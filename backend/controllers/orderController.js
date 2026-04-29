import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Ingredient from '../models/Ingredient.js';
import Customer from '../models/Customer.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_replace_me');

const generateInvoiceAndOrderNumber = async () => {
  const date = new Date();
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await Order.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  const orderNumber = count + 1;
  // Format: BILL-YYYYMMDD-0001
  const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  
  return { invoiceNumber: `BILL-${dateString}-${orderNumber.toString().padStart(4, '0')}`, orderNumber };
};

export const createOrder = async (req, res) => {
  const { items, paymentMethod, discountAmount = 0, customerPhone, customerName, cashGiven, changeDue, isCheckoutSession } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  try {
    let subtotal = 0;
    const orderItems = [];

    // Process items and calculate totals
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId).populate('recipe.ingredient');
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item not found: ${item.menuItemId}` });
      }

      let itemSubtotal = menuItem.price * item.quantity;
      const savedCustomizations = [];

      // Process customizations
      if (item.customizations && item.customizations.length > 0) {
        for (const cust of item.customizations) {
          const custItem = await MenuItem.findById(cust.menuItemId).populate('recipe.ingredient');
          if (custItem) {
            itemSubtotal += custItem.price * item.quantity;
            savedCustomizations.push({
              menuItem: custItem._id,
              name: custItem.name,
              price: custItem.price
            });

            // Deduct Inventory for Customization
            if (custItem.recipe) {
              for (const recipeItem of custItem.recipe) {
                if (!recipeItem.ingredient) continue;
                
                const totalIngredientNeeded = recipeItem.quantity * item.quantity;
                const ingredient = await Ingredient.findById(recipeItem.ingredient._id);
                
                if (ingredient) {
                  ingredient.currentStock -= totalIngredientNeeded;
                  await ingredient.save();
                  if (req.io) {
                    req.io.emit('inventory_updated', { type: 'update', item: ingredient });
                    if (ingredient.currentStock <= ingredient.lowStockThreshold) {
                      req.io.emit('low_stock_alert', { ingredient });
                    }
                  }
                }
              }
            }
          }
        }
      }

      subtotal += itemSubtotal;

      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        priceAtTime: menuItem.price,
        subtotal: itemSubtotal,
        customizations: savedCustomizations
      });

      // Deduct Inventory
      if (menuItem.recipe) {
        for (const recipeItem of menuItem.recipe) {
          if (!recipeItem.ingredient) continue;
          
          const totalIngredientNeeded = recipeItem.quantity * item.quantity;
          const ingredient = await Ingredient.findById(recipeItem.ingredient._id);
          
          if (ingredient) {
            ingredient.currentStock -= totalIngredientNeeded;
            await ingredient.save();
            // Emit inventory update
            if (req.io) {
              req.io.emit('inventory_updated', { type: 'update', item: ingredient });
              if (ingredient.currentStock <= ingredient.lowStockThreshold) {
                req.io.emit('low_stock_alert', { ingredient });
              }
            }
          }
        }
      }
    }

    const taxAmount = subtotal * 0.05; // 5% GST
    const totalAmount = subtotal + taxAmount - discountAmount;
    const { invoiceNumber, orderNumber } = await generateInvoiceAndOrderNumber();

    // Handle Customer CRM logic
    let customerId = null;
    let customerDetails = null;
    if (customerPhone && customerName) {
      let customer = await Customer.findOne({ phone: customerPhone });
      if (customer) {
        customer.name = customerName; // update name if changed
        customer.totalOrders += 1;
        customer.totalSpent += totalAmount;
        await customer.save();
      } else {
        customer = new Customer({
          phone: customerPhone,
          name: customerName,
          totalOrders: 1,
          totalSpent: totalAmount
        });
        await customer.save();
      }
      customerId = customer._id;
      customerDetails = customer;
    }

    const order = new Order({
      invoiceNumber,
      orderNumber,
      items: orderItems,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod,
      cashGiven: cashGiven || 0,
      changeDue: changeDue || 0,
      customer: customerId,
      cashier: req.user ? req.user.id : null,
      status: isCheckoutSession ? 'Pending Payment' : 'Preparing'
    });

    const createdOrder = await order.save();
    
    // Populate for receipt
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('items.menuItem')
      .populate('customer')
      .populate('cashier', 'username');

    if (req.io) {
      req.io.emit('order_created', populatedOrder);
    }

    // Include customer details directly in response for the receipt generator
    const responseData = populatedOrder.toObject();
    responseData.customerDetails = customerDetails;

    if (isCheckoutSession) {
      if (!process.env.STRIPE_SECRET_KEY) {
        console.warn("Stripe key missing - redirecting directly to success for testing");
        return res.json({ url: `${req.headers.origin}/payment-success?order_id=${createdOrder._id}` });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: { 
            currency: 'inr', 
            product_data: { name: `CRFTD Order ${invoiceNumber}` }, 
            unit_amount: Math.round(totalAmount * 100) 
          },
          quantity: 1,
        }],
        mode: 'payment',
        client_reference_id: createdOrder._id.toString(),
        success_url: `${req.headers.origin}/payment-success?order_id=${createdOrder._id}`,
        cancel_url: `${req.headers.origin}/`,
      });
      return res.json({ url: session.url });
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('items.menuItem')
      .populate('customer')
      .populate('cashier', 'username')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem')
      .populate('customer');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    const updatedOrder = await order.save();

    if (req.io) {
      req.io.emit('order_status_updated', updatedOrder);
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPaymentIntent = async (req, res) => {
  const { amount } = req.body;
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("Stripe key missing - returning mock payment intent");
      return res.json({ clientSecret: 'pi_mock_secret_for_testing' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: 'inr',
      payment_method_types: ['upi'],
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createCheckoutSession = async (req, res) => {
  // We handle checkout sessions directly in createOrder by passing isCheckoutSession
  res.status(400).json({ message: 'Use createOrder with isCheckoutSession flag' });
};

export const confirmStripePayment = async (req, res) => {
  try {
    const { order_id } = req.body;
    const order = await Order.findById(order_id)
      .populate('items.menuItem')
      .populate('customer');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'Pending Payment') {
      order.status = 'Completed';
      await order.save();
      
      if (req.io) {
        req.io.emit('order_status_updated', order);
      }
    }

    const responseData = order.toObject();
    if (order.customer) {
      responseData.customerDetails = order.customer;
    }

    res.json(responseData);
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(500).json({ message: error.message });
  }
};

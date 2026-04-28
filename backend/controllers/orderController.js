import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Ingredient from '../models/Ingredient.js';
import Customer from '../models/Customer.js';

const generateInvoiceAndOrderNumber = async () => {
  const date = new Date();
  const count = await Order.countDocuments({
    createdAt: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lte: new Date(date.setHours(23, 59, 59, 999))
    }
  });
  const orderNumber = count + 1;
  return { invoiceNumber: `BILL-${orderNumber.toString().padStart(4, '0')}`, orderNumber };
};

export const createOrder = async (req, res) => {
  const { items, paymentMethod, discountAmount = 0, customerPhone, customerName } = req.body;
  
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

      const itemSubtotal = menuItem.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        priceAtTime: menuItem.price,
        subtotal: itemSubtotal
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
      customer: customerId,
      cashier: req.user ? req.user.id : null
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

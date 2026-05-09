import { supabase } from '../config/supabase.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_replace_me');

const generateInvoiceAndOrderNumber = async () => {
  const date = new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  const orderNumber = (count || 0) + 1;
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
    const orderItemsData = [];
    const orderCustomizationsData = [];
    const stockUpdates = {};

    // Process items
    for (const item of items) {
      const { data: menuItem, error: menuErr } = await supabase
        .from('menu_items')
        .select('*, recipe:menu_item_recipes(quantity, ingredient:ingredients!ingredient_id(*))')
        .eq('id', item.menuItemId)
        .single();

      if (menuErr || !menuItem) {
        return res.status(404).json({ message: `Menu item not found: ${item.menuItemId}` });
      }

      let itemSubtotal = menuItem.price * item.quantity;
      let orderItemTempId = Math.random().toString(36).substring(7); // Used locally to link customizations

      // Process customizations
      if (item.customizations && item.customizations.length > 0) {
        for (const cust of item.customizations) {
          const { data: custItem } = await supabase
            .from('menu_items')
            .select('*, recipe:menu_item_recipes(quantity, ingredient:ingredients!ingredient_id(*))')
            .eq('id', cust.menuItemId)
            .single();

          if (custItem) {
            itemSubtotal += custItem.price * item.quantity;
            orderCustomizationsData.push({
              _tempItemId: orderItemTempId,
              menu_item_id: custItem.id,
              name: custItem.name,
              price: custItem.price
            });

            if (custItem.recipe) {
              for (const recipeItem of custItem.recipe) {
                if (!recipeItem.ingredient) continue;
                const totalNeeded = recipeItem.quantity * item.quantity;
                const ingId = recipeItem.ingredient.id;
                stockUpdates[ingId] = (stockUpdates[ingId] || recipeItem.ingredient.current_stock) - totalNeeded;
              }
            }
          }
        }
      }

      subtotal += itemSubtotal;

      orderItemsData.push({
        _tempItemId: orderItemTempId,
        menu_item_id: menuItem.id,
        quantity: item.quantity,
        price_at_time: menuItem.price,
        subtotal: itemSubtotal
      });

      if (menuItem.recipe) {
        for (const recipeItem of menuItem.recipe) {
          if (!recipeItem.ingredient) continue;
          const totalNeeded = recipeItem.quantity * item.quantity;
          const ingId = recipeItem.ingredient.id;
          stockUpdates[ingId] = (stockUpdates[ingId] || recipeItem.ingredient.current_stock) - totalNeeded;
        }
      }
    }

    const taxAmount = subtotal * 0.05;
    const totalAmount = subtotal + taxAmount - discountAmount;
    const { invoiceNumber, orderNumber } = await generateInvoiceAndOrderNumber();

    // Customer logic
    let customerId = null;
    let customerDetails = null;
    if (customerPhone && customerName) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customerPhone)
        .single();

      if (existingCustomer) {
        const { data: updatedCustomer } = await supabase
          .from('customers')
          .update({
            name: customerName,
            total_orders: existingCustomer.total_orders + 1,
            total_spent: existingCustomer.total_spent + totalAmount
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();
        customerId = updatedCustomer.id;
        customerDetails = updatedCustomer;
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            phone: customerPhone,
            name: customerName,
            total_orders: 1,
            total_spent: totalAmount
          })
          .select()
          .single();
        customerId = newCustomer.id;
        customerDetails = newCustomer;
      }
    }

    // Insert Order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        invoice_number: invoiceNumber,
        order_number: orderNumber,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        cash_given: cashGiven || 0,
        change_due: changeDue || 0,
        customer_id: customerId,
        cashier_id: req.user ? req.user.id : null,
        status: isCheckoutSession ? 'Pending Payment' : 'Preparing'
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insert Order Items
    for (const oi of orderItemsData) {
      const { data: insertedItem } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          menu_item_id: oi.menu_item_id,
          quantity: oi.quantity,
          price_at_time: oi.price_at_time,
          subtotal: oi.subtotal
        })
        .select()
        .single();

      // Insert matching customizations
      const itemCustomizations = orderCustomizationsData.filter(c => c._tempItemId === oi._tempItemId);
      if (itemCustomizations.length > 0) {
        await supabase.from('order_item_customizations').insert(
          itemCustomizations.map(c => ({
            order_item_id: insertedItem.id,
            menu_item_id: c.menu_item_id,
            name: c.name,
            price: c.price
          }))
        );
      }
    }

    // Apply inventory deducts
    for (const [ingId, newStock] of Object.entries(stockUpdates)) {
      const { data: updatedIng } = await supabase
        .from('ingredients')
        .update({ current_stock: newStock })
        .eq('id', ingId)
        .select()
        .single();
      
      if (req.io && updatedIng) {
        req.io.emit('inventory_updated', { type: 'update', item: { _id: updatedIng.id, name: updatedIng.name, currentStock: updatedIng.current_stock } });
      }
    }

    // Format response to match old schema
    const { data: populatedOrder } = await supabase
      .from('orders')
      .select('*, customer:customers(*), cashier:users(username), items:order_items(*, menuItem:menu_items(*), customizations:order_item_customizations(*))')
      .eq('id', order.id)
      .single();

    const responseData = {
      ...populatedOrder,
      _id: populatedOrder.id,
      customerDetails
    };

    if (req.io) {
      req.io.emit('order_created', responseData);
    }

    if (isCheckoutSession) {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.json({ url: `${req.headers.origin}/payment-success?order_id=${order.id}` });
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
        client_reference_id: order.id,
        success_url: `${req.headers.origin}/payment-success?order_id=${order.id}`,
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
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*), cashier:users(username), items:order_items(*, menuItem:menu_items(*), customizations:order_item_customizations(*))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Quick format for frontend compatibility
    const formatted = orders.map(o => ({...o, _id: o.id, createdAt: o.created_at}));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select('*, customer:customers(*), cashier:users(username), items:order_items(*, menuItem:menu_items(*), customizations:order_item_customizations(*))')
      .single();

    if (error) throw error;

    const formatted = {...order, _id: order.id, createdAt: order.created_at};
    if (req.io) {
      req.io.emit('order_status_updated', formatted);
    }
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPaymentIntent = async (req, res) => {
  const { amount } = req.body;
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({ clientSecret: 'pi_mock_secret_for_testing' });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: 'inr',
      payment_method_types: ['upi'],
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCheckoutSession = async (req, res) => {
  res.status(400).json({ message: 'Use createOrder with isCheckoutSession flag' });
};

export const confirmStripePayment = async (req, res) => {
  try {
    const { order_id } = req.body;
    
    const { data: checkOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (!checkOrder) return res.status(404).json({ message: 'Order not found' });

    let finalOrder = checkOrder;

    if (checkOrder.status === 'Pending Payment') {
      const { data: updated } = await supabase
        .from('orders')
        .update({ status: 'Completed' })
        .eq('id', order_id)
        .select('*, customer:customers(*), cashier:users(username), items:order_items(*, menuItem:menu_items(*), customizations:order_item_customizations(*))')
        .single();
      
      finalOrder = updated;
      
      if (req.io) {
        req.io.emit('order_status_updated', {...updated, _id: updated.id});
      }
    }

    res.json({...finalOrder, _id: finalOrder.id, customerDetails: finalOrder.customer});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

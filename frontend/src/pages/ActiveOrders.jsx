import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Bell, MessageSquare, ChefHat } from 'lucide-react';

const ActiveOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Polling for new orders every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        // Filter out completed orders
        setOrders(data.filter(o => o.status !== 'Completed'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, newStatus, orderDetails) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders(); // refresh list
        
        // If marking as ready, optionally trigger WhatsApp notification
        if (newStatus === 'Ready' && orderDetails.customer?.phone) {
          if (window.confirm("Send 'Order Ready' WhatsApp message to customer?")) {
            sendPickupAlert(orderDetails);
          }
        }
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const sendPickupAlert = (order) => {
    const phone = order.customer.phone;
    const name = order.customer.name;
    const message = `Hi ${name}, your order #${order.orderNumber} from CRFTD is ready for pickup! 🍽️\nSee you at the counter!`;
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/91${phone}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  // Group by status
  const preparingOrders = orders.filter(o => o.status === 'Preparing');
  const readyOrders = orders.filter(o => o.status === 'Ready');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Kitchen & Counter Display</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage active orders and notify customers for pickup</p>
      </div>

      <div className="mobile-stack" style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>
        
        {/* Preparing Column */}
        <div className="glass" style={{ flex: 1, borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ChefHat color="#f59e0b" />
            <h2 style={{ margin: 0, color: '#f59e0b' }}>Preparing ({preparingOrders.length})</h2>
          </div>
          
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {preparingOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No orders in queue.</p>
            ) : preparingOrders.map(order => (
              <div key={order._id} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontFamily: 'monospace', fontSize: '1.2rem', color: 'var(--text-main)' }}>Order #{order.orderNumber || order.invoiceNumber.split('-')[1]}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14}/> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{order.customer?.name || 'Walk-in Customer'}</p>

                <ul style={{ paddingLeft: '1.2rem', margin: '0 0 1.5rem 0', color: 'var(--text-main)' }}>
                  {order.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
                      <span style={{ color: 'var(--primary)', marginRight: '0.5rem' }}>{item.quantity}x</span>
                      {item.menuItem?.name}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => updateStatus(order._id, 'Ready', order)}
                  className="btn" 
                  style={{ width: '100%', background: '#f59e0b', color: 'black', fontWeight: 'bold' }}
                >
                  <Bell size={18} /> Mark as Ready
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ready Column */}
        <div className="glass" style={{ flex: 1, borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle color="#10b981" />
            <h2 style={{ margin: 0, color: '#10b981' }}>Ready for Pickup ({readyOrders.length})</h2>
          </div>
          
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {readyOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No orders waiting for pickup.</p>
            ) : readyOrders.map(order => (
              <div key={order._id} style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontFamily: 'monospace', fontSize: '1.2rem', color: '#10b981' }}>Order #{order.orderNumber || order.invoiceNumber.split('-')[1]}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.customer?.name || 'Walk-in'}</span>
                </div>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{order.items.length} items • ₹{order.totalAmount.toFixed(2)}</p>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {order.customer?.phone && (
                    <button 
                      onClick={() => sendPickupAlert(order)}
                      className="btn btn-secondary" 
                      style={{ flex: 1, borderColor: '#25D366', color: '#25D366', padding: '0.75rem' }}
                      title="Send WhatsApp Alert"
                    >
                      <MessageSquare size={18} /> Alert
                    </button>
                  )}
                  <button 
                    onClick={() => updateStatus(order._id, 'Completed', order)}
                    className="btn btn-primary" 
                    style={{ flex: order.customer?.phone ? 2 : 1, padding: '0.75rem' }}
                  >
                    Complete Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ActiveOrders;

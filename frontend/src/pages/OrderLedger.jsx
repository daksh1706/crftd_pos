import React, { useState, useEffect } from 'react';
import { FileText, Search, User, CreditCard } from 'lucide-react';

const OrderLedger = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if(res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const customerName = order.customer?.name || 'Walk-in Customer';
    const customerPhone = order.customer?.phone || '';
    const invoiceNumber = order.invoiceNumber || '';
    
    const searchLower = searchTerm.toLowerCase();
    
    return customerName.toLowerCase().includes(searchLower) ||
           customerPhone.includes(searchLower) ||
           invoiceNumber.toLowerCase().includes(searchLower);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Order Ledger</h1>
          <p style={{ color: 'var(--text-muted)' }}>Complete historical record of all transactions</p>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Search invoice, name, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <tr>
              <th style={{ padding: '1.25rem' }}>S.No</th>
              <th style={{ padding: '1.25rem' }}>Date & Time</th>
              <th style={{ padding: '1.25rem' }}>Order No.</th>
              <th style={{ padding: '1.25rem' }}>Customer Details</th>
              <th style={{ padding: '1.25rem' }}>Payment</th>
              <th style={{ padding: '1.25rem', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr key={order._id} className="table-row-hover" style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '1.25rem', color: 'var(--text-muted)' }}>{index + 1}</td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 500 }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    #{order.orderNumber || order.invoiceNumber.split('-')[1]}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {order.invoiceNumber}
                  </div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                    <User size={14} color="var(--text-muted)" />
                    {order.customer?.name || 'Walk-in Customer'}
                  </div>
                  {order.customer?.phone && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1.5rem', marginTop: '0.2rem' }}>
                      +91 {order.customer.phone}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={14} color="var(--text-muted)" />
                    {order.paymentMethod}
                  </div>
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  ₹{order.totalAmount.toFixed(2)}
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderLedger;

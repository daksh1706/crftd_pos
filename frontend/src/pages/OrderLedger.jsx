import React, { useState, useEffect } from 'react';
import { FileText, Search, User, CreditCard, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const OrderLedger = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today'); // 'all', 'today', 'this_month'
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Polling for updates
    return () => clearInterval(interval);
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
    // Search Filtering
    const customerName = order.customer?.name || 'Walk-in Customer';
    const customerPhone = order.customer?.phone || '';
    const invoiceNumber = order.invoiceNumber || '';
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = customerName.toLowerCase().includes(searchLower) ||
                          customerPhone.includes(searchLower) ||
                          invoiceNumber.toLowerCase().includes(searchLower);

    // Date Filtering
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = orderDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'this_month') {
      matchesDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
    }

    return matchesSearch && matchesDate;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Order Ledger</h1>
          <p style={{ color: 'var(--text-muted)' }}>Complete historical record of all transactions</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', width: '450px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="Search invoice, name, or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          
          <div style={{ position: 'relative', width: '150px' }}>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem', appearance: 'none' }}
            >
              <option value="today">Today</option>
              <option value="this_month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <Calendar size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <ChevronDown size={14} color="var(--text-muted)" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
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
              <th style={{ padding: '1.25rem' }}>Status</th>
              <th style={{ padding: '1.25rem', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <React.Fragment key={order._id}>
                <tr 
                  className="table-row-hover" 
                  style={{ borderTop: '1px solid var(--border)', cursor: 'pointer', backgroundColor: expandedOrderId === order._id ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}
                  onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                >
                  <td style={{ padding: '1.25rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {expandedOrderId === order._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {index + 1}
                    </div>
                  </td>
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
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.85rem', 
                      fontWeight: 'bold',
                      backgroundColor: order.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : order.status === 'Ready' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: order.status === 'Completed' ? '#10b981' : order.status === 'Ready' ? '#3b82f6' : '#f59e0b'
                    }}>
                      {order.status || 'Preparing'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    ₹{order.totalAmount.toFixed(2)}
                  </td>
                </tr>
                
                {/* Expanded Details Row */}
                {expandedOrderId === order._id && (
                  <tr style={{ backgroundColor: 'var(--bg-dark)' }}>
                    <td colSpan="7" style={{ padding: '2rem' }}>
                      <div style={{ display: 'flex', gap: '3rem' }}>
                        {/* Items Breakdown */}
                        <div style={{ flex: 2 }}>
                          <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Order Items</h4>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'left' }}>
                                <th style={{ paddingBottom: '0.5rem' }}>Item</th>
                                <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>Qty</th>
                                <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Price</th>
                                <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items?.map((item, idx) => (
                                <tr key={idx} style={{ borderTop: '1px dashed var(--border)' }}>
                                  <td style={{ padding: '0.75rem 0' }}>
                                    <div style={{ fontWeight: 600 }}>{item.menuItem?.name || 'Unknown Item'}</div>
                                    {item.customizations?.length > 0 && (
                                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                                        + {item.customizations.map(c => c.name).join(', ')}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>{item.quantity}</td>
                                  <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>₹{item.priceAtTime?.toFixed(2) || '0.00'}</td>
                                  <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold' }}>₹{item.subtotal?.toFixed(2) || '0.00'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Bill Breakdown */}
                        <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                          <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Bill Summary</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                              <span>Subtotal</span>
                              <span>₹{order.subtotal?.toFixed(2) || '0.00'}</span>
                            </div>
                            {order.discountAmount > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--error)' }}>
                                <span>Discount</span>
                                <span>-₹{order.discountAmount.toFixed(2)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                              <span>GST (5%)</span>
                              <span>₹{order.taxAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                              <span>Total Paid</span>
                              <span>₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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

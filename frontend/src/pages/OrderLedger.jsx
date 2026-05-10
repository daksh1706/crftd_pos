import React, { useState, useEffect } from 'react';
import { FileText, Search, User, CreditCard, Calendar, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

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

  const generateReceiptDoc = (order) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 280]
    });

    doc.setFont('courier', 'normal');
    doc.setFontSize(8); 
    
    let y = 10;
    const marginLeft = 4;
    
    const doubleLine = "==========================================";
    const singleLine = "------------------------------------------";

    doc.setFontSize(12);
    doc.setFont('courier', 'bold');
    doc.text("          KITCHEN TOKEN", marginLeft, y);
    y += 5;
    doc.setFontSize(10);
    doc.text("              CRFTD", marginLeft, y);
    y += 6;
    
    doc.setFontSize(14);
    const orderNo = order.orderNumber || order.invoiceNumber.split('-')[1] || 'N/A';
    doc.text(`      Order No: ${orderNo}`, marginLeft, y);
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    y += 6;
    
    const cNameToken = order.customer?.name || 'Walk-in';
    const cPhoneToken = order.customer?.phone || '';
    doc.text(`Name : ${cNameToken}`, marginLeft, y);
    y += 4;
    if (cPhoneToken) {
      doc.text(`Phone: +91 ${cPhoneToken}`, marginLeft, y);
      y += 4;
    }
    const timeStrToken = new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' });
    doc.text(`Time : ${timeStrToken}`, marginLeft, y);
    y += 4;

    doc.text(singleLine, marginLeft, y);
    y += 4;
    
    doc.setFont('courier', 'bold');
    doc.text("QTY   ITEM", marginLeft, y);
    doc.setFont('courier', 'normal');
    y += 4;
    doc.text(singleLine, marginLeft, y);
    y += 4;

    order.items.forEach(item => {
      const qtyStr = item.quantity.toString().padEnd(5, ' ');
      const itemName = item.menuItem?.name || 'Item';
      doc.text(`${qtyStr} ${itemName.substring(0, 35)}`, marginLeft, y);
      y += 4;
      if (item.customizations && item.customizations.length > 0) {
        doc.setFontSize(7);
        const customText = `  + ${item.customizations.map(c => c.name).join(', ')}`;
        const splitText = doc.splitTextToSize(customText, 70);
        splitText.forEach(line => {
          doc.text(line, marginLeft, y);
          y += 3;
        });
        doc.setFontSize(8);
      }
    });

    y += 2;
    doc.text("- - - - - - - - CUT HERE - - - - - - - - -", marginLeft, y);
    y += 8;

    doc.text(doubleLine, marginLeft, y);
    y += 4;
    
    doc.setFontSize(10);
    doc.text("         BILLING SYSTEM POS", marginLeft, y);
    doc.setFontSize(8);
    y += 4;
    
    doc.text(doubleLine, marginLeft, y);
    y += 4;

    const padR = (str, len) => str.toString().padEnd(len, ' ');
    const padL = (str, len) => str.toString().padStart(len, ' ');

    const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(',', '');

    doc.text(`Bill No   : ${order.invoiceNumber}`, marginLeft, y);
    y += 4;
    doc.text(`Order No  : ${orderNo}`, marginLeft, y);
    y += 4;
    doc.text(`Date      : ${dateStr}`, marginLeft, y);
    y += 4;
    const cName = order.customer?.name || 'Walk-in Customer';
    doc.text(`Customer  : ${cName}`, marginLeft, y);
    y += 4;

    doc.text(singleLine, marginLeft, y);
    y += 4;

    doc.text("Item                    Qty  Price   Total", marginLeft, y);
    y += 4;
    doc.text(singleLine, marginLeft, y);
    y += 4;

    order.items.forEach(item => {
      let itemName = item.menuItem?.name || 'Item';
      if (itemName.length > 21) {
        itemName = itemName.substring(0, 20) + '.';
      }
      
      const col1 = padR(itemName, 22);
      const col2 = padL(item.quantity.toString(), 5);
      const col3 = padL((item.priceAtTime || 0).toFixed(2), 7);
      const col4 = padL((item.subtotal || 0).toFixed(2), 8);
      
      doc.text(`${col1}${col2}${col3}${col4}`, marginLeft, y);
      y += 4;

      if (item.customizations && item.customizations.length > 0) {
        doc.setFontSize(7);
        const customText = `  + ${item.customizations.map(c => c.name).join(', ')}`;
        const splitText = doc.splitTextToSize(customText, 40); 
        splitText.forEach(line => {
          doc.text(line, marginLeft, y);
          y += 3;
        });
        doc.setFontSize(8);
      }
    });

    doc.text(singleLine, marginLeft, y);
    y += 4;

    const subtotalStr = (order.subtotal || 0).toFixed(2);
    doc.text(`Subtotal:                        ${padL(subtotalStr, 8)}`, marginLeft, y);
    y += 4;
    
    if (order.discountAmount > 0) {
      const discountStr = order.discountAmount.toFixed(2);
      doc.text(`Discount:                       -${padL(discountStr, 8)}`, marginLeft, y);
      y += 4;
    }

    const gstStr = (order.taxAmount || 0).toFixed(2);
    doc.text(`GST (5%):                        ${padL(gstStr, 8)}`, marginLeft, y);
    y += 4;

    doc.text(doubleLine, marginLeft, y);
    y += 4;

    doc.setFont('courier', 'bold');
    const totalStr = (order.totalAmount || 0).toFixed(2);
    doc.text(`TOTAL (Rs.):                     ${padL(totalStr, 8)}`, marginLeft, y);
    doc.setFont('courier', 'normal');
    y += 4;

    if (order.paymentMethod === 'Cash' && order.cashGiven) {
      y += 2;
      const cashStr = order.cashGiven.toFixed(2);
      const changeStr = (order.changeDue || 0).toFixed(2);
      doc.text(`Cash Given:                      ${padL(cashStr, 8)}`, marginLeft, y);
      y += 4;
      doc.text(`Change Due:                      ${padL(changeStr, 8)}`, marginLeft, y);
      y += 4;
    }

    doc.text(doubleLine, marginLeft, y);
    y += 6;

    doc.text("      Thank you! Please visit again.", marginLeft, y);
    y += 4;
    doc.text(doubleLine, marginLeft, y);

    return doc;
  };

  const handleDownloadReceipt = (order) => {
    try {
      const doc = generateReceiptDoc(order);
      if (doc) {
        doc.save(`${order.invoiceNumber}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert("PDF Error: " + err.message);
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                            <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Bill Summary</h4>
                            <button 
                              onClick={() => handleDownloadReceipt(order)}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                            >
                              <Download size={14} /> Download Bill
                            </button>
                          </div>
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

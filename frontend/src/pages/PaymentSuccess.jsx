import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Printer, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    const confirmPayment = async () => {
      try {
        const res = await fetch('/api/orders/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId })
        });
        
        if (!res.ok) throw new Error('Failed to confirm payment');
        
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error(err);
        setError('Error confirming payment. Please check Order Ledger.');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [orderId]);

  const getReceiptDoc = () => {
    if (!order) return null;
    
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 280] });
    doc.setFont('courier', 'normal');
    doc.setFontSize(8); 
    
    let y = 10;
    const marginLeft = 4;
    
    const doubleLine = "==========================================";
    const singleLine = "------------------------------------------";

    doc.setFontSize(12);
    doc.setFont('courier', 'bold');
    doc.text("          KITCHEN TOKEN", marginLeft, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.text(doubleLine, marginLeft, y);
    y += 4;
    doc.text(`Order No: ${order.orderNumber}`, marginLeft, y);
    y += 4;
    doc.text(`Time:     ${new Date(order.createdAt).toLocaleTimeString()}`, marginLeft, y);
    y += 4;
    doc.text(doubleLine, marginLeft, y);
    y += 6;

    order.items.forEach(item => {
      doc.setFont('courier', 'bold');
      const itemName = doc.splitTextToSize(`${item.quantity}x ${item.menuItem?.name || 'Item'}`, 70);
      itemName.forEach(line => { doc.text(line, marginLeft, y); y += 4; });
      doc.setFont('courier', 'normal');
      
      if (item.customizations && item.customizations.length > 0) {
        doc.setFontSize(7);
        const customText = `  + ${item.customizations.map(c => c.name).join(', ')}`;
        const splitText = doc.splitTextToSize(customText, 70);
        splitText.forEach(line => { doc.text(line, marginLeft, y); y += 3; });
        doc.setFontSize(8);
      }
      y += 2;
    });

    doc.text(doubleLine, marginLeft, y);
    y += 6;

    doc.setFontSize(14);
    doc.setFont('courier', 'bold');
    doc.text("             CRFTD", marginLeft, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.text("     Premium Dessert Experience", marginLeft, y);
    y += 4;
    doc.text(doubleLine, marginLeft, y);
    y += 4;

    doc.text(`Bill No:  ${order.invoiceNumber}`, marginLeft, y);
    y += 4;
    doc.text(`Date:     ${new Date(order.createdAt).toLocaleDateString()}`, marginLeft, y);
    y += 4;
    if (order.customerDetails?.phone) {
      doc.text(`Customer: ${order.customerDetails.phone}`, marginLeft, y);
      y += 4;
    }
    doc.text(doubleLine, marginLeft, y);
    y += 6;

    const padL = (str, len) => str.toString().padStart(len, ' ');
    const padR = (str, len) => str.toString().padEnd(len, ' ');

    doc.setFont('courier', 'bold');
    doc.text(`${padR('Item', 20)}${padL('Qty', 6)}${padL('Total', 10)}`, marginLeft, y);
    y += 4;
    doc.setFont('courier', 'normal');
    doc.text(singleLine, marginLeft, y);
    y += 4;

    order.items.forEach(item => {
      const nameStr = (item.menuItem?.name || 'Item').substring(0, 18);
      const qtyStr = item.quantity.toString();
      const lineTotal = item.subtotal.toFixed(2);
      
      doc.text(`${padR(nameStr, 20)}${padL(qtyStr, 6)}${padL(lineTotal, 10)}`, marginLeft, y);
      y += 4;

      if (item.customizations && item.customizations.length > 0) {
        doc.setFontSize(7);
        const customText = `  + ${item.customizations.map(c => c.name).join(', ')}`;
        const splitText = doc.splitTextToSize(customText, 40);
        splitText.forEach(line => { doc.text(line, marginLeft, y); y += 3; });
        doc.setFontSize(8);
      }
    });

    doc.text(singleLine, marginLeft, y);
    y += 4;
    
    doc.text(`Subtotal:                        ${padL(order.subtotal.toFixed(2), 8)}`, marginLeft, y);
    y += 4;
    if (order.discountAmount > 0) {
      doc.text(`Discount:                       -${padL(order.discountAmount.toFixed(2), 8)}`, marginLeft, y);
      y += 4;
    }
    doc.text(`GST (5%):                        ${padL(order.taxAmount.toFixed(2), 8)}`, marginLeft, y);
    y += 4;
    doc.text(singleLine, marginLeft, y);
    y += 4;

    doc.setFont('courier', 'bold');
    doc.text(`TOTAL:                           ${padL(order.totalAmount.toFixed(2), 8)}`, marginLeft, y);
    y += 4;
    doc.setFont('courier', 'normal');
    doc.text(singleLine, marginLeft, y);
    y += 4;

    doc.text(`Paid via: ${order.paymentMethod}`, marginLeft, y);
    y += 4;
    
    doc.text(doubleLine, marginLeft, y);
    y += 6;
    doc.text("      Thank you! Please visit again.", marginLeft, y);
    y += 4;
    doc.text(doubleLine, marginLeft, y);

    return doc;
  };

  const printReceipt = () => {
    const doc = getReceiptDoc();
    if (doc) doc.save(`${order.invoiceNumber}.pdf`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h2>Confirming Payment...</h2>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
        <h2>Payment Status Unknown</h2>
        <p style={{ color: 'var(--error)' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/pos')}>Return to POS</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '2rem' }}>
      <div className="glass animate-slide-up" style={{ width: '500px', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', borderTop: '4px solid #10b981' }}>
        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem auto' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Payment Successful!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Order <strong style={{ color: 'white' }}>{order.invoiceNumber}</strong> has been confirmed.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button onClick={printReceipt} className="btn btn-secondary" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Printer size={18} /> Download Thermal Receipt
          </button>
          
          <button onClick={() => navigate('/pos')} className="btn btn-primary" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> New Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

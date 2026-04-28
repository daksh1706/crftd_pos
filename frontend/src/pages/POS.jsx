import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { ChefHat, X, CheckCircle, Printer, MessageSquare, Search, Info, Plus } from 'lucide-react';

const POS = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  
  // Checkout Modals State
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  
  // Product Details Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Customer Form State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to fetch menu', err);
    }
  };

  const checkCustomerPhone = async (phone) => {
    if (phone.length >= 10) {
      setCustomerLoading(true);
      try {
        const res = await fetch(`/api/customers/${phone}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerName(data.name);
        }
      } catch (err) {
        console.error('Customer not found');
      } finally {
        setCustomerLoading(false);
      }
    }
  };

  const addToCart = (item, e = null) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setSelectedProduct(null);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i._id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountVal = Number(discountPercent) || 0;
  const discountAmount = (subtotal * discountVal) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const gst = subtotalAfterDiscount * 0.05; // 5% GST
  const total = subtotalAfterDiscount + gst;

  const handleCheckoutInit = () => {
    if (cart.length === 0) return alert('Cart is empty!');
    setShowCustomerModal(true);
  };

  const handleProcessOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const orderItems = cart.map(item => ({
        menuItemId: item._id,
        quantity: item.qty
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          paymentMethod,
          discountAmount,
          customerPhone,
          customerName
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        setCompletedOrder(orderData);
        setCart([]);
        setDiscountPercent('');
        setCustomerName('');
        setCustomerPhone('');
        setShowCustomerModal(false);
        setShowSuccessModal(true);
      } else {
        const err = await res.json();
        alert('Checkout failed: ' + err.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error during checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const getReceiptDoc = () => {
    if (!completedOrder) return null;
    
    // Create an 80mm wide document. Height adjusts roughly based on content.
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 280]
    });

    // Use Courier for monospace alignment
    doc.setFont('courier', 'normal');
    doc.setFontSize(8); 
    
    let y = 10;
    const marginLeft = 4;
    
    // Utility for monospace dividers (42 characters wide)
    const doubleLine = "==========================================";
    const singleLine = "------------------------------------------";

    // --- TOKEN SECTION ---
    doc.setFontSize(12);
    doc.setFont('courier', 'bold');
    doc.text("          KITCHEN TOKEN", marginLeft, y);
    y += 5;
    doc.setFontSize(10);
    doc.text("              CRFTD", marginLeft, y);
    y += 6;
    
    doc.setFontSize(14);
    const orderNo = completedOrder.orderNumber || completedOrder.invoiceNumber.split('-')[1];
    doc.text(`         ORDER #${orderNo}`, marginLeft, y);
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    y += 6;
    
    const cNameToken = completedOrder.customerDetails?.name || 'Walk-in';
    const cPhoneToken = completedOrder.customerDetails?.phone || '';
    doc.text(`Name : ${cNameToken}`, marginLeft, y);
    y += 4;
    if (cPhoneToken) {
      doc.text(`Phone: +91 ${cPhoneToken}`, marginLeft, y);
      y += 4;
    }
    const timeStrToken = new Date(completedOrder.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' });
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

    completedOrder.items.forEach(item => {
      const qtyStr = item.quantity.toString().padEnd(5, ' ');
      const itemName = item.menuItem?.name || 'Item';
      doc.text(`${qtyStr} ${itemName.substring(0, 35)}`, marginLeft, y);
      y += 4;
    });

    y += 2;
    doc.text("- - - - - - - - CUT HERE - - - - - - - - -", marginLeft, y);
    y += 8;

    // --- MAIN RECEIPT SECTION ---
    doc.text(doubleLine, marginLeft, y);
    y += 4;
    
    // Header
    doc.setFontSize(10);
    doc.text("         BILLING SYSTEM POS", marginLeft, y);
    doc.setFontSize(8);
    y += 4;
    
    doc.text(doubleLine, marginLeft, y);
    y += 4;

    // Order Info
    const padR = (str, len) => str.toString().padEnd(len, ' ');
    const padL = (str, len) => str.toString().padStart(len, ' ');

    const dateStr = new Date(completedOrder.createdAt).toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(',', '');

    doc.text(`Bill No   : ${completedOrder.invoiceNumber}`, marginLeft, y);
    y += 4;
    doc.text(`Date      : ${dateStr}`, marginLeft, y);
    y += 4;
    const cName = completedOrder.customerDetails?.name || 'Walk-in Customer';
    doc.text(`Customer  : ${cName}`, marginLeft, y);
    y += 4;

    doc.text(singleLine, marginLeft, y);
    y += 4;

    // Items Header
    // "Item" (22 chars), "Qty" (5 chars), "Price" (7 chars), "Total" (8 chars) = 42 chars total
    doc.text("Item                    Qty  Price   Total", marginLeft, y);
    y += 4;
    doc.text(singleLine, marginLeft, y);
    y += 4;

    // Items
    completedOrder.items.forEach(item => {
      let itemName = item.menuItem?.name || 'Item';
      if (itemName.length > 21) {
        itemName = itemName.substring(0, 20) + '.';
      }
      
      const col1 = padR(itemName, 22);
      const col2 = padL(item.quantity.toString(), 5);
      const col3 = padL(item.priceAtTime.toFixed(2), 7);
      const col4 = padL(item.subtotal.toFixed(2), 8);
      
      doc.text(`${col1}${col2}${col3}${col4}`, marginLeft, y);
      y += 4;
    });

    doc.text(singleLine, marginLeft, y);
    y += 4;

    // Totals
    const subtotalStr = completedOrder.subtotal.toFixed(2);
    doc.text(`Subtotal:                        ${padL(subtotalStr, 8)}`, marginLeft, y);
    y += 4;
    
    if (completedOrder.discountAmount > 0) {
      const discountStr = completedOrder.discountAmount.toFixed(2);
      doc.text(`Discount:                       -${padL(discountStr, 8)}`, marginLeft, y);
      y += 4;
    }

    const gstStr = completedOrder.taxAmount.toFixed(2);
    doc.text(`GST (5%):                        ${padL(gstStr, 8)}`, marginLeft, y);
    y += 4;

    doc.text(doubleLine, marginLeft, y);
    y += 4;

    doc.setFont('courier', 'bold');
    const totalStr = completedOrder.totalAmount.toFixed(2);
    doc.text(`TOTAL (Rs.):                     ${padL(totalStr, 8)}`, marginLeft, y);
    doc.setFont('courier', 'normal');
    y += 4;

    doc.text(doubleLine, marginLeft, y);
    y += 6;

    // Footer
    doc.text("      Thank you! Please visit again.", marginLeft, y);
    y += 4;
    doc.text(doubleLine, marginLeft, y);

    return doc;
  };

  const printReceipt = () => {
    const doc = getReceiptDoc();
    if (doc) {
      doc.save(`${completedOrder.invoiceNumber}.pdf`);
    }
  };

  const sendOnlineReceipt = async () => {
    const doc = getReceiptDoc();
    if (!doc) return;

    if (!completedOrder.customerDetails?.phone) {
      alert("No customer phone number available to send receipt.");
      return;
    }

    try {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `${completedOrder.invoiceNumber}.pdf`, { type: 'application/pdf' });

      // Check if browser supports file sharing
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `CRFTD Bill ${completedOrder.invoiceNumber}`,
          text: `Thank you for dining with CRFTD! Please find your bill attached.\n\nAmount: Rs. ${completedOrder.totalAmount.toFixed(2)}`,
          files: [file]
        });
      } else {
        // Fallback if file sharing is not supported by the browser (like Chrome Desktop)
        alert("Your browser does not support direct file sharing to WhatsApp. Generating a text link instead...");
        
        let message = `*CRFTD - E-Receipt*\n\n`;
        message += `Bill No: ${completedOrder.invoiceNumber}\n`;
        message += `Total Amount: ₹${completedOrder.totalAmount.toFixed(2)}\n\n`;
        message += `*Items:*\n`;
        completedOrder.items.forEach(item => {
          message += `- ${item.quantity}x ${item.menuItem?.name} (₹${item.subtotal})\n`;
        });
        message += `\nThank you for choosing CRFTD!`;

        const encodedMessage = encodeURIComponent(message);
        const waUrl = `https://wa.me/91${completedOrder.customerDetails.phone}?text=${encodedMessage}`;
        window.open(waUrl, '_blank');
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '2rem' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Point of Sale</h1>
          <p style={{ color: 'var(--text-muted)' }}>Select an item to view details or add it directly to cart</p>
        </div>
        
        <div className="pos-grid">
          {menuItems.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No menu items found. Go to Menu Manager to create some.</p>
          ) : menuItems.map(item => (
            <div 
              key={item._id} 
              className="pos-item-card animate-slide-up" 
              style={{ 
                opacity: item.isAvailable === false ? 0.6 : 1, 
                filter: item.isAvailable === false ? 'grayscale(0.8)' : 'none',
                pointerEvents: item.isAvailable === false ? 'none' : 'auto',
                cursor: item.isAvailable === false ? 'not-allowed' : 'default',
                paddingBottom: '4.5rem'
              }}
            >
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', marginBottom: '1rem', border: '2px solid rgba(255,255,255,0.1)' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}><ChefHat size={40} color="var(--text-muted)" /></div>
              )}
              <h3 style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                {item.name} 
                {item.isAvailable === false && <span style={{display: 'block', color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.2rem'}}>Sold Out</span>}
              </h3>
              <p className="pos-item-price">₹{item.price}</p>
              
              {item.isAvailable !== false && (
                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setSelectedProduct(item)} 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.85rem' }}
                  >
                    <Info size={14} /> Details
                  </button>
                  <button 
                    onClick={(e) => addToCart(item, e)} 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.85rem' }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="cart-sidebar glass" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="cart-header">
          <h2>Current Order</h2>
        </div>
        
        <div className="cart-items">
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item._id} className="cart-item">
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{item.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>₹{item.price}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={() => updateQty(item._id, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }}>-</button>
                  <span style={{ fontWeight: 600 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item._id, 1)} style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)' }}>+</button>
                </div>
                <div style={{ marginLeft: '1rem', fontWeight: 600, width: '60px', textAlign: 'right' }}>
                  ₹{(item.price * item.qty).toFixed(0)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          
          <div className="summary-row" style={{ alignItems: 'center' }}>
            <span>Discount (%)</span>
            <input 
              type="number" 
              min="0" max="100" 
              value={discountPercent} 
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="0"
              style={{ width: '80px', padding: '0.4rem 0.6rem' }}
            />
          </div>

          <div className="summary-row">
            <span>GST (5%)</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>

          <div className="summary-row total">
            <span>Total Payable</span>
            <span style={{ color: 'var(--accent)' }}>₹{total.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {['Cash', 'UPI', 'Card'].map(method => (
              <button 
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`btn ${paymentMethod === method ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.75rem 0.5rem' }}
              >
                {method}
              </button>
            ))}
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}
            onClick={handleCheckoutInit}
            disabled={cart.length === 0}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass animate-slide-up" style={{ width: '500px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: '250px', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ChefHat size={80} color="var(--text-muted)" />
              )}
              <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', padding: '0.5rem' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>{selectedProduct.name}</h2>
                  <span style={{ fontSize: '0.8rem', color: 'white', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>{selectedProduct.category}</span>
                </div>
                <span style={{ color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 'bold' }}>₹{selectedProduct.price}</span>
              </div>
              
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {selectedProduct.description || "A deliciously crafted dish prepared fresh in our kitchen."}
              </p>

              {/* Nutrition Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Calories</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedProduct.nutritionalInfo?.calories || '-'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Protein</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedProduct.nutritionalInfo?.protein || '-'}g</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Carbs</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedProduct.nutritionalInfo?.carbs || '-'}g</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fat</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedProduct.nutritionalInfo?.fat || '-'}g</div>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }} onClick={(e) => addToCart(selectedProduct, e)}>
                <Plus size={20} /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Step 1 Modal: Customer CRM */}
      {showCustomerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass animate-slide-up" style={{ width: '450px', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Customer Details</h2>
              <button onClick={() => setShowCustomerModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleProcessOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Phone Number (10 digits)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    required 
                    type="tel" 
                    value={customerPhone} 
                    onChange={e => {
                      setCustomerPhone(e.target.value);
                      checkCustomerPhone(e.target.value);
                    }} 
                    placeholder="e.g. 9876543210" 
                  />
                  {customerLoading && <Search size={16} color="var(--primary)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Customer Name</label>
                <input 
                  required 
                  type="text" 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  placeholder="John Doe" 
                />
                {customerName && !customerLoading && customerPhone.length >= 10 && (
                  <p style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>Customer profile identified</p>
                )}
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                 <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Amount</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>₹{total.toFixed(2)}</span>
                 </p>
                 <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }} disabled={isProcessing}>
                    {isProcessing ? 'Processing Order...' : 'Complete Payment'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Step 2 Modal: Success & Bill Options */}
      {showSuccessModal && completedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass animate-slide-up" style={{ width: '500px', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center' }}>
            <CheckCircle size={64} color="var(--accent)" style={{ margin: '0 auto 1.5rem auto' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Order Successful!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Invoice: {completedOrder.invoiceNumber} • Paid via {completedOrder.paymentMethod}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={printReceipt} style={{ padding: '1.2rem' }}>
                <Printer size={20} /> Print Thermal Bill
              </button>
              <button className="btn btn-secondary" onClick={sendOnlineReceipt} style={{ padding: '1.2rem', borderColor: '#25D366', color: '#25D366' }}>
                <MessageSquare size={20} /> Send via WhatsApp
              </button>
              
              <button 
                onClick={() => { setShowSuccessModal(false); setCompletedOrder(null); }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '1rem', textDecoration: 'underline' }}
              >
                Close & Start New Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default POS;

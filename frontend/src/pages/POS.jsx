import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { ChefHat, X, CheckCircle, Printer, MessageSquare, Search, Info, Plus, CreditCard, Smartphone, Banknote, Coffee, Utensils, Download, ChevronRight, ChevronLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const POS = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('All Items');
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Stripe');
  
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

  // Payment Flow States
  // Removed upiQRData
  const [cardAwaiting, setCardAwaiting] = useState(false);

  // Customization State
  const [selectedCustomizations, setSelectedCustomizations] = useState([]);
  
  // Payment variables missing state
  const [cashGiven, setCashGiven] = useState('');

  // Builder Wizard State
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderStep, setBuilderStep] = useState(0); 
  const [builderBase, setBuilderBase] = useState(null);
  const [builderCustomizations, setBuilderCustomizations] = useState([]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('build') === 'true') {
      setShowBuilder(true);
      setBuilderStep(0);
      setBuilderBase(null);
      setBuilderCustomizations([]);
      // Clear URL parameter so it doesn't re-trigger
      navigate('/pos', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMenuItems(data);
      } else {
        console.error('API returned non-array data:', data);
        setMenuItems([]);
      }
    } catch (err) {
      console.error('Failed to fetch menu', err);
      setMenuItems([]);
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
    const customIds = selectedCustomizations.map(c => c._id).sort().join(',');
    const cartItemId = item._id + customIds;

    const formattedCustomizations = selectedCustomizations.map(c => ({
      menuItemId: c._id,
      name: c.name,
      price: c.price
    }));

    setCart((prev) => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, cartItemId, qty: 1, customizations: formattedCustomizations }];
    });
    setSelectedProduct(null);
    setSelectedCustomizations([]);
  };

  const updateQty = (cartItemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.cartItemId === cartItemId) {
        const newQty = Math.max(0, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const subtotal = cart.reduce((sum, item) => {
    const customPrice = item.customizations ? item.customizations.reduce((s, c) => s + c.price, 0) : 0;
    return sum + ((item.price + customPrice) * item.qty);
  }, 0);
  const discountVal = Number(discountPercent) || 0;
  const discountAmount = (subtotal * discountVal) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const gst = subtotalAfterDiscount * 0.05; // 5% GST
  const total = subtotalAfterDiscount + gst;

  const groupedCustomizations = {
    Flavour: menuItems.filter(i => i.isCustomization && i.customizationType === 'Flavour'),
    Topping: menuItems.filter(i => i.isCustomization && i.customizationType === 'Topping'),
    Filling: menuItems.filter(i => i.isCustomization && i.customizationType === 'Filling'),
    Syrup: menuItems.filter(i => i.isCustomization && i.customizationType === 'Syrup')
  };

  const PREDEFINED_CATEGORIES = ['Waffles', 'Pancakes', 'Coffee', 'Shakes', 'Smoothies'];
  const displayCategories = ['All Items', ...PREDEFINED_CATEGORIES];

  const getCategoryIcon = (catName) => {
    const name = catName.toLowerCase();
    if (name.includes('drink') || name.includes('beverage') || name.includes('coffee') || name.includes('shake')) return <Coffee size={24} />;
    if (name.includes('all items')) return <ChefHat size={24} />;
    return <Utensils size={24} />;
  };

  const handleCheckoutInit = () => {
    if (cart.length === 0) return alert('Cart is empty!');
    setShowCustomerModal(true);
  };

  const handlePaymentInit = async (e) => {
    e.preventDefault();
    
    // Redirect to Stripe for UPI/Online Payments
    if (paymentMethod === 'UPI') {
      handleProcessOrder(true);
      return;
    }
    
    if (paymentMethod === 'Card' && !cardAwaiting) {
      setCardAwaiting(true);
      return;
    }
    
    handleProcessOrder(false);
  };

  const handleProcessOrder = async (isCheckoutSession = false) => {
    setIsProcessing(true);

    try {
      const orderItems = cart.map(item => ({
        menuItemId: item._id,
        quantity: item.qty,
        customizations: item.customizations || []
      }));

      const changeDueAmt = paymentMethod === 'Cash' && cashGiven ? Number(cashGiven) - total : 0;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: orderItems,
          paymentMethod,
          discountAmount,
          customerPhone,
          customerName,
          cashGiven: paymentMethod === 'Cash' ? Number(cashGiven) : 0,
          changeDue: changeDueAmt,
          isCheckoutSession
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (isCheckoutSession && data.url) {
          window.location.href = data.url;
          return;
        }

        setCompletedOrder(data);
        setShowCustomerModal(false);
        setShowSuccessModal(true);
        setCart([]);
        setCustomerPhone('');
        setCustomerName('');
        setCashGiven('');
        setCardAwaiting(false);
      } else {
        alert(data.message || 'Failed to process order');
      }
    } catch (err) {
      console.error(err);
      alert('Error processing order');
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

      if (item.customizations && item.customizations.length > 0) {
        doc.setFontSize(7);
        const customText = `  + ${item.customizations.map(c => c.name).join(', ')}`;
        const splitText = doc.splitTextToSize(customText, 40); // wrap within 40 chars
        splitText.forEach(line => {
          doc.text(line, marginLeft, y);
          y += 3;
        });
        doc.setFontSize(8);
      }
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

    if (completedOrder.paymentMethod === 'Cash' && completedOrder.cashGiven) {
      y += 2;
      const cashStr = completedOrder.cashGiven.toFixed(2);
      const changeStr = (completedOrder.changeDue || 0).toFixed(2);
      doc.text(`Cash Given:                      ${padL(cashStr, 8)}`, marginLeft, y);
      y += 4;
      doc.text(`Change Due:                      ${padL(changeStr, 8)}`, marginLeft, y);
      y += 4;
    }

    doc.text(doubleLine, marginLeft, y);
    y += 6;

    // Footer
    doc.text("      Thank you! Please visit again.", marginLeft, y);
    y += 4;
    doc.text(doubleLine, marginLeft, y);

    return doc;
  };

  const downloadReceipt = () => {
    try {
      const doc = getReceiptDoc();
      if (doc) {
        doc.save(`${completedOrder.invoiceNumber}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert("PDF Error: " + err.message);
    }
  };

  const printReceipt = () => {
    const doc = getReceiptDoc();
    if (doc) {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
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
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>Point of Sale</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Select an item to view details or add it directly to cart</p>
          </div>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search Product here..." style={{ paddingLeft: '3rem', borderRadius: 'var(--radius-xl)', background: '#ffffff', boxShadow: 'var(--shadow-sm)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {displayCategories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{ 
                background: activeTab === cat ? 'rgba(16, 185, 129, 0.15)' : '#ffffff', 
                color: activeTab === cat ? 'var(--primary)' : 'var(--text-main)', 
                border: '1px solid',
                borderColor: activeTab === cat ? 'var(--primary)' : 'var(--border)', 
                padding: '1rem 1.5rem', 
                borderRadius: 'var(--radius-lg)', 
                cursor: 'pointer', 
                fontWeight: 600, 
                fontSize: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '120px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {getCategoryIcon(cat)}
              {cat}
            </button>
          ))}
        </div>
        
        <div className="pos-grid">
          {menuItems.filter(item => {
            if (activeTab === 'All Items') return !item.isCustomization;
            return !item.isCustomization && item.category === activeTab;
          }).length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No items found in this category.</p>
          ) : menuItems.filter(item => {
            if (activeTab === 'All Items') return !item.isCustomization;
            return !item.isCustomization && item.category === activeTab;
          }).map(item => (
            <div 
              key={item._id} 
              className="pos-item-card animate-slide-up" 
              style={{ 
                opacity: item.isAvailable === false ? 0.6 : 1, 
                filter: item.isAvailable === false ? 'grayscale(0.8)' : 'none',
                pointerEvents: item.isAvailable === false ? 'none' : 'auto',
                cursor: item.isAvailable === false ? 'not-allowed' : 'default'
              }}
            >
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
              ) : (
                <div style={{ width: '100%', height: '140px', borderRadius: 'var(--radius-md)', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}><ChefHat size={40} color="var(--text-muted)" /></div>
              )}
              
              <span className="pos-item-category">
                {item.isCustomization ? `Component: ${item.customizationType}` : item.category || 'Dish'}
              </span>

              <div className="pos-item-name">
                {item.name} 
                {item.isAvailable === false && <span style={{display: 'block', color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.2rem'}}>Sold Out</span>}
              </div>
              
              <p className="pos-item-price">₹{item.price}</p>
              
              {item.isAvailable !== false && (
                <div className="pos-item-actions" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                    <button 
                      onClick={(e) => addToCart(item, e)} 
                      className="btn" 
                      style={{ width: '100%', padding: '0.75rem 0', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)', border: 'none', fontWeight: 700 }}
                    >
                      Add to Dish
                    </button>
                      <button 
                        onClick={() => setSelectedProduct(item)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                      >
                        View Details
                      </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cart Overlay for Mobile */}
      <div 
        className={`cart-overlay ${isMobileCartOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileCartOpen(false)}
      ></div>

      {/* Cart Sidebar */}
      <div className={`cart-sidebar glass ${isMobileCartOpen ? 'mobile-open' : ''}`} style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="cart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Current Order</h2>
          {/* Close button for mobile */}
          <button 
            className="btn btn-secondary d-md-none" 
            style={{ padding: '0.5rem', background: 'transparent', border: 'none' }}
            onClick={() => setIsMobileCartOpen(false)}
          >
            <X size={24} color="var(--text-main)" />
          </button>
        </div>
        
        <div className="cart-items">
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.cartItemId} className="cart-item">
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{item.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>₹{item.price}</p>
                  {item.customizations && item.customizations.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      + {item.customizations.map(c => c.name).join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={() => updateQty(item.cartItemId, -1)} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                  <span style={{ fontWeight: 600 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.cartItemId, 1)} style={{ background: 'rgba(16, 185, 129, 0.15)', border: 'none', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>+</button>
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
            {['Cash', 'Card', 'UPI'].map(method => (
              <button 
                key={method}
                onClick={() => setPaymentMethod(method)}
                style={{ 
                  flex: 1, 
                  padding: '0.75rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: paymentMethod === method ? 'var(--primary)' : 'var(--border)',
                  background: paymentMethod === method ? 'rgba(16, 185, 129, 0.1)' : '#ffffff',
                  color: paymentMethod === method ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: 600,
                  transition: 'var(--transition)'
                }}
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

      {/* Custom Dish Builder Wizard */}
      {showBuilder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="glass animate-slide-up" style={{ width: '90%', maxWidth: '800px', height: '80vh', borderRadius: 'var(--radius-lg)', background: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark)' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ChefHat color="var(--primary)" /> Build Your Own Dish
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                  {['Base', 'Flavour', 'Topping', 'Filling', 'Syrup'].map((stepName, idx) => (
                    <span key={stepName} style={{ 
                      color: builderStep === idx ? 'var(--primary)' : builderStep > idx ? 'var(--text-main)' : 'var(--text-subtle)',
                      fontWeight: builderStep === idx ? 700 : 500,
                      display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                      {stepName}
                      {idx < 4 && <ChevronRight size={14} color="var(--text-subtle)" />}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowBuilder(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}><X size={24} color="var(--text-muted)" /></button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: 'var(--bg-dark)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                {(() => {
                  let options = [];
                  if (builderStep === 0) options = menuItems.filter(i => !i.isCustomization);
                  if (builderStep === 1) options = menuItems.filter(i => i.isCustomization && i.customizationType === 'Flavour');
                  if (builderStep === 2) options = menuItems.filter(i => i.isCustomization && i.customizationType === 'Topping');
                  if (builderStep === 3) options = menuItems.filter(i => i.isCustomization && i.customizationType === 'Filling');
                  if (builderStep === 4) options = menuItems.filter(i => i.isCustomization && i.customizationType === 'Syrup');

                  if (options.length === 0) return <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No options available for this step. Click Next to skip.</p>;

                  return options.map(item => {
                    const isBaseSelected = builderStep === 0 && builderBase?._id === item._id;
                    const isCustomSelected = builderStep > 0 && builderCustomizations.some(c => c._id === item._id);
                    const isSelected = isBaseSelected || isCustomSelected;

                    return (
                      <div 
                        key={item._id}
                        onClick={() => {
                          if (builderStep === 0) {
                            setBuilderBase(item);
                            setBuilderStep(1);
                          } else {
                            if (isCustomSelected) {
                              setBuilderCustomizations(prev => prev.filter(c => c._id !== item._id));
                            } else {
                              setBuilderCustomizations(prev => [...prev, item]);
                            }
                          }
                        }}
                        style={{
                          background: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#ffffff',
                          border: '2px solid',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          transition: 'var(--transition)',
                          boxShadow: 'var(--shadow-sm)',
                          position: 'relative'
                        }}
                      >
                        {isSelected && <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '0.2rem' }}><CheckCircle size={18} /></div>}
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginBottom: '1rem' }} />
                        ) : (
                          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}><Utensils size={32} color="var(--text-muted)" /></div>
                        )}
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{item.name}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+₹{item.price}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Footer & Actions */}
            <div style={{ padding: '1.5rem 2rem', background: '#ffffff', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Running Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>
                  ₹{((builderBase?.price || 0) + builderCustomizations.reduce((sum, c) => sum + c.price, 0)).toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setBuilderStep(prev => Math.max(0, prev - 1))}
                  disabled={builderStep === 0}
                >
                  <ChevronLeft size={20} /> Back
                </button>
                
                {builderStep < 4 ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setBuilderStep(prev => prev + 1)}
                    disabled={builderStep === 0 && !builderBase}
                  >
                    Next Step <ChevronRight size={20} />
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      if (!builderBase) return alert("Please select a base dish first!");
                      const customIds = builderCustomizations.map(c => c._id).sort().join(',');
                      const cartItemId = builderBase._id + customIds;
                      
                      const formattedCustomizations = builderCustomizations.map(c => ({
                        menuItemId: c._id,
                        name: c.name,
                        price: c.price
                      }));

                      setCart(prev => {
                        const existing = prev.find(i => i.cartItemId === cartItemId);
                        if (existing) {
                          return prev.map(i => i.cartItemId === cartItemId ? { ...i, qty: i.qty + 1 } : i);
                        }
                        return [...prev, { ...builderBase, cartItemId, qty: 1, customizations: formattedCustomizations }];
                      });

                      setShowBuilder(false);
                      setBuilderStep(0);
                      setBuilderBase(null);
                      setBuilderCustomizations([]);
                    }}
                    style={{ background: '#f59e0b', color: 'black' }}
                  >
                    <Plus size={20} /> Add to Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass animate-slide-up" style={{ width: '500px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#ffffff' }}>
            <div style={{ position: 'relative', height: '250px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ChefHat size={80} color="var(--text-muted)" />
              )}
              <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '50%', padding: '0.5rem' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>{selectedProduct.name}</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>{selectedProduct.category || selectedProduct.customizationType}</span>
                </div>
                <span style={{ color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  ₹{(selectedProduct.price + selectedCustomizations.reduce((sum, c) => sum + c.price, 0)).toFixed(2)}
                </span>
              </div>
              
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {selectedProduct.description || "A deliciously crafted dish prepared fresh in our kitchen."}
              </p>

              {/* Nutrition Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Calories</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedProduct.nutritionalInfo?.calories || '-'}</div>
                </div>
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Protein</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedProduct.nutritionalInfo?.protein || '-'}g</div>
                </div>
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Carbs</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedProduct.nutritionalInfo?.carbs || '-'}g</div>
                </div>
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fat</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedProduct.nutritionalInfo?.fat || '-'}g</div>
                </div>
              </div>

              {/* Customizations */}
              <div style={{ marginBottom: '2rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {Object.entries(groupedCustomizations).map(([category, options]) => options.length > 0 && (
                  <div key={category} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'capitalize' }}>{category}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {options.map(opt => {
                        const isSelected = selectedCustomizations.some(c => c._id === opt._id);
                        return (
                          <button
                            key={opt._id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCustomizations(prev => prev.filter(c => c._id !== opt._id));
                              } else {
                                setSelectedCustomizations(prev => [...prev, opt]);
                              }
                            }}
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            {opt.name} (+₹{opt.price})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass animate-slide-up" style={{ width: '450px', borderRadius: 'var(--radius-lg)', padding: '2.5rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Customer Details</h2>
              <button onClick={() => setShowCustomerModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handlePaymentInit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

              {paymentMethod === 'Cash' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cash Given by Customer</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>₹</span>
                    <input 
                      required 
                      type="number" 
                      min={total}
                      step="0.01"
                      value={cashGiven} 
                      onChange={e => setCashGiven(e.target.value)} 
                      placeholder="Enter amount..."
                      style={{ paddingLeft: '2rem' }}
                    />
                  </div>
                  {Number(cashGiven) > 0 && Number(cashGiven) >= total && (
                    <p style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '0.5rem' }}>Change Due: ₹{(Number(cashGiven) - total).toFixed(2)}</p>
                  )}
                </div>
              )}

              {paymentMethod === 'Card' && cardAwaiting && (
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <CreditCard size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>Awaiting Card Swipe</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Please complete the transaction of ₹{total.toFixed(2)} on the card terminal.</p>
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Smartphone size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>Online UPI Checkout</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>You will be redirected to the secure Stripe payment gateway to complete the UPI transaction of ₹{total.toFixed(2)}.</p>
                </div>
              )}

              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                 <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Amount</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>₹{total.toFixed(2)}</span>
                 </p>
                 <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : (
                      paymentMethod === 'Card' && !cardAwaiting ? 'Initiate Card Payment' :
                      paymentMethod === 'Card' && cardAwaiting ? 'Confirm Terminal Success' :
                      paymentMethod === 'UPI' ? 'Proceed to Stripe Payment' :
                      'Complete Payment'
                    )}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Step 2 Modal: Success & Bill Options */}
      {showSuccessModal && completedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass animate-slide-up" style={{ width: '500px', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', background: '#ffffff' }}>
            <CheckCircle size={64} color="var(--accent)" style={{ margin: '0 auto 1.5rem auto' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Order Successful!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Invoice: {completedOrder.invoiceNumber} • Paid via {completedOrder.paymentMethod}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={downloadReceipt} style={{ padding: '1.2rem' }}>
                <Download size={20} /> Download PDF
              </button>
              <button className="btn btn-primary" onClick={printReceipt} style={{ padding: '1.2rem', background: '#3b82f6', border: 'none' }}>
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

      {/* Mobile Cart Overlay */}
      {isMobileCartOpen && (
        <div 
          className="mobile-cart-overlay" 
          onClick={() => setIsMobileCartOpen(false)}
        />
      )}

      {/* Mobile Floating Action Button */}
      <button 
        className="mobile-fab" 
        onClick={() => setIsMobileCartOpen(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={20} />
          <span>{cart.length} Items</span>
        </div>
        <span>₹{total.toFixed(2)}</span>
      </button>

    </div>
  );
};

export default POS;

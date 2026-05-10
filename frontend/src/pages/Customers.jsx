import React, { useState, useEffect } from 'react';
import { Users, Search, ChevronRight, X, UserCircle, Gift, Settings, Clock, Receipt } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [search, setSearch] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [menuItems, setMenuItems] = useState([]);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [loyaltySettings, setLoyaltySettings] = useState({
    pointsPerOrder: 1,
    thresholdPoints: 10,
    rewardType: 'discount', // 'discount' or 'free_dish'
    rewardValue: 50 // discount % or free dish ID/name
  });

  useEffect(() => {
    fetchCustomers();
    fetchLoyaltySettings();
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredCustomers(customers);
    } else {
      const lower = search.toLowerCase();
      setFilteredCustomers(customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(lower)) || 
        (c.phone && c.phone.includes(lower))
      ));
    }
  }, [search, customers]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        setMenuItems(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch menu items', err);
    }
  };

  const fetchLoyaltySettings = async () => {
    try {
      const res = await fetch('/api/loyalty-settings');
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setLoyaltySettings(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch loyalty settings', err);
    }
  };

  const saveLoyaltySettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/loyalty-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loyaltySettings)
      });
      if (res.ok) {
        alert('Loyalty settings saved successfully!');
        setIsSettingsModalOpen(false);
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save loyalty settings', err);
      alert('Error saving settings');
    }
  };

  const handleCustomerClick = async (customer) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    try {
      // Mock API or real API to fetch orders by phone
      const res = await fetch(`/api/orders`);
      const allOrders = await res.json();
      const cOrders = allOrders.filter(o => o.customerPhone === customer.phone || (o.customerDetails && o.customerDetails.phone === customer.phone));
      setCustomerOrders(cOrders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Failed to fetch customer orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users color="var(--primary)" /> Customers & Loyalty
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your customer base and loyalty programs</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '3rem', borderRadius: 'var(--radius-xl)', background: '#ffffff', boxShadow: 'var(--shadow-sm)' }} 
            />
          </div>
          <button className="btn btn-secondary" onClick={() => setIsSettingsModalOpen(true)}>
            <Settings size={20} /> Loyalty Settings
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Customers List */}
        <div className="glass" style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflowY: 'auto', padding: '1rem' }}>
          {filteredCustomers.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No customers found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredCustomers.map(customer => (
                <div 
                  key={customer._id || customer.id} 
                  onClick={() => handleCustomerClick(customer)}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '1.25rem', background: selectedCustomer?._id === customer._id ? 'rgba(16, 185, 129, 0.1)' : '#ffffff', 
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid',
                    borderColor: selectedCustomer?._id === customer._id ? 'var(--primary)' : 'var(--border)',
                    transition: 'var(--transition)'
                  }}
                  className="hover-brighten"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCircle size={28} color="var(--text-muted)" />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>{customer.name}</h4>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{customer.phone}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loyalty Points</div>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{customer.loyaltyPoints || 0} pts</div>
                    </div>
                    <ChevronRight size={20} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Details */}
        {selectedCustomer && (
          <div className="glass animate-slide-up" style={{ width: '400px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '2rem', background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <UserCircle size={48} color="var(--primary)" />
              </div>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>{selectedCustomer.name}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>{selectedCustomer.phone}</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ background: '#ffffff', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Orders</div>
                  <div style={{ fontWeight: 'bold' }}>{customerOrders.length}</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Loyalty Points</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{selectedCustomer.loyaltyPoints || 0}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', background: '#ffffff' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={18} /> Order History
              </h3>
              
              {loadingOrders ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading orders...</p>
              ) : customerOrders.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No previous orders found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {customerOrders.map(order => (
                    <div key={order._id || order.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>{order.invoiceNumber}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>₹{order.totalAmount?.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>{order.paymentMethod}</span>
                      </div>
                      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loyalty Settings Modal */}
      {isSettingsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass animate-slide-up" style={{ width: '450px', borderRadius: 'var(--radius-lg)', padding: '2rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gift color="var(--primary)" /> Loyalty Settings
              </h2>
              <button onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-muted)" /></button>
            </div>

            <form onSubmit={saveLoyaltySettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Points Granted per Order</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  value={loyaltySettings.pointsPerOrder} 
                  onChange={e => setLoyaltySettings({...loyaltySettings, pointsPerOrder: Number(e.target.value)})} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Threshold Points for Reward</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  value={loyaltySettings.thresholdPoints} 
                  onChange={e => setLoyaltySettings({...loyaltySettings, thresholdPoints: Number(e.target.value)})} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reward Type</label>
                <select 
                  value={loyaltySettings.rewardType} 
                  onChange={e => setLoyaltySettings({...loyaltySettings, rewardType: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                >
                  <option value="discount">Percentage Discount</option>
                  <option value="free_dish">Free Dish</option>
                </select>
              </div>

              {loyaltySettings.rewardType === 'discount' ? (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Discount Percentage (%)</label>
                  <input 
                    type="number" 
                    required 
                    min="1" max="100"
                    value={loyaltySettings.rewardValue} 
                    onChange={e => setLoyaltySettings({...loyaltySettings, rewardValue: Number(e.target.value)})} 
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select Free Dish</label>
                  <select 
                    required 
                    value={loyaltySettings.rewardValue} 
                    onChange={e => setLoyaltySettings({...loyaltySettings, rewardValue: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                  >
                    <option value="" disabled>Select a dish...</option>
                    {menuItems.filter(item => !item.isCustomization).map(item => (
                      <option key={item._id} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                Save Settings
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

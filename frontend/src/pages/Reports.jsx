import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { IndianRupee, TrendingUp, ShoppingBag, CreditCard, Calendar } from 'lucide-react';

const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [timeFilter, setTimeFilter] = useState('All Time'); // Today, This Week, This Month, This Year, All Time

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

  const filteredOrders = useMemo(() => {
    if (timeFilter === 'All Time') return orders;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Day of week (0 is Sunday, 1 is Monday). Let's assume week starts on Monday.
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; 
    const startOfWeek = new Date(startOfToday - dayOfWeek * 24 * 60 * 60 * 1000).getTime();
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    return orders.filter(order => {
      const orderTime = new Date(order.createdAt).getTime();
      switch (timeFilter) {
        case 'Today': return orderTime >= startOfToday;
        case 'This Week': return orderTime >= startOfWeek;
        case 'This Month': return orderTime >= startOfMonth;
        case 'This Year': return orderTime >= startOfYear;
        default: return true;
      }
    });
  }, [orders, timeFilter]);

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = filteredOrders.length;
  const totalDiscounts = filteredOrders.reduce((sum, order) => sum + order.discountAmount, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Aggregate daily revenue for the chart based on filtered orders
  const chartDataMap = filteredOrders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = 0;
    acc[date] += order.totalAmount;
    return acc;
  }, {});
  
  const chartData = Object.keys(chartDataMap).map(date => ({
    date,
    revenue: chartDataMap[date]
  })).reverse(); // reverse to show oldest to newest left to right usually, but depends on array order

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track your business performance and sales data</p>
        </div>
        
        {/* Time Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <Calendar size={18} color="var(--text-muted)" />
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1rem', cursor: 'pointer', outline: 'none', boxShadow: 'none', padding: 0 }}
          >
            <option style={{ background: 'var(--bg-panel)' }} value="Today">Today</option>
            <option style={{ background: 'var(--bg-panel)' }} value="This Week">This Week</option>
            <option style={{ background: 'var(--bg-panel)' }} value="This Month">This Month</option>
            <option style={{ background: 'var(--bg-panel)' }} value="This Year">This Year</option>
            <option style={{ background: 'var(--bg-panel)' }} value="All Time">All Time</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), transparent)', width: '100px', height: '100px', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
               <IndianRupee size={24} color="#10b981" />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Revenue</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-main)' }}>₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>

        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
               <ShoppingBag size={24} color="#3b82f6" />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{totalOrders}</h2>
        </div>

        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
               <TrendingUp size={24} color="#ef4444" />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Avg Order Value</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>₹{avgOrderValue.toFixed(2)}</h2>
        </div>

        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
               <CreditCard size={24} color="#f59e0b" />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Discounts Given</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>₹{totalDiscounts.toFixed(2)}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Chart */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
          <h3 style={{ marginBottom: '2rem', fontSize: '1.25rem' }}>Revenue Trend ({timeFilter})</h3>
          <div style={{ height: '300px', width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                  <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="url(#colorRevenue)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No data available for this time period.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Recent Transactions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
            {filteredOrders.slice(0, 10).map(order => (
              <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--primary)' }}>
                    Order #{order.orderNumber || order.invoiceNumber.split('-')[1]}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {order.paymentMethod} • {order.invoiceNumber}
                  </p>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  ₹{order.totalAmount.toFixed(2)}
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No recent transactions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

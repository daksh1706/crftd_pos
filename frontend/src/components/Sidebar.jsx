import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  MenuSquare, 
  BarChart3, 
  Settings as SettingsIcon,
  BookOpen,
  Bell,
  LogOut,
  Plus,
  Shield,
  Users
} from 'lucide-react';

const Sidebar = ({ setAuth, role }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    if (setAuth) setAuth(null);
    navigate('/');
  };
  return (
    <>
      <div className="desktop-sidebar" style={{
        width: '260px',
        backgroundColor: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        height: '100%'
      }}>
        <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>C</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: 'var(--text-main)' }}>CRFTD POS</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <NavItem to="/pos" icon={<ShoppingCart size={20} />} label="Point of Sale" />
          <NavItem to="/pos?build=true" icon={<Plus size={20} />} label="Build Your Own" />
          <NavItem to="/orders" icon={<Bell size={20} />} label="Active Orders" />
          <NavItem to="/inventory" icon={<Package size={20} />} label="Inventory" />
          <NavItem to="/menu" icon={<MenuSquare size={20} />} label="Menu & Recipes" />
          <NavItem to="/customers" icon={<Users size={20} />} label="Customers" />
          <NavItem to="/reports" icon={<BarChart3 size={20} />} label="Analytics" />
          <NavItem to="/ledger" icon={<BookOpen size={20} />} label="Order Ledger" />
          <NavItem to="/settings" icon={<SettingsIcon size={20} />} label="Settings" />
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <button onClick={handleLogout} style={{ 
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
            color: 'var(--text-muted)', background: 'transparent', border: 'none', 
            cursor: 'pointer', width: '100%', borderRadius: 'var(--radius-md)', 
            fontWeight: 600, fontSize: '1rem' 
          }} className="hover-brighten">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <MobileNavItem to="/pos" icon={<ShoppingCart size={24} />} label="POS" />
        <MobileNavItem to="/pos?build=true" icon={<Plus size={24} />} label="Build" />
        <MobileNavItem to="/orders" icon={<Bell size={24} />} label="Orders" />
        <MobileNavItem to="/menu" icon={<MenuSquare size={24} />} label="Menu" />
        <MobileNavItem to="/reports" icon={<BarChart3 size={24} />} label="Stats" />
      </div>
    </>
  );
};

const NavItem = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
        fontWeight: isActive ? 600 : 500,
        transition: 'var(--transition)'
      })}
      className="hover-brighten"
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

const MobileNavItem = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        textDecoration: 'none',
        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
        fontWeight: isActive ? 600 : 500,
        transition: 'var(--transition)',
        padding: '0.5rem'
      })}
    >
      {icon}
      <span style={{ fontSize: '0.7rem' }}>{label}</span>
    </NavLink>
  );
};

export default Sidebar;

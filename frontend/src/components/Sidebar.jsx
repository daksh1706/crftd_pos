import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  MenuSquare, 
  BarChart3, 
  Settings as SettingsIcon,
  BookOpen,
  Bell
} from 'lucide-react';

const Sidebar = () => {
  return (
    <div style={{
      width: '260px',
      backgroundColor: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem'
    }}>
      <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)', /* Vibrant Orange to Red for CRFTD */
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>C</span>
        </div>
        <h2 style={{ fontSize: '1.75rem', margin: 0, letterSpacing: '2px', fontWeight: 800 }}>CRFTD</h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <NavLink to="/pos" style={({isActive}) => ({ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', color: isActive ? 'white' : 'var(--text-muted)', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', textDecoration: 'none', borderRadius: 'var(--radius-md)', transition: 'var(--transition)' })} className="hover-brighten">
          <ShoppingCart size={20} /> Point of Sale
        </NavLink>
        <NavLink to="/orders" style={({isActive}) => ({ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', color: isActive ? 'white' : 'var(--text-muted)', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', textDecoration: 'none', borderRadius: 'var(--radius-md)', transition: 'var(--transition)' })} className="hover-brighten">
          <Bell size={20} /> Active Orders
        </NavLink>
        <NavLink to="/inventory" style={({isActive}) => ({ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', color: isActive ? 'white' : 'var(--text-muted)', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', textDecoration: 'none', borderRadius: 'var(--radius-md)', transition: 'var(--transition)' })} className="hover-brighten">
          <Package size={20} /> Inventory
        </NavLink>
        <NavLink to="/menu" style={({isActive}) => ({ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', color: isActive ? 'white' : 'var(--text-muted)', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', textDecoration: 'none', borderRadius: 'var(--radius-md)', transition: 'var(--transition)' })} className="hover-brighten">
          <MenuSquare size={20} /> Menu & Recipes
        </NavLink>
        <NavLink to="/reports" style={({isActive}) => ({ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', color: isActive ? 'white' : 'var(--text-muted)', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', textDecoration: 'none', borderRadius: 'var(--radius-md)', transition: 'var(--transition)' })} className="hover-brighten">
          <BarChart3 size={20} /> Analytics
        </NavLink>
        <NavLink to="/ledger" style={({isActive}) => ({ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', color: isActive ? 'white' : 'var(--text-muted)', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', textDecoration: 'none', borderRadius: 'var(--radius-md)', transition: 'var(--transition)' })} className="hover-brighten">
          <BookOpen size={20} /> Order Ledger
        </NavLink>
        <NavLink to="/settings" style={({isActive}) => ({ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', color: isActive ? 'white' : 'var(--text-muted)', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', textDecoration: 'none', borderRadius: 'var(--radius-md)', transition: 'var(--transition)' })} className="hover-brighten">
          <SettingsIcon size={20} /> Settings
        </NavLink>
      </nav>
    </div>
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
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-sm)',
        textDecoration: 'none',
        color: isActive ? 'white' : 'var(--text-muted)',
        backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
        transition: 'var(--transition)'
      })}
    >
      {icon}
      <span style={{ fontWeight: 500 }}>{label}</span>
    </NavLink>
  );
};

export default Sidebar;

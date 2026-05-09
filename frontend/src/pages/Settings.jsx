import React from 'react';
import { Settings as SettingsIcon, Store, User, Shield } from 'lucide-react';

const Settings = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure your CRFTD POS system</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Settings Nav */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn hover-brighten" style={{ justifyContent: 'flex-start', background: '#ffffff', color: 'var(--text-main)', padding: '1rem' }}>
              <Store size={18} /> Store Details
            </button>
            <button className="btn hover-brighten" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-muted)', padding: '1rem' }}>
              <User size={18} /> Accounts
            </button>
            <button className="btn hover-brighten" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-muted)', padding: '1rem' }}>
              <Shield size={18} /> Security & Roles
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Store Details</h2>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Store Name</label>
              <input type="text" defaultValue="CRFTD" />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>GSTIN</label>
              <input type="text" defaultValue="27CRFTD0000A1Z5" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Store Address</label>
              <textarea rows="3" defaultValue="Premium Crafted Experience\n123 Cyberpunk Street" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Default Tax Rate (%)</label>
              <input type="number" defaultValue="5" />
            </div>

            <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '1rem 2rem' }}>Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;

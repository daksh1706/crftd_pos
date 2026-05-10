import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Lock, User, Mail } from 'lucide-react';

const AuthPage = ({ setAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isLogin) {
        localStorage.setItem('userInfo', JSON.stringify(data));
        setAuth(data);
        navigate('/pos');
      } else {
        setSuccessMsg('Request submitted! Please wait for admin approval.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div className="glass" style={{ width: '400px', padding: '3rem', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
        <ChefHat size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>CRFTD POS</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {isLogin ? 'Login to access the system' : 'Request access to the system'}
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="email" 
              placeholder="Email address" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', height: '3rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', height: '3rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', height: '3rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Request Access')}
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already requested access? "}
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

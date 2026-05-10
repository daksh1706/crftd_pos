import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, ShieldAlert } from 'lucide-react';

const AccessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/users/pending', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await fetch(`/api/users/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchRequests(); // refresh list
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (userInfo.role !== 'Admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <ShieldAlert size={64} color="var(--error)" style={{ marginBottom: '1rem' }} />
        <h1>Access Denied</h1>
        <p style={{ color: 'var(--text-muted)' }}>You must be an Administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Access Requests</h1>
        <p style={{ color: 'var(--text-muted)' }}>Approve or deny staff members requesting access to the POS.</p>
      </div>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
          <Clock size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No Pending Requests</h3>
          <p style={{ color: 'var(--text-muted)' }}>You're all caught up!</p>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <tr>
                <th style={{ padding: '1.25rem' }}>Email / Username</th>
                <th style={{ padding: '1.25rem' }}>Requested Role</th>
                <th style={{ padding: '1.25rem' }}>Date Requested</th>
                <th style={{ padding: '1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '1.25rem', fontWeight: 500 }}>{req.username}</td>
                  <td style={{ padding: '1.25rem', color: 'var(--primary)' }}>{req.role}</td>
                  <td style={{ padding: '1.25rem', color: 'var(--text-muted)' }}>
                    {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleStatusUpdate(req.id, 'approved')}
                        style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <UserCheck size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(req.id, 'rejected')}
                        style={{ padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <UserX size={16} /> Deny
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;

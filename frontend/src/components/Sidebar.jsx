import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Sidebar = ({ closeMobileMenu }) => {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem('username') || 'Advisor';
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { name: '📊 Dashboard', path: '/dashboard' },
    { name: '👥 Clients Database', path: '/clients' },
    { name: '🔄 SIP Tracker', path: '/sips' },
    { name: '💸 Transactions', path: '/transactions' },
    { name: '📂 MF Schemes', path: '/schemes' },
    { name: '📈 Charts & Analytics', path: '/charts' }, 
    { name: '📥 Download Reports', path: '/reports' },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true); 
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout failed on server", err);
    } finally {
      sessionStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sidebar, #1e293b)', transition: 'background 0.3s ease' }}>
      
      <style>{`
        .sidebar-nav::-webkit-scrollbar { display: none; }
        .sidebar-nav { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-icon { display: inline-block; animation: spin 1s linear infinite; }
      `}</style>

      <div className="sidebar-logo" style={{ padding: '20px', borderBottom: '1px solid var(--border, #334155)', transition: 'border-color 0.3s ease' }}>
        <div style={{ fontWeight: '900', fontSize: '20px', color: '#fff' }}>VisionBridge 📈</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', fontWeight: '700' }}>
          WELCOME, {userName.toUpperCase()}
        </div>
      </div>
      
      <nav className="sidebar-nav" style={{ flex: 1, paddingTop: '15px', overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={closeMobileMenu} 
            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
            style={{ fontWeight: '900' }}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border, #334155)', transition: 'border-color 0.3s ease' }}>
        <button 
          onClick={handleLogout} 
          disabled={isLoggingOut}
          className="sidebar-link" 
          style={{ 
            width: '100%', textAlign: 'left', border: 'none', background: 'none', 
            cursor: isLoggingOut ? 'not-allowed' : 'pointer', fontWeight: '900', 
            color: isLoggingOut ? '#fca5a5' : '#ef4444', transition: 'color 0.2s ease', 
            opacity: isLoggingOut ? 0.7 : 1 
          }}
        >
          {isLoggingOut ? (
            <span><span className="spin-icon">⏳</span> Logging out...</span>
          ) : (
            <span>🚪 Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api'; // 💡 Import our secure API instance

const Sidebar = () => {
  const navigate = useNavigate();
  // 💡 Grab the name we saved during login
  const userName = sessionStorage.getItem('username') || 'Advisor';

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
    try {
      // 1. Tell backend to clear the HttpOnly cookie
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout failed on server", err);
    } finally {
      // 2. Always clear local data and redirect
      sessionStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-logo" style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
        <div style={{ fontWeight: '900', fontSize: '20px', color: '#fff' }}>VisionBridge 📈</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', fontWeight: '700' }}>
          WELCOME, {userName.toUpperCase()}
        </div>
      </div>
      
      <nav className="sidebar-nav" style={{ flex: 1, paddingTop: '10px' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
            style={{ fontWeight: '900' }}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid #334155' }}>
        <button 
          onClick={handleLogout} 
          className="sidebar-link" 
          style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#ef4444' }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
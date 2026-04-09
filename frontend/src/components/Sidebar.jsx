import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Sidebar = ({ closeMobileMenu }) => {
  const navigate = useNavigate();
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
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout failed on server", err);
    } finally {
      sessionStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e293b' }}>
      
      {/* 💡 CSS to hide the scrollbar specifically for the navigation area */}
      <style>{`
        .sidebar-nav::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        .sidebar-nav {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>

      <div className="sidebar-logo" style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
        <div style={{ fontWeight: '900', fontSize: '20px', color: '#fff' }}>VisionBridge 📈</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', fontWeight: '700' }}>
          WELCOME, {userName.toUpperCase()}
        </div>
      </div>
      
      {/* 💡 VISIBLE SEARCH BUTTON */}
      <div style={{ padding: '15px 20px 5px 20px' }}>
        <button 
          onClick={() => {
            window.dispatchEvent(new Event('open-cmd-k'));
            if(closeMobileMenu) closeMobileMenu(); // Close sidebar on mobile when searching
          }}
          style={{ 
            width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', 
            borderRadius: '8px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', 
            alignItems: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            transition: 'border-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#64748b'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🔍</span> Search...
          </span>
          <span style={{ background: '#1e293b', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', border: '1px solid #334155' }}>
            Ctrl K
          </span>
        </button>
      </div>

      <nav className="sidebar-nav" style={{ flex: 1, paddingTop: '10px', overflowY: 'auto' }}>
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
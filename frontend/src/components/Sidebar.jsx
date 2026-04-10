import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ThemeSwitcher from './ThemeSwitcher';

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
      console.error("Logout failed", err);
    } finally {
      sessionStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="sidebar" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: 'var(--sidebar, #1e293b)', 
      transition: 'background 0.3s ease',
      overflow: 'hidden' // 💡 Force-remove any external scrollbars
    }}>
      
      <style>{`
        /* Hide scrollbar but allow scrolling if absolutely needed on tiny screens */
        .sidebar-nav::-webkit-scrollbar { display: none; }
        .sidebar-nav { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-icon { display: inline-block; animation: spin 1s linear infinite; }
        
        .sidebar-link {
          display: block;
          padding: 10px 20px; /* 💡 Reduced vertical padding from 12px to 10px */
          color: #94a3b8;
          text-decoration: none;
          transition: all 0.2s;
          font-weight: 900;
          font-size: 14px; /* 💡 Standardized font size */
        }
        .sidebar-link.active {
          background: rgba(14, 165, 233, 0.1);
          color: #0ea5e9;
          border-right: 4px solid #0ea5e9;
        }
      `}</style>

      {/* TOP: LOGO (More compact padding) */}
      <div className="sidebar-logo" style={{ padding: '15px 20px', borderBottom: '1px solid var(--border, #334155)', flexShrink: 0 }}>
        <div style={{ fontWeight: '900', fontSize: '18px', color: '#fff' }}>VisionBridge 📈</div>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', fontWeight: '700' }}>
          WELCOME, {userName.toUpperCase()}
        </div>
      </div>
      
      {/* MIDDLE: NAV LINKS (Tightened spacing) */}
      <nav className="sidebar-nav" style={{ 
        flex: 1, 
        paddingTop: '10px', 
        overflowY: 'auto' 
      }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={closeMobileMenu} 
            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* BOTTOM: SETTINGS & LOGOUT (Slimmed down) */}
      <div style={{ 
        padding: '15px 20px', 
        borderTop: '1px solid var(--border, #334155)', 
        flexShrink: 0,
        background: 'var(--sidebar, #1e293b)' 
      }}>
        
        <div style={{ marginBottom: '15px' }}>
          <p style={{ color: '#94a3b8', fontSize: '9px', fontWeight: '800', marginBottom: '8px', letterSpacing: '1px' }}>APPEARANCE</p>
          {/* We use a smaller version of the switcher if possible, or just standard */}
          <ThemeSwitcher />
        </div>

        <button 
          onClick={handleLogout} 
          disabled={isLoggingOut}
          style={{ 
            width: '100%', textAlign: 'left', border: 'none', background: 'none', 
            cursor: isLoggingOut ? 'not-allowed' : 'pointer', fontWeight: '900', 
            color: isLoggingOut ? '#fca5a5' : '#ef4444', opacity: isLoggingOut ? 0.7 : 1,
            padding: '5px 0',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isLoggingOut ? <span><span className="spin-icon">⏳</span> Logging out...</span> : <span>🚪 Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
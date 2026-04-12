import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ThemeSwitcher from './ThemeSwitcher';

const Sidebar = ({ closeMobileMenu, isMobileOpen }) => {
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
      width: '100%',
      background: 'var(--sidebar, #1e293b)', 
      transition: 'background 0.3s ease',
      overflow: 'hidden',
      borderRight: '1.5px solid var(--border, #334155)',
      zIndex: 999999
    }}>
      
      <style>{`
        .sidebar-nav::-webkit-scrollbar { display: none; }
        .sidebar-nav { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-icon { display: inline-block; animation: spin 1s linear infinite; }
        
        .sidebar-link {
          display: block;
          padding: 14px 20px;
          color: #94a3b8;
          text-decoration: none;
          transition: all 0.2s;
          font-weight: 900;
          font-size: 14px;
        }
        .sidebar-link.active {
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          border-right: 4px solid #0ea5e9;
        }
      `}</style>

      <div className="sidebar-logo" style={{ 
        padding: '25px 20px', 
        borderBottom: '1px solid var(--border, #334155)', 
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '20px', color: '#fff', whiteSpace: 'nowrap' }}>VisionBridge 📈</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontWeight: '700' }}>
            WELCOME, {userName.toUpperCase()}
          </div>
        </div>

        <button 
          onClick={closeMobileMenu}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none', 
            color: 'white', 
            fontSize: '20px', 
            padding: '5px 10px', 
            borderRadius: '6px', 
            cursor: 'pointer',
            display: window.innerWidth < 1024 ? 'block' : 'none'
          }}
        >
          ✕
        </button>
      </div>
      
      <nav className="sidebar-nav" style={{ flex: 1, paddingTop: '15px', overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <NavLink key={item.name} to={item.path} onClick={closeMobileMenu} 
            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid var(--border, #334155)', flexShrink: 0, background: 'rgba(0,0,0,0.1)' }}>
        {/* 🚪 LOGOUT BUTTON - NOW ON TOP */}
        <button onClick={handleLogout} disabled={isLoggingOut}
          style={{ 
            width: '100%', 
            textAlign: 'left', 
            border: 'none', 
            background: 'none', 
            cursor: isLoggingOut ? 'not-allowed' : 'pointer', 
            fontWeight: '900', 
            color: isLoggingOut ? '#fca5a5' : '#ef4444', 
            opacity: isLoggingOut ? 0.7 : 1, 
            padding: '8px 0', 
            fontSize: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '15px' 
          }}>
          {isLoggingOut ? <span><span className="spin-icon">⏳</span> Logging out...</span> : <span>🚪 Logout</span>}
        </button>

        {/* 🌓 APPEARANCE BUTTON - NOW ON BOTTOM */}
        <div>
          <p style={{ color: '#94a3b8', fontSize: '9px', fontWeight: '800', marginBottom: '10px', letterSpacing: '1px' }}>APPEARANCE</p>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
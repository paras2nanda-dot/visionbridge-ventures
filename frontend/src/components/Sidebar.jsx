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
      borderRight: '1px solid var(--border)',
      zIndex: 999999,
      overflow: 'hidden'
    }}>
      
      <style>{`
        .sidebar-nav { flex: 1; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .sidebar-nav::-webkit-scrollbar { display: none; }
        
        .sidebar-link {
          display: block;
          padding: 14px 20px;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          /* 💡 FIX: Removed ellipsis and allowed text to wrap if necessary */
          white-space: normal; 
          word-wrap: break-word;
          line-height: 1.4;
        }
        .sidebar-link.active {
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          border-right: 4px solid #0ea5e9;
        }

        @media (max-width: 768px) {
          .sidebar-logo-text { font-size: 16px !important; }
          .sidebar-link { padding: 12px 15px; font-size: 13px; }
          .mobile-close-btn { display: flex !important; }
        }
      `}</style>

      <div className="sidebar-logo" style={{ 
        padding: '20px 15px', 
        borderBottom: '1px solid var(--border)', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ minWidth: 0 }}>
          <div className="sidebar-logo-text" style={{ fontWeight: '900', fontSize: '18px', color: '#fff' }}>VisionBridge 📈</div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
            {userName}
          </div>
        </div>

        <button 
          onClick={closeMobileMenu}
          className="mobile-close-btn"
          style={{ 
            display: 'none', background: 'rgba(255,255,255,0.1)', border: 'none', 
            color: 'white', fontSize: '18px', width: '32px', height: '32px',
            alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer'
          }}
        >✕</button>
      </div>
      
      <nav className="sidebar-nav" style={{ paddingTop: '10px' }}>
        {menuItems.map((item) => (
          <NavLink key={item.name} to={item.path} onClick={closeMobileMenu} 
            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '15px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
        <button onClick={handleLogout} disabled={isLoggingOut}
          style={{ 
            width: '100%', textAlign: 'left', border: 'none', background: 'none', 
            cursor: 'pointer', fontWeight: '800', color: '#ef4444', 
            fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' 
          }}>
          🚪 {isLoggingOut ? "Logging out..." : "Logout"}
        </button>

        <p style={{ color: '#94a3b8', fontSize: '8px', fontWeight: '900', marginBottom: '8px', letterSpacing: '1px' }}>APPEARANCE</p>
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default Sidebar;
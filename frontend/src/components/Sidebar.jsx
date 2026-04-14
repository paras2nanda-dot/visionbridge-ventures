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
        .sidebar-nav { 
          flex: 1; 
          overflow-y: auto; 
          scrollbar-width: none; 
          -ms-overflow-style: none; 
          padding-top: 15px;
        }
        .sidebar-nav::-webkit-scrollbar { display: none; }
        
        .sidebar-link {
          display: block;
          padding: 16px 24px;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          white-space: normal; 
          word-wrap: break-word;
          line-height: 1.5;
          transition: all 0.2s ease;
          border-left: 4px solid transparent;
          text-transform: none !important;
        }

        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .sidebar-link.active {
          background: linear-gradient(90deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0) 100%);
          color: #0ea5e9;
          border-left: 4px solid #0ea5e9;
          font-weight: 800;
        }

        @media (max-width: 768px) {
          .sidebar-logo-text { 
             font-size: 22px !important; 
             letter-spacing: -0.5px;
          }
          .sidebar-link { 
             padding: 18px 24px; 
             font-size: 16px; 
             font-weight: 700;
          }
          .mobile-close-btn { 
             display: flex !important; 
             margin-right: -5px;
          }
          .sidebar-logo {
             padding: 30px 20px !important; 
          }
        }
      `}</style>

      <div className="sidebar-logo" style={{ 
        padding: '25px 20px', 
        borderBottom: '1px solid var(--border)', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ minWidth: 0 }}>
          <div className="sidebar-logo-text" style={{ fontWeight: '900', fontSize: '22px', color: '#fff' }}>VisionBridge 📈</div>
          <div style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: '900', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '1.5px' }}>
            WELCOME, {userName.toUpperCase()}
          </div>
        </div>

        <button 
          onClick={closeMobileMenu}
          className="mobile-close-btn"
          style={{ 
            display: 'none', background: 'rgba(255,255,255,0.1)', border: 'none', 
            color: 'white', fontSize: '18px', width: '38px', height: '38px',
            alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer'
          }}
        >✕</button>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink key={item.name} to={item.path} onClick={closeMobileMenu} 
            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '20px', borderTop: '1.5px solid var(--border)', background: 'transparent' }}>
        <button onClick={handleLogout} disabled={isLoggingOut}
          style={{ 
            width: '100%', textAlign: 'left', border: 'none !important', background: 'transparent !important', 
            cursor: 'pointer', fontWeight: '800', color: '#ef4444', 
            fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px',
            padding: '4px 0', outline: 'none !important', boxShadow: 'none !important' 
          }}>
          <span style={{ fontSize: '18px' }}>🚪</span> {isLoggingOut ? "LOGGING OUT..." : "Logout"}
        </button>

        <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '900', marginBottom: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Appearance</p>
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default Sidebar;
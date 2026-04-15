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
      background: 'var(--sidebar)', 
      borderRight: '1px solid rgba(255,255,255,0.05)', // Subtle border for dark sidebar
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
          color: #94a3b8; /* Slate 400 */
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          white-space: normal; 
          word-wrap: break-word;
          line-height: 1.5;
          transition: all 0.2s ease;
          border-left: 4px solid transparent;
        }

        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #f8fafc;
        }

        .sidebar-link.active {
          background: rgba(56, 189, 248, 0.1); /* VisionBridge Blue tint */
          color: #38bdf8;
          border-left: 4px solid #38bdf8;
          font-weight: 800;
        }

        /* 🔴 FIXED LOGOUT BUTTON STYLES */
        .sidebar-logout-btn {
          width: 100%;
          text-align: left;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: #ef4444 !important; /* Red 500 */
          font-size: 15px !important;
          font-weight: 700 !important;
          padding: 16px 24px !important;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease !important;
          border-radius: 0 !important; 
          text-transform: none !important;
        }

        .sidebar-logout-btn:hover {
          background: rgba(239, 68, 68, 0.1) !important; /* Light red hover */
          transform: translateY(0) !important; /* Overrides global button hover */
        }

        @media (max-width: 768px) {
          .sidebar-logo-text { 
             font-size: 22px !important; 
             letter-spacing: -0.5px;
          }
          .sidebar-link, .sidebar-logout-btn { 
             padding: 18px 24px !important; 
             font-size: 16px !important; 
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

      {/* BRANDING & LOGO */}
      <div className="sidebar-logo" style={{ 
        padding: '28px 24px', 
        borderBottom: '1px solid rgba(255,255,255,0.05)', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ minWidth: 0 }}>
          <div className="sidebar-logo-text" style={{ fontWeight: '900', fontSize: '22px', color: '#f8fafc', letterSpacing: '-0.5px' }}>VisionBridge <span style={{fontSize: '18px'}}>📈</span></div>
          <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '1px' }}>
            Welcome, {userName}
          </div>
        </div>

        <button 
          onClick={closeMobileMenu}
          className="mobile-close-btn"
          style={{ 
            display: 'none', background: 'rgba(255,255,255,0.1) !important', border: 'none !important', 
            color: 'white !important', fontSize: '18px !important', width: '38px', height: '38px',
            alignItems: 'center', justifyContent: 'center', borderRadius: '50% !important', cursor: 'pointer',
            boxShadow: 'none !important'
          }}
        >✕</button>
      </div>
      
      {/* NAVIGATION LINKS */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink key={item.name} to={item.path} onClick={closeMobileMenu} 
            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* BOTTOM ACTION AREA */}
      <div style={{ padding: '0 0 20px 0', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
        <button 
          onClick={handleLogout} 
          disabled={isLoggingOut}
          className="sidebar-logout-btn"
        >
          <span style={{ fontSize: '18px' }}>🚪</span> {isLoggingOut ? "Logging out..." : "Logout"}
        </button>

        <div style={{ padding: '0 24px' }}>
          <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '800', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Appearance</p>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
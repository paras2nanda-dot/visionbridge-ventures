import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
      
      {/* 📱 MOBILE HAMBURGER BUTTON */}
      <button 
        onClick={toggleSidebar}
        style={{
          position: 'fixed',
          top: '15px',
          left: '15px',
          zIndex: 1001,
          padding: '10px',
          background: '#1e293b',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'block', // Default visible
          fontSize: '20px'
        }}
        className="mobile-only-btn"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* 🌑 MOBILE OVERLAY (Blur background when menu is open) */}
      {isSidebarOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* 1. SIDEBAR */}
      <div style={{ 
        width: '260px', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        bottom: 0, 
        zIndex: 100,
        transition: 'transform 0.3s ease',
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', // Hidden by default on mobile
      }}
      className="sidebar-wrapper"
      >
        <Sidebar closeMobileMenu={() => setIsSidebarOpen(false)} />
      </div>

      {/* 2. MAIN CONTENT */}
      <main style={{ 
        flex: 1, 
        padding: '40px',
        minHeight: '100vh',
        width: '100%',
        transition: 'margin 0.3s ease'
      }}
      className="main-content-layout"
      >
        <Outlet />
      </main>

      {/* 💡 CSS INJECTOR (Simple way to handle media queries without a separate CSS file) */}
      <style>{`
        @media (min-width: 1024px) {
          .sidebar-wrapper { transform: translateX(0) !important; }
          .main-content-layout { marginLeft: 260px !important; width: calc(100% - 260px) !important; }
          .mobile-only-btn { display: none !important; }
        }
        @media (max-width: 1023px) {
          .main-content-layout { padding: 80px 20px 40px 20px !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
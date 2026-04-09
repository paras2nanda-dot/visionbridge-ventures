import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation(); // 💡 Get current URL path

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // 🍞 BREADCRUMB LOGIC: Split the URL into clickable parts
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Helper to format path names nicely (e.g., 'sips' -> 'SIP Tracker')
  const formatBreadcrumb = (path) => {
    const titles = {
      dashboard: 'Dashboard',
      clients: 'Clients Database',
      sips: 'SIP Tracker',
      transactions: 'Transactions',
      schemes: 'MF Schemes',
      charts: 'Charts & Analytics',
      reports: 'Download Reports'
    };
    return titles[path] || (path.charAt(0).toUpperCase() + path.slice(1));
  };

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
          display: 'block',
          fontSize: '20px'
        }}
        className="mobile-only-btn"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* 🌑 MOBILE OVERLAY */}
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
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}
      className="sidebar-wrapper"
      >
        <Sidebar closeMobileMenu={() => setIsSidebarOpen(false)} />
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <main style={{ 
        flex: 1, 
        padding: '40px',
        minHeight: '100vh',
        width: '100%',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 1 
      }}
      className="main-content-layout"
      >
        {/* 🍞 DYNAMIC BREADCRUMB UI */}
        <div className="fade-in" style={{ 
          marginBottom: '20px', 
          fontSize: '13px', 
          fontWeight: '600', 
          color: '#94a3b8', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontFamily: "'Inter', sans-serif"
        }}>
          <Link to="/dashboard" style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#0ea5e9'} onMouseOut={(e) => e.target.style.color = '#64748b'}>
            🏠 Home
          </Link>
          
          {pathnames.map((value, index) => {
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            const title = formatBreadcrumb(value);

            return (
              <React.Fragment key={to}>
                <span>/</span>
                {isLast ? (
                  <span style={{ color: '#0ea5e9', fontWeight: '800' }}>{title}</span>
                ) : (
                  <Link to={to} style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#0ea5e9'} onMouseOut={(e) => e.target.style.color = '#64748b'}>
                    {title}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* This is where your actual page content (Dashboard, Clients, etc.) loads */}
        <Outlet />
      </main>

      {/* 💡 RESPONSIVE CSS */}
      <style>{`
        @media (min-width: 1024px) {
          .sidebar-wrapper { transform: translateX(0) !important; }
          .main-content-layout { margin-left: 260px !important; width: calc(100% - 260px) !important; }
          .mobile-only-btn { display: none !important; }
        }
        @media (max-width: 1023px) {
          .main-content-layout { padding: 80px 20px 40px 20px !important; margin-left: 0 !important; width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
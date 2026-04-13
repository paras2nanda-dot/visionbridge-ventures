import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import AutoLogout from './AutoLogout';
import CommandPalette from './CommandPalette';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation(); 
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatBreadcrumb = (path) => {
    const titles = { dashboard: 'Dashboard', clients: 'Clients Database', sips: 'SIP Tracker', transactions: 'Transactions', schemes: 'MF Schemes', charts: 'Charts & Analytics', reports: 'Download Reports' };
    return titles[path] || (path.charAt(0).toUpperCase() + path.slice(1));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main, #f8fafc)', transition: 'background 0.3s ease', overflowX: 'hidden' }}>
      <AutoLogout timeoutMinutes={15} />
      <CommandPalette />

      {!isSidebarOpen && (
        <button 
          onClick={toggleSidebar} 
          style={{ 
            position: 'fixed', top: '15px', left: '15px', zIndex: 999996, 
            padding: '10px', background: 'var(--sidebar, #1e293b)', 
            color: 'white', border: '1px solid var(--border, #334155)', 
            borderRadius: '8px', cursor: 'pointer', fontSize: '20px' 
          }} 
          className="mobile-only-btn"
        >
          ☰
        </button>
      )}

      {isSidebarOpen && <div onClick={toggleSidebar} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999997, backdropFilter: 'blur(8px)' }} />}

      <div style={{ 
        position: 'fixed', top: 0, left: 0, bottom: 0, 
        zIndex: 999998, transition: 'transform 0.3s ease', 
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' 
      }} className="sidebar-wrapper">
        <Sidebar closeMobileMenu={() => setIsSidebarOpen(false)} isMobileOpen={isSidebarOpen} />
      </div>

      <main style={{ flex: 1, padding: '40px', minHeight: '100vh', width: '100%', transition: 'all 0.3s ease', position: 'relative', zIndex: 1 }} className="main-content-layout">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>🏠 Home</Link>
            {pathnames.map((value, index) => {
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              return (
                <React.Fragment key={to}>
                  <span>/</span>
                  {isLast ? <span style={{ color: '#0ea5e9', fontWeight: '800' }}>{formatBreadcrumb(value)}</span> : <Link to={to} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{formatBreadcrumb(value)}</Link>}
                </React.Fragment>
              );
            })}
          </div>

          <button onClick={() => window.dispatchEvent(new Event('open-cmd-k'))} style={{ display: 'flex', alignItems: 'center', gap: '40px', padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}>
            <span>🔍 Search...</span>
            <span style={{ background: 'var(--bg-main)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>Ctrl K</span>
          </button>
        </div>
        <Outlet />
      </main>

      <style>{`
        .sidebar-wrapper { width: 280px; }
        @media (min-width: 1024px) { 
          .sidebar-wrapper { transform: translateX(0) !important; z-index: 100 !important; } 
          .main-content-layout { margin-left: 280px !important; width: calc(100% - 280px) !important; } 
          .mobile-only-btn { display: none !important; } 
        }
        @media (max-width: 1023px) { 
          .main-content-layout { padding: 80px 15px 40px 15px !important; margin-left: 0 !important; width: 100% !important; } 
          .sidebar-wrapper { width: 80% !important; max-width: 300px !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
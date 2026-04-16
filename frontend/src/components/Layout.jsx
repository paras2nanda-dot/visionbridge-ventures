import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import AutoLogout from './AutoLogout';
import CommandPalette from './CommandPalette';
import { Home, Search } from 'lucide-react'; // ✅ Imported Lucide icons

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation(); 
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const pathnames = location.pathname.split('/').filter((x) => x);

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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', transition: 'background 0.3s ease' }}>
      <AutoLogout timeoutMinutes={15} />
      <CommandPalette />

      {/* 🌁 Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={toggleSidebar} 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.85)', zIndex: 10000001, 
            backdropFilter: 'blur(8px)', transition: 'all 0.3s ease' 
          }} 
        />
      )}

      {/* 📂 Sidebar Wrapper */}
      <div style={{ 
        width: '280px', position: 'fixed', top: 0, left: 0, bottom: 0, 
        zIndex: 10000002, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        boxShadow: isSidebarOpen ? '20px 0 25px -5px rgba(0,0,0,0.2)' : 'none'
      }} className="sidebar-wrapper">
        <Sidebar closeMobileMenu={() => setIsSidebarOpen(false)} isMobileOpen={isSidebarOpen} />
      </div>

      {/* 🖥️ Main Content Area */}
      <main style={{ flex: 1, minHeight: '100vh', width: '100%', transition: 'all 0.3s ease', position: 'relative', zIndex: 1 }} className="main-content-layout">
        
        {/* 📱 STICKY MOBILE HEADER BAR (Solves Overlap) */}
        <div className="mobile-top-nav">
            <button onClick={toggleSidebar} className="mobile-nav-toggle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
            <span style={{ fontWeight: '900', fontSize: '18px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>VisionBridge</span>
            <div style={{ width: '40px' }}></div> {/* Balanced Spacer */}
        </div>

        <div className="content-padding-wrapper">
            {/* 🔝 Top Header Bar (Breadcrumbs & Search) */}
            <div className="top-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
            
                {/* Breadcrumbs */}
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.3px', flexWrap: 'wrap' }}>
                    {/* ✅ Clean Lucide Home Icon */}
                    <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Home size={16} /> Home
                    </Link>
                    {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    return (
                        <React.Fragment key={to}>
                        <span style={{ opacity: 0.5 }}>/</span>
                        {isLast ? <span style={{ color: '#0284c7', fontWeight: '900' }}>{formatBreadcrumb(value)}</span> : <Link to={to} style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>{formatBreadcrumb(value)}</Link>}
                        </React.Fragment>
                    );
                    })}
                </div>

                {/* Search / Command Palette Trigger */}
                <button 
                    className="search-cmd-btn"
                    onClick={() => window.dispatchEvent(new Event('open-cmd-k'))} 
                    style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', 
                        padding: '12px 20px', background: 'var(--bg-card)', 
                        border: '1px solid var(--border)', borderRadius: '12px', /* ✅ Soft SaaS Border */
                        color: 'var(--text-muted)', fontSize: '15px', fontWeight: '600', 
                        cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', /* ✅ Soft Drop Shadow */
                        transition: 'all 0.2s ease', outline: 'none'
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                        {/* ✅ Clean Lucide Search Icon */}
                        <Search size={18} style={{ opacity: 0.7 }} /> Search...
                    </span>
                    <span style={{ background: 'var(--bg-main)', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', border: '1px solid var(--border)', letterSpacing: '0.5px' }}>
                        Ctrl K
                    </span>
                </button>
            </div>

            <Outlet />
        </div>
      </main>

      <style>{`
        /* Desktop Layout Defaults */
        .mobile-top-nav { display: none; }
        .content-padding-wrapper { padding: 40px; }

        @media (min-width: 1024px) { 
          .sidebar-wrapper { transform: translateX(0) !important; z-index: 100 !important; box-shadow: none !important; } 
          .main-content-layout { margin-left: 280px !important; width: calc(100% - 280px) !important; } 
          .search-cmd-btn:hover { border-color: #0284c7 !important; transform: translateY(-2px); }
        }
        
        /* Mobile Premium Overhaul */
        @media (max-width: 1023px) { 
          .mobile-top-nav { 
            display: flex; 
            position: sticky; 
            top: 0; 
            background: var(--bg-card); 
            border-bottom: 1px solid var(--border); /* ✅ Soft SaaS Border */
            padding: 12px 16px; 
            z-index: 1000; 
            align-items: center; 
            justify-content: space-between; 
          }
          .mobile-nav-toggle {
            background: transparent;
            border: none;
            color: var(--text-main);
            padding: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
          }
          .main-content-layout { padding: 0 !important; margin-left: 0 !important; width: 100% !important; } 
          .content-padding-wrapper { padding: 24px 16px 40px 16px !important; }
          .top-header-bar { flex-direction: column; align-items: flex-start !important; gap: 16px !important; margin-bottom: 24px !important; }
          .search-cmd-btn { width: 100% !important; padding: 14px 20px !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
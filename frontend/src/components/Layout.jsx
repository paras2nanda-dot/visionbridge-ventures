import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* 1. SIDEBAR - Fixed width and position */}
      <div style={{ 
        width: '260px', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        bottom: 0, 
        zIndex: 100 
      }}>
        <Sidebar />
      </div>

      {/* 2. MAIN CONTENT - Pushed right by the sidebar's width */}
      <main style={{ 
        flex: 1, 
        marginLeft: '260px', // 👈 This stops the overlap
        padding: '40px',
        width: 'calc(100% - 260px)',
        minHeight: '100vh'
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
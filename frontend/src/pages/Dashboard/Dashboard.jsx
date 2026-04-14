import React, { useState } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';
import ActivityFeed from '../../components/ActivityFeed';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('business');

  // 💡 Auto-Centering logic for mobile tabs
  const handleTabClick = (e, tabName) => {
    setActiveTab(tabName);
    // Smoothly scrolls the clicked tab into the center of the screen.
    // On desktop, this does nothing since it already fits.
    // On mobile, this makes sure adjacent tabs "peek" into view!
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const tabStyle = (tabName) => ({
    padding: '12px 20px', 
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontSize: '14px', 
    fontWeight: activeTab === tabName ? '900' : '600',
    color: activeTab === tabName ? '#6366f1' : 'var(--text-muted)',
    borderBottom: activeTab === tabName ? '4px solid #6366f1' : '4px solid transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    outline: 'none',
    whiteSpace: 'nowrap', 
    flexShrink: 0 // 📱 Vital: forces overflow on mobile instead of squishing text
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '15px', background: 'var(--bg-main)' }}>
      {/* 📱 Inject Mobile CSS to hide the ugly native scrollbar */}
      <style>{`
        .dashboard-tabs::-webkit-scrollbar { display: none; }
      `}</style>
      
      <h1 className="title" style={{ fontWeight: '900', color: 'var(--text-main)', marginBottom: '20px' }}>
        Dashboard
      </h1>
      
      {/* 💡 NAVIGATION TABS - Optimized for Touch Scrolling */}
      <div className="dashboard-tabs" style={{ 
        display: 'flex', 
        gap: '5px', 
        borderBottom: '2px solid var(--border)',
        background: 'var(--bg-main)',
        position: 'sticky',
        top: '0', 
        paddingTop: '5px',
        paddingBottom: '0',
        zIndex: 100,
        overflowX: 'auto', 
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none', 
        marginBottom: '20px',
        scrollBehavior: 'smooth'
      }}>
        <button style={tabStyle('business')} onClick={(e) => handleTabClick(e, 'business')}>
          🏢 Business Analytics
        </button>
        <button style={tabStyle('client')} onClick={(e) => handleTabClick(e, 'client')}>
          👤 Client Insights
        </button>
        <button style={tabStyle('activity')} onClick={(e) => handleTabClick(e, 'activity')}>
          🕒 Recent Activity
        </button>
      </div>

      <div style={{ paddingTop: '5px' }}>
        {activeTab === 'business' && <BusinessDashboard />}
        {activeTab === 'client' && <ClientDashboard />}
        
        {activeTab === 'activity' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'block' }}>
            <ActivityFeed />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';
import ActivityFeed from '../../components/ActivityFeed';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('business');

  const tabStyle = (tabName) => ({
    padding: '12px 20px', // 📱 Slightly smaller padding for mobile
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontSize: '14px', // 📱 Optimized font size
    fontWeight: activeTab === tabName ? '900' : '600',
    color: activeTab === tabName ? '#6366f1' : 'var(--text-muted)',
    borderBottom: activeTab === tabName ? '4px solid #6366f1' : '4px solid transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    outline: 'none',
    whiteSpace: 'nowrap' // 📱 Vital: prevents tabs from breaking into lines
  });

  return (
    /* 📱 Mobile: Reduced outer padding from 25px to 15px */
    <div style={{ width: '100%', minHeight: '100vh', padding: '15px', background: 'var(--bg-main)' }}>
      
      <h1 className="title" style={{ fontWeight: '900', color: 'var(--text-main)', marginBottom: '20px' }}>
        Dashboard
      </h1>
      
      {/* 💡 NAVIGATION TABS - Optimized for Touch Scrolling */}
      <div style={{ 
        display: 'flex', 
        gap: '5px', 
        borderBottom: '2px solid var(--border)',
        background: 'var(--bg-main)',
        position: 'sticky',
        top: '0', 
        paddingTop: '5px',
        paddingBottom: '0',
        zIndex: 100,
        overflowX: 'auto', // 📱 Vital: Allows swiping through tabs on mobile
        scrollbarWidth: 'none', // Hides scrollbar on Firefox
        msOverflowStyle: 'none', // Hides scrollbar on IE
        marginBottom: '20px'
      }}>
        <button style={tabStyle('business')} onClick={() => setActiveTab('business')}>
          🏢 Business Analytics
        </button>
        <button style={tabStyle('client')} onClick={() => setActiveTab('client')}>
          👤 Client Insights
        </button>
        <button style={tabStyle('activity')} onClick={() => setActiveTab('activity')}>
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
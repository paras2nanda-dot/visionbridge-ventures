import React, { useState } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';
import ActivityFeed from '../../components/ActivityFeed';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('business');

  const tabStyle = (tabName) => ({
    padding: '14px 28px',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontSize: '15px',
    fontWeight: activeTab === tabName ? '900' : '600',
    color: activeTab === tabName ? '#0ea5e9' : '#94a3b8',
    borderBottom: activeTab === tabName ? '4px solid #0ea5e9' : '4px solid transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    outline: 'none',
    whiteSpace: 'nowrap'
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '25px', background: '#f8fafc' }}>
      
      {/* 💡 Main Page Header */}
      <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '20px' }}>
        Dashboard
      </h1>
      
      {/* 💡 NAVIGATION TABS - Added solid background to prevent overlap transparency */}
      <div style={{ 
        display: 'flex', 
        gap: '5px', 
        borderBottom: '2px solid #e2e8f0',
        background: '#f8fafc',
        position: 'sticky',
        top: '-25px', // Adjusted to account for parent padding
        zIndex: 100,
        overflowX: 'auto',
        marginBottom: '10px'
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

      {/* 💡 CONTENT AREA - Optimized padding to fix card overlap */}
      <div style={{ paddingTop: '15px' }}>
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
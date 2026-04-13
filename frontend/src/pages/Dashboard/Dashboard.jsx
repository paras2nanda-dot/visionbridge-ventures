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
    color: activeTab === tabName ? '#6366f1' : 'var(--text-muted)',
    borderBottom: activeTab === tabName ? '4px solid #6366f1' : '4px solid transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    outline: 'none',
    whiteSpace: 'nowrap'
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '25px', background: 'var(--bg-main)' }}>
      
      {/* 💡 Main Page Header */}
      <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '20px' }}>
        Dashboard
      </h1>
      
      {/* 💡 NAVIGATION TABS */}
      <div style={{ 
        display: 'flex', 
        gap: '5px', 
        borderBottom: '2px solid var(--border)',
        background: 'var(--bg-main)',
        position: 'sticky',
        top: '0', 
        paddingTop: '10px',
        paddingBottom: '0',
        zIndex: 100,
        overflowX: 'auto',
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
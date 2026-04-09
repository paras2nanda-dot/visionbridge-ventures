import React, { useState } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';
import ActivityFeed from '../../components/ActivityFeed';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [isSwitching, setIsSwitching] = useState(false);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setIsSwitching(true);
    setActiveTab(tab);
    setTimeout(() => setIsSwitching(false), 400);
  };

  const tabStyle = (tabName) => ({
    padding: '14px 28px',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontSize: '15px',
    fontWeight: activeTab === tabName ? '900' : '600',
    color: activeTab === tabName ? '#0ea5e9' : 'var(--text-muted, #94a3b8)',
    borderBottom: activeTab === tabName ? '4px solid #0ea5e9' : '4px solid transparent',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    outline: 'none',
    whiteSpace: 'nowrap'
  });

  return (
    <div className="container fade-in" style={{ width: '100%', minHeight: '100vh', padding: '20px' }}>
      
      <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main, #0f172a)', marginBottom: '25px' }}>
        Dashboard
      </h1>
      
      {/* 💡 NAVIGATION TABS */}
      <div style={{ 
        display: 'flex', 
        gap: '5px', 
        marginBottom: '0', 
        borderBottom: '2px solid var(--border, #e2e8f0)',
        background: 'var(--bg-main, #f8fafc)',
        position: 'sticky',
        top: '0',
        zIndex: 100,
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        <button style={tabStyle('business')} onClick={() => handleTabChange('business')}>
          🏢 Business Analytics
        </button>
        <button style={tabStyle('client')} onClick={() => handleTabChange('client')}>
          👤 Client Insights
        </button>
        <button style={tabStyle('activity')} onClick={() => handleTabChange('activity')}>
          🕒 Recent Activity
        </button>
      </div>

      <div style={{ paddingTop: '30px' }}>
        {isSwitching ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px', gap: '15px' }}>
            <div className="sync-spinner"></div>
            <p style={{ fontWeight: '800', color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '1.5px' }}>REFRESHING VIEW...</p>
            <style>{`
              .sync-spinner {
                width: 30px;
                height: 30px;
                border: 3px solid var(--border);
                border-top: 3px solid #0ea5e9;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : (
          <div className="fade-in">
            {/* 💡 EXCLUSIVE RENDERING: Only one of these will exist at a time */}
            {activeTab === 'business' && (
              <div key="business-view">
                <BusinessDashboard />
              </div>
            )}

            {activeTab === 'client' && (
              <div key="client-view">
                <ClientDashboard />
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div key="activity-view" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <ActivityFeed />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
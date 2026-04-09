import React, { useState } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [isSwitching, setIsSwitching] = useState(false);

  // 💡 Function to handle tab changes with a quick visual "sync" feel
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setIsSwitching(true);
    setActiveTab(tab);
    // Short delay to show the "Syncing" state for a professional feel
    setTimeout(() => setIsSwitching(false), 400);
  };

  const tabStyle = (tabName) => ({
    padding: '14px 28px',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontSize: '16px',
    fontWeight: activeTab === tabName ? '900' : '500',
    color: activeTab === tabName ? '#0ea5e9' : '#94a3b8',
    borderBottom: activeTab === tabName ? '4px solid #0ea5e9' : '4px solid transparent',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: activeTab === tabName ? 'translateY(-1px)' : 'translateY(0)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    outline: 'none',
  });

  return (
    <div className="container fade-in" style={{ width: '100%', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '25px' }}>
        Dashboard
      </h1>
      
      {/* 💡 Tabs Container */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '0', 
        borderBottom: '2px solid #e2e8f0',
        background: '#f8fafc',
        position: 'sticky',
        top: '0',
        zIndex: 100
      }}>
        <button style={tabStyle('business')} onClick={() => handleTabChange('business')}>
          🏢 Business Dashboard
        </button>
        <button style={tabStyle('client')} onClick={() => handleTabChange('client')}>
          👤 Client Dashboard
        </button>
      </div>

      <div style={{ paddingTop: '30px' }}>
        {isSwitching ? (
          /* 🔄 CSS Loader directly inside the component */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px', gap: '15px' }}>
            <div className="sync-spinner"></div>
            <p style={{ fontWeight: '800', color: '#64748b', fontSize: '12px', letterSpacing: '1px' }}>SYNCING ANALYTICS...</p>
            <style>{`
              .sync-spinner {
                width: 35px;
                height: 35px;
                border: 3px solid #e2e8f0;
                border-top: 3px solid #0ea5e9;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : (
          <div className="fade-in">
            {activeTab === 'business' ? <BusinessDashboard /> : <ClientDashboard />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
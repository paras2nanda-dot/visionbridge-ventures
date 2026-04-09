import React, { useState } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';
import ActivityFeed from '../../components/ActivityFeed'; // 💡 NEW: Import our feed

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
    fontSize: '16px',
    fontWeight: activeTab === tabName ? '900' : '500',
    color: activeTab === tabName ? '#0ea5e9' : 'var(--text-muted, #94a3b8)',
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
      
      {/* 💡 Title responds to Theme */}
      <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main, #0f172a)', marginBottom: '25px', transition: 'color 0.3s' }}>
        Dashboard
      </h1>
      
      {/* 💡 Tabs Container responds to Theme */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '0', 
        borderBottom: '2px solid var(--border, #e2e8f0)',
        background: 'var(--bg-main, #f8fafc)',
        position: 'sticky',
        top: '0',
        zIndex: 100,
        transition: 'background 0.3s, border-color 0.3s'
      }}>
        <button style={tabStyle('business')} onClick={() => handleTabChange('business')}>
          🏢 Business Dashboard
        </button>
        <button style={tabStyle('client')} onClick={() => handleTabChange('client')}>
          👤 Client Dashboard
        </button>
      </div>

      <div style={{ paddingTop: '30px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* 📊 Main Analytics Section (Left) */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          {isSwitching ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px', gap: '15px' }}>
              <div className="sync-spinner"></div>
              <p style={{ fontWeight: '800', color: 'var(--text-muted, #64748b)', fontSize: '12px', letterSpacing: '1px' }}>SYNCING ANALYTICS...</p>
              <style>{`
                .sync-spinner {
                  width: 35px;
                  height: 35px;
                  border: 3px solid var(--border, #e2e8f0);
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

        {/* 🕒 NEW: Activity Feed Section (Right) */}
        <div style={{ width: '380px', minWidth: '300px' }}>
           <ActivityFeed />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
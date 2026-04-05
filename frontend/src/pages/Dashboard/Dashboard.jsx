import React, { useState } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('business');

  const tabStyle = (tabName) => ({
    padding: '14px 28px',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontSize: '16px',
    fontWeight: activeTab === tabName ? '900' : '500',
    color: activeTab === tabName ? '#0ea5e9' : '#94a3b8',
    borderBottom: activeTab === tabName ? '4px solid #0ea5e9' : '4px solid transparent',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    outline: 'none'
  });

  return (
    <div style={{ padding: '30px', width: '100%', minHeight: '100vh', background: '#f8fafc' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '25px' }}>Dashboard</h1>
      
      {/* Sub-Tabs Switcher */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0' }}>
        <button style={tabStyle('business')} onClick={() => setActiveTab('business')}>
          🏢 Business Dashboard
        </button>
        <button style={tabStyle('client')} onClick={() => setActiveTab('client')}>
          👤 Client Dashboard
        </button>
      </div>

      <div className="fade-in">
        {activeTab === 'business' ? <BusinessDashboard /> : <ClientDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;
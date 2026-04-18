import React, { useState, useRef } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';
import LeaderboardsDashboard from './LeaderboardsDashboard'; // 🟢 NEW IMPORT

import { Briefcase, Users, Trophy } from 'lucide-react'; // 🟢 Added Trophy icon

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('business');
  
  // 🟢 Added 'leaderboards' to the swipe order
  const tabOrder = ['business', 'client', 'leaderboards']; 
  
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const tabContainerRef = useRef(null);
  const tabRefs = {
    business: useRef(null),
    client: useRef(null),
    leaderboards: useRef(null) // 🟢 Added ref for the new tab
  };

  const minSwipeDistance = 50;

  const switchTab = (newTab) => {
    setActiveTab(newTab);
    if (tabRefs[newTab] && tabRefs[newTab].current) {
      tabRefs[newTab].current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleTabClick = (e, tabName) => switchTab(tabName);

  const onPointerDown = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.clientX;
  };

  const onPointerMove = (e) => {
    if (touchStartX.current !== null) {
      touchEndX.current = e.clientX;
    }
  };

  const onPointerUp = () => {
    if (touchStartX.current === null || touchEndX.current === null) {
      touchStartX.current = null;
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabOrder.indexOf(activeTab);
      if (isLeftSwipe && currentIndex < tabOrder.length - 1) {
        switchTab(tabOrder[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        switchTab(tabOrder[currentIndex - 1]);
      }
    }

    // Reset tracking
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const tabStyle = (tabName) => ({
    padding: '12px 24px', 
    cursor: 'pointer',
    fontSize: '14px', 
    letterSpacing: '0.3px',
    fontWeight: activeTab === tabName ? '800' : '600',
    color: activeTab === tabName ? '#0284c7' : 'var(--text-muted)',
    borderBottom: activeTab === tabName ? '3px solid #0284c7' : '3px solid transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap', 
    flexShrink: 0 
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '12px 32px 32px 32px', background: 'var(--bg-main)', overflowX: 'hidden' }}>
      
      <style>{`
        .dashboard-tabs::-webkit-scrollbar { display: none; }
        .dashboard-tabs button { 
          border-top: none !important; 
          border-left: none !important; 
          border-right: none !important; 
          box-shadow: none !important; 
          background: transparent !important; 
          border-radius: 0 !important;
        } 
        .dashboard-tabs button:hover { color: #0284c7; }
      `}</style>
      
      <div 
        className="dashboard-tabs" 
        ref={tabContainerRef}
        style={{ 
            display: 'flex', 
            gap: '16px', 
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-main)',
            position: 'sticky',
            top: '0', 
            paddingTop: '4px',
            paddingBottom: '0',
            zIndex: 100,
            overflowX: 'auto', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none', 
            marginBottom: '32px',
            scrollBehavior: 'smooth'
      }}>
        <button ref={tabRefs.business} style={tabStyle('business')} onClick={(e) => handleTabClick(e, 'business')}>
          <Briefcase size={18} /> Business Analytics
        </button>
        <button ref={tabRefs.client} style={tabStyle('client')} onClick={(e) => handleTabClick(e, 'client')}>
          <Users size={18} /> Client Insights
        </button>
        {/* 🟢 NEW LEADERBOARDS TAB */}
        <button ref={tabRefs.leaderboards} style={tabStyle('leaderboards')} onClick={(e) => handleTabClick(e, 'leaderboards')}>
          <Trophy size={18} /> Leaderboards
        </button>
      </div>

      <div 
        style={{ paddingTop: '8px', minHeight: '60vh', width: '100%' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {activeTab === 'business' && <BusinessDashboard />}
        {activeTab === 'client' && <ClientDashboard />}
        {activeTab === 'leaderboards' && <LeaderboardsDashboard />} {/* 🟢 NEW COMPONENT RENDERED HERE */}
      </div>
    </div>
  );
};

export default Dashboard;
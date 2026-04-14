import React, { useState, useRef } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';
import ActivityFeed from '../../components/ActivityFeed';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('business');
  
  // Array defining the logical order of tabs for swiping
  const tabOrder = ['business', 'client', 'activity'];
  
  // Refs for touch tracking and scrolling the tab container
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const tabContainerRef = useRef(null);
  const tabRefs = {
    business: useRef(null),
    client: useRef(null),
    activity: useRef(null)
  };

  // Minimum distance (in pixels) required to trigger a swipe change
  const minSwipeDistance = 50;

  // 💡 Centralized function to change tabs and ensure the tab bar scrolls correctly
  const switchTab = (newTab) => {
    setActiveTab(newTab);
    
    // Smoothly scroll the newly selected tab into the center of the viewport
    if (tabRefs[newTab] && tabRefs[newTab].current) {
      tabRefs[newTab].current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleTabClick = (e, tabName) => {
    switchTab(tabName);
  };

  // 🖐️ Touch Event Handlers
  const onTouchStart = (e) => {
    touchEndX.current = null; // Reset end position
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabOrder.indexOf(activeTab);
      
      if (isLeftSwipe && currentIndex < tabOrder.length - 1) {
        // Swiped Left: Move to the NEXT tab
        switchTab(tabOrder[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        // Swiped Right: Move to the PREVIOUS tab
        switchTab(tabOrder[currentIndex - 1]);
      }
    }
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
    flexShrink: 0 
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '15px', background: 'var(--bg-main)', overflowX: 'hidden' }}>
      <style>{`
        .dashboard-tabs::-webkit-scrollbar { display: none; }
      `}</style>
      
      <h1 className="title" style={{ fontWeight: '900', color: 'var(--text-main)', marginBottom: '20px' }}>
        Dashboard
      </h1>
      
      {/* NAVIGATION TABS */}
      <div 
        className="dashboard-tabs" 
        ref={tabContainerRef}
        style={{ 
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
        <button 
            ref={tabRefs.business}
            style={tabStyle('business')} 
            onClick={(e) => handleTabClick(e, 'business')}
        >
          🏢 Business Analytics
        </button>
        <button 
            ref={tabRefs.client}
            style={tabStyle('client')} 
            onClick={(e) => handleTabClick(e, 'client')}
        >
          👤 Client Insights
        </button>
        <button 
            ref={tabRefs.activity}
            style={tabStyle('activity')} 
            onClick={(e) => handleTabClick(e, 'activity')}
        >
          🕒 Recent Activity
        </button>
      </div>

      {/* 🖐️ SWIPEABLE CONTENT CONTAINER 
        We wrap the active tab content in a div that listens for touch events.
      */}
      <div 
        style={{ paddingTop: '5px', minHeight: '60vh', width: '100%' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
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
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';
import LeaderboardsDashboard from './LeaderboardsDashboard'; 
import api from '../../services/api'; 

import { Briefcase, Users, Trophy } from 'lucide-react'; 

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [reviewAlert, setReviewAlert] = useState(0); 
  
  const tabOrder = ['business', 'client', 'leaderboards']; 
  
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const tabContainerRef = useRef(null);
  const tabRefs = {
    business: useRef(null),
    client: useRef(null),
    leaderboards: useRef(null) 
  };

  const minSwipeDistance = 50;

  // 🛡️ SYNCED REVIEW INDICATORS
  useEffect(() => {
    const fetchReviewStats = async () => {
        try {
            const res = await api.get('/dashboard/reviews/stats');
            /**
             * 🛡️ Robust Extraction: Ensures we pull 'overdue' count correctly 
             * from the specific review controller response.
             */
            const overdueCount = res.data?.overdue || 0;
            setReviewAlert(parseInt(overdueCount));
        } catch (err) {
            console.error("Dashboard Metadata Sync Error:", err);
        }
    };
    fetchReviewStats();
  }, []);

  const switchTab = (newTab) => {
    setActiveTab(newTab);
    if (tabRefs[newTab] && tabRefs[newTab].current) {
      tabRefs[newTab].current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleTabClick = (e, tabName) => switchTab(tabName);

  // 🖐️ Swipe & Pointer Logic (Preserved)
  const onPointerDown = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.clientX;
  };

  const onPointerMove = (e) => {
    if (touchStartX.current !== null) touchEndX.current = e.clientX;
  };

  const onPointerUp = () => {
    if (touchStartX.current === null || touchEndX.current === null) {
      touchStartX.current = null;
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > minSwipeDistance) {
      const currentIndex = tabOrder.indexOf(activeTab);
      if (distance > 0 && currentIndex < tabOrder.length - 1) {
        switchTab(tabOrder[currentIndex + 1]);
      } else if (distance < 0 && currentIndex > 0) {
        switchTab(tabOrder[currentIndex - 1]);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const tabStyle = (tabName) => ({
    padding: '14px 28px', 
    cursor: 'pointer',
    fontSize: '13px', 
    letterSpacing: '0.5px',
    fontWeight: activeTab === tabName ? '800' : '600',
    color: activeTab === tabName ? '#0284c7' : 'var(--text-muted)',
    borderBottom: activeTab === tabName ? '3px solid #0284c7' : '3px solid transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    whiteSpace: 'nowrap', 
    flexShrink: 0,
    textTransform: 'uppercase',
    position: 'relative'
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '12px 32px 32px 32px', background: 'var(--bg-main)', overflowX: 'hidden' }}>
      
      <style>{`
        .dashboard-tabs::-webkit-scrollbar { display: none; }
        .dashboard-tabs button { 
          border: none !important; 
          box-shadow: none !important; 
          background: transparent !important; 
          border-radius: 0 !important;
          outline: none !important;
        } 
        .dashboard-tabs button:hover { color: #0284c7; }
        
        .tab-badge {
            position: absolute;
            top: 10px;
            right: 12px;
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
            border: 2px solid var(--bg-main);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
      
      {/* 🟢 STICKY TAB NAVIGATOR */}
      <div 
        className="dashboard-tabs" 
        ref={tabContainerRef}
        style={{ 
            display: 'flex', 
            gap: '8px', 
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-main)',
            position: 'sticky',
            top: '0', 
            zIndex: 100,
            overflowX: 'auto', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none', 
            marginBottom: '32px'
      }}>
        <button ref={tabRefs.business} style={tabStyle('business')} onClick={(e) => handleTabClick(e, 'business')}>
          <Briefcase size={18} /> Business Analytics
          {reviewAlert > 0 && <span className="tab-badge" title={`${reviewAlert} Reviews Overdue`}></span>}
        </button>
        <button ref={tabRefs.client} style={tabStyle('client')} onClick={(e) => handleTabClick(e, 'client')}>
          <Users size={18} /> Client Insights
        </button>
        <button ref={tabRefs.leaderboards} style={tabStyle('leaderboards')} onClick={(e) => handleTabClick(e, 'leaderboards')}>
          <Trophy size={18} /> Leaderboards
        </button>
      </div>

      {/* 🟢 SWIPEABLE CONTENT AREA */}
      <div 
        style={{ paddingTop: '8px', minHeight: '70vh', width: '100%' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {activeTab === 'business' && <BusinessDashboard />}
        {activeTab === 'client' && <ClientDashboard />}
        {activeTab === 'leaderboards' && <LeaderboardsDashboard />} 
      </div>
    </div>
  );
};

export default Dashboard;
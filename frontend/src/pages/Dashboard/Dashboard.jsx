import React, { useState, useRef, useEffect } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';
import ActivityFeed from '../../components/ActivityFeed';
import api from '../../services/api';

import { Briefcase, Users, Clock, Shield, ShieldCheck, Trash2 } from 'lucide-react';

// --- Internal Security Component ---
const PasskeyManager = () => {
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPasskeys = async () => {
    try {
      const res = await api.get('/auth/webauthn/passkeys');
      setPasskeys(res.data);
    } catch (err) {
      console.error("Failed to fetch passkeys", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this biometric login?")) return;
    try {
      await api.delete(`/auth/webauthn/passkeys/${id}`);
      setPasskeys(passkeys.filter(k => k.id !== id));
      alert("Biometric device removed.");
    } catch (err) {
      alert("Failed to remove device.");
    }
  };

  useEffect(() => { fetchPasskeys(); }, []);

  return (
    <div style={{ padding: '32px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
      <h3 style={{ marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '20px' }}>
        <ShieldCheck size={24} color="#0284c7" /> Biometric Security
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', fontWeight: '500' }}>
        Manage the devices authorized to log in with fingerprint or face recognition.
      </p>

      {loading ? <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Loading devices...</p> : passkeys.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontWeight: '600', padding: '24px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center' }}>No biometric devices registered.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {passkeys.map(key => (
            <div key={key.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)', marginBottom: '6px' }}>Authorized Device</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Added: {new Date(key.created_at).toLocaleDateString()}</div>
              </div>
              <button 
                onClick={() => handleDelete(key.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Trash2 size={16} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('business');
  
  const tabOrder = ['business', 'client', 'activity', 'security'];
  
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const tabContainerRef = useRef(null);
  const tabRefs = {
    business: useRef(null),
    client: useRef(null),
    activity: useRef(null),
    security: useRef(null)
  };

  const minSwipeDistance = 50;

  const switchTab = (newTab) => {
    setActiveTab(newTab);
    if (tabRefs[newTab] && tabRefs[newTab].current) {
      tabRefs[newTab].current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleTabClick = (e, tabName) => switchTab(tabName);

  const onTouchStart = (e) => {
    touchEndX.current = null;
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
        switchTab(tabOrder[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        switchTab(tabOrder[currentIndex - 1]);
      }
    }
  };

  const tabStyle = (tabName) => ({
    padding: '12px 24px', 
    cursor: 'pointer',
    fontSize: '14px', 
    letterSpacing: '0.5px',
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
            marginBottom: '24px',
            scrollBehavior: 'smooth'
      }}>
        <button ref={tabRefs.business} style={tabStyle('business')} onClick={(e) => handleTabClick(e, 'business')}>
          <Briefcase size={18} /> Business Analytics
        </button>
        <button ref={tabRefs.client} style={tabStyle('client')} onClick={(e) => handleTabClick(e, 'client')}>
          <Users size={18} /> Client Insights
        </button>
        <button ref={tabRefs.activity} style={tabStyle('activity')} onClick={(e) => handleTabClick(e, 'activity')}>
          <Clock size={18} /> Recent Activities
        </button>
        <button ref={tabRefs.security} style={tabStyle('security')} onClick={(e) => handleTabClick(e, 'security')}>
          <Shield size={18} /> Security
        </button>
      </div>

      <div 
        style={{ paddingTop: '8px', minHeight: '60vh', width: '100%' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {activeTab === 'business' && <BusinessDashboard />}
        {activeTab === 'client' && <ClientDashboard />}
        {activeTab === 'activity' && <div style={{ maxWidth: '1000px', margin: '0 auto' }}><ActivityFeed /></div>}
        {activeTab === 'security' && <div style={{ maxWidth: '700px', margin: '0 auto' }}><PasskeyManager /></div>}
      </div>
    </div>
  );
};

export default Dashboard;
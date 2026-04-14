import React, { useState, useRef, useEffect } from 'react';
import BusinessDashboard from './BusinessDashboard';
import ClientDashboard from './ClientDashboard';
import ActivityFeed from '../../components/ActivityFeed';
import api from '../../services/api';

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
    <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '2.5px solid var(--border)' }}>
      <h3 style={{ marginBottom: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
        🛡️ Biometric Security
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', fontWeight: '500' }}>
        Manage the devices authorized to log in with your fingerprint or face recognition.
      </p>

      {loading ? <p>Loading devices...</p> : passkeys.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No biometric devices registered.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {passkeys.map(key => (
            <div key={key.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', border: '2px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)' }}>Registered Device</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Added on: {new Date(key.created_at).toLocaleDateString()}</div>
              </div>
              <button 
                onClick={() => handleDelete(key.id)}
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '800' }}
              >
                Remove
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
    padding: '14px 24px', 
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontSize: '14px', 
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    fontWeight: activeTab === tabName ? '900' : '700',
    color: activeTab === tabName ? '#38bdf8' : 'var(--text-muted)',
    borderBottom: activeTab === tabName ? '4px solid #38bdf8' : '4px solid transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    outline: 'none',
    whiteSpace: 'nowrap', 
    flexShrink: 0 
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '15px', background: 'var(--bg-main)', overflowX: 'hidden' }}>
      <style>{`
        .dashboard-tabs::-webkit-scrollbar { display: none; }
        .dashboard-tabs button:hover { color: #38bdf8; opacity: 0.8; }
      `}</style>
      
      <h1 className="title" style={{ fontWeight: '900', color: 'var(--text-main)', marginBottom: '25px', fontSize: '32px' }}>
        Dashboard
      </h1>
      
      <div 
        className="dashboard-tabs" 
        ref={tabContainerRef}
        style={{ 
            display: 'flex', 
            gap: '10px', 
            borderBottom: '2.5px solid var(--border)',
            background: 'var(--bg-main)',
            position: 'sticky',
            top: '0', 
            paddingTop: '5px',
            paddingBottom: '0',
            zIndex: 100,
            overflowX: 'auto', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none', 
            marginBottom: '30px',
            scrollBehavior: 'smooth'
      }}>
        <button ref={tabRefs.business} style={tabStyle('business')} onClick={(e) => handleTabClick(e, 'business')}>
          🏢 Business Analytics
        </button>
        <button ref={tabRefs.client} style={tabStyle('client')} onClick={(e) => handleTabClick(e, 'client')}>
          👤 Client Insights
        </button>
        <button ref={tabRefs.activity} style={tabStyle('activity')} onClick={(e) => handleTabClick(e, 'activity')}>
          🕒 Recent Activities
        </button>
        <button ref={tabRefs.security} style={tabStyle('security')} onClick={(e) => handleTabClick(e, 'security')}>
          🛡️ Security
        </button>
      </div>

      <div 
        style={{ paddingTop: '5px', minHeight: '60vh', width: '100%' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {activeTab === 'business' && <BusinessDashboard />}
        {activeTab === 'client' && <ClientDashboard />}
        {activeTab === 'activity' && <div style={{ maxWidth: '1000px', margin: '0 auto' }}><ActivityFeed /></div>}
        {activeTab === 'security' && <div style={{ maxWidth: '600px', margin: '0 auto' }}><PasskeyManager /></div>}
      </div>
    </div>
  );
};

export default Dashboard;
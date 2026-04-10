import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      setActivities(res.data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Feed Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // Refresh feed every 60 seconds automatically
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
       <div className="sync-spinner" style={{ margin: '0 auto' }}></div>
       <p style={{ marginTop: '10px', fontWeight: '800', fontSize: '12px', color: 'var(--text-muted)' }}>SYNCING FEED...</p>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-card, #fff)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
      <h3 style={{ marginTop: 0, marginBottom: '25px', color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', transition: 'color 0.3s ease' }}>
        <span>🕒</span> Recent Activity Feed
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {activities.length > 0 ? activities.map(act => (
          <div key={act.id} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <div style={{ background: `${act.color}20`, color: act.color, padding: '12px', borderRadius: '50%', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {act.icon}
            </div>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-main, #0f172a)', fontSize: '14px', transition: 'color 0.3s ease' }}>{act.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', marginTop: '2px', transition: 'color 0.3s ease' }}>{act.description}</div>
              <div style={{ fontSize: '11px', color: act.color, marginTop: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{act.time_label}</div>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            No recent activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
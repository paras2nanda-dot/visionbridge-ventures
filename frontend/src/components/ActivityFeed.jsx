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
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🕒 Logic to fix time interpretation
  const getTimeLabel = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getActionStyles = (type) => {
    switch (type) {
      case 'DELETE': return { color: '#ef4444', icon: '🗑️', label: 'Removed' };
      case 'UPDATE': return { color: '#f59e0b', icon: '📝', label: 'Modified' };
      default: return { color: '#10b981', icon: '➕', label: 'Added' };
    }
  };

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
       <div className="sync-spinner" style={{ margin: '0 auto' }}></div>
       <p style={{ marginTop: '10px', fontWeight: '800', fontSize: '12px', color: 'var(--text-muted)' }}>SYNCING AUDIT LOG...</p>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-card, #fff)', padding: '25px', borderRadius: '16px', border: '1.5px solid var(--border, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0, marginBottom: '25px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
        <span>🕒</span> Recent Activity Feed
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activities.length > 0 ? activities.map(act => {
          const style = getActionStyles(act.action_type);
          return (
            <div key={act.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '12px', borderRadius: '12px', background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border)' }}>
              <div style={{ background: `${style.color}20`, color: style.color, width: '45px', height: '45px', borderRadius: '10px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {style.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>
                  {act.details}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#0ea5e9', border: '1px solid #0ea5e9', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    User: {act.user_name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    • {act.entity_name}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--text-main)' }}>{getTimeLabel(act.created_at)}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No activity logs recorded.</div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
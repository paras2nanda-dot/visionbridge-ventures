import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      console.log("📊 LOGS RECEIVED:", res.data); // 👈 Check F12 Console for this!
      setActivities(res.data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Feed Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTimeLabel = (dateString) => {
    if (!dateString) return '...';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getActionStyles = (type) => {
    switch (type?.toUpperCase()) {
      case 'DELETE': return { color: '#ef4444', icon: '🗑️' };
      case 'UPDATE': return { color: '#f59e0b', icon: '📝' };
      case 'CREATE': return { color: '#10b981', icon: '➕' };
      default: return { color: '#0ea5e9', icon: '🔔' };
    }
  };

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
       <div className="sync-spinner" style={{ margin: '0 auto', width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
       <p style={{ marginTop: '15px', fontWeight: '800', color: '#94a3b8', fontSize: '11px' }}>FETCHING AUDIT TRAIL...</p>
       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '800' }}>
          <span>🕒</span> Recent Activity Feed
        </h3>
        <button onClick={fetchActivities} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>REFRESH</button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activities.length > 0 ? activities.map((act) => {
          const style = getActionStyles(act.action_type);
          return (
            <div key={act.id} style={{ 
              display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', borderRadius: '12px', 
              background: '#f8fafc', border: '1px solid #e2e8f0' 
            }}>
              <div style={{ 
                background: `${style.color}15`, color: style.color, width: '40px', height: '40px', 
                borderRadius: '10px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                {style.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {act.details || "Activity recorded"}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '9px', fontWeight: '900', color: '#0ea5e9', border: '1px solid #0ea5e9', padding: '0px 5px', borderRadius: '3px', textTransform: 'uppercase' }}>
                    {act.user_name || 'System'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                    • {act.entity_name}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>{getTimeLabel(act.created_at)}</div>
                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '600' }}>
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '13px', fontWeight: '600' }}>
            No activity logs found. Perform an action to see it here!
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
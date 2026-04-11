import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      console.log("✅ Data Received in UI:", res.data);
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
    <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '16px' }}>
       <p style={{ fontWeight: '800', color: '#94a3b8', fontSize: '12px' }}>LOADING AUDIT TRAIL...</p>
    </div>
  );

  return (
    <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '800' }}>
          <span>🕒</span> Recent Activity Feed
        </h3>
        <button onClick={fetchActivities} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '5px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>
          REFRESH
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activities.length > 0 ? activities.map((act) => {
          const style = getActionStyles(act.action_type);
          return (
            <div key={act.id} style={{ 
              display: 'flex', gap: '12px', alignItems: 'center', padding: '14px', borderRadius: '12px', 
              background: '#f8fafc', border: '1px solid #e2e8f0' 
            }}>
              {/* Icon Box */}
              <div style={{ 
                background: `${style.color}15`, color: style.color, width: '42px', height: '42px', 
                borderRadius: '10px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                {style.icon}
              </div>

              {/* Text Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', marginBottom: '4px' }}>
                  {act.details}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: '900', color: '#0ea5e9', border: '1px solid #0ea5e9', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    USER: {act.user_name}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                    • {act.entity_name}
                  </span>
                </div>
              </div>

              {/* Time Section */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>{getTimeLabel(act.created_at)}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px', fontWeight: '600' }}>
            No activity logs found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
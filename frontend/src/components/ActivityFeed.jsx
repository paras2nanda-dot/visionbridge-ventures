import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      console.log("📊 UI DATA RECEIVED:", res.data);
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
    <div style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800' }}>
          <span>🕒</span> Recent Activity Feed
        </h3>
        <button onClick={fetchActivities} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
          REFRESH
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {activities.length > 0 ? activities.map((act) => {
          const style = getActionStyles(act.action_type);
          return (
            <div key={act.id} style={{ 
              display: 'flex', gap: '15px', alignItems: 'center', padding: '15px', borderRadius: '12px', 
              background: '#f8fafc', border: '1px solid #e2e8f0', transition: 'transform 0.2s'
            }}>
              <div style={{ 
                background: `${style.color}15`, color: style.color, width: '45px', height: '45px', 
                borderRadius: '10px', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                {style.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px', marginBottom: '4px' }}>
                  {act.details || "System Activity"}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#0ea5e9', border: '1px solid #0ea5e9', padding: '2px 8px', borderRadius: '5px', textTransform: 'uppercase' }}>
                    USER: {act.user_name}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    • {act.entity_name}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '50px', fontSize: '15px', fontWeight: '600' }}>
            No activity logs found. Try performing an action!
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
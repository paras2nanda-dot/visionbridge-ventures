import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      console.log("📊 RAW DATA RECEIVED:", res.data);
      setActivities(res.data);
      setLoading(false);
    } catch (err) {
      console.error("❌ API Fetch Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Loading logs...</div>;

  return (
    <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '2px solid #e2e8f0', color: '#000000' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>🕒 Recent Activity Feed</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activities.length > 0 ? activities.map((act) => (
          <div key={act.id} style={{ 
            padding: '15px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>
                {act.details}
              </div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                <span style={{ color: '#0ea5e9', fontWeight: '900', textTransform: 'uppercase' }}>USER: {act.user_name}</span>
                <span style={{ color: '#64748b' }}> • {act.entity_name}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>
              {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No logs found.</div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
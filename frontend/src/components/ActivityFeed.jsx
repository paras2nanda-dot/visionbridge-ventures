import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      console.log("📊 UI RECEIVED DATA:", res.data);
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

  if (loading) return <div style={{ padding: '20px', color: '#666' }}>Loading Activities...</div>;

  return (
    <div style={{ 
      background: '#ffffff', 
      padding: '20px', 
      borderRadius: '12px', 
      border: '2px solid #e2e8f0',
      color: '#000000' // Force black text
    }}>
      <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        🕒 Recent Activity Feed
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activities.length > 0 ? activities.map((act) => (
          <div key={act.id} style={{ 
            padding: '12px', 
            background: '#f8fafc', 
            border: '1px solid #cbd5e1', 
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>
                {act.details}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>USER: {act.user_name}</span>
                <span style={{ color: '#64748b' }}> • {act.entity_name}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8' }}>
              {new Date(act.created_at).toLocaleDateString()} <br/>
              {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>No logs found in database.</div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
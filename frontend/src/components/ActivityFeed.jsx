import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null); // Tracks which forensic log is open

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activities');
      setActivities(res.data);
    } catch (err) {
      console.error("❌ Feed Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, []);

  const getActionStyles = (type) => {
    switch (type?.toUpperCase()) {
      case 'DELETE': return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)', icon: '🗑️' };
      case 'UPDATE': return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)', icon: '📝' };
      case 'CREATE': return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)', icon: '✨' };
      default: return { color: '#6366f1', glow: 'rgba(99, 102, 241, 0.15)', icon: '🔔' };
    }
  };

  /**
   * 🛡️ FORENSIC DIFF ENGINE
   * Compares two JSON objects and renders a table showing only modified fields.
   */
  const renderDiff = (oldData, newData) => {
    if (!oldData && !newData) return null;
    
    // Combine all keys, excluding technical timestamps/IDs
    const allKeys = Object.keys({ ...oldData, ...newData }).filter(
      k => !['id', 'created_at', 'updated_at', 'is_active', 'added_by'].includes(k)
    );

    return (
      <div className="fade-in" style={{ 
        marginTop: '20px', padding: '20px', background: 'rgba(0,0,0,0.35)', 
        borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' 
      }}>
        <div style={{ fontSize: '10px', fontWeight: '900', color: '#6366f1', marginBottom: '12px', letterSpacing: '1px' }}>
          MODIFICATION ANALYSIS
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ paddingBottom: '10px', fontWeight: '800' }}>DATA FIELD</th>
              <th style={{ paddingBottom: '10px', fontWeight: '800' }}>PREVIOUS STATE</th>
              <th style={{ paddingBottom: '10px', fontWeight: '800' }}>MODIFIED STATE</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map(key => {
              const oldVal = oldData ? oldData[key] : null;
              const newVal = newData ? newData[key] : null;
              
              // Only show the row if the value actually changed
              if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;

              return (
                <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 0', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>
                    {key.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '10px 0', color: '#ef4444', opacity: 0.8 }}>{String(oldVal || '—')}</td>
                  <td style={{ padding: '10px 0', color: '#10b981', fontWeight: '700' }}>{String(newVal || '—')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading && activities.length === 0) return (
    <div style={{ padding: '60px', textAlign: 'center', background: '#0f172a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
       <p style={{ fontWeight: '800', color: '#94a3b8', fontSize: '12px', letterSpacing: '2px' }}>AUTHENTICATING AUDIT TRAIL...</p>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', padding: '0 5px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>
          Recent Activity Feed
        </h3>
        <button 
          onClick={fetchActivities} 
          disabled={loading}
          style={{ 
            background: loading ? 'rgba(99, 102, 241, 0.2)' : '#6366f1', 
            border: 'none', 
            color: 'white', 
            padding: '10px 22px', 
            borderRadius: '12px', 
            fontSize: '11px', 
            fontWeight: '900', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            transition: 'all 0.2s', 
            letterSpacing: '0.5px',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
          }}
        >
          {loading ? "SYNCING..." : "REFRESH FEED"}
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {activities.length > 0 ? activities.map((act) => {
          const style = getActionStyles(act.action_type);
          const isExpanded = expandedId === act.id;
          const hasDiffData = act.old_data || act.new_data;

          return (
            <div key={act.id} style={{ 
              display: 'flex', flexDirection: 'column', padding: '22px', borderRadius: '24px', 
              background: '#0f172a', 
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 15px 35px -12px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.3s ease'
            }}>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {/* Glowing Icon Halo */}
                <div style={{ 
                  background: style.glow, 
                  border: `1px solid ${style.color}50`,
                  color: style.color, 
                  width: '56px', height: '56px', 
                  borderRadius: '16px', 
                  fontSize: '26px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  boxShadow: `0 0 20px ${style.glow}`
                }}>
                  {style.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '17px', marginBottom: '8px', letterSpacing: '0.3px' }}>
                    {act.details || "System Activity"}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '10px', fontWeight: '900', color: '#38bdf8', 
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.2)', 
                      padding: '4px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' 
                    }}>
                      USER: {act.user_name}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                      • {act.entity_name}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '800', fontFamily: 'monospace', marginBottom: '8px' }}>
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {hasDiffData && (
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : act.id)}
                      style={{ 
                        background: 'none', border: 'none', color: isExpanded ? '#fff' : '#6366f1', 
                        fontSize: '10px', fontWeight: '900', cursor: 'pointer', 
                        textDecoration: 'underline', padding: 0 
                      }}
                    >
                      {isExpanded ? "HIDE DETAILS" : "VIEW CHANGES"}
                    </button>
                  )}
                </div>
              </div>

              {/* Forensic Content Dropdown */}
              {isExpanded && renderDiff(act.old_data, act.new_data)}
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '100px', background: '#0f172a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{fontSize: '16px', fontWeight: '700', letterSpacing: '1px'}}>LOGS CLEAR • SYSTEM SECURE</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
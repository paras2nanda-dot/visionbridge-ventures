import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null); 
  
  // 🎛️ Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  
  // ✅ Selection States
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activities');
      setActivities(res.data);
      setSelectedIds([]); // Clear selection on refresh
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

  // 🗑️ Bulk Delete Handler
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} activity logs?`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await api.post('/activities/bulk-delete', { ids: selectedIds });
      await fetchActivities(); // Refresh the list after deletion
    } catch (err) {
      console.error("❌ Delete Error:", err);
      alert("Failed to delete logs. Check console.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getActionStyles = (type) => {
    switch (type?.toUpperCase()) {
      case 'DELETE': return { color: '#ef4444', icon: '🗑️' };
      case 'UPDATE': return { color: '#f59e0b', icon: '📝' };
      case 'CREATE': return { color: '#10b981', icon: '✨' };
      default: return { color: '#38bdf8', icon: '🔔' };
    }
  };

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
      return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = val.split('-');
        return `${day}/${month}/${year}`;
    }
    return String(val);
  };

  const renderDiff = (oldData, newData) => {
    if (!oldData && !newData) return null;
    const allKeys = Object.keys({ ...oldData, ...newData }).filter(
      k => !['id', 'created_at', 'updated_at', 'is_active'].includes(k)
    );

    let hasVisibleChanges = false;
    const rows = allKeys.map(key => {
      const rawOld = oldData ? oldData[key] : null;
      const rawNew = newData ? newData[key] : null;
      const displayOld = formatValue(rawOld);
      const displayNew = formatValue(rawNew);
      
      if (displayOld === displayNew) return null;
      hasVisibleChanges = true;

      return (
        <tr key={key} style={{ borderBottom: '2px solid var(--border)' }}>
          <td style={{ padding: '12px 15px 12px 0', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', fontSize: '11px', whiteSpace: 'nowrap' }}>
            {key.replace(/_/g, ' ')}
          </td>
          <td style={{ padding: '12px 15px', color: '#ef4444', fontWeight: '600', whiteSpace: 'nowrap' }}>{displayOld}</td>
          <td style={{ padding: '12px 0 12px 15px', color: '#10b981', fontWeight: '800', whiteSpace: 'nowrap' }}>{displayNew}</td>
        </tr>
      );
    });

    if (!hasVisibleChanges) return null;

    return (
      <div className="fade-in" style={{ marginTop: '20px', padding: '20px 0 20px 20px', background: 'var(--bg-main)', borderRadius: '16px', border: '2.5px solid var(--border)' }}>
        <div style={{ fontSize: '11px', fontWeight: '900', color: '#38bdf8', marginBottom: '15px', letterSpacing: '1px', paddingRight: '20px', textTransform: 'none' }}>
          Modification analysis
        </div>
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <table className="mobile-table-wrapper" style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', fontSize: '13px', paddingRight: '20px' }}>
            <thead>
                <tr style={{ color: 'var(--text-main)', textAlign: 'left', borderBottom: '2.5px solid var(--border)' }}>
                <th style={{ paddingBottom: '12px', fontWeight: '900', whiteSpace: 'nowrap' }}>Data field</th>
                <th style={{ paddingBottom: '12px', paddingLeft: '15px', fontWeight: '900', whiteSpace: 'nowrap' }}>Previous state</th>
                <th style={{ paddingBottom: '12px', paddingLeft: '15px', fontWeight: '900', whiteSpace: 'nowrap' }}>Modified state</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
            </table>
        </div>
      </div>
    );
  };

  // 🔍 Filter Logic
  const filteredActivities = activities.filter(act => {
    const searchString = `${act.details} ${act.entity_name} ${act.user_name}`.toLowerCase();
    if (searchQuery && !searchString.includes(searchQuery.toLowerCase())) return false;
    if (filterAction !== 'ALL' && act.action_type?.toUpperCase() !== filterAction) return false;
    if (filterDate) {
      const actDate = new Date(act.created_at).toISOString().split('T')[0];
      if (actDate !== filterDate) return false;
    }
    return true;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredActivities.map(act => act.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  if (loading && activities.length === 0) return (
    <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '2.5px solid var(--border)' }}>
       <p style={{ fontWeight: '900', color: 'var(--text-main)', fontSize: '14px', letterSpacing: '1px' }}>SYNCING AUDIT TRAIL...</p>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '10px 0' }}>
      <style>{`
        .mobile-table-wrapper::-webkit-scrollbar { display: none; }
        .filter-input {
            padding: 12px 15px;
            border-radius: 10px;
            border: 2.5px solid var(--border);
            background: var(--bg-card); 
            color: var(--text-main); 
            font-size: 14px;
            font-weight: 600;
            outline: none;
        }
        
        .date-input-placeholder {
            position: relative;
        }
        .date-input-placeholder input[type="date"]:invalid::before {
            content: 'Filter by Date';
            color: var(--text-muted);
            position: absolute;
            left: 15px;
            pointer-events: none;
        }

        @media (max-width: 600px) {
            .filter-container { flex-direction: column; align-items: stretch !important; gap: 10px; }
            .filter-input-wrapper { width: 100%; display: flex; }
            .filter-input { width: 100%; }
        }
      `}</style>

      {/* HEADER ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', padding: '0 5px', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '24px', fontWeight: '900' }}>
          Recent Activity Feed
        </h3>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            {selectedIds.length > 0 && (
                <button 
                onClick={handleDeleteSelected} 
                disabled={isDeleting}
                style={{ background: '#ef4444', border: '2.5px solid #000', color: 'white', padding: '10px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px' }}
                >
                {isDeleting ? "DELETING..." : `DELETE SELECTED (${selectedIds.length})`}
                </button>
            )}
            <button 
            onClick={fetchActivities} 
            disabled={loading}
            style={{ background: '#38bdf8', border: '2.5px solid #000', color: 'white', padding: '10px 22px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px' }}
            >
            {loading ? "SYNCING..." : "Refresh feed"}
            </button>
        </div>
      </div>

      {/* 🎛️ CONTROL CENTER / FILTER BAR */}
      <div className="filter-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '2.5px solid var(--border)', marginBottom: '30px', alignItems: 'center', boxShadow: '6px 6px 0px rgba(0,0,0,0.1)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <input 
                type="checkbox" 
                checked={selectedIds.length > 0 && selectedIds.length === filteredActivities.length}
                onChange={handleSelectAll}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
        </div>

        <div className="filter-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Search activity..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
              style={{ width: '100%' }}
            />
        </div>

        <div className="filter-input-wrapper date-input-placeholder">
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              required 
              className="filter-input"
            />
        </div>

        <div className="filter-input-wrapper">
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="filter-input"
            >
              <option value="ALL">All actions</option>
              <option value="CREATE">Creates</option>
              <option value="UPDATE">Updates</option>
              <option value="DELETE">Deletes</option>
            </select>
        </div>
      </div>
      
      {/* ACTIVITY LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredActivities.length > 0 ? filteredActivities.map((act) => {
          const style = getActionStyles(act.action_type);
          const isExpanded = expandedId === act.id;
          const hasDiffData = act.old_data || act.new_data;
          const isSelected = selectedIds.includes(act.id);

          return (
            <div key={act.id} style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '12px', background: isSelected ? 'rgba(56, 189, 248, 0.05)' : 'var(--bg-card)', border: '2.5px solid var(--border)', boxShadow: isSelected ? 'none' : '6px 6px 0px rgba(0,0,0,0.1)', transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleSelect(act.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />

                <div style={{ background: 'rgba(0,0,0,0.05)', border: `2px solid var(--border)`, width: '48px', height: '48px', borderRadius: '10px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {style.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '900', color: 'var(--text-main)', fontSize: '16px', marginBottom: '5px', letterSpacing: '0.3px' }}>
                    {act.details || "System Activity"}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#38bdf8', textTransform: 'none' }}>
                      User: {act.user_name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800' }}>
                      • {act.entity_name}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '900', marginBottom: '5px' }}>
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {hasDiffData && (
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : act.id)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '11px', fontWeight: '900', cursor: 'pointer', textDecoration: 'underline', padding: 0, textTransform: 'none' }}
                    >
                      {isExpanded ? "Hide changes" : "View changes"}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && renderDiff(act.old_data, act.new_data)}
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '100px', background: 'var(--bg-card)', borderRadius: '12px', border: '2.5px solid var(--border)' }}>
            <p style={{fontSize: '16px', fontWeight: '900', letterSpacing: '1px'}}>NO MATCHING LOGS FOUND</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
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
      case 'DELETE': return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)', icon: '🗑️' };
      case 'UPDATE': return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)', icon: '📝' };
      case 'CREATE': return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)', icon: '✨' };
      default: return { color: '#6366f1', glow: 'rgba(99, 102, 241, 0.15)', icon: '🔔' };
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
        <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <td style={{ padding: '10px 15px 10px 0', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', whiteSpace: 'nowrap' }}>
            {key.replace(/_/g, ' ')}
          </td>
          <td style={{ padding: '10px 15px', color: '#ef4444', opacity: 0.8, whiteSpace: 'nowrap' }}>{displayOld}</td>
          <td style={{ padding: '10px 0 10px 15px', color: '#10b981', fontWeight: '700', whiteSpace: 'nowrap' }}>{displayNew}</td>
        </tr>
      );
    });

    if (!hasVisibleChanges) return null;

    return (
      <div className="fade-in" style={{ marginTop: '20px', padding: '20px 0 20px 20px', background: 'rgba(0,0,0,0.35)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '10px', fontWeight: '900', color: '#6366f1', marginBottom: '12px', letterSpacing: '1px', paddingRight: '20px' }}>
          MODIFICATION ANALYSIS
        </div>
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <table className="mobile-table-wrapper" style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', fontSize: '13px', paddingRight: '20px' }}>
            <thead>
                <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ paddingBottom: '10px', fontWeight: '800', whiteSpace: 'nowrap' }}>DATA FIELD</th>
                <th style={{ paddingBottom: '10px', paddingLeft: '15px', fontWeight: '800', whiteSpace: 'nowrap' }}>PREVIOUS STATE</th>
                <th style={{ paddingBottom: '10px', paddingLeft: '15px', fontWeight: '800', whiteSpace: 'nowrap' }}>MODIFIED STATE</th>
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
    // 1. Search Filter (checks details, entity name, and user)
    const searchString = `${act.details} ${act.entity_name} ${act.user_name}`.toLowerCase();
    if (searchQuery && !searchString.includes(searchQuery.toLowerCase())) return false;
    
    // 2. Action Type Filter
    if (filterAction !== 'ALL' && act.action_type?.toUpperCase() !== filterAction) return false;
    
    // 3. Date Filter
    if (filterDate) {
      const actDate = new Date(act.created_at).toISOString().split('T')[0];
      if (actDate !== filterDate) return false;
    }
    
    return true;
  });

  // Handle Select All
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
    <div style={{ padding: '60px', textAlign: 'center', background: '#0f172a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
       <p style={{ fontWeight: '800', color: '#94a3b8', fontSize: '12px', letterSpacing: '2px' }}>AUTHENTICATING AUDIT TRAIL...</p>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '10px 0' }}>
      {/* 📱 Inject Mobile CSS specific for the filter bar */}
      <style>{`
        .mobile-table-wrapper::-webkit-scrollbar { display: none; }
        .filter-input {
            padding: 10px 15px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
            background: #1e293b; /* Dark slate background */
            color: #f8fafc; /* White text */
            font-size: 13px;
            outline: none;
            color-scheme: dark; /* Ensures date picker calendar is dark */
        }
        .filter-input::placeholder { color: #94a3b8; }
        
        @media (max-width: 600px) {
            .filter-container { flex-direction: column; align-items: stretch !important; gap: 10px; }
            .filter-input-wrapper { width: 100%; display: flex; }
            .filter-input { width: 100%; }
            .select-all-wrapper { margin-bottom: 5px; }
        }
      `}</style>

      {/* HEADER ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 5px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>
          Recent Activity Feed
        </h3>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            {selectedIds.length > 0 && (
                <button 
                onClick={handleDeleteSelected} 
                disabled={isDeleting}
                style={{ background: '#ef4444', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}
                >
                {isDeleting ? "DELETING..." : `DELETE SELECTED (${selectedIds.length})`}
                </button>
            )}
            <button 
            onClick={fetchActivities} 
            disabled={loading}
            style={{ background: loading ? 'rgba(99, 102, 241, 0.2)' : '#6366f1', border: 'none', color: 'white', padding: '10px 22px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
            >
            {loading ? "SYNCING..." : "REFRESH FEED"}
            </button>
        </div>
      </div>

      {/* 🎛️ CONTROL CENTER / FILTER BAR */}
      <div className="filter-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', background: '#0f172a', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '25px', alignItems: 'center' }}>
        
        {/* Checkbox for Select All */}
        <div className="select-all-wrapper" style={{ display: 'flex', alignItems: 'center', marginRight: '5px' }}>
            <input 
                type="checkbox" 
                checked={selectedIds.length > 0 && selectedIds.length === filteredActivities.length}
                onChange={handleSelectAll}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
            />
            <span style={{marginLeft: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: '700', display: window.innerWidth <= 600 ? 'inline' : 'none'}}>Select All</span>
        </div>

        {/* Search */}
        <div className="filter-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Search activity..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
        </div>

        {/* Date Filter */}
        <div className="filter-input-wrapper">
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="filter-input"
              style={{ cursor: 'pointer', boxSizing: 'border-box' }}
            />
        </div>

        {/* Action Type Filter */}
        <div className="filter-input-wrapper">
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="filter-input"
              style={{ cursor: 'pointer', boxSizing: 'border-box' }}
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Creates (✨)</option>
              <option value="UPDATE">Updates (📝)</option>
              <option value="DELETE">Deletes (🗑️)</option>
            </select>
        </div>
      </div>
      
      {/* ACTIVITY LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {filteredActivities.length > 0 ? filteredActivities.map((act) => {
          const style = getActionStyles(act.action_type);
          const isExpanded = expandedId === act.id;
          const hasDiffData = act.old_data || act.new_data;
          const isSelected = selectedIds.includes(act.id);

          return (
            <div key={act.id} style={{ display: 'flex', flexDirection: 'column', padding: '22px', borderRadius: '24px', background: isSelected ? 'rgba(99, 102, 241, 0.05)' : '#0f172a', border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 15px 35px -12px rgba(0, 0, 0, 0.5)', transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                
                {/* Checkbox for individual log */}
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleSelect(act.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1', flexShrink: 0 }}
                />

                <div style={{ background: style.glow, border: `1px solid ${style.color}50`, color: style.color, width: '48px', height: '48px', borderRadius: '14px', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 15px ${style.glow}` }}>
                  {style.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingLeft: '5px' }}>
                  <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '16px', marginBottom: '8px', letterSpacing: '0.3px' }}>
                    {act.details || "System Activity"}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '4px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
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
                      style={{ background: 'none', border: 'none', color: isExpanded ? '#fff' : '#6366f1', fontSize: '10px', fontWeight: '900', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      {isExpanded ? "HIDE DETAILS" : "VIEW CHANGES"}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && renderDiff(act.old_data, act.new_data)}
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '100px', background: '#0f172a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{fontSize: '16px', fontWeight: '700', letterSpacing: '1px'}}>NO MATCHING LOGS FOUND</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
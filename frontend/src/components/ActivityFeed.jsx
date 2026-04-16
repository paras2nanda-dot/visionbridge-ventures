import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Search, Trash2, RefreshCw, FilePlus, FileEdit, FileMinus, Bell, Eye, EyeOff, Activity } from 'lucide-react';

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
      console.error("Feed Sync Error:", err);
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
      console.error("Delete Error:", err);
      alert("Failed to delete logs. Check console.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getActionStyles = (type) => {
    switch (type?.toUpperCase()) {
      case 'DELETE': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', icon: <FileMinus size={20} color="#ef4444" /> };
      case 'UPDATE': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', icon: <FileEdit size={20} color="#f59e0b" /> };
      case 'CREATE': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', icon: <FilePlus size={20} color="#10b981" /> };
      default: return { color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)', border: 'rgba(2, 132, 199, 0.2)', icon: <Bell size={20} color="#0284c7" /> };
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
        <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
          <td style={{ padding: '12px 16px 12px 0', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
            {key.replace(/_/g, ' ')}
          </td>
          <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: '600', whiteSpace: 'nowrap' }}>{displayOld}</td>
          <td style={{ padding: '12px 0 12px 16px', color: '#10b981', fontWeight: '700', whiteSpace: 'nowrap' }}>{displayNew}</td>
        </tr>
      );
    });

    if (!hasVisibleChanges) return null;

    return (
      <div className="fade-in" style={{ marginTop: '20px', padding: '20px 24px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', marginBottom: '16px', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} /> Modification Analysis
        </div>
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <table className="mobile-table-wrapper" style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ paddingBottom: '12px', fontWeight: '800', whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Data field</th>
                <th style={{ paddingBottom: '12px', paddingLeft: '16px', fontWeight: '800', whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Previous state</th>
                <th style={{ paddingBottom: '12px', paddingLeft: '16px', fontWeight: '800', whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>Modified state</th>
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
    <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin" color="#0284c7" />
        <p style={{ fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' }}>SYNCING AUDIT TRAIL...</p>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '10px 0', maxWidth: '1000px', margin: '0 auto' }}>
      <style>{`
        .mobile-table-wrapper::-webkit-scrollbar { display: none; }
        .filter-input {
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid var(--border);
            background: var(--bg-card); 
            color: var(--text-main); 
            font-size: 14px;
            font-weight: 600;
            outline: none;
            height: 48px;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .filter-input:focus {
            border-color: #0284c7;
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }

        @media (max-width: 600px) {
            .filter-container { flex-direction: column; align-items: stretch !important; gap: 12px; }
            .filter-input-wrapper { width: 100%; display: flex; }
            .filter-input { width: 100%; }
        }
      `}</style>

      {/* HEADER ACTION BUTTONS (Title removed to prevent duplication with tabs) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px', padding: '0 8px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
            {selectedIds.length > 0 && (
                <button 
                onClick={handleDeleteSelected} 
                disabled={isDeleting}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ef4444', border: '1px solid transparent', color: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.2)' }}
                >
                  <Trash2 size={16} /> {isDeleting ? "DELETING..." : `DELETE (${selectedIds.length})`}
                </button>
            )}
            <button 
            onClick={fetchActivities} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '10px 20px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; }}
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} /> {loading ? "SYNCING..." : "REFRESH"}
            </button>
        </div>
      </div>

      {/* 🎛️ CONTROL CENTER / FILTER BAR */}
      <div className="filter-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '32px', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <input 
                type="checkbox" 
                checked={selectedIds.length > 0 && selectedIds.length === filteredActivities.length}
                onChange={handleSelectAll}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7' }}
            />
        </div>

        <div className="filter-input-wrapper" style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search activity logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
              style={{ width: '100%', paddingLeft: '44px' }}
            />
        </div>

        <div className="filter-input-wrapper">
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="filter-input"
              style={{ minWidth: '180px' }}
            />
        </div>

        <div className="filter-input-wrapper">
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="filter-input"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Creates</option>
              <option value="UPDATE">Updates</option>
              <option value="DELETE">Deletes</option>
            </select>
        </div>
      </div>
      
      {/* ACTIVITY LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredActivities.length > 0 ? filteredActivities.map((act) => {
          const style = getActionStyles(act.action_type);
          const isExpanded = expandedId === act.id;
          const hasDiffData = act.old_data || act.new_data;
          const isSelected = selectedIds.includes(act.id);

          return (
            <div key={act.id} style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px', background: isSelected ? 'rgba(2, 132, 199, 0.04)' : 'var(--bg-card)', border: isSelected ? '1px solid rgba(2, 132, 199, 0.2)' : '1px solid var(--border)', boxShadow: isSelected ? 'none' : '0 2px 4px -1px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }} onMouseOver={(e) => { if(!isSelected) e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)' }} onMouseOut={(e) => { if(!isSelected) e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleSelect(act.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7', marginTop: '14px' }}
                />

                <div style={{ background: style.bg, border: `1px solid ${style.border}`, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {style.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    
                    <div>
                        <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '15px', marginBottom: '6px', lineHeight: 1.4 }}>
                            {act.details || "System Activity"}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', padding: '4px 10px', background: 'rgba(2, 132, 199, 0.1)', borderRadius: '6px' }}>
                            {act.user_name}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {act.entity_name}
                            </span>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px' }}>
                            {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {hasDiffData && (
                            <button 
                            onClick={() => setExpandedId(isExpanded ? null : act.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#0284c7', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: 0, transition: 'opacity 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = 0.7}
                            onMouseOut={(e) => e.currentTarget.style.opacity = 1}
                            >
                            {isExpanded ? <><EyeOff size={14}/> Hide changes</> : <><Eye size={14}/> View changes</>}
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && renderDiff(act.old_data, act.new_data)}
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '80px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
            <Activity size={32} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{fontSize: '14px', fontWeight: '700', letterSpacing: '0.5px', margin: 0}}>NO MATCHING LOGS FOUND</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
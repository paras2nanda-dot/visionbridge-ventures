/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 

const Sips = () => {
  const [sips, setSips] = useState([]);
  const [clients, setClients] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [clientName, setClientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false); 
  const [selectedIds, setSelectedIds] = useState([]);

  const initialState = {
    sip_id: '', client_code_input: '', client_id: '', scheme_id: '', amount: '',
    start_date: new Date().toISOString().split('T')[0], end_date: '',
    frequency: 'MONTHLY',
    sip_day: '1', status: 'Active', platform: 'NSE', notes: ''
  };

  const [formData, setFormData] = useState(initialState);
  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(val || 0));

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      const [c, s, sip] = await Promise.all([api.get('/clients'), api.get('/mf-schemes'), api.get('/sips')]);
      setClients(c.data || []); 
      setSchemes(s.data || []); 
      setSips(sip.data || []);
      setSelectedIds([]); 
      
      if (!isEditing && !isViewing) {
        const high = Math.max(...(sip.data || []).map(i => parseInt(i.sip_id?.replace(/\D/g, '') || 0)), 0);
        setFormData(prev => ({ ...prev, sip_id: `SID${(high + 1).toString().padStart(5, '0')}` }));
      }
    } catch (e) { toast.error("Sync Error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewing) return setIsViewing(false);
    if (!formData.client_id) return toast.warning("Please select a valid Client ID");
    if (!formData.scheme_id) return toast.warning("Please select a Scheme");

    setIsSaving(true); 
    const payload = { 
      ...formData, 
      amount: formData.amount.toString().replace(/,/g, ''),
      end_date: formData.end_date || null,
      frequency: formData.frequency.toUpperCase() 
    };

    try {
      if (isEditing) await api.put(`/sips/${editingId}`, payload);
      else await api.post('/sips', payload);
      toast.success("✅ Success"); 
      setIsEditing(false); setClientName(''); setFormData(initialState); fetchInitialData();
    } catch (e) { toast.error(e.response?.data?.error || "Error saving"); }
    finally { setIsSaving(false); } 
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === filteredSips.length ? [] : filteredSips.map(s => s.id));

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedIds.length} selected SIPs permanently?`)) {
      try {
        await api.post('/sips/bulk-delete', { ids: selectedIds });
        toast.success("🗑️ Bulk Deleted");
        fetchInitialData();
      } catch (e) { toast.error("Bulk Delete Failed"); }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this mandate?")) {
      try {
        await api.delete(`/sips/${id}`);
        toast.success("🗑️ Deleted");
        fetchInitialData();
      } catch (e) { toast.error("Delete Error"); }
    }
  };

  const filteredSips = sips.filter(s => 
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sip_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.3px' };
  
  /* 🪄 Explicitly added border mapping for high contrast visibility */
  const inputStyle = { width: '100%', padding: '12px', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)' };

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className="title" style={{ color: 'var(--text-main)', margin: 0, fontWeight: '800' }}>SIP Tracker</h1>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* 💎 Executive Metric Tile 1 */}
          <div style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid #10b981', flex: '1 1 auto', minWidth: '160px' }}>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly SIP Book</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>₹{formatINR(sips.filter(s => s.status === 'Active').reduce((sum, s) => sum + parseFloat(s.amount || 0), 0))}</div>
          </div>
          {/* 💎 Executive Metric Tile 2 */}
          <div style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', borderLeft: '4px solid #6366f1', flex: '1 1 auto', minWidth: '160px' }}>
            <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL SIP AUM</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>₹{formatINR(sips.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0))}</div>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: '32px', borderTop: `4px solid ${isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#6366f1'}` }}>
        <form onSubmit={handleSubmit}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div><label style={labelStyle}>SID</label><input style={inputStyle} value={formData.sip_id} readOnly /></div>
              <div><label style={labelStyle}>Client ID *</label>
              <input style={inputStyle} value={formData.client_code_input} readOnly={isViewing} placeholder="e.g. C001" onChange={(e)=> {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
              }} required /></div>
              <div><label style={labelStyle}>Client Name</label><input style={inputStyle} value={clientName} readOnly /></div>
              <div><label style={labelStyle}>MF Scheme Name *</label>
              <select style={inputStyle} value={formData.scheme_id} disabled={isViewing} onChange={e=>setFormData({...formData, scheme_id:e.target.value})} required>
                <option value="">Select Scheme...</option>{schemes.map(s=><option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select></div>
              <div><label style={labelStyle}>SIP Amount (₹) *</label><input style={inputStyle} value={formData.amount} readOnly={isViewing} onChange={e=>setFormData({...formData, amount:e.target.value})} required /></div>
              <div><label style={labelStyle}>Frequency</label>
              <select style={inputStyle} value={formData.frequency} disabled={isViewing} onChange={e=>setFormData({...formData, frequency:e.target.value})}>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select></div>
              <div><label style={labelStyle}>SIP Day</label><select style={inputStyle} value={formData.sip_day} disabled={isViewing} onChange={e=>setFormData({...formData, sip_day:e.target.value})}>
                {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select></div>
              <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={formData.status} disabled={isViewing} onChange={e=>setFormData({...formData, status:e.target.value})}>
                <option>Active</option><option>Paused</option><option>Stopped</option>
              </select></div>
              <div><label style={labelStyle}>Start Date</label><input type="date" style={inputStyle} value={formData.start_date} readOnly={isViewing} onChange={e=>setFormData({...formData, start_date:e.target.value})} required /></div>
              <div><label style={labelStyle}>End Date</label><input type="date" style={inputStyle} value={formData.end_date} readOnly={isViewing} onChange={e=>setFormData({...formData, end_date:e.target.value})} /></div>
              <div><label style={labelStyle}>Platform</label><select style={inputStyle} value={formData.platform} disabled={isViewing} onChange={e=>setFormData({...formData, platform:e.target.value})}><option>NSE</option><option>BSE</option></select></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, height: '60px'}} value={formData.notes} readOnly={isViewing} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
           </div>
           {/* 🪄 FIX: Removed flex-grow so button stays standard size on desktop */}
           <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
             <button type="submit" disabled={isSaving} style={{padding:'12px 40px', background: isEditing ? '#f59e0b' : isViewing ? '#64748b' : '#6366f1', color:'#fff', border:'none', borderRadius:'8px', fontWeight:'bold', cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'}}>
                {isSaving ? (isEditing ? "Updating..." : "Syncing SIP...") : (isEditing ? "Update" : isViewing ? "Close View" : "Add SIP")}
             </button>
             {(isEditing || isViewing) && <button type="button" onClick={() => { setIsEditing(false); setIsViewing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} style={{padding:'12px 24px', background:'transparent', color:'var(--text-main)', border:'1px solid var(--border)', borderRadius:'8px', fontWeight: 'bold'}}>Cancel</button>}
           </div>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', maxWidth: '350px', width: '100%' }}>
          <input type="text" placeholder="Search SIP mandates..." style={{ ...inputStyle, paddingLeft: '40px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>
        {selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '0', background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{background: 'rgba(248, 250, 252, 0.5)', borderBottom: '1px solid var(--border)'}}>
                  <th style={{padding:'16px', textAlign:'left'}}><input type="checkbox" checked={selectedIds.length === filteredSips.length && filteredSips.length > 0} onChange={toggleAll} /></th>
                  <th style={{padding:'16px', textAlign:'left', color: 'var(--text-muted)', fontWeight: '700'}}>SID</th>
                  <th style={{padding:'16px', textAlign:'left', color: 'var(--text-muted)', fontWeight: '700'}}>CLIENT</th>
                  <th style={{padding:'16px', textAlign:'left', color: 'var(--text-muted)', fontWeight: '700'}}>SCHEME</th>
                  <th style={{padding:'16px', textAlign:'center', color: 'var(--text-muted)', fontWeight: '700'}}>STATUS</th>
                  <th style={{padding:'16px', textAlign:'right', color: 'var(--text-muted)', fontWeight: '700'}}>AMOUNT</th>
                  <th style={{padding:'16px', textAlign:'center', color: 'var(--text-muted)', fontWeight: '700'}}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredSips.map(s => (
                <tr key={s.id} style={{borderBottom:'1px solid var(--border)', background: selectedIds.includes(s.id) ? 'rgba(99, 102, 241, 0.04)' : 'transparent', transition: 'background 0.2s'}}>
                  <td style={{ padding: '12px' }}><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                  <td style={{ padding: '12px', color: '#6366f1', fontWeight: 'bold' }}>{s.sip_id}</td>
                  <td style={{ padding: '12px', color: 'var(--text-main)', fontWeight: '600' }}>{s.client_code} - {s.client_name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-main)' }}>
                    <div style={{fontWeight:'bold'}}>{s.scheme_name}</div>
                    <div style={{fontSize:'10px', color:'var(--text-muted)', marginTop: '2px'}}>{s.platform} • {s.frequency}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: s.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: s.status === 'Active' ? '#10b981' : '#ef4444' 
                    }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>₹{formatINR(s.amount)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => { setIsViewing(true); setIsEditing(false); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{color:'var(--text-muted)', border:'none', background:'none', cursor:'pointer', fontWeight:'bold', fontSize: '11px'}}>VIEW</button>
                          <button onClick={() => { setIsEditing(true); setIsViewing(false); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{color:'#6366f1', border:'none', background:'none', cursor:'pointer', fontWeight:'bold', fontSize: '11px'}}>EDIT</button>
                          <button onClick={() => handleDelete(s.id)} style={{color:'#ef4444', border:'none', background:'none', cursor:'pointer', fontWeight:'bold', fontSize: '11px'}}>DELETE</button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sips;
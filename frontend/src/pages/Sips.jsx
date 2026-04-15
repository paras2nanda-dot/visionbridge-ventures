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
  const [loading, setLoading] = useState(true); // ✅ FIX: Added missing loading state

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
    setLoading(true); // ✅ FIX: Set loading to true when fetching starts
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
    } catch (e) { 
      toast.error("Sync Error"); 
    } finally {
      setLoading(false); // ✅ FIX: Turn off loading when done
    }
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

  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '800', fontSize: '13px', color: 'var(--text-main)', letterSpacing: '0.5px' };
  const inputStyle = { width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', border: '2.5px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '600' };

  return (
    <div className="container fade-in" style={{ paddingBottom: '50px' }}>
      
      {/* HEADER & METRIC CARDS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 className="title" style={{ color: 'var(--text-main)', margin: 0, fontWeight: '900', fontSize: '32px' }}>SIP Tracker</h1>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card)', border: '2.5px solid var(--border)', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)', flex: '1 1 auto', minWidth: '180px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '6px', background: '#38bdf8' }}></div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '8px' }}>Monthly SIP Book</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px', paddingLeft: '8px' }}>₹{formatINR(sips.filter(s => s.status === 'Active').reduce((sum, s) => sum + parseFloat(s.amount || 0), 0))}</div>
          </div>
          
          <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card)', border: '2.5px solid var(--border)', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)', flex: '1 1 auto', minWidth: '180px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '6px', background: '#6366f1' }}></div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '8px' }}>Total SIP AUM</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px', paddingLeft: '8px' }}>₹{formatINR(sips.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0))}</div>
          </div>
        </div>
      </div>
      
      {/* ADD/EDIT SIP FORM CARD */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '2.5px solid var(--border)', boxShadow: '6px 6px 0px rgba(0,0,0,0.1)', marginBottom: '40px', position: 'relative' }}>
        
        {/* State Indicator */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#38bdf8', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}></div>

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
           
           <div style={{ marginTop: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
             <button type="submit" disabled={isSaving} style={{padding: '12px 32px', background: isEditing ? '#f59e0b' : isViewing ? 'var(--text-muted)' : '#38bdf8', color: 'white', border: '2.5px solid #000', borderRadius: '10px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: '900', letterSpacing: '0.5px'}}>
                {isSaving ? (isEditing ? "UPDATING..." : "SYNCING SIP...") : (isEditing ? "UPDATE SIP" : isViewing ? "CLOSE VIEW" : "ADD SIP")}
             </button>
             {(isEditing || isViewing) && <button type="button" onClick={() => { setIsEditing(false); setIsViewing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} style={{padding: '12px 24px', borderRadius: '10px', border: '2.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '900', letterSpacing: '0.5px'}}>CANCEL</button>}
           </div>
        </form>
      </div>

      {/* SEARCH BAR & BULK DELETE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
          <input 
            type="text" 
            placeholder="Search SIP mandates..." 
            style={{ ...inputStyle, paddingLeft: '52px' }} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7, fontSize: '18px', pointerEvents: 'none' }}>🔍</span>
        </div>
        {selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', border: '2.5px solid #000', padding: '12px 24px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* SIP TRACKER TABLE */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '2.5px solid var(--border)', overflow: 'hidden', boxShadow: '6px 6px 0px rgba(0,0,0,0.1)' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.03)', borderBottom: '2.5px solid var(--border)' }}>
                  <th style={{ padding: '16px', width: '40px' }}><input type="checkbox" checked={selectedIds.length === filteredSips.length && filteredSips.length > 0} onChange={toggleAll} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /></th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-main)', fontWeight: '900' }}>SID</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-main)', fontWeight: '900' }}>Client name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-main)', fontWeight: '900' }}>Scheme</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-main)', fontWeight: '900' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '900' }}>Amount</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-main)', fontWeight: '900' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSips.map(s => (
                <tr key={s.id} style={{ borderBottom: '2px solid var(--border)', background: selectedIds.includes(s.id) ? 'rgba(56, 189, 248, 0.05)' : 'transparent', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /></td>
                  <td style={{ padding: '16px', color: '#38bdf8', fontWeight: '900' }}>{s.sip_id}</td>
                  <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '800' }}>{s.client_code} - {s.client_name}</td>
                  <td style={{ padding: '16px', color: 'var(--text-main)' }}>
                    <div style={{fontWeight: '800'}}>{s.scheme_name}</div>
                    <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '700'}}>{s.platform} • {s.frequency}</div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: s.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: s.status === 'Active' ? '#10b981' : '#ef4444',
                      border: s.status === 'Active' ? '1.5px solid rgba(16, 185, 129, 0.3)' : '1.5px solid rgba(239, 68, 68, 0.3)'
                    }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR(s.amount)}</td>
                  <td style={{ padding: '16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => { setIsViewing(true); setIsEditing(false); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ color: 'var(--text-main)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '11px', marginRight: '16px', textTransform: 'uppercase' }}>VIEW</button>
                      <button onClick={() => { setIsEditing(true); setIsViewing(false); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '11px', marginRight: '16px', textTransform: 'uppercase' }}>EDIT</button>
                      <button onClick={() => handleDelete(s.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}>DELETE</button>
                  </td>
                </tr>
              ))}
              {filteredSips.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800' }}>No SIP records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sips;
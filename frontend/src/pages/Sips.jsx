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
  const [editingId, setEditingId] = useState(null);
  
  // 💡 NEW: Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  const initialState = {
    sip_id: '', client_code_input: '', client_id: '', scheme_id: '', amount: '',
    start_date: new Date().toISOString().split('T')[0], end_date: '',
    frequency: 'MONTHLY', sip_day: '1', status: 'Active', platform: 'NSE', notes: ''
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
      setSelectedIds([]); // Reset selection after refresh
      
      if (!isEditing && sip.data?.length > 0) {
        const high = Math.max(...sip.data.map(i => parseInt(i.sip_id?.replace(/\D/g, '') || 0)));
        setFormData(prev => ({ ...prev, sip_id: `SID${(high + 1).toString().padStart(5, '0')}` }));
      }
    } catch (e) { toast.error("Sync Error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, amount: formData.amount.toString().replace(/,/g, '') };
    try {
      if (isEditing) await api.put(`/sips/${editingId}`, payload);
      else await api.post('/sips', payload);
      toast.success("✅ Success"); setIsEditing(false); setClientName(''); setFormData(initialState); fetchInitialData();
    } catch (e) { toast.error("Error saving"); }
  };

  // 💡 NEW: Selection Handlers
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredSips.length) setSelectedIds([]);
    else setSelectedIds(filteredSips.map(s => s.id));
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedIds.length} selected SIPs permanently?`)) {
      try {
        await api.post('/sips/bulk-delete', { ids: selectedIds });
        toast.success("🗑️ Selected SIPs Deleted");
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

  const filteredSips = sips.filter(s => s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="container">
      <h1 className="title">SIP Tracker</h1>
      
      {/* FORM SECTION */}
      <div className="card" style={{ marginBottom: '30px', padding: '25px', borderTop: isEditing ? '4px solid #f59e0b' : '4px solid #3b82f6' }}>
        <form onSubmit={handleSubmit}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Client ID</label>
              <input style={{width:'100%', padding:'8px'}} value={formData.client_code_input} onChange={(e)=> {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
              }} required /></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Scheme</label>
              <select style={{width:'100%', padding:'8px'}} value={formData.scheme_id} onChange={e=>setFormData({...formData, scheme_id:e.target.value})} required>
                <option value="">Select...</option>{schemes.map(s=><option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Amount</label>
              <input style={{width:'100%', padding:'8px'}} value={formData.amount} onChange={e=>setFormData({...formData, amount:e.target.value})} required /></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Start Date</label>
              <input type="date" style={{width:'100%', padding:'8px'}} value={formData.start_date} onChange={e=>setFormData({...formData, start_date:e.target.value})} required /></div>
           </div>
           <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
             <button type="submit" style={{padding:'10px 30px', background: isEditing ? '#f59e0b' : '#3b82f6', color:'#fff', border:'none', borderRadius:'4px', fontWeight:'bold'}}>{isEditing ? "Update Mandate" : "Add SIP"}</button>
             {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData(initialState); setClientName(''); }} style={{padding:'10px 20px', background:'white', border:'1px solid #ccc', borderRadius:'4px'}}>Cancel</button>}
           </div>
        </form>
      </div>

      {/* SEARCH AND BULK ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <input type="text" placeholder="🔍 Search Client Name..." style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', width: '300px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        {selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{background:'#f8fafc', borderBottom: '2px solid #eee'}}>
                <th style={{padding:'10px', textAlign:'left'}}><input type="checkbox" checked={selectedIds.length === filteredSips.length && filteredSips.length > 0} onChange={toggleAll} /></th>
                <th style={{padding:'10px', textAlign:'left'}}>SID</th>
                <th style={{padding:'10px', textAlign:'left'}}>Client</th>
                <th style={{padding:'10px', textAlign:'right'}}>Amount</th>
                <th style={{padding:'10px', textAlign:'center'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSips.map(s => (
              <tr key={s.id} style={{borderBottom:'1px solid #eee', background: selectedIds.includes(s.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent'}}>
                <td style={{ padding: '10px' }}><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#3b82f6' }}>{s.sip_id}</td>
                <td style={{ padding: '10px' }}>
                  <div>{s.client_name}</div>
                  <small style={{color:'#64748b'}}>{s.scheme_name}</small>
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>₹{formatINR(s.amount)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={() => { setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{color:'#64748b', border:'none', background:'none', cursor:'pointer', fontSize:'11px', fontWeight:'bold'}}>VIEW</button>
                        <button onClick={() => { setIsEditing(true); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{color:'#3b82f6', border:'none', background:'none', cursor:'pointer', fontSize:'11px', fontWeight:'bold'}}>EDIT</button>
                        <button onClick={() => handleDelete(s.id)} style={{color:'#ef4444', border:'none', background:'none', cursor:'pointer', fontSize:'11px', fontWeight:'bold'}}>DELETE</button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sips;
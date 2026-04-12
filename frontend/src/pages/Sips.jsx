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
  };

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
        // 💡 Payload cleaning: Ensure we only send an array of clean IDs
        await api.post('/sips/bulk-delete', { ids: selectedIds });
        toast.success("🗑️ Bulk Deleted");
        fetchInitialData();
      } catch (e) { 
        console.error("Bulk Delete Error:", e);
        toast.error("Bulk Delete Failed: " + (e.response?.data?.error || "Check Server")); 
      }
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

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="title">SIP Tracker</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ border: '2px solid #10b981', padding: '10px 20px', borderRadius: '10px', background: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>Monthly SIP Book</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>₹{formatINR(sips.filter(s => s.status === 'Active').reduce((sum, s) => sum + parseFloat(s.amount || 0), 0))}</div>
          </div>
          <div style={{ border: '2px solid #3b82f6', padding: '10px 20px', borderRadius: '10px', background: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 'bold' }}>TOTAL SIP AUM</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>₹{formatINR(sips.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0))}</div>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: '30px', padding: '25px', borderTop: isEditing ? '4px solid #f59e0b' : isViewing ? '4px solid #64748b' : '4px solid #3b82f6' }}>
        <form onSubmit={handleSubmit}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>SID</label><input style={{width:'100%', padding:'8px', background:'#f8fafc'}} value={formData.sip_id} readOnly /></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Client ID *</label>
              <input style={{width:'100%', padding:'8px'}} value={formData.client_code_input} readOnly={isViewing} placeholder="e.g. C001" onChange={(e)=> {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
              }} required /></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Client Name</label><input style={{width:'100%', padding:'8px', background: '#f1f5f9'}} value={clientName} readOnly /></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>MF Scheme Name *</label>
              <select style={{width:'100%', padding:'8px'}} value={formData.scheme_id} disabled={isViewing} onChange={e=>setFormData({...formData, scheme_id:e.target.value})} required>
                <option value="">Select Scheme...</option>{schemes.map(s=><option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>SIP Amount (₹) *</label><input style={{width:'100%', padding:'8px'}} value={formData.amount} readOnly={isViewing} onChange={e=>setFormData({...formData, amount:e.target.value})} required /></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Frequency</label>
              <select style={{width:'100%', padding:'8px'}} value={formData.frequency} disabled={isViewing} onChange={e=>setFormData({...formData, frequency:e.target.value})}>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>SIP Day</label><select style={{width:'100%', padding:'8px'}} value={formData.sip_day} disabled={isViewing} onChange={e=>setFormData({...formData, sip_day:e.target.value})}>
                {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Status</label>
              <select style={{width:'100%', padding:'8px'}} value={formData.status} disabled={isViewing} onChange={e=>setFormData({...formData, status:e.target.value})}>
                <option>Active</option><option>Paused</option><option>Stopped</option>
              </select></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Start Date</label><input type="date" style={{width:'100%', padding:'8px'}} value={formData.start_date} readOnly={isViewing} onChange={e=>setFormData({...formData, start_date:e.target.value})} required /></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>End Date</label><input type="date" style={{width:'100%', padding:'8px'}} value={formData.end_date} readOnly={isViewing} onChange={e=>setFormData({...formData, end_date:e.target.value})} /></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Platform</label><select style={{width:'100%', padding:'8px'}} value={formData.platform} disabled={isViewing} onChange={e=>setFormData({...formData, platform:e.target.value})}><option>NSE</option><option>BSE</option></select></div>
           </div>
           <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
             <button type="submit" style={{padding:'10px 40px', background: isEditing ? '#f59e0b' : isViewing ? '#64748b' : '#3b82f6', color:'#fff', border:'none', borderRadius:'6px', fontWeight:'bold', cursor: 'pointer'}}>
               {isEditing ? "Update" : isViewing ? "Close View" : "Add SIP"}
             </button>
             {(isEditing || isViewing) && <button type="button" onClick={() => { setIsEditing(false); setIsViewing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} style={{padding:'10px 20px', background:'white', border:'1px solid #ccc', borderRadius:'6px'}}>Cancel</button>}
           </div>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <input type="text" placeholder="🔍 Filter SIPs..." style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', width: '350px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        {selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{background:'#f8fafc', borderBottom: '2px solid #eee'}}>
                <th style={{padding:'12px', textAlign:'left'}}><input type="checkbox" checked={selectedIds.length === filteredSips.length && filteredSips.length > 0} onChange={toggleAll} /></th>
                <th style={{padding:'12px', textAlign:'left'}}>SID</th>
                <th style={{padding:'12px', textAlign:'left'}}>Client</th>
                <th style={{padding:'12px', textAlign:'left'}}>Scheme</th>
                <th style={{padding:'12px', textAlign:'center'}}>Status</th>
                <th style={{padding:'12px', textAlign:'right'}}>Amount</th>
                <th style={{padding:'12px', textAlign:'right'}}>AUM</th>
                <th style={{padding:'12px', textAlign:'center'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSips.map(s => (
              <tr key={s.id} style={{borderBottom:'1px solid #eee', background: selectedIds.includes(s.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent'}}>
                <td style={{ padding: '12px' }}><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                <td style={{ padding: '12px', color: '#3b82f6', fontWeight: 'bold' }}>{s.sip_id}</td>
                <td style={{ padding: '12px' }}>{s.client_code} - {s.client_name}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{fontWeight:'bold'}}>{s.scheme_name}</div>
                  <div style={{fontSize:'10px', color:'#64748b'}}>{s.platform} • {s.frequency}</div>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', background: s.status === 'Active' ? '#dcfce7' : '#fee2e2', color: s.status === 'Active' ? '#15803d' : '#991b1b' }}>{s.status}</span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>₹{formatINR(s.amount)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>₹{formatINR(s.amount)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => { setIsViewing(true); setIsEditing(false); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{color:'#64748b', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>View</button>
                        <button onClick={() => { setIsEditing(true); setIsViewing(false); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{color:'#3b82f6', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>Edit</button>
                        <button onClick={() => handleDelete(s.id)} style={{color:'#ef4444', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>Delete</button>
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
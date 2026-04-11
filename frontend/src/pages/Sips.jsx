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
      const [cRes, sRes, sipRes] = await Promise.all([api.get('/clients'), api.get('/mf-schemes'), api.get('/sips')]);
      setClients(cRes.data || []); 
      setSchemes(sRes.data || []); 
      setSips(sipRes.data || []);
      
      if (!isEditing && sipRes.data.length > 0) {
        const highestID = Math.max(...sipRes.data.map(s => parseInt(s.sip_id?.replace(/\D/g, '') || 0)));
        setFormData(prev => ({ ...prev, sip_id: `SID${(highestID + 1).toString().padStart(5, '0')}` }));
      }
    } catch (err) { toast.error("Sync Error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, amount: formData.amount.toString().replace(/,/g, '') };
    try {
      if (isEditing) await api.put(`/sips/${editingId}`, payload);
      else await api.post(`/sips`, payload);
      
      toast.success("✅ SIP Mandate Saved");
      setIsEditing(false); 
      setFormData(initialState); 
      setClientName(''); 
      fetchInitialData();
    } catch (err) { toast.error("Error saving SIP"); }
  };

  // 🗑️ DELETE FUNCTION
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this SIP mandate?")) {
      try {
        await api.delete(`/sips/${id}`);
        toast.success("🗑️ SIP Deleted");
        fetchInitialData();
      } catch (err) {
        toast.error("Error deleting SIP record");
      }
    }
  };

  const filteredSips = sips.filter(s => 
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sip_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <h1 className="title">SIP Tracker</h1>
      
      {/* FORM SECTION */}
      <div className="card" style={{ marginBottom: '30px', padding: '25px', borderTop: isEditing ? '4px solid #f59e0b' : '4px solid #3b82f6' }}>
        <form onSubmit={handleSubmit}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Client ID</label><input style={{width:'100%', padding:'8px'}} value={formData.client_code_input} onChange={(e)=> {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
              }} required /></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Scheme</label><select style={{width:'100%', padding:'8px'}} value={formData.scheme_id} onChange={e=>setFormData({...formData, scheme_id:e.target.value})} required>
                <option value="">Select...</option>{schemes.map(s=><option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Amount</label><input style={{width:'100%', padding:'8px'}} value={formData.amount} onChange={e=>setFormData({...formData, amount:e.target.value})} required /></div>
              <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Start Date</label><input type="date" style={{width:'100%', padding:'8px'}} value={formData.start_date} onChange={e=>setFormData({...formData, start_date:e.target.value})} required /></div>
           </div>
           
           <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 30px', background: isEditing ? '#f59e0b' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {isEditing ? "Update Mandate" : "Add SIP"}
                </button>
                {isEditing && (
                    <button type="button" onClick={() => { setIsEditing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} style={{ padding: '10px 20px', background: 'white', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                        Cancel
                    </button>
                )}
           </div>
        </form>
      </div>

      {/* SEARCH SECTION */}
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '16px' }}>🔍</span>
        <input type="text" placeholder="Filter by SID or Client Name..." style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* TABLE SECTION */}
      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{background:'#f8fafc', borderBottom: '2px solid #eee'}}>
                <th style={{padding:'10px', textAlign:'left'}}>SID</th>
                <th style={{padding:'10px', textAlign:'left'}}>Client</th>
                <th style={{padding:'10px', textAlign:'center'}}>Start Date</th>
                <th style={{padding:'10px', textAlign:'right'}}>Amount</th>
                <th style={{padding:'10px', textAlign:'center'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSips.map(s => (
              <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#3b82f6' }}>{s.sip_id}</td>
                <td style={{ padding: '10px' }}>{s.client_name}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>{s.start_date}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>₹{formatINR(s.amount)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => { setIsEditing(true); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo(0,0); }} style={{color:'#3b82f6', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>Edit</button>
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
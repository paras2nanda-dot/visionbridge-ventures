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
      const [c, s, sip] = await Promise.all([api.get('/clients'), api.get('/mf-schemes'), api.get('/sips')]);
      setClients(c.data); setSchemes(s.data); setSips(sip.data);
      if (!isEditing && sip.data.length > 0) {
        const high = Math.max(...sip.data.map(i => parseInt(i.sip_id?.replace(/\D/g, '') || 0)));
        setFormData(p => ({ ...p, sip_id: `SID${(high + 1).toString().padStart(5, '0')}` }));
      }
    } catch (e) { toast.error("Sync Error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) await api.put(`/sips/${editingId}`, formData);
      else await api.post('/sips', formData);
      toast.success("✅ SIP Saved"); setIsEditing(false); fetchInitialData();
    } catch (e) { toast.error("Error saving"); }
  };

  return (
    <div className="container">
      <h1 className="title">SIP Tracker</h1>
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
           <button type="submit" style={{marginTop:'15px', padding:'10px 30px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:'4px', fontWeight:'bold'}}>{isEditing ? "Update" : "Add SIP"}</button>
        </form>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead><tr style={{background:'#f8fafc'}}><th style={{padding:'10px'}}>SID</th><th style={{padding:'10px'}}>Client</th><th style={{padding:'10px'}}>Start Date</th><th style={{padding:'10px'}}>Amount</th><th style={{padding:'10px'}}>Action</th></tr></thead>
          <tbody>
            {sips.filter(s => s.client_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
              <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{s.sip_id}</td>
                <td style={{ padding: '10px' }}>{s.client_name}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>{s.start_date}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>₹{formatINR(s.amount)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}><button onClick={() => { setIsEditing(true); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo(0,0); }} style={{color:'#3b82f6', border:'none', background:'none', cursor:'pointer'}}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sips;
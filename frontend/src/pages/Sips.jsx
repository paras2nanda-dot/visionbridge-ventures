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
      setClients(cRes.data); setSchemes(sRes.data); setSips(sipRes.data);
      if (!isEditing && sipRes.data.length > 0) {
        const highestID = Math.max(...sipRes.data.map(s => parseInt(s.sip_id?.replace(/\D/g, '') || 0)));
        setFormData(prev => ({ ...prev, sip_id: `SID${(highestID + 1).toString().padStart(5, '0')}` }));
      }
    } catch (err) { toast.error("Data Sync Error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, amount: formData.amount.toString().replace(/,/g, '') };
    try {
      if (isEditing) await api.put(`/sips/${editingId}`, payload);
      else await api.post(`/sips`, payload);
      toast.success("Saved Successfully");
      setIsEditing(false); setFormData(initialState); setClientName(''); fetchInitialData();
    } catch (err) { toast.error("Error saving"); }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="title">SIP Tracker</h1>
        <div style={{ background: 'var(--bg-card)', border: '2px solid #10b981', padding: '12px 25px', borderRadius: '12px' }}>
             <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>Monthly SIP Book</span>
             <h2 style={{ margin: 0 }}>₹{formatINR(sips.filter(s => s.status === 'Active').reduce((sum, s) => sum + parseFloat(s.amount || 0), 0))}</h2>
        </div>
      </div>

      {/* FORM SECTION (Keeping your standard design) */}
      <div className="card" style={{ marginBottom: '30px', padding: '25px', borderTop: isEditing ? '4px solid #f59e0b' : '4px solid #3b82f6' }}>
        <form onSubmit={handleSubmit}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div><label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'12px'}}>Client ID</label><input style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid var(--border)'}} value={formData.client_code_input} onChange={(e)=> {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
              }} required /></div>
              <div><label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'12px'}}>Scheme</label><select style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid var(--border)'}} value={formData.scheme_id} onChange={e=>setFormData({...formData, scheme_id:e.target.value})} required>
                <option value="">Select Scheme...</option>{schemes.map(s=><option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select></div>
              <div><label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'12px'}}>Amount</label><input style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid var(--border)'}} value={formData.amount} onChange={e=>setFormData({...formData, amount:e.target.value})} required /></div>
              <div><label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'12px'}}>Start Date</label><input type="date" style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid var(--border)'}} value={formData.start_date} onChange={e=>setFormData({...formData, start_date:e.target.value})} required /></div>
           </div>
           <button type="submit" style={{marginTop:'20px', padding:'12px 30px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>{isEditing ? "Update Mandate" : "Add New SIP"}</button>
        </form>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{background:'var(--bg-main)', borderBottom: '2px solid var(--border)'}}>
              <th style={{padding:'15px', textAlign:'left'}}>SID</th>
              <th style={{padding:'15px', textAlign:'left'}}>Client / Scheme</th>
              <th style={{padding:'15px', textAlign:'center'}}>Start Date</th>
              <th style={{padding:'15px', textAlign:'center'}}>End Date</th>
              <th style={{padding:'15px', textAlign:'right'}}>Amount</th>
              <th style={{padding:'15px', textAlign:'center'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sips.filter(s => s.client_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
              <tr key={s.id} style={{borderBottom:'1px solid var(--border)'}}>
                <td style={{ padding: '15px', fontWeight: 'bold', color: '#3b82f6' }}>{s.sip_id}</td>
                <td style={{ padding: '15px' }}>
                  <div style={{fontWeight:'bold'}}>{s.client_name}</div>
                  <div style={{fontSize:'11px', color:'var(--text-muted)'}}>{s.scheme_name}</div>
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>{s.start_date || '-'}</td>
                <td style={{ padding: '15px', textAlign: 'center' }}>{s.end_date || 'Active'}</td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>₹{formatINR(s.amount)}</td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <button onClick={() => { setIsEditing(true); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo(0,0); }} style={{color:'#3b82f6', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>EDIT</button>
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
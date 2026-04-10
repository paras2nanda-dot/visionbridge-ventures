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
    sip_id: '',
    client_code_input: '',
    client_id: '',
    scheme_id: '',
    amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    frequency: 'MONTHLY',
    sip_day: '1',
    status: 'Active',
    platform: 'NSE',
    notes: ''
  };

  const [formData, setFormData] = useState(initialState);

  const formatINR = (val) => {
    if (!val) return "";
    let num = val.toString().replace(/,/g, '');
    return new Intl.NumberFormat('en-IN').format(num);
  };

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      const [cRes, sRes, sipRes] = await Promise.all([
        api.get('/clients'),
        api.get('/mf-schemes'),
        api.get('/sips')
      ]);
      
      const cData = cRes.data;
      const sData = sRes.data;
      const sipData = sipRes.data;

      setClients(Array.isArray(cData) ? cData : []);
      setSchemes(Array.isArray(sData) ? sData : []);
      const validSips = Array.isArray(sipData) ? sipData : [];
      setSips(validSips);

      if (!isEditing) {
        let nextNum = 1;
        if (validSips.length > 0) {
          const highestID = Math.max(...validSips.map(s => parseInt(s.sip_id?.replace(/\D/g, '') || 0, 10)));
          nextNum = highestID + 1;
        }
        setFormData(prev => ({ ...prev, sip_id: `SID${nextNum.toString().padStart(5, '0')}` }));
      }
    } catch (err) { 
      console.error(err);
      toast.error("Failed to fetch SIP data from server");
    }
  };

  const calculateSIPData = (sip) => {
    if (!sip.start_date || !sip.amount) return { aum: 0, count: 0 };
    const start = new Date(sip.start_date);
    const end = sip.status === 'Active' ? new Date() : new Date(sip.end_date || sip.stopped_at || new Date());
    if (start > end) return { aum: 0, count: 0 };

    let count = 0;
    if (sip.frequency === 'MONTHLY') {
      const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      count = monthDiff + (end.getDate() >= parseInt(sip.sip_day || 1) ? 1 : 0);
    } else {
      const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
      count = Math.floor(daysDiff / 7) + 1;
    }
    const finalCount = Math.max(0, count);
    return { aum: finalCount * parseFloat(sip.amount), count: finalCount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_id || !formData.scheme_id) {
      return toast.warn("⚠️ Please validate Client and Scheme.");
    }
    
    const payload = { 
      ...formData, 
      amount: formData.amount.toString().replace(/,/g, ''), 
      is_active: formData.status === 'Active',
      stopped_at: formData.status === 'Stopped' ? formData.end_date : null 
    };

    const url = isEditing ? `/sips/${editingId}` : `/sips`;

    try {
      if (isEditing) {
        await api.put(url, payload);
        toast.success("✅ SIP Updated Successfully");
      } else {
        await api.post(url, payload);
        toast.success("✅ New SIP Saved");
      }
      
      setIsEditing(false); 
      setFormData(initialState); 
      setClientName(''); 
      fetchInitialData();
      
    } catch (err) { 
      toast.error(err.response?.data?.error || "❌ Error saving SIP");
    }
  };

  const filteredSips = sips.filter(s => 
    s.sip_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.client_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const monthlyBookValue = sips.filter(s => s.status === 'Active' && s.frequency === 'MONTHLY').reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
  const totalAumValue = sips.reduce((sum, s) => sum + calculateSIPData(s).aum, 0);

  // Theme-ready styles
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '800', fontSize: '12px', color: 'var(--text-muted)' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none', fontSize: '13px', background: 'var(--bg-card)', color: 'var(--text-main)' };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="title" style={{ margin: 0, color: 'var(--text-main)' }}>SIP Tracker</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: 'var(--bg-card)', border: '2px solid #10b981', padding: '12px 20px', borderRadius: '10px' }}>
             <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>Monthly SIP Book</span>
             <h2 style={{ margin: 0, color: 'var(--text-main)' }}>₹{formatINR(monthlyBookValue)}</h2>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '2px solid #3b82f6', padding: '12px 20px', borderRadius: '10px' }}>
             <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>TOTAL SIP AUM</span>
             <h2 style={{ margin: 0, color: 'var(--text-main)' }}>₹{formatINR(totalAumValue)}</h2>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderTop: isEditing ? '4px solid #f59e0b' : '4px solid #3b82f6', marginBottom: '30px', background: 'var(--bg-card)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div><label style={labelStyle}>SID</label><input style={{...inputStyle, background: 'var(--bg-main)', fontWeight:'bold'}} value={formData.sip_id} readOnly /></div>
            <div>
              <label style={labelStyle}>Client ID *</label>
              <input style={inputStyle} value={formData.client_code_input} onChange={(e) => {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
              }} required />
            </div>
            <div><label style={labelStyle}>Client Name</label><input style={{...inputStyle, background: 'var(--bg-main)'}} value={clientName} readOnly /></div>
            <div>
              <label style={labelStyle}>MF Scheme Name *</label>
              <select style={inputStyle} value={formData.scheme_id} onChange={e => setFormData({...formData, scheme_id: e.target.value})} required>
                <option value="">Select Scheme...</option>
                {schemes.map(s => <option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select>
            </div>

            <div><label style={labelStyle}>SIP Amount (₹) *</label><input style={inputStyle} value={formatINR(formData.amount)} onChange={e => setFormData({...formData, amount: e.target.value.replace(/,/g, '')})} required /></div>
            <div>
              <label style={labelStyle}>Frequency</label>
              <select style={inputStyle} value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}>
                <option value="MONTHLY">Monthly</option><option value="WEEKLY">Weekly</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>SIP Day</label>
              <select style={inputStyle} value={formData.sip_day} onChange={e => setFormData({...formData, sip_day: e.target.value})}>
                {formData.frequency === 'MONTHLY' 
                  ? [...Array(31)].map((_, i) => <option key={i+1}>{i+1}</option>)
                  : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d}>{d}</option>)
                }
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option>Active</option><option>Stopped</option>
              </select>
            </div>

            <div><label style={labelStyle}>Start Date</label><input style={inputStyle} type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required /></div>
            
            {/* 💡 FIXED: End Date is now editable regardless of status, but visually cued */}
            <div>
              <label style={labelStyle}>End Date</label>
              <input 
                style={inputStyle} 
                type="date" 
                value={formData.end_date} 
                onChange={e => setFormData({...formData, end_date: e.target.value})} 
              />
            </div>
            
            <div>
                <label style={labelStyle}>Platform</label>
                <select style={inputStyle} value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                    <option>NSE</option><option>BSE</option><option>Cams</option><option>Kfin</option><option>Other</option>
                </select>
            </div>
            <div><label style={labelStyle}>Notes</label><input style={inputStyle} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ padding: '12px 40px', background: isEditing ? '#f59e0b' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{isEditing ? "Update" : "Add SIP"}</button>
            {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} style={{ padding: '12px 20px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <span style={{ fontSize: '16px' }}>🔍</span>
        <input type="text" placeholder="Filter SIPs by SID, Client ID, or Client Name..." style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px', background: 'transparent', color: 'var(--text-main)' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ background: 'var(--bg-main)' }}>
            <tr><th style={{padding:'12px', textAlign:'left', color: 'var(--text-muted)'}}>SID</th><th style={{padding:'12px', textAlign:'left', color: 'var(--text-muted)'}}>Client</th><th style={{padding:'12px', textAlign:'left', color: 'var(--text-muted)'}}>Scheme</th><th style={{padding:'12px', textAlign:'center', color: 'var(--text-muted)'}}>Status</th><th style={{padding:'12px', textAlign:'right', color: 'var(--text-muted)'}}>Amount</th><th style={{padding:'12px', textAlign:'right', color: 'var(--text-muted)'}}>AUM</th><th style={{padding:'12px', textAlign:'center', color: 'var(--text-muted)'}}>Action</th></tr>
          </thead>
          <tbody>
            {filteredSips.map(s => {
              const d = calculateSIPData(s);
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#3b82f6' }}>{s.sip_id}</td>
                  <td style={{ padding: '12px', color: 'var(--text-main)' }}>{s.client_code} - {s.client_name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-main)' }}>{s.scheme_name} <br/><small style={{color:'var(--text-muted)'}}>{s.platform} • {s.frequency === 'MONTHLY' ? 'Monthly' : 'Weekly'}</small></td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: s.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: s.status === 'Active' ? '#10b981' : '#ef4444' }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)' }}>₹{formatINR(s.amount)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>₹{formatINR(d.aum)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => { setIsEditing(true); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo(0,0); }} style={{color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sips;
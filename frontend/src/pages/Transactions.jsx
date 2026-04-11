import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [clientName, setClientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialState = {
    transaction_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    client_code_input: '',
    client_id: '',
    scheme_id: '', 
    switch_in_scheme_id: '', 
    transaction_type: 'Purchase',
    amount: '',
    platform: 'NSE', 
    notes: ''
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        api.get('/clients'),
        api.get('/mf-schemes'),
        api.get('/transactions')
      ]);
      setClients(cRes.data || []);
      setSchemes(sRes.data || []);
      setTransactions(tRes.data || []);

      if (!isEditing) {
        const highestTID = tRes.data.length > 0 ? Math.max(...tRes.data.map(t => parseInt(t.transaction_id?.replace(/\D/g, '') || 0))) : 0;
        setFormData(prev => ({ ...prev, transaction_id: `TID${(highestTID + 1).toString().padStart(5, '0')}` }));
      }
    } catch (err) { toast.error("Sync Error"); }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(val.toString().replace(/,/g, ""));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_id || !formData.scheme_id) return toast.warn("⚠️ Validate Client and Scheme.");
    
    const cleanAmount = formData.amount.toString().replace(/,/g, '');

    const url = isEditing ? `/transactions/${editingId}` : `/transactions`;
    try {
      if (isEditing) await api.put(url, {...formData, amount: cleanAmount});
      else await api.post(url, {...formData, amount: cleanAmount});
      toast.success("✅ Saved Successfully");
      setIsEditing(false); setClientName(''); setFormData(initialState); fetchInitialData();
    } catch (err) { toast.error("Save Error: " + (err.response?.data?.error || "Check Connection")); }
  };

  const filteredTransactions = transactions.filter(t => 
    t.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <h1 className="title">Transactions</h1>
      <div className="card" style={{ borderTop: isEditing ? '4px solid #f59e0b' : '4px solid #10b981', marginBottom: '30px', padding: '25px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div><label style={{fontSize:'12px', fontWeight:'bold'}}>TID</label><input style={{width:'100%', padding:'8px', background:'#f8fafc'}} value={formData.transaction_id} readOnly /></div>
            <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Date</label><input style={{width:'100%', padding:'8px'}} type="date" value={formData.transaction_date} onChange={e => setFormData({...formData, transaction_date: e.target.value})} required /></div>
            <div>
              <label style={{fontSize:'12px', fontWeight:'bold'}}>Client ID</label>
              <input style={{width:'100%', padding:'8px'}} value={formData.client_code_input} onChange={e => {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
              }} required />
            </div>
            <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Client Name</label><input style={{width:'100%', padding:'8px', background:'#f1f5f9'}} value={clientName} readOnly /></div>
            
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{fontSize:'12px', fontWeight:'bold'}}>Scheme Name *</label>
              <select style={{width:'100%', padding:'8px'}} value={formData.scheme_id} onChange={e => setFormData({...formData, scheme_id: e.target.value})} required>
                <option value="">Select Scheme...</option>
                {schemes.map(s => <option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select>
            </div>
            
            <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Type</label>
              <select style={{width:'100%', padding:'8px'}} value={formData.transaction_type} onChange={e => setFormData({...formData, transaction_type: e.target.value})}>
                <option>Purchase</option><option>Redemption</option><option>Switch</option>
              </select>
            </div>
            <div><label style={{fontSize:'12px', fontWeight:'bold'}}>Amount (₹)</label><input style={{width:'100%', padding:'8px'}} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required /></div>
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ padding: '12px 40px', background: isEditing ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isEditing ? "Update" : "Save"}
            </button>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} style={{ padding: '12px 20px', background: 'white', border:'1px solid #ccc', borderRadius:'6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              <th style={{padding:'10px', textAlign:'left'}}>TID</th>
              <th style={{padding:'10px', textAlign:'left'}}>Client</th>
              <th style={{padding:'10px', textAlign:'left'}}>Scheme</th>
              <th style={{padding:'10px', textAlign:'right'}}>Amount</th>
              <th style={{padding:'10px', textAlign:'center'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px' }}>{t.transaction_id}</td>
                <td style={{ padding: '10px' }}>{t.client_code} - {t.client_name}</td>
                <td style={{ padding: '10px' }}>{t.scheme_name}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>₹{formatINR(t.amount)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button onClick={() => { 
                    setIsEditing(true); 
                    setEditingId(t.id); 
                    // 💡 THE FIX: Formatting the date string so the input box can read it
                    setFormData({
                      ...t, 
                      client_code_input: t.client_code, 
                      transaction_date: t.transaction_date?.split('T')[0] 
                    }); 
                    setClientName(t.client_name); 
                    window.scrollTo(0,0); 
                  }} style={{color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
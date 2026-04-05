import React, { useState, useEffect } from 'react';

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
      const token = sessionStorage.getItem("token"); // 💡 Get Token
      const headers = { 'Authorization': `Bearer ${token}` }; // 💡 Auth Header

      const [cRes, sRes, tRes] = await Promise.all([
        fetch('http://localhost:3000/api/clients', { headers }),
        fetch('http://localhost:3000/api/mf-schemes', { headers }),
        fetch('http://localhost:3000/api/transactions', { headers })
      ]);
      const cData = await cRes.json();
      const sData = await sRes.json();
      const tData = await tRes.json();

      setClients(Array.isArray(cData) ? cData : []);
      setSchemes(Array.isArray(sData) ? sData : []);
      const validTData = Array.isArray(tData) ? tData : [];
      setTransactions(validTData);

      if (!isEditing) {
        let nextNum = 1;
        if (validTData.length > 0) {
          const highestTID = Math.max(...validTData.map(t => {
             const num = parseInt(t.transaction_id?.replace(/\D/g, ''), 10);
             return isNaN(num) ? 0 : num;
          }));
          nextNum = highestTID + 1;
        }
        setFormData(prev => ({ ...prev, transaction_id: `TID${nextNum.toString().padStart(5, '0')}` }));
      }
    } catch (err) { console.error(err); }
  };

  const formatINR = (val) => {
    if (!val) return "";
    return new Intl.NumberFormat('en-IN').format(val.toString().replace(/,/g, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_id || !formData.scheme_id) return alert("⚠️ Please validate Client and Scheme.");
    
    const cleanAmount = formData.amount.toString().replace(/,/g, '');
    const token = sessionStorage.getItem("token"); // 💡 Get Token
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // 💡 Auth Header
    };

    if (formData.transaction_type === 'Switch') {
      if (!formData.switch_in_scheme_id) return alert("⚠️ Please select the 'Switch In' Scheme.");

      try {
        const outPayload = { 
            ...formData, 
            transaction_id: `${formData.transaction_id}-OUT`,
            transaction_type: 'Switch Out', 
            amount: cleanAmount 
        };
        const inPayload = { 
            ...formData, 
            transaction_id: `${formData.transaction_id}-IN`,
            scheme_id: formData.switch_in_scheme_id, 
            transaction_type: 'Switch In', 
            amount: cleanAmount 
        };

        const resOut = await fetch('http://localhost:3000/api/transactions', {
          method: 'POST', headers, body: JSON.stringify(outPayload)
        });
        const resIn = await fetch('http://localhost:3000/api/transactions', {
          method: 'POST', headers, body: JSON.stringify(inPayload)
        });

        if (resOut.ok && resIn.ok) {
          alert("✅ Switch Transaction Completed (Two entries created)");
          setFormData(initialState); fetchInitialData();
        }
      } catch (err) { alert("❌ Error during Switch"); }

    } else {
      const url = isEditing ? `http://localhost:3000/api/transactions/${editingId}` : `http://localhost:3000/api/transactions`;
      try {
        const res = await fetch(url, {
          method: isEditing ? 'PUT' : 'POST',
          headers,
          body: JSON.stringify({...formData, amount: cleanAmount})
        });
        if (res.ok) {
          alert("✅ Transaction Saved");
          setIsEditing(false); setEditingId(null); setClientName(''); setFormData(initialState);
          fetchInitialData();
        }
      } catch (err) { alert("❌ Network Error"); }
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.client_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '12px', color: '#475569' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px' };

  return (
    <div className="container">
      <h1 className="title">Transactions</h1>

      <div className="card" style={{ borderTop: isEditing ? '4px solid #f59e0b' : '4px solid #10b981', marginBottom: '30px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div><label style={labelStyle}>TID</label><input style={{...inputStyle, background: '#f8fafc', fontWeight:'bold'}} value={formData.transaction_id} readOnly /></div>
            <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={formData.transaction_date} onChange={e => setFormData({...formData, transaction_date: e.target.value})} required /></div>
            <div>
              <label style={labelStyle}>Client ID</label>
              <input style={inputStyle} value={formData.client_code_input} onChange={e => {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
              }} required />
            </div>
            <div><label style={labelStyle}>Client Name</label><input style={{...inputStyle, background: '#f1f5f9'}} value={clientName} readOnly /></div>
            
            <div style={{ gridColumn: formData.transaction_type === 'Switch' ? 'span 1' : 'span 2' }}>
              <label style={labelStyle}>{formData.transaction_type === 'Switch' ? 'Switch Out Scheme *' : 'MF Scheme Name *'}</label>
              <select style={inputStyle} value={formData.scheme_id} onChange={e => setFormData({...formData, scheme_id: e.target.value})} required>
                <option value="">Select Scheme...</option>
                {schemes.map(s => <option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select>
            </div>

            {formData.transaction_type === 'Switch' && (
                <div style={{ gridColumn: 'span 1' }}>
                    <label style={{...labelStyle, color: '#10b981'}}>Switch In Scheme *</label>
                    <select style={{...inputStyle, border: '1px solid #10b981'}} value={formData.switch_in_scheme_id} onChange={e => setFormData({...formData, switch_in_scheme_id: e.target.value})} required>
                        <option value="">Select In-Scheme...</option>
                        {schemes.map(s => <option key={s.id} value={s.id}>{s.scheme_name}</option>)}
                    </select>
                </div>
            )}

            <div><label style={labelStyle}>Type</label>
              <select style={inputStyle} value={formData.transaction_type} onChange={e => setFormData({...formData, transaction_type: e.target.value})}>
                <option>Purchase</option>
                <option>Redemption</option>
                <option>Switch</option>
              </select>
            </div>
            <div><label style={labelStyle}>Amount (₹)</label><input style={inputStyle} value={formatINR(formData.amount)} onChange={e => setFormData({...formData, amount: e.target.value.replace(/,/g, '')})} required /></div>
            
            <div><label style={labelStyle}>Platform</label>
              <select style={inputStyle} value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                <option>NSE</option><option>BSE</option><option>Cams</option><option>Kfin</option><option>Other</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Notes</label><input style={inputStyle} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Optional notes..." /></div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-primary" style={{ padding: '12px 40px', background: isEditing ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{isEditing ? "Update" : "Add Transaction"}</button>
            {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} style={{ padding: '12px 20px', background: 'white', border:'1px solid #ccc', borderRadius:'6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '16px' }}>🔍</span>
        <input type="text" placeholder="Filter by TID, Client ID, or Client Name..." style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr><th style={{padding:'12px', textAlign:'left'}}>TID</th><th style={{padding:'12px', textAlign:'left'}}>Client</th><th style={{padding:'12px', textAlign:'left'}}>Scheme</th><th style={{padding:'12px', textAlign:'right'}}>Amount</th><th style={{padding:'12px', textAlign:'center'}}>Action</th></tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: t.transaction_type.includes('In') ? '#10b981' : (t.transaction_type.includes('Out') ? '#ef4444' : '#64748b') }}>{t.transaction_id}</td>
                <td style={{ padding: '12px' }}>{t.client_code} - {t.client_name}</td>
                <td style={{ padding: '12px' }}>{t.scheme_name} <br/><small style={{color:'#64748b'}}>{t.platform} • {t.transaction_type}</small></td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>₹{formatINR(t.amount)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                   <button onClick={() => { setIsEditing(true); setEditingId(t.id); setFormData({...t, client_code_input: t.client_code}); setClientName(t.client_name); window.scrollTo(0,0); }} style={{color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>Edit</button>
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
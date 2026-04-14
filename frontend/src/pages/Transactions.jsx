/* eslint-disable no-unused-vars */
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
  const [isViewing, setIsViewing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false); 
  const [selectedIds, setSelectedIds] = useState([]);

  const initialState = {
    transaction_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    client_code_input: '', client_id: '', scheme_id: '', 
    transaction_type: 'Purchase', amount: '', platform: 'NSE', notes: ''
  };

  const [formData, setFormData] = useState(initialState);
  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        api.get('/clients'), api.get('/mf-schemes'), api.get('/transactions')
      ]);
      setClients(cRes.data || []);
      setSchemes(sRes.data || []);
      setTransactions(tRes.data || []);
      setSelectedIds([]);

      if (!isEditing && !isViewing) {
        const highestTID = Math.max(...(tRes.data || []).map(t => parseInt(t.transaction_id?.replace(/\D/g, '') || 0)), 0);
        setFormData(prev => ({ ...prev, transaction_id: `TID${(highestTID + 1).toString().padStart(5, '0')}` }));
      }
    } catch (err) { toast.error("Sync Error"); }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(String(val || 0).replace(/,/g, ""));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewing) return setIsViewing(false);
    if (!formData.client_id || !formData.scheme_id) return toast.warn("⚠️ Validate Client and Scheme.");
    
    setIsSaving(true); 
    const cleanAmount = formData.amount.toString().replace(/,/g, '');
    try {
      if (isEditing) await api.put(`/transactions/${editingId}`, {...formData, amount: cleanAmount});
      else await api.post(`/transactions`, {...formData, amount: cleanAmount});
      toast.success("✅ Saved Successfully");
      setIsEditing(false); setFormData(initialState); setClientName(''); fetchInitialData();
    } catch (err) { toast.error("Save Error"); }
    finally { setIsSaving(false); } 
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredTransactions.length) setSelectedIds([]);
    else setSelectedIds(filteredTransactions.map(t => t.id));
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedIds.length} selected transactions?`)) {
      try {
        await api.post('/transactions/bulk-delete', { ids: selectedIds });
        toast.success("🗑️ Transactions Deleted");
        fetchInitialData();
      } catch (err) { toast.error("Bulk Delete Failed"); }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      try {
        await api.delete(`/transactions/${id}`);
        toast.success("🗑️ Deleted");
        fetchInitialData();
      } catch (err) { toast.error("Delete Error"); }
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.3px' };
  
  /* 🪄 Stripped out explicit borders, background, and color to let index.css take over */
  const inputStyle = { width: '100%', padding: '12px', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease' };

  return (
    <div className="container fade-in">
      <h1 className="title" style={{ color: 'var(--text-main)', fontWeight: '800' }}>Transactions</h1>
      <div className="card" style={{ borderTop: `4px solid ${isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#10b981'}`, marginBottom: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div><label style={labelStyle}>TID</label><input style={inputStyle} value={formData.transaction_id} readOnly /></div>
            <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={formData.transaction_date} readOnly={isViewing} onChange={e => setFormData({...formData, transaction_date: e.target.value})} required /></div>
            <div><label style={labelStyle}>Client ID</label><input style={inputStyle} value={formData.client_code_input} readOnly={isViewing} onChange={e => {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
            }} required /></div>
            <div><label style={labelStyle}>Client Name</label><input style={inputStyle} value={clientName} readOnly /></div>
            <div><label style={labelStyle}>Scheme Name *</label>
              <select style={inputStyle} value={formData.scheme_id} disabled={isViewing} onChange={e => setFormData({...formData, scheme_id: e.target.value})} required>
                <option value="">Select Scheme...</option>{schemes.map(s => <option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select></div>
            <div><label style={labelStyle}>Type</label>
              <select style={inputStyle} value={formData.transaction_type} disabled={isViewing} onChange={e => setFormData({...formData, transaction_type: e.target.value})}>
                <option>Purchase</option><option>Redemption</option><option>Switch In</option><option>Switch Out</option>
              </select></div>
            <div><label style={labelStyle}>Amount (₹)</label><input style={inputStyle} value={formData.amount} readOnly={isViewing} onChange={e => setFormData({...formData, amount: e.target.value})} required /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, height: '60px'}} value={formData.notes} readOnly={isViewing} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="submit" disabled={isSaving} style={{ padding: '12px 40px', background: isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', flex: '1 1 auto', minWidth: '150px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                {isSaving ? (isEditing ? "Updating..." : "Saving Transaction...") : (isEditing ? "Update" : isViewing ? "Close" : "Save")}
            </button>
            {(isEditing || isViewing) && <button type="button" onClick={() => { setIsEditing(false); setIsViewing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-main)', border:'1px solid var(--border)', borderRadius:'8px', cursor: 'pointer', flex: '0 1 auto', fontWeight: 'bold' }}>Cancel</button>}
          </div>
        </form>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
          <input type="text" placeholder="Search transactions..." style={{ ...inputStyle, paddingLeft: '40px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>
        {selectedIds.length > 0 && <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Delete Selected ({selectedIds.length})</button>}
      </div>
      <div className="card" style={{ padding: '0', background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{background: 'rgba(248, 250, 252, 0.5)', borderBottom: '1px solid var(--border)'}}>
                <th style={{padding:'16px'}}><input type="checkbox" checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0} onChange={toggleAll} /></th>
                <th style={{textAlign:'left', padding:'16px', color: 'var(--text-muted)', fontWeight: '700'}}>TID</th>
                <th style={{textAlign:'left', padding:'16px', color: 'var(--text-muted)', fontWeight: '700'}}>DATE</th>
                <th style={{textAlign:'left', padding:'16px', color: 'var(--text-muted)', fontWeight: '700'}}>CLIENT</th>
                <th style={{textAlign:'left', padding:'16px', color: 'var(--text-muted)', fontWeight: '700'}}>SCHEME</th>
                <th style={{textAlign:'center', padding:'16px', color: 'var(--text-muted)', fontWeight: '700'}}>TYPE</th>
                <th style={{textAlign:'right', padding:'16px', color: 'var(--text-muted)', fontWeight: '700'}}>AMOUNT</th>
                <th style={{textAlign:'center', padding:'16px', color: 'var(--text-muted)', fontWeight: '700'}}>ACTION</th>
              </tr>
            </thead>
            <tbody>{filteredTransactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', background: selectedIds.includes(t.id) ? 'rgba(16, 185, 129, 0.04)' : 'transparent', color: 'var(--text-main)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '12px', textAlign:'center' }}><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} /></td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{t.transaction_id}</td>
                  <td style={{ padding: '12px' }}>{t.transaction_date}</td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{t.client_code} - {t.client_name}</td>
                  <td style={{ padding: '12px' }}>{t.scheme_name}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: t.transaction_type.toLowerCase().includes('purchase') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: t.transaction_type.toLowerCase().includes('purchase') ? '#10b981' : '#ef4444' 
                    }}>{t.transaction_type}</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{formatINR(t.amount)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                      <button onClick={() => { setIsViewing(true); setEditingId(t.id); setFormData({...t, client_code_input: t.client_code}); setClientName(t.client_name); window.scrollTo({top:0}); }} style={{color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'11px'}}>VIEW</button>
                      <button onClick={() => { setIsEditing(true); setEditingId(t.id); setFormData({...t, client_code_input: t.client_code}); setClientName(t.client_name); window.scrollTo({top:0}); }} style={{color:'#6366f1', background:'none', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'11px'}}>EDIT</button>
                      <button onClick={() => handleDelete(t.id)} style={{color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'11px'}}>DELETE</button>
                    </div>
                  </td></tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
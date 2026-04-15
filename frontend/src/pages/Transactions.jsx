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
  const [loading, setLoading] = useState(true); // ✅ Fixed missing loading state

  const initialState = {
    transaction_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    client_code_input: '', client_id: '', scheme_id: '', 
    transaction_type: 'Purchase', amount: '', platform: 'NSE', notes: ''
  };

  const [formData, setFormData] = useState(initialState);
  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true); // ✅ Set loading true on start
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
    } catch (err) { 
      toast.error("Sync Error"); 
    } finally {
      setLoading(false); // ✅ Set loading false on completion
    }
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

  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '800', fontSize: '13px', color: 'var(--text-main)', letterSpacing: '0.5px' };
  const inputStyle = { width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', border: '2.5px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '600' };

  return (
    <div className="container fade-in" style={{ paddingBottom: '50px' }}>
      <h1 className="title" style={{ color: 'var(--text-main)', fontWeight: '900', fontSize: '32px', marginBottom: '30px' }}>Transactions</h1>
      
      {/* FORM CARD */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '2.5px solid var(--border)', boxShadow: '6px 6px 0px rgba(0,0,0,0.1)', marginBottom: '40px', position: 'relative' }}>
        
        {/* State Indicator */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#38bdf8', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}></div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div><label style={labelStyle}>TID</label><input style={inputStyle} value={formData.transaction_id} readOnly /></div>
            <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={formData.transaction_date} readOnly={isViewing} onChange={e => setFormData({...formData, transaction_date: e.target.value})} required /></div>
            <div><label style={labelStyle}>Client ID</label><input style={inputStyle} value={formData.client_code_input} readOnly={isViewing} placeholder="e.g. C001" onChange={e => {
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
          
          <div style={{ marginTop: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <button type="submit" disabled={isSaving} style={{ padding: '12px 32px', background: isEditing ? '#f59e0b' : isViewing ? 'var(--text-muted)' : '#38bdf8', color: 'white', border: '2.5px solid #000', borderRadius: '10px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: '900', letterSpacing: '0.5px' }}>
                {isSaving ? (isEditing ? "UPDATING..." : "SAVING TRANSACTION...") : (isEditing ? "UPDATE TRANSACTION" : isViewing ? "CLOSE VIEW" : "SAVE")}
            </button>
            {(isEditing || isViewing) && <button type="button" onClick={() => { setIsEditing(false); setIsViewing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} style={{ padding: '12px 24px', borderRadius: '10px', border: '2.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '900', letterSpacing: '0.5px' }}>CANCEL</button>}
          </div>
        </form>
      </div>

      {/* SEARCH BAR & BULK DELETE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
          <input 
            type="text" 
            placeholder="Search transactions..." 
            style={{ ...inputStyle, paddingLeft: '52px' }} // Applied overlap fix
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7, fontSize: '18px', pointerEvents: 'none' }}>🔍</span>
        </div>
        {selectedIds.length > 0 && <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', border: '2.5px solid #000', padding: '12px 24px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>Delete Selected ({selectedIds.length})</button>}
      </div>

      {/* TRANSACTIONS TABLE */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '2.5px solid var(--border)', overflow: 'hidden', boxShadow: '6px 6px 0px rgba(0,0,0,0.1)' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.03)', borderBottom: '2.5px solid var(--border)' }}>
                <th style={{ padding: '16px', width: '40px' }}><input type="checkbox" checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0} onChange={toggleAll} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /></th>
                <th style={{ textAlign: 'left', padding: '16px', color: 'var(--text-main)', fontWeight: '900' }}>TID</th>
                <th style={{ textAlign: 'left', padding: '16px', color: 'var(--text-main)', fontWeight: '900' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '16px', color: 'var(--text-main)', fontWeight: '900' }}>Client</th>
                <th style={{ textAlign: 'left', padding: '16px', color: 'var(--text-main)', fontWeight: '900' }}>Scheme</th>
                <th style={{ textAlign: 'center', padding: '16px', color: 'var(--text-main)', fontWeight: '900' }}>Type</th>
                <th style={{ textAlign: 'right', padding: '16px', color: 'var(--text-main)', fontWeight: '900' }}>Amount</th>
                <th style={{ textAlign: 'center', padding: '16px', color: 'var(--text-main)', fontWeight: '900' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '2px solid var(--border)', background: selectedIds.includes(t.id) ? 'rgba(56, 189, 248, 0.05)' : 'transparent', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /></td>
                  <td style={{ padding: '16px', fontWeight: '900', color: '#38bdf8' }}>{t.transaction_id}</td>
                  <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-muted)' }}>{new Date(t.transaction_date).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                  <td style={{ padding: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{t.client_code} - {t.client_name}</td>
                  <td style={{ padding: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{t.scheme_name}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: t.transaction_type.toLowerCase().includes('purchase') || t.transaction_type.toLowerCase().includes('in') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: t.transaction_type.toLowerCase().includes('purchase') || t.transaction_type.toLowerCase().includes('in') ? '#10b981' : '#ef4444',
                      border: t.transaction_type.toLowerCase().includes('purchase') || t.transaction_type.toLowerCase().includes('in') ? '1.5px solid rgba(16, 185, 129, 0.3)' : '1.5px solid rgba(239, 68, 68, 0.3)'
                    }}>{t.transaction_type}</span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR(t.amount)}</td>
                  <td style={{ padding: '16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => { setIsViewing(true); setIsEditing(false); setEditingId(t.id); setFormData({...t, client_code_input: t.client_code}); setClientName(t.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ color: 'var(--text-main)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '11px', marginRight: '16px', textTransform: 'uppercase' }}>VIEW</button>
                      <button onClick={() => { setIsEditing(true); setIsViewing(false); setEditingId(t.id); setFormData({...t, client_code_input: t.client_code}); setClientName(t.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '11px', marginRight: '16px', textTransform: 'uppercase' }}>EDIT</button>
                      <button onClick={() => handleDelete(t.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}>DELETE</button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800' }}>No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 
import { Search, Trash2, Edit, Eye, Check, X, PlusCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  const initialState = {
    transaction_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    client_code_input: '', client_id: '', scheme_id: '', 
    transaction_type: 'Purchase', amount: '', platform: 'NSE', notes: ''
  };

  const [formData, setFormData] = useState(initialState);
  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
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
      setLoading(false);
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
    if (selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0) setSelectedIds([]);
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

  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '0.3px' };
  const inputStyle = { width: '100%', padding: '14px 16px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' };

  const thStyle = { 
    color: 'var(--text-muted)', 
    textAlign: 'left', 
    padding: '16px', 
    fontWeight: '700', 
    fontSize: '12px', 
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)'
  };

  return (
    <div className="container fade-in" style={{ paddingBottom: '60px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 🚀 Giant "Transactions" title removed to rely on clean breadcrumbs */}
      
      {/* FORM CARD */}
      <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        
        {/* State Indicator */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#0284c7' }}></div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            <div><label style={labelStyle}>TID</label><input style={{...inputStyle, opacity: 0.7}} value={formData.transaction_id} readOnly /></div>
            <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={formData.transaction_date} readOnly={isViewing} onChange={e => setFormData({...formData, transaction_date: e.target.value})} required /></div>
            <div><label style={labelStyle}>Client ID *</label><input style={inputStyle} value={formData.client_code_input} readOnly={isViewing} placeholder="e.g. C001" onChange={e => {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
            }} required /></div>
            <div><label style={labelStyle}>Client Name</label><input style={{...inputStyle, opacity: 0.7}} value={clientName} readOnly /></div>
            <div><label style={labelStyle}>Scheme Name *</label>
              <select style={inputStyle} value={formData.scheme_id} disabled={isViewing} onChange={e => setFormData({...formData, scheme_id: e.target.value})} required>
                <option value="">Select Scheme...</option>{schemes.map(s => <option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select></div>
            <div><label style={labelStyle}>Type</label>
              <select style={inputStyle} value={formData.transaction_type} disabled={isViewing} onChange={e => setFormData({...formData, transaction_type: e.target.value})}>
                <option>Purchase</option><option>Redemption</option><option>Switch In</option><option>Switch Out</option>
              </select></div>
            <div><label style={labelStyle}>Amount (₹)</label><input style={inputStyle} value={formData.amount} readOnly={isViewing} onChange={e => setFormData({...formData, amount: e.target.value})} required /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, height: '80px', resize: 'vertical'}} value={formData.notes} readOnly={isViewing} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
          </div>
          
          <div style={{ marginTop: '40px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <button 
              type="submit" 
              disabled={isSaving} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', 
                background: isEditing ? '#f59e0b' : isViewing ? 'var(--bg-main)' : '#0284c7', 
                color: isViewing ? 'var(--text-main)' : 'white', 
                border: isViewing ? '1px solid var(--border)' : '1px solid transparent', 
                borderRadius: '10px', cursor: isSaving ? 'not-allowed' : 'pointer', 
                fontWeight: '800', letterSpacing: '0.5px', transition: 'all 0.2s',
                boxShadow: isViewing ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}>
                {isSaving ? (isEditing ? "UPDATING..." : "SAVING TRANSACTION...") : (isEditing ? <><Check size={18}/> UPDATE TRANSACTION</> : isViewing ? "CLOSE VIEW" : <><PlusCircle size={18}/> SAVE TRANSACTION</>)}
            </button>
            {(isEditing || isViewing) && (
              <button 
                type="button" 
                onClick={() => { setIsEditing(false); setIsViewing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', 
                  border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', 
                  cursor: 'pointer', fontWeight: '800', letterSpacing: '0.5px', transition: 'all 0.2s' 
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--bg-main)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <X size={18} /> CANCEL
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 🔍 SEARCH BAR & BULK DELETE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search transactions by TID or Client..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ ...inputStyle, paddingLeft: '44px', borderRadius: '12px' }} 
          />
        </div>
        {selectedIds.length > 0 && (
          <button 
            onClick={handleBulkDelete} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ef4444', color: 'white', border: '1px solid #dc2626', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.2)' }}
          >
            <Trash2 size={18} /> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* TRANSACTIONS TABLE */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)' }}>
                <th style={{ padding: '16px', width: '40px', borderBottom: '1px solid var(--border)' }}><input type="checkbox" checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0} onChange={toggleAll} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0284c7' }} /></th>
                <th style={thStyle}>TID</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Scheme</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Type</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', background: selectedIds.includes(t.id) ? 'rgba(2, 132, 199, 0.04)' : 'transparent', transition: 'background 0.2s' }} onMouseOver={(e) => { if(!selectedIds.includes(t.id)) e.currentTarget.style.background = 'var(--bg-main)'; }} onMouseOut={(e) => { if(!selectedIds.includes(t.id)) e.currentTarget.style.background = 'transparent'; }}>
                  <td style={{ padding: '16px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0284c7' }} /></td>
                  <td style={{ padding: '16px', fontWeight: '800', color: '#0284c7' }}>{t.transaction_id}</td>
                  <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>{new Date(t.transaction_date).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                  <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{t.client_code} - {t.client_name}</td>
                  <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{t.scheme_name}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: t.transaction_type.toLowerCase().includes('purchase') || t.transaction_type.toLowerCase().includes('in') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: t.transaction_type.toLowerCase().includes('purchase') || t.transaction_type.toLowerCase().includes('in') ? '#10b981' : '#ef4444',
                      border: t.transaction_type.toLowerCase().includes('purchase') || t.transaction_type.toLowerCase().includes('in') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>{t.transaction_type}</span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>₹{formatINR(t.amount)}</td>
                  <td style={{ padding: '16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => { setIsViewing(true); setIsEditing(false); setEditingId(t.id); setFormData({...t, client_code_input: t.client_code}); setClientName(t.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'color 0.2s' }} title="View Details" onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <Eye size={18} />
                      </button>
                      <button onClick={() => { setIsEditing(true); setIsViewing(false); setEditingId(t.id); setFormData({...t, client_code_input: t.client_code}); setClientName(t.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'opacity 0.2s' }} title="Edit Transaction" onMouseOver={(e) => e.currentTarget.style.opacity = 0.7} onMouseOut={(e) => e.currentTarget.style.opacity = 1}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'opacity 0.2s' }} title="Delete Transaction" onMouseOver={(e) => e.currentTarget.style.opacity = 0.7} onMouseOut={(e) => e.currentTarget.style.opacity = 1}>
                        <Trash2 size={18} />
                      </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>No transactions found.</td>
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
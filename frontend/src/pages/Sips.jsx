/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 
import { Search, Trash2, Edit, Eye, Check, X, PlusCircle, TrendingUp, Wallet, AlertCircle } from 'lucide-react';

const Sips = () => {
  const [sips, setSips] = useState([]);
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
    sip_id: '', client_code_input: '', client_id: '', scheme_id: '', amount: '',
    start_date: new Date().toISOString().split('T')[0], end_date: '',
    frequency: 'MONTHLY',
    sip_day: '1', status: 'Active', platform: 'NSE', notes: ''
  };

  const [formData, setFormData] = useState(initialState);
  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(val || 0));

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true); 
    try {
      const [c, s, sip] = await Promise.all([
        api.get('/clients'), 
        api.get('/mf-schemes'), 
        api.get('/sips')
      ]);

      const clientList = c.data?.data || (Array.isArray(c.data) ? c.data : []);
      const schemeList = s.data?.data || (Array.isArray(s.data) ? s.data : []);
      const sipList = sip.data?.data || (Array.isArray(sip.data) ? sip.data : []);

      setClients(clientList); 
      setSchemes(schemeList); 
      setSips(sipList);
      setSelectedIds([]); 
      
      if (!isEditing && !isViewing) {
        const high = Math.max(...sipList.map(i => parseInt(i.sip_id?.replace(/\D/g, '') || 0)), 0);
        setFormData(prev => ({ ...prev, sip_id: `SID${(high + 1).toString().padStart(5, '0')}` }));
      }
    } catch (e) { 
      toast.error("Network Error: Could not sync mandates."); 
    } finally {
      setLoading(false); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewing) return setIsViewing(false);
    if (!formData.client_id) return toast.warning("⚠️ Enter a valid Client ID.");
    if (!formData.scheme_id) return toast.warning("⚠️ Choose a Scheme.");

    setIsSaving(true); 
    const payload = { 
      ...formData, 
      amount: formData.amount.toString().replace(/,/g, ''),
      end_date: formData.end_date || null
    };

    try {
      const res = isEditing 
        ? await api.put(`/sips/${editingId}`, payload)
        : await api.post('/sips', payload);

      if (res.data.success) {
        toast.success(isEditing ? "Mandate Updated" : "SIP Mandate Created");
        setIsEditing(false); setClientName(''); setFormData(initialState); fetchInitialData();
      }
    } catch (e) { 
      toast.error(e.response?.data?.error || "Transaction failed."); 
    } finally { 
      setIsSaving(false); 
    } 
  };

  const filteredSips = useMemo(() => {
    return sips.filter(s => 
      s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sip_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sips, searchTerm]);

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === filteredSips.length && filteredSips.length > 0 ? [] : filteredSips.map(s => s.id));

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this SIP mandate?")) return;
    try {
      const res = await api.delete(`/sips/${id}`);
      if (res.data.success) {
        toast.success("Mandate Deleted");
        fetchInitialData();
      }
    } catch (e) { toast.error("Delete failed"); }
  };

  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const inputStyle = { width: '100%', padding: '14px 16px', fontSize: '14px', outline: 'none', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' };

  return (
    <div className="container fade-in" style={{ paddingBottom: '60px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 🟢 STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', position: 'relative' }}>
          <TrendingUp style={{ position: 'absolute', right: '24px', top: '24px', color: '#10b981' }} size={24} />
          <p style={labelStyle}>Current Monthly SIP Book</p>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
            {formatINR(sips.filter(s => s.status === 'Active').reduce((sum, s) => sum + parseFloat(s.amount || 0), 0))}
          </h2>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', position: 'relative' }}>
          <Wallet style={{ position: 'absolute', right: '24px', top: '24px', color: '#0284c7' }} size={24} />
          <p style={labelStyle}>Total Active Mandates</p>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
            {sips.filter(s => s.status === 'Active').length}
          </h2>
        </div>
      </div>

      {/* 🟢 FORM MODULE */}
      <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '40px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#0284c7' }}></div>
        <form onSubmit={handleSubmit}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              <div><label style={labelStyle}>SID</label><input style={{...inputStyle, opacity: 0.6}} value={formData.sip_id || ''} readOnly /></div>
              
              <div>
                <label style={labelStyle}>Client ID *</label>
                <input 
                  style={inputStyle} 
                  value={formData.client_code_input || ''} 
                  readOnly={isViewing} 
                  placeholder="Enter Code (e.g. C001)" 
                  onChange={(e)=> {
                    const val = e.target.value.toUpperCase().trim();
                    setFormData(prev => ({ ...prev, client_code_input: val })); // Immediate feedback
                    const found = clients.find(c => c.client_code === val);
                    if (found) {
                      setClientName(found.full_name);
                      setFormData(prev => ({ ...prev, client_code_input: val, client_id: found.id }));
                    } else {
                      setClientName('');
                      setFormData(prev => ({ ...prev, client_code_input: val, client_id: '' }));
                    }
                  }} required />
              </div>
              
              <div><label style={labelStyle}>Client Name</label><input style={{...inputStyle, opacity: 0.6}} value={clientName || ''} readOnly /></div>
              
              <div>
                <label style={labelStyle}>MF Scheme Name *</label>
                <select style={inputStyle} value={formData.scheme_id || ''} disabled={isViewing} onChange={e=>setFormData({...formData, scheme_id:e.target.value})} required>
                  <option value="">Select Scheme...</option>
                  {schemes.map(s=><option key={s.id} value={s.id}>{s.scheme_name}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Monthly Amount (₹) *</label><input style={inputStyle} value={formData.amount || ''} readOnly={isViewing} onChange={e=>setFormData({...formData, amount:e.target.value})} required /></div>
              <div>
                <label style={labelStyle}>SIP Execution Day</label>
                <select style={inputStyle} value={formData.sip_day || '1'} disabled={isViewing} onChange={e=>setFormData({...formData, sip_day:e.target.value})}>
                  {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Current Status</label>
                <select style={{...inputStyle, color: formData.status === 'Active' ? '#10b981' : '#ef4444'}} value={formData.status || 'Active'} disabled={isViewing} onChange={e=>setFormData({...formData, status:e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Stopped">Stopped</option>
                </select>
              </div>
              <div><label style={labelStyle}>Start Date</label><input type="date" style={inputStyle} value={formData.start_date || ''} readOnly={isViewing} onChange={e=>setFormData({...formData, start_date:e.target.value})} required /></div>
              <div><label style={labelStyle}>Expiry Date</label><input type="date" style={inputStyle} value={formData.end_date || ''} readOnly={isViewing} onChange={e=>setFormData({...formData, end_date:e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Internal Notes</label><textarea style={{...inputStyle, height: '80px', resize: 'none'}} value={formData.notes || ''} readOnly={isViewing} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
           </div>
           
           <div style={{marginTop: '32px', display: 'flex', gap: '16px'}}>
               <button type="submit" disabled={isSaving} style={{ padding: '14px 32px', background: isEditing ? '#f59e0b' : isViewing ? 'var(--bg-main)' : '#0284c7', color: isViewing ? 'var(--text-main)' : 'white', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSaving ? "SYNCING..." : isEditing ? <><Check size={18}/> UPDATE MANDATE</> : isViewing ? "CLOSE PREVIEW" : <><PlusCircle size={18}/> REGISTER SIP</>}
               </button>
               {(isEditing || isViewing) && (
                  <button type="button" onClick={() => { setIsEditing(false); setIsViewing(false); setFormData(initialState); setClientName(''); fetchInitialData(); }} style={{ padding: '14px 24px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>CANCEL</button>
               )}
           </div>
        </form>
      </div>

      {/* 🟢 SEARCH & LIST */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search by Client or SID..." style={{ ...inputStyle, paddingLeft: '48px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)' }}>
                  <th style={{ padding: '16px', width: '40px' }}><input type="checkbox" checked={selectedIds.length === filteredSips.length && filteredSips.length > 0} onChange={toggleAll} /></th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)' }}>SID</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)' }}>Client / Partner</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)' }}>Scheme</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)' }}>Amount</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSips.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                  <td style={{ padding: '16px', color: '#0284c7', fontWeight: '800' }}>{s.sip_id}</td>
                  <td style={{ padding: '16px', fontWeight: '700' }}>{s.client_code} - {s.client_name}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{fontWeight: '700'}}>{s.scheme_name}</div>
                    <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>Execution Day: {s.sip_day}</div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase',
                      background: s.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: s.status === 'Active' ? '#10b981' : '#ef4444'
                    }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900' }}>{formatINR(s.amount)}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button onClick={() => { setIsViewing(true); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', margin: '0 8px' }}><Eye size={18} /></button>
                      <button onClick={() => { setIsEditing(true); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', margin: '0 8px' }}><Edit size={18} /></button>
                      <button onClick={() => handleDelete(s.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', margin: '0 8px' }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sips;
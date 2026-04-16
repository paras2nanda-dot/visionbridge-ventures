/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 
import { Search, Trash2, Edit, Eye, Check, X, PlusCircle, TrendingUp, Wallet } from 'lucide-react';

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
  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(val || 0));

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true); 
    try {
      const [c, s, sip] = await Promise.all([api.get('/clients'), api.get('/mf-schemes'), api.get('/sips')]);
      setClients(c.data || []); 
      setSchemes(s.data || []); 
      setSips(sip.data || []);
      setSelectedIds([]); 
      
      if (!isEditing && !isViewing) {
        const high = Math.max(...(sip.data || []).map(i => parseInt(i.sip_id?.replace(/\D/g, '') || 0)), 0);
        setFormData(prev => ({ ...prev, sip_id: `SID${(high + 1).toString().padStart(5, '0')}` }));
      }
    } catch (e) { 
      toast.error("Sync Error"); 
    } finally {
      setLoading(false); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewing) return setIsViewing(false);
    if (!formData.client_id) return toast.warning("Please select a valid Client ID");
    if (!formData.scheme_id) return toast.warning("Please select a Scheme");

    setIsSaving(true); 
    const payload = { 
      ...formData, 
      amount: formData.amount.toString().replace(/,/g, ''),
      end_date: formData.end_date || null,
      frequency: formData.frequency.toUpperCase() 
    };

    try {
      if (isEditing) await api.put(`/sips/${editingId}`, payload);
      else await api.post('/sips', payload);
      toast.success("✅ Success"); 
      setIsEditing(false); setClientName(''); setFormData(initialState); fetchInitialData();
    } catch (e) { toast.error(e.response?.data?.error || "Error saving"); }
    finally { setIsSaving(false); } 
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === filteredSips.length && filteredSips.length > 0 ? [] : filteredSips.map(s => s.id));

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedIds.length} selected SIPs permanently?`)) {
      try {
        await api.post('/sips/bulk-delete', { ids: selectedIds });
        toast.success("🗑️ Bulk Deleted");
        fetchInitialData();
      } catch (e) { toast.error("Bulk Delete Failed"); }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this mandate?")) {
      try {
        await api.delete(`/sips/${id}`);
        toast.success("🗑️ Deleted");
        fetchInitialData();
      } catch (e) { toast.error("Delete Error"); }
    }
  };

  const filteredSips = sips.filter(s => 
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sip_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '0.3px' };
  const inputStyle = { width: '100%', padding: '14px 16px', fontSize: '14px', outline: 'none', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' };

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
      
      {/* 🚀 Removed giant "SIP Tracker" title to rely on breadcrumbs */}
      
      {/* METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        <div className="card-bold" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', position: 'relative', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '24px', right: '24px', color: '#0284c7', background: 'rgba(2, 132, 199, 0.08)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
            <TrendingUp size={24} strokeWidth={2} />
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.3px' }}>
            Monthly SIP Book
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0', letterSpacing: '-0.5px' }}>
            ₹{formatINR(sips.filter(s => s.status === 'Active').reduce((sum, s) => sum + parseFloat(s.amount || 0), 0))}
          </h2>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> Active Mandates
          </div>
        </div>
        
        <div className="card-bold" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', position: 'relative', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '24px', right: '24px', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.08)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
            <Wallet size={24} strokeWidth={2} />
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.3px' }}>
            Total SIP AUM
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0', letterSpacing: '-0.5px' }}>
            ₹{formatINR(sips.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0))}
          </h2>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Lifetime Processing
          </div>
        </div>

      </div>
      
      {/* ADD/EDIT SIP FORM MODULE */}
      <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        
        {/* State Indicator */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#0284c7' }}></div>

        <form onSubmit={handleSubmit}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              <div><label style={labelStyle}>SID</label><input style={{...inputStyle, opacity: 0.7}} value={formData.sip_id} readOnly /></div>
              <div><label style={labelStyle}>Client ID *</label>
              <input style={inputStyle} value={formData.client_code_input} readOnly={isViewing} placeholder="e.g. C001" onChange={(e)=> {
                const val = e.target.value.toUpperCase();
                const found = clients.find(c => c.client_code === val);
                setClientName(found ? found.full_name : '');
                setFormData({...formData, client_code_input: val, client_id: found ? found.id : ''});
              }} required /></div>
              
              <div><label style={labelStyle}>Client Name</label><input style={{...inputStyle, opacity: 0.7}} value={clientName} readOnly /></div>
              
              <div><label style={labelStyle}>MF Scheme Name *</label>
              <select style={inputStyle} value={formData.scheme_id} disabled={isViewing} onChange={e=>setFormData({...formData, scheme_id:e.target.value})} required>
                <option value="">Select Scheme...</option>{schemes.map(s=><option key={s.id} value={s.id}>{s.scheme_name}</option>)}
              </select></div>
              <div><label style={labelStyle}>SIP Amount (₹) *</label><input style={inputStyle} value={formData.amount} readOnly={isViewing} onChange={e=>setFormData({...formData, amount:e.target.value})} required /></div>
              <div><label style={labelStyle}>Frequency</label>
              <select style={inputStyle} value={formData.frequency} disabled={isViewing} onChange={e=>setFormData({...formData, frequency:e.target.value})}>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select></div>
              <div><label style={labelStyle}>SIP Day</label><select style={inputStyle} value={formData.sip_day} disabled={isViewing} onChange={e=>setFormData({...formData, sip_day:e.target.value})}>
                {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select></div>
              <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={formData.status} disabled={isViewing} onChange={e=>setFormData({...formData, status:e.target.value})}>
                <option>Active</option><option>Paused</option><option>Stopped</option>
              </select></div>
              <div><label style={labelStyle}>Start Date</label><input type="date" style={inputStyle} value={formData.start_date} readOnly={isViewing} onChange={e=>setFormData({...formData, start_date:e.target.value})} required /></div>
              <div><label style={labelStyle}>End Date</label><input type="date" style={inputStyle} value={formData.end_date} readOnly={isViewing} onChange={e=>setFormData({...formData, end_date:e.target.value})} /></div>
              <div><label style={labelStyle}>Platform</label><select style={inputStyle} value={formData.platform} disabled={isViewing} onChange={e=>setFormData({...formData, platform:e.target.value})}><option>NSE</option><option>BSE</option></select></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, height: '80px', resize: 'vertical'}} value={formData.notes} readOnly={isViewing} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
           </div>
           
           {/* Action Buttons */}
           <div style={{marginTop: '40px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start'}}>
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
                    {isSaving ? (isEditing ? "UPDATING..." : "SYNCING SIP...") : (isEditing ? <><Check size={18}/> UPDATE SIP</> : isViewing ? "CLOSE VIEW" : <><PlusCircle size={18}/> ADD SIP</>)}
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

      {/* SEARCH BAR & BULK DELETE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search SIP mandates by ID or Client..." 
            style={{ ...inputStyle, paddingLeft: '44px', borderRadius: '12px' }} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
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

      {/* SIP TRACKER TABLE */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)' }}>
                  <th style={{ padding: '16px', width: '40px', borderBottom: '1px solid var(--border)' }}><input type="checkbox" checked={selectedIds.length === filteredSips.length && filteredSips.length > 0} onChange={toggleAll} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0284c7' }} /></th>
                  <th style={thStyle}>SID</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Scheme</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSips.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: selectedIds.includes(s.id) ? 'rgba(2, 132, 199, 0.04)' : 'transparent', transition: 'background 0.2s' }} onMouseOver={(e) => { if(!selectedIds.includes(s.id)) e.currentTarget.style.background = 'var(--bg-main)'; }} onMouseOut={(e) => { if(!selectedIds.includes(s.id)) e.currentTarget.style.background = 'transparent'; }}>
                  <td style={{ padding: '16px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0284c7' }} /></td>
                  <td style={{ padding: '16px', color: '#0284c7', fontWeight: '800' }}>{s.sip_id}</td>
                  <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '700' }}>{s.client_code} - {s.client_name}</td>
                  <td style={{ padding: '16px', color: 'var(--text-main)' }}>
                    <div style={{fontWeight: '700'}}>{s.scheme_name}</div>
                    <div style={{fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600'}}>{s.platform} • {s.frequency}</div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: s.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: s.status === 'Active' ? '#10b981' : '#ef4444',
                      border: s.status === 'Active' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>₹{formatINR(s.amount)}</td>
                  <td style={{ padding: '16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => { setIsViewing(true); setIsEditing(false); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'color 0.2s' }} title="View SIP" onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <Eye size={18} />
                      </button>
                      <button onClick={() => { setIsEditing(true); setIsViewing(false); setEditingId(s.id); setFormData({...s, client_code_input: s.client_code}); setClientName(s.client_name); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'opacity 0.2s' }} title="Edit SIP" onMouseOver={(e) => e.currentTarget.style.opacity = 0.7} onMouseOut={(e) => e.currentTarget.style.opacity = 1}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'opacity 0.2s' }} title="Delete SIP" onMouseOver={(e) => e.currentTarget.style.opacity = 0.7} onMouseOut={(e) => e.currentTarget.style.opacity = 1}>
                        <Trash2 size={18} />
                      </button>
                  </td>
                </tr>
              ))}
              {filteredSips.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
                    No SIP records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sips;
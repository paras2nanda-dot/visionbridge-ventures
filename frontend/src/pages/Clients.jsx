/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 

const Clients = () => {
  const [activeSubTab, setActiveSubTab] = useState('basic');
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  const [selectedIds, setSelectedIds] = useState([]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB').replace(/\//g, '-'); 
  };

  const initialState = {
    client_code: '', full_name: '', date_of_birth: '', 
    onboarding_date: formatDateForInput(new Date()), 
    added_by: 'Paras', sourcing: 'Internal', sourcing_type: 'Family / Relative', mobile_number: '',
    monthly_income: '', risk_profile: 'Moderate', investment_experience: 'Beginner', 
    pan: '', aadhaar: '', nominee_name: '', nominee_relation: '', nominee_mobile: '', notes: '', email: ''
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients');
      const validData = Array.isArray(res.data) ? res.data : [];
      setClients(validData);
      setSelectedIds([]);
      
      if (!isEditing && !isViewing) {
        const maxNum = validData.reduce((acc, c) => {
          const num = parseInt(c.client_code?.replace('C', ''), 10);
          return !isNaN(num) ? Math.max(acc, num) : acc;
        }, 0);
        setFormData(prev => ({ ...prev, client_code: `C${(maxNum + 1).toString().padStart(3, '0')}` }));
      }
    } catch (err) { toast.error("Database Sync Error"); }
    finally { setLoading(false); }
  };

  const formatINR = (val) => val ? new Intl.NumberFormat('en-IN').format(val.toString().replace(/,/g, "")) : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewing) return setIsViewing(false);
    
    // 🛡️ STRICT VALIDATION: Block save if not exactly 10 digits
    if (formData.mobile_number.length !== 10) {
      return toast.error("❌ Mobile number must be exactly 10 digits.");
    }

    setIsSaving(true); 
    try {
      if (isEditing) await api.put(`/clients/${editingId}`, formData);
      else await api.post(`/clients`, formData);
      toast.success("✅ Success");
      setIsEditing(false); setFormData(initialState); fetchClients(); setActiveSubTab('basic'); 
    } catch (err) { toast.error("Error saving client details"); }
    finally { setIsSaving(false); } 
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === filteredClients.length ? [] : filteredClients.map(c => c.id));

  const handleBulkDelete = async () => {
    if (window.confirm(`Permanently delete ${selectedIds.length} selected clients?`)) {
      try {
        await api.post('/clients/bulk-delete', { ids: selectedIds });
        toast.success("🗑️ Bulk Deleted");
        fetchClients();
      } catch (err) { toast.error("Bulk Delete Failed"); }
    }
  };

  const handleAction = (client, mode) => {
    mode === 'view' ? (setIsViewing(true), setIsEditing(false)) : (setIsEditing(true), setIsViewing(false));
    setEditingId(client.id);
    setActiveSubTab('basic');
    setFormData({ ...client, date_of_birth: formatDateForInput(client.dob || client.date_of_birth), onboarding_date: formatDateForInput(client.onboarding_date) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredClients = clients.filter(c => {
    const s = searchTerm.toLowerCase();
    return c.full_name?.toLowerCase().includes(s) || c.client_code?.toLowerCase().includes(s) || c.mobile_number?.includes(s);
  });

  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '12px', color: 'var(--text-muted)' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' };

  return (
    <div className="container fade-in" style={{ paddingBottom: '50px' }}>
      <h1 className="title" style={{ color: 'var(--text-main)' }}>Clients Database</h1>

      <div className="card" style={{ borderTop: isEditing ? '4px solid #f59e0b' : isViewing ? '4px solid #64748b' : '4px solid #6366f1', marginBottom: '30px', padding: '25px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button type="button" onClick={() => setActiveSubTab('basic')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: activeSubTab === 'basic' ? (isEditing ? '#f59e0b' : '#6366f1') : 'var(--bg-main)', color: activeSubTab === 'basic' ? 'white' : 'var(--text-muted)', fontWeight: 'bold', border:'none', transition: 'all 0.3s' }}>📋 Basic Details</button>
          <button type="button" onClick={() => setActiveSubTab('other')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: activeSubTab === 'other' ? (isEditing ? '#f59e0b' : '#6366f1') : 'var(--bg-main)', color: activeSubTab === 'other' ? 'white' : 'var(--text-muted)', fontWeight: 'bold', border:'none', transition: 'all 0.3s' }}>📝 Other Details</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div style={{ display: activeSubTab === 'basic' ? 'contents' : 'none' }}>
              <div><label style={labelStyle}>Client ID</label><input style={{...inputStyle, background: 'var(--bg-main)'}} value={formData.client_code} readOnly /></div>
              <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} type="text" value={formData.full_name} readOnly={isViewing} onChange={e => setFormData({...formData, full_name: e.target.value})} required /></div>
              <div><label style={labelStyle}>DOB *</label><input style={inputStyle} type="date" value={formData.date_of_birth} readOnly={isViewing} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} required /></div>
              <div><label style={labelStyle}>Onboarding Date</label><input style={inputStyle} type="date" value={formData.onboarding_date} readOnly={isViewing} onChange={e => setFormData({...formData, onboarding_date: e.target.value})} /></div>
              <div><label style={labelStyle}>Added By</label><select style={inputStyle} value={formData.added_by} disabled={isViewing} onChange={e => setFormData({...formData, added_by: e.target.value})}><option>Paras</option><option>Himanshu</option></select></div>
              
              {/* 🛡️ STRICT MOBILE INPUT: Prevents character entry > 10 */}
              <div>
                <label style={labelStyle}>Mobile *</label>
                <input 
                  style={inputStyle} 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  placeholder="10 digit number"
                  value={formData.mobile_number} 
                  readOnly={isViewing} 
                  onChange={e => {
                    const onlyNums = e.target.value.replace(/\D/g, '');
                    if (onlyNums.length <= 10) {
                      setFormData({...formData, mobile_number: onlyNums});
                    }
                  }} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: activeSubTab === 'other' ? 'contents' : 'none' }}>
              <div><label style={labelStyle}>Monthly Income (₹)</label><input style={inputStyle} type="text" value={formatINR(formData.monthly_income)} readOnly={isViewing} onChange={e => setFormData({...formData, monthly_income: e.target.value.replace(/,/g, '')})} /></div>
              <div><label style={labelStyle}>Risk Profile</label><select style={inputStyle} value={formData.risk_profile} disabled={isViewing} onChange={e => setFormData({...formData, risk_profile: e.target.value})}><option>Low</option><option>Moderate</option><option>High</option></select></div>
              <div><label style={labelStyle}>Investment Experience</label><select style={inputStyle} value={formData.investment_experience} disabled={isViewing} onChange={e => setFormData({...formData, investment_experience: e.target.value})}><option>Beginner</option><option>Intermediate</option><option>Pro</option></select></div>
              <div><label style={labelStyle}>PAN Card</label><input style={inputStyle} type="text" value={formData.pan} readOnly={isViewing} onChange={e => setFormData({...formData, pan: e.target.value})} /></div>
              <div><label style={labelStyle}>Aadhaar No.</label><input style={inputStyle} type="text" value={formData.aadhaar} readOnly={isViewing} onChange={e => setFormData({...formData, aadhaar: e.target.value})} /></div>
              <div><label style={labelStyle}>Mail ID</label><input style={inputStyle} type="email" value={formData.email} readOnly={isViewing} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Client Notes</label><textarea style={{...inputStyle, height: '40px'}} value={formData.notes} readOnly={isViewing} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
            </div>
          </div>
          <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
             <button type="submit" disabled={isSaving} style={{padding: '12px 30px', background: isEditing ? '#f59e0b' : isViewing ? '#64748b' : '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 'bold'}}>
                {isSaving ? (isEditing ? "Updating..." : "Adding Client...") : (isEditing ? "Update" : isViewing ? "Close" : "Add Client")}
             </button>
             {(isEditing || isViewing) && <button type="button" onClick={() => {setIsEditing(false); setIsViewing(false); setFormData(initialState); fetchClients();}} style={{padding: '12px 20px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold'}}>Cancel</button>}
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '400px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border, #e2e8f0)', background: 'var(--bg-card, #ffffff)', color: 'var(--text-main)', outline: 'none' }} />
        {selectedIds.length > 0 && <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Delete ({selectedIds.length})</button>}
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead><tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--border)' }}><th style={{ padding: '15px' }}><input type="checkbox" checked={selectedIds.length === filteredClients.length && filteredClients.length > 0} onChange={toggleAll} /></th><th style={{ color: 'var(--text-muted)' }}>ID</th><th style={{ color: 'var(--text-muted)', textAlign: 'left' }}>Client Name</th><th style={{ color: 'var(--text-muted)', textAlign: 'left' }}>Mobile</th><th style={{ color: 'var(--text-muted)', textAlign: 'left' }}>Onboarded</th><th style={{ color: 'var(--text-muted)', textAlign: 'left' }}>Added By</th><th style={{ color: 'var(--text-muted)' }}>Action</th></tr></thead>
          <tbody>{filteredClients.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: selectedIds.includes(c.id) ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: 'var(--text-main)' }}>
                <td style={{ padding: '12px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#6366f1' }}>{c.client_code}</td>
                <td style={{ padding: '12px', fontWeight: '600' }}>{c.full_name}</td>
                <td style={{ padding: '12px' }}>{c.mobile_number}</td>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{formatDateForDisplay(c.onboarding_date)}</td>
                <td style={{ padding: '12px' }}>{c.added_by}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleAction(c, 'view')} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', marginRight: '10px' }}>VIEW</button>
                    <button onClick={() => handleAction(c, 'edit')} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', marginRight: '10px' }}>EDIT</button>
                    <button onClick={async () => { if(window.confirm("Delete?")) { await api.delete(`/clients/${c.id}`); fetchClients(); } }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clients;
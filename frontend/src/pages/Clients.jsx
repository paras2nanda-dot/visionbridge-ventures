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
  const [selectedIds, setSelectedIds] = useState([]);

  // 🛡️ DATE HELPERS
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`; 
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
        let maxNum = 0;
        validData.forEach(c => {
          if (c.client_code && c.client_code.startsWith('C')) {
            const num = parseInt(c.client_code.replace('C', ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });
        const nextId = `C${(maxNum + 1).toString().padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, client_code: nextId }));
      }
    } catch (err) { 
      toast.error("Database Sync Error");
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => {
    if (!val) return "";
    return new Intl.NumberFormat('en-IN').format(val.toString().replace(/,/g, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewing) {
      setIsViewing(false);
      setFormData(initialState);
      fetchClients();
      return;
    }
    const url = isEditing ? `/clients/${editingId}` : `/clients`;
    try {
      if (isEditing) await api.put(url, formData);
      else await api.post(url, formData);
      toast.success("✅ Saved Successfully");
      setIsEditing(false); setFormData(initialState); fetchClients(); setActiveSubTab('basic'); 
    } catch (err) { toast.error("Error saving client details"); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredClients.length) setSelectedIds([]);
    else setSelectedIds(filteredClients.map(c => c.id));
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Permanently delete ${selectedIds.length} selected clients?`)) {
      try {
        await api.post('/clients/bulk-delete', { ids: selectedIds });
        toast.success("🗑️ Selected Clients Deleted");
        fetchClients();
      } catch (err) { toast.error("Bulk Delete Failed"); }
    }
  };

  const handleAction = (client, mode) => {
    if (mode === 'view') { setIsViewing(true); setIsEditing(false); } 
    else { setIsEditing(true); setIsViewing(false); }
    setEditingId(client.id);
    setActiveSubTab('basic');
    setFormData({
      ...client,
      date_of_birth: formatDateForInput(client.dob || client.date_of_birth), 
      onboarding_date: formatDateForInput(client.onboarding_date),
      pan: client.pan || '', 
      aadhaar: client.aadhaar || '', 
      email: client.email || '',
      notes: client.notes || '', 
      nominee_name: client.nominee_name || '',
      nominee_relation: client.nominee_relation || '', 
      nominee_mobile: client.nominee_mobile || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredClients = clients.filter(c => {
    const search = searchTerm.toLowerCase().trim();
    return (
      (c.full_name || '').toLowerCase().includes(search) ||
      (c.client_code || '').toLowerCase().includes(search) ||
      (c.mobile_number || '').includes(search)
    );
  });

  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '12px', color: '#475569' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' };

  return (
    <div className="container" style={{ paddingBottom: '50px' }}>
      <h1 className="title">Clients Database {isEditing ? <span style={{color: '#f59e0b'}}> (Editing)</span> : isViewing ? <span style={{color: '#64748b'}}> (Viewing)</span> : ''}</h1>

      {/* FORM SECTION */}
      <div className="card" style={{ borderTop: isEditing ? '4px solid #f59e0b' : isViewing ? '4px solid #64748b' : '4px solid #38bdf8', marginBottom: '30px', padding: '25px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button type="button" onClick={() => setActiveSubTab('basic')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: activeSubTab === 'basic' ? (isEditing ? '#f59e0b' : isViewing ? '#64748b' : '#38bdf8') : '#f1f5f9', color: activeSubTab === 'basic' ? 'white' : '#64748b', fontWeight: 'bold', border: 'none' }}>📋 1. Basic Details</button>
          <button type="button" onClick={() => setActiveSubTab('other')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: activeSubTab === 'other' ? (isEditing ? '#f59e0b' : isViewing ? '#64748b' : '#38bdf8') : '#f1f5f9', color: activeSubTab === 'other' ? 'white' : '#64748b', fontWeight: 'bold', border: 'none' }}>📝 2. Other Details</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            {/* TAB 1: BASIC DETAILS */}
            <div style={{ display: activeSubTab === 'basic' ? 'contents' : 'none' }}>
              <div><label style={labelStyle}>Client ID</label><input style={{...inputStyle, background: '#f8fafc'}} value={formData.client_code} readOnly /></div>
              <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} type="text" value={formData.full_name} readOnly={isViewing} onChange={e => setFormData({...formData, full_name: e.target.value})} required /></div>
              <div><label style={labelStyle}>DOB *</label><input style={inputStyle} type="date" value={formData.date_of_birth} readOnly={isViewing} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} required /></div>
              <div><label style={labelStyle}>Onboarding Date</label><input style={inputStyle} type="date" value={formData.onboarding_date} readOnly={isViewing} onChange={e => setFormData({...formData, onboarding_date: e.target.value})} /></div>
              <div><label style={labelStyle}>Added By</label><select style={inputStyle} value={formData.added_by} disabled={isViewing} onChange={e => setFormData({...formData, added_by: e.target.value})}><option>Paras</option><option>Himanshu</option></select></div>
              <div><label style={labelStyle}>Mobile *</label><input style={inputStyle} type="text" maxLength="10" value={formData.mobile_number} readOnly={isViewing} onChange={e => setFormData({...formData, mobile_number: e.target.value.replace(/[^0-9]/g, '')})} required /></div>
              <div><label style={labelStyle}>Client Sourcing</label><select style={inputStyle} value={formData.sourcing} disabled={isViewing} onChange={e => setFormData({...formData, sourcing: e.target.value})}><option>Internal</option><option>External</option></select></div>
              <div><label style={labelStyle}>Sourcing Type</label><select style={inputStyle} value={formData.sourcing_type} disabled={isViewing} onChange={e => setFormData({...formData, sourcing_type: e.target.value})}>
                <option>Family / Relative</option><option>Friend</option><option>Colleague</option><option>Reference by Family</option><option>Reference by Colleague</option><option>Marketing</option><option>Others</option>
              </select></div>
            </div>

            {/* TAB 2: OTHER DETAILS */}
            <div style={{ display: activeSubTab === 'other' ? 'contents' : 'none' }}>
              <div><label style={labelStyle}>Monthly Income (₹)</label><input style={inputStyle} type="text" value={formatINR(formData.monthly_income)} readOnly={isViewing} onChange={e => setFormData({...formData, monthly_income: e.target.value.replace(/,/g, '')})} /></div>
              <div><label style={labelStyle}>PAN Card</label><input style={inputStyle} type="text" value={formData.pan} readOnly={isViewing} onChange={e => setFormData({...formData, pan: e.target.value})} /></div>
              <div><label style={labelStyle}>Aadhaar No.</label><input style={inputStyle} type="text" value={formData.aadhaar} readOnly={isViewing} onChange={e => setFormData({...formData, aadhaar: e.target.value})} /></div>
              <div><label style={labelStyle}>Mail ID</label><input style={inputStyle} type="email" value={formData.email} readOnly={isViewing} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div><label style={labelStyle}>Risk Profile</label><select style={inputStyle} value={formData.risk_profile} disabled={isViewing} onChange={e => setFormData({...formData, risk_profile: e.target.value})}><option>Low</option><option>Moderate</option><option>High</option></select></div>
              <div><label style={labelStyle}>Investment Experience</label><select style={inputStyle} value={formData.investment_experience} disabled={isViewing} onChange={e => setFormData({...formData, investment_experience: e.target.value})}><option>Beginner</option><option>Intermediate</option><option>Pro</option></select></div>
              <div><label style={labelStyle}>Nominee Name</label><input style={inputStyle} type="text" value={formData.nominee_name} readOnly={isViewing} onChange={e => setFormData({...formData, nominee_name: e.target.value})} /></div>
              <div><label style={labelStyle}>Nominee Relation</label><input style={inputStyle} type="text" value={formData.nominee_relation} readOnly={isViewing} onChange={e => setFormData({...formData, nominee_relation: e.target.value})} /></div>
              <div><label style={labelStyle}>Nominee Mobile</label><input style={inputStyle} type="text" maxLength="10" value={formData.nominee_mobile} readOnly={isViewing} onChange={e => setFormData({...formData, nominee_mobile: e.target.value.replace(/[^0-9]/g, '')})} /></div>
              <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Client Notes</label><textarea style={{...inputStyle, height: '45px'}} value={formData.notes} readOnly={isViewing} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
            </div>
          </div>
          <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
             <button type="submit" style={{padding: '12px 40px', background: isEditing ? '#f59e0b' : isViewing ? '#64748b' : '#38bdf8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>{isEditing ? "Update" : isViewing ? "Close View" : "Add Client"}</button>
             {(isEditing || isViewing) && <button type="button" onClick={() => {setIsEditing(false); setIsViewing(false); setFormData(initialState); fetchClients();}} style={{padding: '12px 20px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontWeight: 'bold'}}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* SEARCH AND BULK DELETE BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '400px' }}>
          <input type="text" placeholder="Search by Name, ID, or Mobile..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} />
          <span style={{ position: 'absolute', left: '12px', top: '12px' }}>🔍</span>
        </div>
        {selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Delete Selected ({selectedIds.length})</button>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '15px 12px', width: '40px' }}><input type="checkbox" checked={selectedIds.length === filteredClients.length && filteredClients.length > 0} onChange={toggleAll} /></th>
              <th style={{ padding: '15px 12px', textAlign: 'left', width: '80px' }}>ID</th>
              <th style={{ padding: '15px 12px', textAlign: 'left' }}>Client Name</th>
              <th style={{ padding: '15px 12px', textAlign: 'left', width: '120px' }}>Mobile</th>
              <th style={{ padding: '15px 12px', textAlign: 'left', width: '130px' }}>Onboarded On</th>
              <th style={{ padding: '15px 12px', textAlign: 'left', width: '110px' }}>Added By</th>
              <th style={{ padding: '15px 12px', textAlign: 'center', width: '180px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan="7" style={{ padding: '20px' }}><div className="shimmer" style={{ width: '100%', height: '20px', borderRadius: '4px' }}></div></td></tr>
               ))
            ) : filteredClients.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedIds.includes(c.id) ? 'rgba(56, 189, 248, 0.05)' : 'transparent' }}>
                <td style={{ padding: '12px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#38bdf8' }}>{c.client_code}</td>
                <td style={{ padding: '12px', fontWeight: '600' }}>{c.full_name}</td>
                <td style={{ padding: '12px' }}>{c.mobile_number}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{formatDateForDisplay(c.onboarding_date)}</td>
                <td style={{ padding: '12px' }}>{c.added_by}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button onClick={() => handleAction(c, 'view')} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>VIEW</button>
                      <button onClick={() => handleAction(c, 'edit')} style={{ color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>EDIT</button>
                      <button onClick={async () => { if(window.confirm("Permanently delete this client?")) { try { await api.delete(`/clients/${c.id}`); toast.info("Client removed"); fetchClients(); } catch(err){toast.error("Error deleting client");}} }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>DELETE</button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{` .shimmer { background: #f1f5f9; background-image: linear-gradient(to right, #f1f5f9 0%, #e2e8f0 20%, #f1f5f9 40%, #f1f5f9 100%); background-size: 800px 100%; animation: shimmer 1.5s infinite linear; } @keyframes shimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } } `}</style>
    </div>
  );
};

export default Clients;
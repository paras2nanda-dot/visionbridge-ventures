/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
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

  // 🖐️ Swipe Logic Setup
  const tabOrder = ['basic', 'other'];
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabOrder.indexOf(activeSubTab);
      if (isLeftSwipe && currentIndex < tabOrder.length - 1) {
        setActiveSubTab(tabOrder[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        setActiveSubTab(tabOrder[currentIndex - 1]);
      }
    }
  };

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

  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.3px' };
  const inputStyle = { width: '100%', padding: '12px', fontSize: '14px', outline: 'none', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)' };

  return (
    <div className="container fade-in" style={{ paddingBottom: '50px' }}>
      <h1 className="title" style={{ color: 'var(--text-main)', fontWeight: '800' }}>Clients Database</h1>

      <div className="card" style={{ borderTop: `4px solid ${isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#38bdf8'}`, marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-main)', padding: '6px', borderRadius: '12px' }}>
          <button 
            type="button" 
            onClick={() => setActiveSubTab('basic')} 
            style={{ 
              flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold', transition: 'all 0.2s',
              background: activeSubTab === 'basic' ? '#38bdf8' : 'transparent',
              color: activeSubTab === 'basic' ? 'white' : 'var(--text-muted)',
              boxShadow: activeSubTab === 'basic' ? '0 4px 12px rgba(56, 189, 248, 0.3)' : 'none'
            }}>📋 1. Basic Details</button>
          <button 
            type="button" 
            onClick={() => setActiveSubTab('other')} 
            style={{ 
              flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold', transition: 'all 0.2s',
              background: activeSubTab === 'other' ? '#38bdf8' : 'transparent',
              color: activeSubTab === 'other' ? 'white' : 'var(--text-muted)',
              boxShadow: activeSubTab === 'other' ? '0 4px 12px rgba(56, 189, 248, 0.3)' : 'none'
            }}>📝 2. Other Details</button>
        </div>

        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div style={{ display: activeSubTab === 'basic' ? 'contents' : 'none' }}>
                  <div><label style={labelStyle}>Client ID</label><input style={inputStyle} value={formData.client_code} readOnly /></div>
                  <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} type="text" value={formData.full_name} readOnly={isViewing} onChange={e => setFormData({...formData, full_name: e.target.value})} required /></div>
                  <div><label style={labelStyle}>DOB *</label><input style={inputStyle} type="date" value={formData.date_of_birth} readOnly={isViewing} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} required /></div>
                  <div><label style={labelStyle}>Onboarding Date</label><input style={inputStyle} type="date" value={formData.onboarding_date} readOnly={isViewing} onChange={e => setFormData({...formData, onboarding_date: e.target.value})} /></div>
                  <div><label style={labelStyle}>Added By</label><select style={inputStyle} value={formData.added_by} disabled={isViewing} onChange={e => setFormData({...formData, added_by: e.target.value})}><option>Paras</option><option>Himanshu</option></select></div>
                  <div>
                      <label style={labelStyle}>Mobile *</label>
                      <input style={inputStyle} type="text" inputMode="numeric" placeholder="10 digit number" value={formData.mobile_number} readOnly={isViewing} onChange={e => {
                          const onlyNums = e.target.value.replace(/\D/g, '');
                          if (onlyNums.length <= 10) setFormData({...formData, mobile_number: onlyNums});
                      }} required />
                  </div>
                  <div><label style={labelStyle}>Client Sourcing</label><select style={inputStyle} value={formData.sourcing} disabled={isViewing} onChange={e => setFormData({...formData, sourcing: e.target.value})}><option>Internal</option><option>External</option></select></div>
                  <div><label style={labelStyle}>Sourcing Type</label><select style={inputStyle} value={formData.sourcing_type} disabled={isViewing} onChange={e => setFormData({...formData, sourcing_type: e.target.value})}><option>Family / Relative</option><option>Colleague</option><option>Friend</option><option>Reference by Family</option><option>Reference by Colleague</option><option>Marketing</option><option>Others</option></select></div>
                </div>

                <div style={{ display: activeSubTab === 'other' ? 'contents' : 'none' }}>
                  <div><label style={labelStyle}>Monthly Income (₹)</label><input style={inputStyle} type="text" value={formatINR(formData.monthly_income)} readOnly={isViewing} onChange={e => setFormData({...formData, monthly_income: e.target.value.replace(/,/g, '')})} /></div>
                  <div><label style={labelStyle}>Risk Profile</label><select style={inputStyle} value={formData.risk_profile} disabled={isViewing} onChange={e => setFormData({...formData, risk_profile: e.target.value})}><option>Low</option><option>Moderate</option><option>High</option></select></div>
                  <div><label style={labelStyle}>Investment Experience</label><select style={inputStyle} value={formData.investment_experience} disabled={isViewing} onChange={e => setFormData({...formData, investment_experience: e.target.value})}><option>Beginner</option><option>Intermediate</option><option>Pro</option></select></div>
                  <div><label style={labelStyle}>PAN Card</label><input style={inputStyle} type="text" value={formData.pan} readOnly={isViewing} onChange={e => setFormData({...formData, pan: e.target.value})} /></div>
                  <div><label style={labelStyle}>Aadhaar No.</label><input style={inputStyle} type="text" value={formData.aadhaar} readOnly={isViewing} onChange={e => setFormData({...formData, aadhaar: e.target.value})} /></div>
                  <div><label style={labelStyle}>Mail ID</label><input style={inputStyle} type="email" value={formData.email} readOnly={isViewing} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div><label style={labelStyle}>Nominee Name</label><input style={inputStyle} type="text" value={formData.nominee_name} readOnly={isViewing} onChange={e => setFormData({...formData, nominee_name: e.target.value})} /></div>
                  <div><label style={labelStyle}>Nominee Relation</label><input style={inputStyle} type="text" value={formData.nominee_relation} readOnly={isViewing} onChange={e => setFormData({...formData, nominee_relation: e.target.value})} /></div>
                  <div><label style={labelStyle}>Nominee Mobile</label><input style={inputStyle} type="text" inputMode="numeric" value={formData.nominee_mobile} readOnly={isViewing} onChange={e => setFormData({...formData, nominee_mobile: e.target.value.replace(/\D/g, '')})} /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Client Notes</label><textarea style={{...inputStyle, height: '80px'}} value={formData.notes} readOnly={isViewing} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
                </div>
            </div>
            <div style={{marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-start'}}>
                <button type="submit" disabled={isSaving} style={{padding: '12px 32px', background: isEditing ? '#f59e0b' : isViewing ? '#64748b' : '#38bdf8', color: 'white', border: 'none', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)'}}>
                    {isSaving ? (isEditing ? "Updating..." : "Adding Client...") : (isEditing ? "Update Client" : isViewing ? "Close View" : "Add Client")}
                </button>
                {(isEditing || isViewing) && <button type="button" onClick={() => {setIsEditing(false); setIsViewing(false); setFormData(initialState); fetchClients();}} style={{padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold'}}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
          <input type="text" placeholder="Search clients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: '40px' }} />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>
        {selectedIds.length > 0 && <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Delete selected ({selectedIds.length})</button>}
      </div>

      <div className="card" style={{ padding: '0', background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(248, 250, 252, 0.5)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px' }}><input type="checkbox" checked={selectedIds.length === filteredClients.length && filteredClients.length > 0} onChange={toggleAll} /></th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'left', padding: '16px', fontWeight: '700' }}>ID</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'left', padding: '16px', fontWeight: '700' }}>CLIENT NAME</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'left', padding: '16px', fontWeight: '700' }}>MOBILE</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'left', padding: '16px', fontWeight: '700' }}>ONBOARDED</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'left', padding: '16px', fontWeight: '700' }}>ADDED BY</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px', fontWeight: '700' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>{filteredClients.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: selectedIds.includes(c.id) ? 'rgba(99, 102, 241, 0.04)' : 'transparent', color: 'var(--text-main)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '12px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#6366f1' }}>{c.client_code}</td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{c.full_name}</td>
                  <td style={{ padding: '12px' }}>{c.mobile_number}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{formatDateForDisplay(c.onboarding_date)}</td>
                  <td style={{ padding: '12px' }}>{c.added_by}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => handleAction(c, 'view')} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', marginRight: '12px' }}>VIEW</button>
                      <button onClick={() => handleAction(c, 'edit')} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', marginRight: '12px' }}>EDIT</button>
                      <button onClick={async () => { if(window.confirm("Delete?")) { await api.delete(`/clients/${c.id}`); fetchClients(); } }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>DELETE</button>
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

export default Clients;
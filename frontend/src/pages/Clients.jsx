/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 
import { Search, Trash2, Edit, Eye, ClipboardList, FileText, UserPlus, Check, X, Handshake, Users, AlertCircle, Activity } from 'lucide-react';

const Clients = () => {
  const [activeSubTab, setActiveSubTab] = useState('basic');
  const [clients, setClients] = useState([]);
  const [subDistributors, setSubDistributors] = useState([]); 
  const [families, setFamilies] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  const [selectedIds, setSelectedIds] = useState([]);

  // 🖐️ Swipe Logic (Preserved)
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
    if (Math.abs(distance) > minSwipeDistance) {
      const currentIndex = tabOrder.indexOf(activeSubTab);
      if (distance > 0 && currentIndex < tabOrder.length - 1) setActiveSubTab(tabOrder[currentIndex + 1]);
      else if (distance < 0 && currentIndex > 0) setActiveSubTab(tabOrder[currentIndex - 1]);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB').replace(/\//g, '-'); 
  };

  const initialState = {
    client_code: '', full_name: '', date_of_birth: '', 
    onboarding_date: formatDateForInput(new Date()), 
    added_by: 'Paras', sourcing: 'Internal', sub_distributor_id: '', sourcing_type: 'Family / Relative', mobile_number: '',
    monthly_income: '', risk_profile: 'Moderate', investment_experience: 'Beginner', 
    pan: '', aadhaar: '', nominee_name: '', nominee_relation: '', nominee_mobile: '', notes: '', email: '',
    family_type: 'new', family_id: '', family_name: '', family_role: 'HEAD'
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => { 
    fetchInitialData(); 
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [cRes, sdRes, fRes] = await Promise.all([
        api.get('/clients'), api.get('/sub-distributors'), api.get('/clients/families')
      ]);
      
      // 🛡️ FIX: Standardized Array Extraction
      const validClients = cRes.data?.data || (Array.isArray(cRes.data) ? cRes.data : []);
      const validDistributors = sdRes.data?.data || (Array.isArray(sdRes.data) ? sdRes.data : []);
      const validFamilies = fRes.data?.data || (Array.isArray(fRes.data) ? fRes.data : []);

      setClients(validClients);
      setSubDistributors(validDistributors);
      setFamilies(validFamilies);
      setSelectedIds([]);
      
      // 🟢 Accurate Next ID Calculation
      if (!isEditing && !isViewing) {
        const maxNum = validClients.reduce((acc, c) => {
          const num = parseInt(c.client_code?.replace('C', ''), 10);
          return !isNaN(num) ? Math.max(acc, num) : acc;
        }, 0);
        setFormData(prev => ({ ...prev, client_code: `C${(maxNum + 1).toString().padStart(3, '0')}` }));
      }
    } catch (err) { 
      toast.error("Database Sync Error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const calculateHealth = (c) => {
    let score = 20; // Basic registration
    if (c.email) score += 20;
    if (c.nominee_name) score += 20;
    if (c.pan) score += 20;
    if (c.family_id) score += 20;
    return score;
  };

  const formatINR = (val) => val ? new Intl.NumberFormat('en-IN').format(val.toString().replace(/,/g, "")) : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewing) return setIsViewing(false);
    
    if (formData.mobile_number.length !== 10) return toast.error("❌ Mobile number must be 10 digits.");
    if (formData.sourcing === 'External' && !formData.sub_distributor_id) return toast.warn("⚠️ Select a Sub Distributor.");
    if (formData.family_type === 'existing' && !formData.family_id) return toast.warn("⚠️ Select an existing family.");

    setIsSaving(true); 
    try {
      const res = isEditing 
        ? await api.put(`/clients/${editingId}`, formData)
        : await api.post(`/clients`, formData);

      if (res.data.success) {
        toast.success("✅ Client Saved Successfully");
        setIsEditing(false); setFormData(initialState); fetchInitialData(); setActiveSubTab('basic'); 
      }
    } catch (err) { 
      toast.error(err.response?.data?.error || "Save Failed"); 
    } finally { 
      setIsSaving(false); 
    } 
  };

  const handleAction = (client, mode) => {
    mode === 'view' ? (setIsViewing(true), setIsEditing(false)) : (setIsEditing(true), setIsViewing(false));
    setEditingId(client.id);
    setActiveSubTab('basic');
    setFormData({ 
      ...initialState, 
      ...client, 
      date_of_birth: formatDateForInput(client.dob || client.date_of_birth), 
      onboarding_date: formatDateForInput(client.onboarding_date),
      family_type: 'existing'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === filteredClients.length && filteredClients.length > 0 ? [] : filteredClients.map(c => c.id));

  const handleBulkDelete = async () => {
    if (window.confirm(`Permanently delete ${selectedIds.length} selected clients?`)) {
      try {
        await api.post('/clients/bulk-delete', { ids: selectedIds });
        toast.success("🗑️ Bulk Deleted");
        fetchInitialData();
      } catch (err) { toast.error("Bulk Delete Failed"); }
    }
  };

  // 🛡️ FIXED: Search optimization via useMemo prevents typing lag
  const filteredClients = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.full_name?.toLowerCase().includes(s) || 
      c.client_code?.toLowerCase().includes(s) || 
      c.mobile_number?.includes(s)
    );
  }, [clients, searchTerm]);

  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '0.3px' };
  const inputStyle = { width: '100%', padding: '14px 16px', fontSize: '14px', outline: 'none', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', transition: 'all 0.2s' };
  const thStyle = { color: 'var(--text-muted)', textAlign: 'left', padding: '16px', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' };

  return (
    <div className="container fade-in" style={{ paddingBottom: '60px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* FORM MODULE */}
      <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#0284c7' }}></div>

        {/* Tab Headers */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'var(--bg-main)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '400px' }}>
          <button type="button" onClick={() => setActiveSubTab('basic')} style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', border: 'none', background: activeSubTab === 'basic' ? 'var(--bg-card)' : 'transparent', color: activeSubTab === 'basic' ? '#0284c7' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ClipboardList size={16} /> Basic
          </button>
          <button type="button" onClick={() => setActiveSubTab('other')} style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', border: 'none', background: activeSubTab === 'other' ? 'var(--bg-card)' : 'transparent', color: activeSubTab === 'other' ? '#0284c7' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <FileText size={16} /> KYC / Other
          </button>
        </div>

        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                {/* BASIC TAB FIELDS */}
                <div style={{ display: activeSubTab === 'basic' ? 'contents' : 'none' }}>
                  <div><label style={labelStyle}>Client ID</label><input style={{...inputStyle, opacity: 0.7}} value={formData.client_code} readOnly /></div>
                  <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} type="text" value={formData.full_name} readOnly={isViewing} onChange={e => setFormData({...formData, full_name: e.target.value})} required /></div>
                  <div><label style={labelStyle}>DOB *</label><input style={inputStyle} type="date" value={formData.date_of_birth} readOnly={isViewing} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} required /></div>
                  <div><label style={labelStyle}>Onboarding Date</label><input style={inputStyle} type="date" value={formData.onboarding_date} readOnly={isViewing} onChange={e => setFormData({...formData, onboarding_date: e.target.value})} /></div>
                  <div><label style={labelStyle}>Added By</label><select style={inputStyle} value={formData.added_by} disabled={isViewing} onChange={e => setFormData({...formData, added_by: e.target.value})}><option>Paras</option><option>Himanshu</option></select></div>
                  <div><label style={labelStyle}>Mobile *</label><input style={inputStyle} type="text" value={formData.mobile_number} readOnly={isViewing} onChange={e => setFormData({...formData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10)})} required /></div>
                  <div>
                    <label style={labelStyle}>Client Sourcing</label>
                    <select style={inputStyle} value={formData.sourcing} disabled={isViewing} onChange={e => setFormData({...formData, sourcing: e.target.value, sub_distributor_id: e.target.value === 'Internal' ? '' : formData.sub_distributor_id})}><option>Internal</option><option>External</option></select>
                  </div>
                  {formData.sourcing === 'External' && (
                    <div className="fade-in">
                      <label style={labelStyle}>Sub Distributor *</label>
                      <select style={inputStyle} value={formData.sub_distributor_id} disabled={isViewing} onChange={e => setFormData({...formData, sub_distributor_id: e.target.value})} required>
                        <option value="">Select Distributor...</option>
                        {subDistributors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* KYC TAB FIELDS */}
                <div style={{ display: activeSubTab === 'other' ? 'contents' : 'none' }}>
                  <div><label style={labelStyle}>Monthly Income (₹)</label><input style={inputStyle} value={formatINR(formData.monthly_income)} readOnly={isViewing} onChange={e => setFormData({...formData, monthly_income: e.target.value.replace(/,/g, '')})} /></div>
                  <div><label style={labelStyle}>Risk Profile</label><select style={inputStyle} value={formData.risk_profile} disabled={isViewing} onChange={e => setFormData({...formData, risk_profile: e.target.value})}><option>Low</option><option>Moderate</option><option>High</option></select></div>
                  <div><label style={labelStyle}>PAN Card</label><input style={inputStyle} value={formData.pan} readOnly={isViewing} onChange={e => setFormData({...formData, pan: e.target.value.toUpperCase()})} /></div>
                  <div><label style={labelStyle}>Mail ID</label><input style={inputStyle} type="email" value={formData.email} readOnly={isViewing} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div><label style={labelStyle}>Nominee Name</label><input style={inputStyle} value={formData.nominee_name} readOnly={isViewing} onChange={e => setFormData({...formData, nominee_name: e.target.value})} /></div>
                  <div><label style={labelStyle}>Nominee Mobile</label><input style={inputStyle} value={formData.nominee_mobile} readOnly={isViewing} onChange={e => setFormData({...formData, nominee_mobile: e.target.value.replace(/\D/g, '')})} /></div>
                  
                  {/* Family Logic (Preserved) */}
                  <div style={{ gridColumn: '1 / -1', padding: '24px', background: 'rgba(2, 132, 199, 0.03)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18}/> Family Grouping</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Family Type</label>
                            <select style={inputStyle} value={formData.family_type} disabled={isViewing || isEditing} onChange={e => setFormData({...formData, family_type: e.target.value, family_name: e.target.value === 'new' ? `${formData.full_name} Family` : ''})}><option value="new">New Family</option><option value="existing">Existing</option></select>
                        </div>
                        {formData.family_type === 'existing' && (
                            <div>
                                <label style={labelStyle}>Select Family</label>
                                <select style={inputStyle} value={formData.family_id} disabled={isViewing} onChange={e => setFormData({...formData, family_id: e.target.value})}><option value="">Choose...</option>{families.map(f => <option key={f.id} value={f.id}>{f.family_name}</option>)}</select>
                            </div>
                        )}
                        <div>
                            <label style={labelStyle}>Role</label>
                            <select style={inputStyle} value={formData.family_role} disabled={isViewing} onChange={e => setFormData({...formData, family_role: e.target.value})}><option value="HEAD">Head of Family</option><option value="MEMBER">Member</option></select>
                        </div>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Client Notes</label><textarea style={{...inputStyle, height: '80px'}} value={formData.notes} readOnly={isViewing} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
                </div>
            </div>
            
            <div style={{marginTop: '40px', display: 'flex', gap: '16px'}}>
                <button type="submit" disabled={isSaving} style={{ padding: '12px 28px', background: isEditing ? '#f59e0b' : isViewing ? 'var(--bg-main)' : '#0284c7', color: isViewing ? 'var(--text-main)' : 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSaving ? "SAVING..." : isEditing ? <><Check size={18}/> UPDATE CLIENT</> : isViewing ? "CLOSE" : <><UserPlus size={18}/> ADD CLIENT</>}
                </button>
                {(isEditing || isViewing) && (
                  <button type="button" onClick={() => {setIsEditing(false); setIsViewing(false); setFormData(initialState);}} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>CANCEL</button>
                )}
            </div>
          </form>
        </div>
      </div>

      {/* SEARCH & BULK ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search clients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: '44px' }} />
        </div>
        {selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer' }}>
            <Trash2 size={18} /> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* CLIENTS TABLE */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)' }}>
                <th style={{ padding: '16px', width: '40px' }}><input type="checkbox" checked={selectedIds.length === filteredClients.length && filteredClients.length > 0} onChange={toggleAll} /></th>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Health</th>
                <th style={thStyle}>Family</th>
                <th style={thStyle}>Partner</th>
                <th style={thStyle}>Mobile</th>
                <th style={thStyle}>Added By</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(c => {
                const health = calculateHealth(c);
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                    <td style={{ padding: '16px', fontWeight: '800', color: '#0284c7' }}>{c.client_code}</td>
                    <td style={{ padding: '16px', fontWeight: '700' }}>{c.full_name}</td>
                    <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${health}%`, height: '100%', background: health > 70 ? '#10b981' : health > 40 ? '#f59e0b' : '#ef4444' }}></div>
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>{health}%</span>
                        </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>{c.family_name || '-'}</td>
                    <td style={{ padding: '16px', fontSize: '12px' }}>{subDistributors.find(d => d.id === c.sub_distributor_id)?.name || '-'}</td>
                    <td style={{ padding: '16px' }}>{c.mobile_number}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{c.added_by}</td>
                    <td style={{ padding: '16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleAction(c, 'view')} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', margin: '0 4px' }}><Eye size={18} /></button>
                        <button onClick={() => handleAction(c, 'edit')} style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', margin: '0 4px' }}><Edit size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Clients;
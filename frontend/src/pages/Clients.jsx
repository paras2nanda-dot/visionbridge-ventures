/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 
import { Search, Trash2, Edit, Eye, ClipboardList, FileText, UserPlus, Check, X, Handshake } from 'lucide-react';

const Clients = () => {
  const [activeSubTab, setActiveSubTab] = useState('basic');
  const [clients, setClients] = useState([]);
  const [subDistributors, setSubDistributors] = useState([]); // 🟢 NEW STATE
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

  // 🟢 Updated initialState to include sub_distributor_id
  const initialState = {
    client_code: '', full_name: '', date_of_birth: '', 
    onboarding_date: formatDateForInput(new Date()), 
    added_by: 'Paras', sourcing: 'Internal', sub_distributor_id: '', sourcing_type: 'Family / Relative', mobile_number: '',
    monthly_income: '', risk_profile: 'Moderate', investment_experience: 'Beginner', 
    pan: '', aadhaar: '', nominee_name: '', nominee_relation: '', nominee_mobile: '', notes: '', email: ''
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => { 
    fetchClients(); 
    fetchSubDistributors(); // 🟢 FETCH PARTNERS ON LOAD
  }, []);

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

  const fetchSubDistributors = async () => {
    try {
      const res = await api.get('/sub-distributors');
      setSubDistributors(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Could not fetch sub-distributors"); }
  };

  const formatINR = (val) => val ? new Intl.NumberFormat('en-IN').format(val.toString().replace(/,/g, "")) : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewing) return setIsViewing(false);
    
    if (formData.mobile_number.length !== 10) {
      return toast.error("❌ Mobile number must be exactly 10 digits.");
    }
    
    // 🟢 Validation for Sub-Distributor dropdown
    if (formData.sourcing === 'External' && !formData.sub_distributor_id) {
      return toast.warn("⚠️ Please select a Sub Distributor.");
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
  const toggleAll = () => setSelectedIds(selectedIds.length === filteredClients.length && filteredClients.length > 0 ? [] : filteredClients.map(c => c.id));

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
    setFormData({ 
      ...initialState, 
      ...client, 
      date_of_birth: formatDateForInput(client.dob || client.date_of_birth), 
      onboarding_date: formatDateForInput(client.onboarding_date),
      sub_distributor_id: client.sub_distributor_id || '' 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredClients = clients.filter(c => {
    const s = searchTerm.toLowerCase();
    return c.full_name?.toLowerCase().includes(s) || c.client_code?.toLowerCase().includes(s) || c.mobile_number?.includes(s);
  });

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
      
      {/* FORM MODULE */}
      <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isEditing ? '#f59e0b' : isViewing ? '#94a3b8' : '#0284c7' }}></div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'var(--bg-main)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '400px' }}>
          <button 
            type="button" 
            onClick={() => setActiveSubTab('basic')} 
            style={{ 
              flex: 1, padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: activeSubTab === 'basic' ? 'var(--bg-card)' : 'transparent',
              color: activeSubTab === 'basic' ? '#0284c7' : 'var(--text-muted)',
              boxShadow: activeSubTab === 'basic' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}>
              <ClipboardList size={16} /> Basic Details
          </button>
          <button 
            type="button" 
            onClick={() => setActiveSubTab('other')} 
            style={{ 
              flex: 1, padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: activeSubTab === 'other' ? 'var(--bg-card)' : 'transparent',
              color: activeSubTab === 'other' ? '#0284c7' : 'var(--text-muted)',
              boxShadow: activeSubTab === 'other' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}>
              <FileText size={16} /> Other Details
          </button>
        </div>

        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ display: activeSubTab === 'basic' ? 'contents' : 'none' }}>
                  <div><label style={labelStyle}>Client ID</label><input style={{...inputStyle, opacity: 0.7}} value={formData.client_code} readOnly /></div>
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
                  
                  <div>
                    <label style={labelStyle}>Client Sourcing</label>
                    <select style={inputStyle} value={formData.sourcing} disabled={isViewing} onChange={e => {
                      const newSourcing = e.target.value;
                      setFormData({
                        ...formData, 
                        sourcing: newSourcing, 
                        sub_distributor_id: newSourcing === 'Internal' ? '' : formData.sub_distributor_id
                      });
                    }}>
                      <option>Internal</option>
                      <option>External</option>
                    </select>
                  </div>

                  {/* 🟢 NEW SUB DISTRIBUTOR DROPDOWN */}
                  {formData.sourcing === 'External' && (
                    <div className="fade-in">
                      <label style={labelStyle}>Sub Distributor *</label>
                      <select 
                        style={inputStyle} 
                        value={formData.sub_distributor_id} 
                        disabled={isViewing} 
                        onChange={e => setFormData({...formData, sub_distributor_id: e.target.value})} 
                        required={formData.sourcing === 'External'} 
                      >
                        <option value="">Select Distributor...</option>
                        {subDistributors.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </div>
                  )}

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
                  <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Client Notes</label><textarea style={{...inputStyle, height: '100px', resize: 'vertical'}} value={formData.notes} readOnly={isViewing} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
                </div>
            </div>
            
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
                    {isSaving ? (isEditing ? "UPDATING..." : "ADDING CLIENT...") : (isEditing ? <><Check size={18}/> UPDATE CLIENT</> : isViewing ? "CLOSE VIEW" : <><UserPlus size={18}/> ADD CLIENT</>)}
                </button>
                {(isEditing || isViewing) && (
                  <button 
                    type="button" 
                    onClick={() => {setIsEditing(false); setIsViewing(false); setFormData(initialState); fetchClients();}} 
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', 
                      border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', 
                      cursor: 'pointer', fontWeight: '800', letterSpacing: '0.5px', transition: 'all 0.2s'
                    }}
                  >
                    <X size={18} /> CANCEL
                  </button>
                )}
            </div>
          </form>
        </div>
      </div>

      {/* 🔍 SEARCH BAR & ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search clients by name, code, or mobile..." 
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
            <Trash2 size={18} /> Delete ({selectedIds.length})
          </button>
        )}
      </div>

      {/* CLIENTS TABLE */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)' }}>
                <th style={{ padding: '16px', width: '40px', borderBottom: '1px solid var(--border)' }}><input type="checkbox" checked={selectedIds.length === filteredClients.length && filteredClients.length > 0} onChange={toggleAll} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0284c7' }} /></th>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Client Name</th>
                <th style={thStyle}>Mobile</th>
                <th style={thStyle}>Onboarded On</th>
                <th style={thStyle}>Added By</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>{filteredClients.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: selectedIds.includes(c.id) ? 'rgba(2, 132, 199, 0.04)' : 'transparent', transition: 'background 0.2s' }} onMouseOver={(e) => { if(!selectedIds.includes(c.id)) e.currentTarget.style.background = 'var(--bg-main)'; }} onMouseOut={(e) => { if(!selectedIds.includes(c.id)) e.currentTarget.style.background = 'transparent'; }}>
                  <td style={{ padding: '16px', textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0284c7' }} /></td>
                  <td style={{ padding: '16px', fontWeight: '800', color: '#0284c7' }}>{c.client_code}</td>
                  <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{c.full_name}</td>
                  <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>{c.mobile_number}</td>
                  <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>{formatDateForDisplay(c.onboarding_date)}</td>
                  <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>{c.added_by}</td>
                  <td style={{ padding: '16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleAction(c, 'view')} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'color 0.2s' }} title="View Details">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleAction(c, 'edit')} style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'opacity 0.2s' }} title="Edit Client">
                        <Edit size={18} />
                      </button>
                      <button onClick={async () => { if(window.confirm("Permanently delete this client?")) { await api.delete(`/clients/${c.id}`); fetchClients(); } }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'opacity 0.2s' }} title="Delete Client">
                        <Trash2 size={18} />
                      </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
                    No clients found matching your search.
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

export default Clients;
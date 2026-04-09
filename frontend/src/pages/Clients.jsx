import React, { useState, useEffect } from 'react';
import api from '../services/api'; // 💡 Imported the secure API instance

const Clients = () => {
  const [activeSubTab, setActiveSubTab] = useState('basic');
  const [clients, setClients] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`; 
  };

  const initialState = {
    client_code: '', full_name: '', date_of_birth: '', 
    onboarding_date: formatDateForInput(new Date()), 
    added_by: 'Paras', sourcing: 'Internal', sourcing_type: 'Family / Relative', mobile_number: '',
    monthly_income: '', risk_profile: 'Medium', investment_experience: 'Beginner', 
    pan: '', aadhaar: '', nominee_name: '', nominee_relation: '', nominee_mobile: '', notes: '', email: ''
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      // 💡 api.get handles the cookie automatically
      const res = await api.get('/clients');
      const validData = Array.isArray(res.data) ? res.data : [];
      setClients(validData);
      
      // 💡 SMARTER ID GENERATION
      if (!isEditing) {
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
    } catch (err) { console.error("Sync Error:", err); }
  };

  const formatINR = (val) => {
    if (!val) return "";
    return new Intl.NumberFormat('en-IN').format(val.toString().replace(/,/g, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final safety check before sending to backend
    if (formData.mobile_number.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    const url = isEditing ? `/clients/${editingId}` : `/clients`;

    try {
      // 💡 Axios handles the HTTP methods and cookies cleanly
      if (isEditing) {
        await api.put(url, formData);
      } else {
        await api.post(url, formData);
      }

      alert(isEditing ? "✅ Client Updated Successfully!" : "✅ Client Added Successfully!");
      setIsEditing(false);
      setEditingId(null);
      setFormData(initialState); 
      fetchClients(); 
      setActiveSubTab('basic'); 
    } catch (err) { 
      alert(`❌ Failed to save client:\n\n${err.response?.data?.error || 'Unauthorized'}`); 
    }
  };

  const handleEdit = (client) => {
    setIsEditing(true);
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

  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '12px', color: '#475569' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' };

  return (
    <div className="container" style={{ paddingBottom: '50px' }}>
      <h1 className="title">Clients Database {isEditing && <span style={{color: '#f59e0b'}}> (Editing {formData.client_code})</span>}</h1>

      <div className="card" style={{ borderTop: isEditing ? '4px solid #f59e0b' : '4px solid #38bdf8', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button type="button" onClick={() => setActiveSubTab('basic')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: activeSubTab === 'basic' ? (isEditing ? '#f59e0b' : '#38bdf8') : '#f1f5f9', color: activeSubTab === 'basic' ? 'white' : '#64748b', fontWeight: 'bold', border: 'none' }}>📋 1. Basic Details</button>
          <button type="button" onClick={() => setActiveSubTab('other')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: activeSubTab === 'other' ? (isEditing ? '#f59e0b' : '#38bdf8') : '#f1f5f9', color: activeSubTab === 'other' ? 'white' : '#64748b', fontWeight: 'bold', border: 'none' }}>📝 2. Other Details</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            
            <div style={{ display: activeSubTab === 'basic' ? 'contents' : 'none' }}>
              <div><label style={labelStyle}>Client ID</label><input style={{...inputStyle, background: '#f8fafc'}} value={formData.client_code} readOnly /></div>
              <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required /></div>
              <div><label style={labelStyle}>DOB *</label><input style={inputStyle} type="date" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} required /></div>
              <div><label style={labelStyle}>Onboarding Date</label><input style={inputStyle} type="date" value={formData.onboarding_date} onChange={e => setFormData({...formData, onboarding_date: e.target.value})} /></div>
              <div><label style={labelStyle}>Added By</label><select style={inputStyle} value={formData.added_by} onChange={e => setFormData({...formData, added_by: e.target.value})}><option>Paras</option><option>Himanshu</option></select></div>
              
              <div>
                <label style={labelStyle}>Mobile *</label>
                <input 
                  style={inputStyle} 
                  type="text" 
                  maxLength="10"
                  value={formData.mobile_number} 
                  onChange={e => setFormData({...formData, mobile_number: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)})} 
                  required 
                  placeholder="10-digit number"
                />
              </div>

              <div><label style={labelStyle}>Client Sourcing</label><select style={inputStyle} value={formData.sourcing} onChange={e => setFormData({...formData, sourcing: e.target.value})}><option>Internal</option><option>External</option></select></div>
              <div><label style={labelStyle}>Sourcing Type</label>
                <select style={inputStyle} value={formData.sourcing_type} onChange={e => setFormData({...formData, sourcing_type: e.target.value})}>
                  <option>Family / Relative</option><option>Friend</option><option>Colleague</option><option>Reference by Family</option><option>Reference by Colleague</option><option>Marketing</option><option>Others</option>
                </select>
              </div>
            </div>

            <div style={{ display: activeSubTab === 'other' ? 'contents' : 'none' }}>
              <div><label style={labelStyle}>Monthly Income (₹)</label><input style={inputStyle} type="text" value={formatINR(formData.monthly_income)} onChange={e => setFormData({...formData, monthly_income: e.target.value.replace(/,/g, '')})} /></div>
              <div><label style={labelStyle}>Investment Experience</label><select style={inputStyle} value={formData.investment_experience} onChange={e => setFormData({...formData, investment_experience: e.target.value})}><option>Beginner</option><option>Intermediate</option><option>Pro</option></select></div>
              <div><label style={labelStyle}>Risk Profile</label><select style={inputStyle} value={formData.risk_profile} onChange={e => setFormData({...formData, risk_profile: e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></div>
              <div><label style={labelStyle}>PAN Card</label><input style={inputStyle} type="text" value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} /></div>
              <div><label style={labelStyle}>Aadhaar No.</label><input style={inputStyle} type="text" value={formData.aadhaar} onChange={e => setFormData({...formData, aadhaar: e.target.value})} /></div>
              <div><label style={labelStyle}>Mail ID</label><input style={inputStyle} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div><label style={labelStyle}>Nominee Name</label><input style={inputStyle} type="text" value={formData.nominee_name} onChange={e => setFormData({...formData, nominee_name: e.target.value})} /></div>
              <div><label style={labelStyle}>Nominee Relation</label><input style={inputStyle} type="text" value={formData.nominee_relation} onChange={e => setFormData({...formData, nominee_relation: e.target.value})} /></div>
              
              <div>
                <label style={labelStyle}>Nominee Mobile</label>
                <input 
                  style={inputStyle} 
                  type="text" 
                  maxLength="10"
                  value={formData.nominee_mobile} 
                  onChange={e => setFormData({...formData, nominee_mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)})} 
                  placeholder="Optional 10-digit number"
                />
              </div>

              <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Client Notes</label><textarea style={{...inputStyle, height: '60px'}} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
            </div>

          </div>
          
          <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
             <button type="submit" className="btn-primary" style={{padding: '12px 30px', background: isEditing ? '#f59e0b' : '#38bdf8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>{isEditing ? "Update Client" : "Add Client"}</button>
             {isEditing && <button type="button" onClick={() => {setIsEditing(false); setFormData(initialState); fetchClients();}} style={{padding: '12px 20px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontWeight: 'bold'}}>Cancel Edit</button>}
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '15px 12px', textAlign: 'left', color: '#475569' }}>ID</th>
              <th style={{ padding: '15px 12px', textAlign: 'left', color: '#475569' }}>Name</th>
              <th style={{ padding: '15px 12px', textAlign: 'left', color: '#475569' }}>Mobile</th>
              <th style={{ padding: '15px 12px', textAlign: 'left', color: '#475569' }}>Onboarded On</th>
              <th style={{ padding: '15px 12px', textAlign: 'center', color: '#475569' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#38bdf8' }}>{c.client_code}</td>
                <td style={{ padding: '12px', fontWeight: '500' }}>{c.full_name}</td>
                <td style={{ padding: '12px' }}>{c.mobile_number}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{formatDateForDisplay(c.onboarding_date)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(c)} style={{ border: 'none', color: '#38bdf8', background: 'none', cursor: 'pointer', marginRight: '15px', fontWeight: '600' }}>Edit</button>
                  <button onClick={async () => { 
                    if(window.confirm("Delete permanently?")) { 
                      try {
                        await api.delete(`/clients/${c.id}`); 
                        fetchClients(); 
                      } catch (err) {
                        alert("Failed to delete.");
                      }
                    }
                  }} style={{ border: 'none', color: '#ef4444', background: 'none', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
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
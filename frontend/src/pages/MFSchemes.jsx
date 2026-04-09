import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; // 💡 Added toast

const MFSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const categories = {
    "Equity": ["Large Cap", "Mid Cap", "Small Cap", "Multi Cap", "Flexi Cap", "ELSS", "Sectoral/Thematic", "Focused", "Value/Contra"],
    "Debt": ["Liquid", "Overnight", "Ultra Short Duration", "Low Duration", "Money Market", "Corporate Bond", "Gilt", "Dynamic Bond"],
    "Hybrid": ["Aggressive Hybrid", "Balanced Advantage", "Multi Asset Allocation", "Arbitrage", "Equity Savings"],
    "Other": ["Index Fund", "ETF", "Fund of Funds", "Gold"]
  };

  const initialState = {
    scheme_name: '',
    amc_name: '',
    category: '',
    sub_category: '',
    large_cap: '',
    mid_cap: '',
    small_cap: '',
    debt_allocation: '',
    gold_allocation: '',
    commission_rate: '0.8',
    total_current_value: '' 
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => { fetchSchemes(); }, []);

  const fetchSchemes = async () => {
    try {
      const res = await api.get('/mf-schemes');
      setSchemes(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      console.error(err);
      toast.error("Failed to fetch MF Master data"); 
    }
  };

  const totalEquity = Number(formData.large_cap || 0) + Number(formData.mid_cap || 0) + Number(formData.small_cap || 0);
  const grandTotal = totalEquity + Number(formData.debt_allocation || 0) + Number(formData.gold_allocation || 0);

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Number(val) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (grandTotal !== 100) {
      return toast.warn(`⚠️ Allocation must be exactly 100%. Current: ${grandTotal}%`);
    }

    const url = isEditing ? `/mf-schemes/${editingId}` : `/mf-schemes`;

    const payload = {
        ...formData,
        large_cap: formData.large_cap || 0,
        mid_cap: formData.mid_cap || 0,
        small_cap: formData.small_cap || 0,
        debt_allocation: formData.debt_allocation || 0,
        gold_allocation: formData.gold_allocation || 0,
        commission_rate: formData.commission_rate || 0.8,
        total_current_value: formData.total_current_value || 0
    };

    try {
      if (isEditing) {
        await api.put(url, payload);
        toast.success("✅ Scheme Updated Successfully");
      } else {
        await api.post(url, payload);
        toast.success("✅ New Scheme Added to Master");
      }
      
      setIsEditing(false); 
      setEditingId(null); 
      setFormData(initialState);
      fetchSchemes();
      
    } catch (err) { 
      toast.error(err.response?.data?.error || "❌ Network Error saving scheme"); 
    }
  };

  const handleEdit = (s) => {
    setIsEditing(true); 
    setEditingId(s.id);
    
    setFormData({
      scheme_name: s.scheme_name || '', 
      amc_name: s.amc_name || '',
      category: s.category || '', 
      sub_category: s.sub_category || '',
      large_cap: s.large_cap ?? '', 
      mid_cap: s.mid_cap ?? '',
      small_cap: s.small_cap ?? '', 
      debt_allocation: s.debt_allocation ?? '',
      gold_allocation: s.gold_allocation ?? '',
      commission_rate: s.commission_rate ?? '0.8',
      total_current_value: s.total_current_value ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    // Custom logic: We use toast for info but confirm for destructive actions
    if (window.confirm("Permanently delete this scheme from Master?")) {
      try {
        await api.delete(`/mf-schemes/${id}`);
        toast.info("Scheme removed");
        fetchSchemes();
      } catch (err) {
        console.error("Delete error", err);
        toast.error("Failed to delete scheme");
      }
    }
  };

  const filteredSchemes = schemes.filter(s => 
    s.amc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.scheme_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labelStyle = { display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '11px', color: '#475569' };
  const inputStyle = { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px' };

  return (
    <div className="container">
      <h1 className="title">Mutual Fund Master</h1>

      <div className="card" style={{ borderTop: isEditing ? '4px solid #f59e0b' : '4px solid #6366f1', marginBottom: '30px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
            <div><label style={labelStyle}>AMC Name *</label><input style={inputStyle} value={formData.amc_name} onChange={e => setFormData({...formData, amc_name: e.target.value})} required /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Scheme Name *</label><input style={inputStyle} value={formData.scheme_name} onChange={e => setFormData({...formData, scheme_name: e.target.value})} required /></div>
            
            <div>
              <label style={labelStyle}>Category *</label>
              <select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, sub_category: ''})} required>
                <option value="">Select Category</option>
                {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Sub-Category *</label>
              <select style={inputStyle} value={formData.sub_category} onChange={e => setFormData({...formData, sub_category: e.target.value})} required disabled={!formData.category}>
                <option value="">Select Sub-Category</option>
                {formData.category && categories[formData.category].map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>

            <div>
                <label style={{...labelStyle, color: '#6366f1'}}>Commission Rate (%)</label>
                <input style={{...inputStyle, borderColor: '#6366f1'}} type="number" step="any" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
             <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #3b82f6' }}>
                <label style={{...labelStyle, color: '#1e40af'}}>Total Business Market Value (₹)</label>
                <input 
                    style={{...inputStyle, fontSize: '16px', fontWeight: 'bold'}} 
                    type="number" 
                    step="any"
                    value={formData.total_current_value} 
                    onChange={e => setFormData({...formData, total_current_value: e.target.value})} 
                    placeholder="Enter aggregate from portal"
                />
                <small style={{display:'block', marginTop: '5px', color: '#60a5fa', fontSize: '10px'}}>Total AUM for this fund across all clients</small>
             </div>

             <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    <div><label style={labelStyle}>Large Cap %</label><input style={inputStyle} type="number" step="any" value={formData.large_cap} onChange={e => setFormData({...formData, large_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Mid Cap %</label><input style={inputStyle} type="number" step="any" value={formData.mid_cap} onChange={e => setFormData({...formData, mid_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Small Cap %</label><input style={inputStyle} type="number" step="any" value={formData.small_cap} onChange={e => setFormData({...formData, small_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Debt %</label><input style={inputStyle} type="number" step="any" value={formData.debt_allocation} onChange={e => setFormData({...formData, debt_allocation: e.target.value})} /></div>
                    <div><label style={labelStyle}>Gold %</label><input style={inputStyle} type="number" step="any" value={formData.gold_allocation} onChange={e => setFormData({...formData, gold_allocation: e.target.value})} /></div>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Equity: <strong>{totalEquity}%</strong></span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: grandTotal === 100 ? '#10b981' : '#ef4444' }}>Grand Total: {grandTotal}%</span>
                </div>
             </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '20px', padding: '12px 40px', background: isEditing ? '#f59e0b' : '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{isEditing ? "Update Scheme" : "Add Scheme"}</button>
          {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData(initialState); }} style={{ marginLeft: '10px', color: '#64748b', cursor:'pointer', border:'none', background:'none', fontWeight: 'bold' }}>Cancel</button>}
        </form>
      </div>

      <div style={{ marginBottom: '15px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🔍</span>
        <input type="text" placeholder="Search Master..." style={{ width: '100%', border: 'none', outline: 'none' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>AMC / Scheme</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Comm. %</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Total Market Value</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchemes.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px' }}><strong>{s.amc_name}</strong><br/><span style={{color: '#64748b'}}>{s.scheme_name}</span></td>
                <td style={{ padding: '12px' }}>{s.category}<br/><small style={{color: '#94a3b8'}}>{s.sub_category}</small></td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight:'600', color: '#6366f1' }}>{s.commission_rate || '0.8'}%</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#1e40af' }}>₹{formatINR(s.total_current_value)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(s)} style={{ border: 'none', color: '#6366f1', background: 'none', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>Edit</button>
                  <button onClick={() => handleDelete(s.id)} style={{ border: 'none', color: '#ef4444', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MFSchemes;
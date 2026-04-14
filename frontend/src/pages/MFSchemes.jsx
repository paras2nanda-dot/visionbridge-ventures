/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 

const MFSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false); 

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

    setIsSaving(true); 
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
    } finally {
      setIsSaving(false); 
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

  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.3px' };
  
  /* 🪄 Stripped explicit borders, background, and color to let index.css take over */
  const inputStyle = { width: '100%', padding: '12px', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease' };

  return (
    <div className="container fade-in">
      <h1 className="title" style={{ color: 'var(--text-main)', fontWeight: '800' }}>Mutual Fund Master</h1>

      <div className="card" style={{ borderTop: `4px solid ${isEditing ? '#f59e0b' : '#6366f1'}`, marginBottom: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div><label style={labelStyle}>AMC Name *</label><input style={inputStyle} value={formData.amc_name} onChange={e => setFormData({...formData, amc_name: e.target.value})} required /></div>
            <div><label style={labelStyle}>Scheme Name *</label><input style={inputStyle} value={formData.scheme_name} onChange={e => setFormData({...formData, scheme_name: e.target.value})} required /></div>
            
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
                {/* Need inline border override here just to highlight commission field */}
                <input style={{...inputStyle, border: '1px solid rgba(99, 102, 241, 0.4) !important'}} type="number" step="any" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* 💎 Hero Metric Tile: Total AUM */}
              <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                <label style={{...labelStyle, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px'}}>Total Market Value (₹)</label>
                <input 
                    style={{...inputStyle, fontSize: '22px', fontWeight: '900', background: 'transparent !important', border: 'none !important', padding: '0', marginTop: '8px'}} 
                    type="number" 
                    step="any"
                    value={formData.total_current_value} 
                    onChange={e => setFormData({...formData, total_current_value: e.target.value})} 
                    placeholder="0.00"
                />
                <div style={{marginTop: '12px', padding: '8px 12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', display: 'inline-block'}}>
                  <span style={{color: '#6366f1', fontSize: '10px', fontWeight: '800'}}>AGGREGATE PORTFOLIO VALUE</span>
                </div>
              </div>

              {/* 📊 Allocation Dashboard Section */}
              <div style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '12px' }}>
                    <div><label style={labelStyle}>Large %</label><input style={{...inputStyle, padding: '8px'}} type="number" step="any" value={formData.large_cap} onChange={e => setFormData({...formData, large_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Mid %</label><input style={{...inputStyle, padding: '8px'}} type="number" step="any" value={formData.mid_cap} onChange={e => setFormData({...formData, mid_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Small %</label><input style={{...inputStyle, padding: '8px'}} type="number" step="any" value={formData.small_cap} onChange={e => setFormData({...formData, small_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Debt %</label><input style={{...inputStyle, padding: '8px'}} type="number" step="any" value={formData.debt_allocation} onChange={e => setFormData({...formData, debt_allocation: e.target.value})} /></div>
                    <div><label style={labelStyle}>Gold %</label><input style={{...inputStyle, padding: '8px'}} type="number" step="any" value={formData.gold_allocation} onChange={e => setFormData({...formData, gold_allocation: e.target.value})} /></div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>EQUITY CONCENTRATION: <strong style={{color: 'var(--text-main)'}}>{totalEquity}%</strong></span>
                    <div style={{ 
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '900', 
                      background: grandTotal === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: grandTotal === 100 ? '#10b981' : '#ef4444',
                      border: `1px solid ${grandTotal === 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                      TOTAL: {grandTotal}%
                    </div>
                </div>
              </div>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="submit" disabled={isSaving} style={{ padding: '12px 48px', background: isEditing ? '#f59e0b' : '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: '800', flex: '1 1 auto', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}>
              {isSaving ? (isEditing ? "Updating..." : "Adding Scheme...") : (isEditing ? "Update Master Scheme" : "Register New Scheme")}
            </button>
            {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData(initialState); }} style={{ padding: '12px 24px', color: 'var(--text-muted)', cursor:'pointer', border:'1px solid var(--border)', background:'transparent', borderRadius: '8px', fontWeight: '800' }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '500px', width: '100%' }}>
        <input type="text" placeholder="Search mutual fund master..." style={{ ...inputStyle, paddingLeft: '40px', borderRadius: '12px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
      </div>

      <div className="card" style={{ padding: '0', background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(248, 250, 252, 0.5)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '700' }}>AMC / SCHEME</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '700' }}>CATEGORY</th>
                <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '700' }}>COMM %</th>
                <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL MARKET VALUE</th>
                <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemes.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '14px 16px' }}><strong style={{color: 'var(--text-main)', fontSize: '14px'}}>{s.amc_name}</strong><br/><span style={{color: 'var(--text-muted)', fontSize: '11px'}}>{s.scheme_name}</span></td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-main)' }}>{s.category}<br/><small style={{color: 'var(--text-muted)', fontWeight: '600'}}>{s.sub_category}</small></td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight:'800', color: '#6366f1' }}>{s.commission_rate || '0.8'}%</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>₹{formatINR(s.total_current_value)}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button onClick={() => handleEdit(s)} style={{ border: 'none', color: '#6366f1', background: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '12px', marginRight: '12px' }}>EDIT</button>
                    <button onClick={() => handleDelete(s.id)} style={{ border: 'none', color: '#ef4444', background: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>DELETE</button>
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

export default MFSchemes;
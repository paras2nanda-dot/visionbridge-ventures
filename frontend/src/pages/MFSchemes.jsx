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

  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '800', fontSize: '13px', color: 'var(--text-main)', letterSpacing: '0.5px' };
  const inputStyle = { width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', border: '2.5px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '600' };

  return (
    <div className="container fade-in" style={{ paddingBottom: '50px' }}>
      <h1 className="title" style={{ color: 'var(--text-main)', fontWeight: '900', fontSize: '32px', marginBottom: '30px' }}>Mutual Fund Master</h1>

      <div className="card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '2.5px solid var(--border)', boxShadow: '6px 6px 0px rgba(0,0,0,0.1)', marginBottom: '40px', position: 'relative' }}>
        
        {/* State Indicator */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isEditing ? '#f59e0b' : '#38bdf8', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}></div>

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
                <label style={{...labelStyle, color: '#38bdf8'}}>Commission Rate (%)</label>
                <input style={{...inputStyle, border: '2.5px solid rgba(56, 189, 248, 0.4)'}} type="number" step="any" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div style={{ padding: '20px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', border: '2.5px solid rgba(56, 189, 248, 0.3)' }}>
                <label style={{...labelStyle, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px'}}>Total Market Value (₹)</label>
                <input 
                    style={{...inputStyle, fontSize: '24px', fontWeight: '900', background: 'transparent', border: 'none', padding: '0', marginTop: '8px'}} 
                    type="number" 
                    step="any"
                    value={formData.total_current_value} 
                    onChange={e => setFormData({...formData, total_current_value: e.target.value})} 
                    placeholder="0.00"
                />
                <div style={{marginTop: '12px', padding: '8px 12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', display: 'inline-block'}}>
                  <span style={{color: '#38bdf8', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px'}}>AGGREGATE PORTFOLIO VALUE</span>
                </div>
              </div>

              <div style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: '12px', border: '2.5px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '12px' }}>
                    <div><label style={labelStyle}>Large %</label><input style={{...inputStyle, padding: '10px'}} type="number" step="any" value={formData.large_cap} onChange={e => setFormData({...formData, large_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Mid %</label><input style={{...inputStyle, padding: '10px'}} type="number" step="any" value={formData.mid_cap} onChange={e => setFormData({...formData, mid_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Small %</label><input style={{...inputStyle, padding: '10px'}} type="number" step="any" value={formData.small_cap} onChange={e => setFormData({...formData, small_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Debt %</label><input style={{...inputStyle, padding: '10px'}} type="number" step="any" value={formData.debt_allocation} onChange={e => setFormData({...formData, debt_allocation: e.target.value})} /></div>
                    <div><label style={labelStyle}>Gold %</label><input style={{...inputStyle, padding: '10px'}} type="number" step="any" value={formData.gold_allocation} onChange={e => setFormData({...formData, gold_allocation: e.target.value})} /></div>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800' }}>EQUITY CONCENTRATION: <strong style={{color: 'var(--text-main)'}}>{totalEquity}%</strong></span>
                    <div style={{ 
                      padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '900', 
                      background: grandTotal === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: grandTotal === 100 ? '#10b981' : '#ef4444',
                      border: `1.5px solid ${grandTotal === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      TOTAL: {grandTotal}%
                    </div>
                </div>
              </div>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <button type="submit" disabled={isSaving} style={{ padding: '12px 32px', background: isEditing ? '#f59e0b' : '#38bdf8', color: 'white', border: '2.5px solid #000', borderRadius: '10px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: '900', letterSpacing: '0.5px' }}>
              {isSaving ? (isEditing ? "UPDATING..." : "ADDING SCHEME...") : (isEditing ? "UPDATE MASTER SCHEME" : "REGISTER NEW SCHEME")}
            </button>
            {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData(initialState); }} style={{ padding: '12px 24px', borderRadius: '10px', border: '2.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '900', letterSpacing: '0.5px' }}>CANCEL</button>}
          </div>
        </form>
      </div>

      {/* 🔍 SEARCH BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ position: 'relative', maxWidth: '500px', width: '100%' }}>
          <input 
            type="text" 
            placeholder="Search mutual fund master..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ 
                ...inputStyle, 
                paddingLeft: '55px', 
                textIndent: '10px' 
            }} 
          />
          <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7, fontSize: '20px', pointerEvents: 'none' }}>🔍</span>
        </div>
      </div>

      {/* SCHEMES TABLE */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '2.5px solid var(--border)', overflow: 'hidden', boxShadow: '6px 6px 0px rgba(0,0,0,0.1)' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.03)', borderBottom: '2.5px solid var(--border)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-main)', fontWeight: '900' }}>AMC / Scheme</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-main)', fontWeight: '900' }}>Category</th>
                <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '900' }}>Comm %</th>
                <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '900' }}>Total Market Value</th>
                <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-main)', fontWeight: '900' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemes.map(s => (
                <tr key={s.id} style={{ borderBottom: '2px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px' }}><strong style={{color: 'var(--text-main)', fontSize: '15px', fontWeight: '900'}}>{s.amc_name}</strong><br/><span style={{color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700'}}>{s.scheme_name}</span></td>
                  <td style={{ padding: '16px', color: 'var(--text-main)' }}><span style={{fontWeight: '800'}}>{s.category}</span><br/><span style={{color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700'}}>{s.sub_category}</span></td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight:'900', color: '#38bdf8' }}>{s.commission_rate || '0.8'}%</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', color: '#10b981' }}>₹{formatINR(s.total_current_value)}</td>
                  <td style={{ padding: '16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button onClick={() => handleEdit(s)} style={{ border: 'none', color: '#38bdf8', background: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '11px', marginRight: '16px', textTransform: 'uppercase' }}>EDIT</button>
                    <button onClick={() => handleDelete(s.id)} style={{ border: 'none', color: '#ef4444', background: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}>DELETE</button>
                  </td>
                </tr>
              ))}
              {filteredSchemes.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800' }}>No schemes found in master database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MFSchemes;
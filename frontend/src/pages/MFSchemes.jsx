/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 
import { Search, Trash2, Edit, Check, X, PlusCircle } from 'lucide-react';

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
      return toast.warn(`Allocation must be exactly 100%. Current: ${grandTotal}%`);
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
        toast.success("Scheme Updated Successfully");
      } else {
        await api.post(url, payload);
        toast.success("New Scheme Added to Master");
      }
      
      setIsEditing(false); 
      setEditingId(null); 
      setFormData(initialState);
      fetchSchemes();
      
    } catch (err) { 
      toast.error(err.response?.data?.error || "Network Error saving scheme"); 
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

  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '0.3px' };
  const inputStyle = { width: '100%', padding: '14px 16px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' };

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
      
      {/* 🚀 Giant "Mutual Fund Master" title removed to rely on clean breadcrumbs */}

      <div className="card" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        
        {/* State Indicator */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isEditing ? '#f59e0b' : '#0284c7' }}></div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
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
                <label style={{...labelStyle, color: '#0284c7'}}>Commission Rate (%)</label>
                <input style={{...inputStyle, border: '1px solid rgba(2, 132, 199, 0.4)'}} type="number" step="any" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div style={{ padding: '24px', background: 'rgba(2, 132, 199, 0.04)', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                <label style={{...labelStyle, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Market Value (₹)</label>
                <input 
                    style={{...inputStyle, fontSize: '24px', fontWeight: '800', background: 'transparent', border: 'none', padding: '0', marginTop: '8px', outline: 'none', boxShadow: 'none'}} 
                    type="number" 
                    step="any"
                    value={formData.total_current_value} 
                    onChange={e => setFormData({...formData, total_current_value: e.target.value})} 
                    placeholder="0.00"
                />
                <div style={{marginTop: '16px', padding: '8px 12px', background: 'rgba(2, 132, 199, 0.1)', borderRadius: '8px', display: 'inline-block'}}>
                  <span style={{color: '#0284c7', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px'}}>AGGREGATE PORTFOLIO VALUE</span>
                </div>
              </div>

              <div style={{ padding: '24px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '16px' }}>
                    <div><label style={labelStyle}>Large %</label><input style={{...inputStyle, padding: '12px'}} type="number" step="any" value={formData.large_cap} onChange={e => setFormData({...formData, large_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Mid %</label><input style={{...inputStyle, padding: '12px'}} type="number" step="any" value={formData.mid_cap} onChange={e => setFormData({...formData, mid_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Small %</label><input style={{...inputStyle, padding: '12px'}} type="number" step="any" value={formData.small_cap} onChange={e => setFormData({...formData, small_cap: e.target.value})} /></div>
                    <div><label style={labelStyle}>Debt %</label><input style={{...inputStyle, padding: '12px'}} type="number" step="any" value={formData.debt_allocation} onChange={e => setFormData({...formData, debt_allocation: e.target.value})} /></div>
                    <div><label style={labelStyle}>Gold %</label><input style={{...inputStyle, padding: '12px'}} type="number" step="any" value={formData.gold_allocation} onChange={e => setFormData({...formData, gold_allocation: e.target.value})} /></div>
                </div>
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>EQUITY CONCENTRATION: <strong style={{color: 'var(--text-main)'}}>{totalEquity}%</strong></span>
                    <div style={{ 
                      padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', 
                      background: grandTotal === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: grandTotal === 100 ? '#10b981' : '#ef4444',
                      border: `1px solid ${grandTotal === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      TOTAL ALLOCATION: {grandTotal}%
                    </div>
                </div>
              </div>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <button 
              type="submit" 
              disabled={isSaving} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', 
                background: isEditing ? '#f59e0b' : '#0284c7', 
                color: 'white', 
                border: '1px solid transparent', 
                borderRadius: '10px', cursor: isSaving ? 'not-allowed' : 'pointer', 
                fontWeight: '800', letterSpacing: '0.5px', transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}>
              {isSaving ? (isEditing ? "UPDATING..." : "ADDING SCHEME...") : (isEditing ? <><Check size={18}/> UPDATE SCHEME</> : <><PlusCircle size={18}/> REGISTER SCHEME</>)}
            </button>
            {isEditing && (
              <button 
                type="button" 
                onClick={() => { setIsEditing(false); setFormData(initialState); }} 
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

      {/* 🔍 SEARCH BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', maxWidth: '500px', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search mutual fund master..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ ...inputStyle, paddingLeft: '44px', borderRadius: '12px' }} 
          />
        </div>
      </div>

      {/* SCHEMES TABLE */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)' }}>
                <th style={thStyle}>AMC / Scheme</th>
                <th style={thStyle}>Category</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Comm %</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total Market Value</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemes.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-main)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px' }}>
                    <strong style={{color: 'var(--text-main)', fontSize: '15px', fontWeight: '800'}}>{s.amc_name}</strong><br/>
                    <span style={{color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600'}}>{s.scheme_name}</span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-main)' }}>
                    <span style={{fontWeight: '700'}}>{s.category}</span><br/>
                    <span style={{color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600'}}>{s.sub_category}</span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight:'800', color: '#0284c7' }}>{s.commission_rate || '0.8'}%</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>₹{formatINR(s.total_current_value)}</td>
                  <td style={{ padding: '16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleEdit(s)} style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'opacity 0.2s' }} title="Edit Scheme" onMouseOver={(e) => e.currentTarget.style.opacity = 0.7} onMouseOut={(e) => e.currentTarget.style.opacity = 1}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', margin: '0 4px', transition: 'opacity 0.2s' }} title="Delete Scheme" onMouseOver={(e) => e.currentTarget.style.opacity = 0.7} onMouseOut={(e) => e.currentTarget.style.opacity = 1}>
                        <Trash2 size={18} />
                      </button>
                  </td>
                </tr>
              ))}
              {filteredSchemes.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>No schemes found in master database.</td>
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
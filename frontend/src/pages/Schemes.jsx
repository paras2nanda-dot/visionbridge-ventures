/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const Schemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialState = {
    amc_name: '', scheme_name: '', category: 'Equity', sub_category: 'Multi Cap',
    commission_rate: '0.8', large_cap: '0', mid_cap: '0', small_cap: '0',
    debt_allocation: '0', gold_allocation: '0', total_current_value: ''
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => { fetchSchemes(); }, []);

  const fetchSchemes = async () => {
    try {
      const res = await api.get('/mf-schemes');
      setSchemes(res.data || []);
    } catch (e) { toast.error("Failed to load schemes"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Logic check: Sum of allocations should ideally be 100, but we'll allow flexible entry
    const payload = { ...formData };
    
    try {
      if (isEditing) {
        await api.put(`/mf-schemes/${editingId}`, payload);
        toast.success("✅ Scheme Updated");
      } else {
        await api.post('/mf-schemes', payload);
        toast.success("✅ Scheme Added");
      }
      setFormData(initialState);
      setIsEditing(false);
      fetchSchemes();
    } catch (err) {
      toast.error(err.response?.data?.error || "Save Error");
    }
  };

  const handleEdit = (s) => {
    setIsEditing(true);
    setEditingId(s.id);
    setFormData({ ...s });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this scheme?")) {
      try {
        await api.delete(`/mf-schemes/${id}`);
        toast.success("🗑️ Deleted");
        fetchSchemes();
      } catch (e) { toast.error("Delete failed"); }
    }
  };

  return (
    <div className="container fade-in">
      <h2 className="title" style={{ fontSize: '32px', marginBottom: '30px' }}>Mutual Fund Master</h2>

      {/* FORM SECTION */}
      <div className="card" style={{ padding: '30px', marginBottom: '40px', borderTop: isEditing ? '4px solid #f59e0b' : '4px solid #6366f1' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div><label style={{ fontWeight: '800', fontSize: '12px' }}>AMC Name *</label>
              <input style={{ width: '100%', padding: '12px' }} value={formData.amc_name} onChange={e => setFormData({ ...formData, amc_name: e.target.value.toUpperCase() })} placeholder="e.g. HDFC" required />
            </div>
            <div><label style={{ fontWeight: '800', fontSize: '12px' }}>Scheme Name *</label>
              <input style={{ width: '100%', padding: '12px' }} value={formData.scheme_name} onChange={e => setFormData({ ...formData, scheme_name: e.target.value })} placeholder="e.g. Flexi Cap Fund" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div><label style={{ fontWeight: '800', fontSize: '12px' }}>Category *</label>
              <select style={{ width: '100%', padding: '12px' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                <option value="Equity">Equity</option>
                <option value="Debt">Debt</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Commodity">Commodity</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div><label style={{ fontWeight: '800', fontSize: '12px' }}>Sub-Category *</label>
              <select style={{ width: '100%', padding: '12px' }} value={formData.sub_category} onChange={e => setFormData({ ...formData, sub_category: e.target.value })}>
                <option value="Multi Cap">Multi Cap</option>
                <option value="Flexi Cap">Flexi Cap</option>
                <option value="Large Cap">Large Cap</option>
                <option value="Mid Cap">Mid Cap</option>
                <option value="Small Cap">Small Cap</option>
                <option value="Liquid">Liquid</option>
                <option value="Gold">Gold</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div><label style={{ fontWeight: '800', fontSize: '12px', color: '#6366f1' }}>Commission Rate (%)</label>
              <input type="number" step="0.01" style={{ width: '100%', padding: '12px' }} value={formData.commission_rate} onChange={e => setFormData({ ...formData, commission_rate: e.target.value })} />
            </div>
          </div>

          {/* ALLOCATION BARS */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '30px' }}>
            {['large_cap', 'mid_cap', 'small_cap', 'debt_allocation', 'gold_allocation'].map(field => (
              <div key={field}>
                <label style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>{field.replace('_', ' ')} %</label>
                <input type="number" style={{ width: '100%', padding: '8px' }} value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button type="submit" style={{ padding: '12px 40px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
              {isEditing ? "Update Scheme" : "Add Scheme"}
            </button>
            {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData(initialState); }} style={{ padding: '12px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* TABLE SECTION */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ textAlign: 'left', padding: '15px' }}>AMC / Scheme</th>
              <th style={{ textAlign: 'left', padding: '15px' }}>Category</th>
              <th style={{ textAlign: 'center', padding: '15px' }}>Comm. %</th>
              <th style={{ textAlign: 'center', padding: '15px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {schemes.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontWeight: '800', color: '#1e293b' }}>{s.amc_name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{s.scheme_name}</div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{s.category}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.sub_category}</div>
                </td>
                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '800', color: '#6366f1' }}>
                  {s.commission_rate}%
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(s)} style={{ border: 'none', background: 'none', color: '#3b82f6', fontWeight: '800', cursor: 'pointer', marginRight: '15px' }}>Edit</button>
                  <button onClick={() => handleDelete(s.id)} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: '800', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Schemes;
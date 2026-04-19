/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 
import { Search, Trash2, Edit, Handshake, MapPin, IndianRupee, X, Check, BarChart3, Users, TrendingUp, FileText } from 'lucide-react';
import InvoiceManager from './Invoices/InvoiceManager'; // 🟢 NEW: Imported the invoice component

const SubDistributors = () => {
  // 🟢 NEW: Tab State
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'invoices'

  const [distributors, setDistributors] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Performance Drawer States
  const [showPerf, setShowPerf] = useState(false);
  const [perfData, setPerfData] = useState(null);
  const [activePartner, setActivePartner] = useState(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  const initialState = { name: '', code: '', location: '', split_percentage: 90 };
  const [formData, setFormData] = useState(initialState);

  useEffect(() => { fetchDistributors(); }, []);

  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sub-distributors');
      setDistributors(Array.isArray(res.data) ? res.data : []);
    } catch (err) { toast.error("Database Sync Error"); }
    finally { setLoading(false); }
  };

  const fetchPerformance = async (partner) => {
    setLoadingPerf(true);
    setActivePartner(partner);
    setShowPerf(true);
    try {
      const res = await api.get(`/sub-distributors/${partner.id}/performance`);
      setPerfData(res.data);
    } catch (err) {
      toast.error("Failed to load performance metrics");
      setShowPerf(false);
    } finally {
      setLoadingPerf(false);
    }
  };

  const handleDownloadPartnerReport = async (id, name) => {
    try {
      const response = await api.get(`/reports/sub-distributor/${id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("📊 Report Generated Successfully");
    } catch (err) {
      toast.error("Failed to generate partner report");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true); 
    try {
      if (isEditing) await api.put(`/sub-distributors/${editingId}`, formData);
      else await api.post(`/sub-distributors`, formData);
      toast.success("✅ Partner Record Updated");
      setIsEditing(false); setFormData(initialState); fetchDistributors();
    } catch (err) { toast.error("Error saving partner details"); }
    finally { setIsSaving(false); } 
  };

  const handleEdit = (d) => {
    setIsEditing(true);
    setEditingId(d.id);
    setFormData({ name: d.name, code: d.code, location: d.location, split_percentage: d.split_percentage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  const filtered = distributors.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' };
  const inputStyle = { width: '100%', padding: '14px 16px', fontSize: '14px', outline: 'none', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' };

  return (
    <div className="container fade-in" style={{ paddingBottom: '60px', maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
      
      {/* 🟢 NEW: TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '20px', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('list')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', 
            fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', 
            border: activeTab === 'list' ? '1px solid #0284c7' : '1px solid transparent', 
            background: activeTab === 'list' ? 'rgba(2, 132, 199, 0.1)' : 'transparent', 
            color: activeTab === 'list' ? '#0284c7' : 'var(--text-muted)' 
          }}
        >
          <Handshake size={18} /> Partner Directory
        </button>
        <button 
          onClick={() => setActiveTab('invoices')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', 
            fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', 
            border: activeTab === 'invoices' ? '1px solid #8b5cf6' : '1px solid transparent', 
            background: activeTab === 'invoices' ? 'rgba(139, 92, 246, 0.1)' : 'transparent', 
            color: activeTab === 'invoices' ? '#8b5cf6' : 'var(--text-muted)' 
          }}
        >
          <FileText size={18} /> Commission Invoices
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* FORM MODULE */}
          <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', fontWeight: '800' }}>
                <Handshake color="#0284c7" /> {isEditing ? 'Edit Partner Details' : 'Register New Sub-Distributor'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div><label style={labelStyle}>Partner Name *</label><input style={inputStyle} type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div><label style={labelStyle}>Distributor Code *</label><input style={inputStyle} type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required /></div>
                <div><label style={labelStyle}>Location</label><input style={inputStyle} type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                <div><label style={labelStyle}>Commission Split (%)</label><input style={inputStyle} type="number" step="0.01" value={formData.split_percentage} onChange={e => setFormData({...formData, split_percentage: e.target.value})} /></div>
              </div>
              <div style={{marginTop: '24px', display: 'flex', gap: '12px'}}>
                <button type="submit" disabled={isSaving} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px rgba(2, 132, 199, 0.3)' }}>
                    {isSaving ? 'PROCESSING...' : isEditing ? 'UPDATE PARTNER' : 'REGISTER PARTNER'}
                </button>
                {isEditing && <button type="button" onClick={() => {setIsEditing(false); setFormData(initialState);}} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '12px 28px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>CANCEL</button>}
              </div>
            </form>
          </div>

          {/* SEARCH & LIST */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input style={{ ...inputStyle, paddingLeft: '48px' }} placeholder="Search partners by name or code..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            {filtered.map(d => (
              <div key={d.id} style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border)', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ color: '#0284c7', fontWeight: '900', fontSize: '11px', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{d.code}</div>
                        <h4 style={{ margin: '6px 0', fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>{d.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>
                            <MapPin size={14} /> {d.location || 'Pan India'}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', padding: '10px 14px', borderRadius: '12px', fontWeight: '900', fontSize: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        {d.split_percentage}% Split
                    </div>
                </div>
                
                <div style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => fetchPerformance(d)}
                      style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '10px', border: 'none', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', cursor: 'pointer', fontWeight: '800', fontSize: '14px' }}>
                      <BarChart3 size={16} /> Performance
                    </button>
                    <button onClick={() => handleEdit(d)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Edit</button>
                    <button onClick={async () => { if(window.confirm("Remove this partner?")) { await api.delete(`/sub-distributors/${d.id}`); fetchDistributors(); } }} style={{ width: '48px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* PERFORMANCE SLIDE-OUT PANEL */}
          {showPerf && (
            <>
                <div onClick={() => setShowPerf(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000003 }}></div>
                <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '500px', background: 'var(--bg-card)', zIndex: 10000004, borderLeft: '1px solid var(--border)', padding: '40px', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.2)' }} className="slide-in-right">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <div style={{ color: '#0284c7', fontWeight: '900', fontSize: '12px', letterSpacing: '1px' }}>PERFORMANCE INSIGHTS</div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0' }}>{activePartner?.name}</h2>
                        </div>
                        <button onClick={() => setShowPerf(false)} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}><X size={20}/></button>
                    </div>

                    {loadingPerf ? (
                        <div style={{ padding: '60px 0', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)' }}>CALCULATING PAYOUTS...</div>
                    ) : (
                        <div className="fade-in">
                            {/* Summary Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
                                <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={14}/> Total AUM</div>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981' }}>₹{formatINR(perfData?.stats?.invested_aum)}</div>
                                </div>
                                <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><BarChart3 size={14}/> SIP Book</div>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR(perfData?.stats?.monthly_sip_book)}</div>
                                </div>
                                <div style={{ background: 'rgba(2, 132, 199, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(2, 132, 199, 0.2)', gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><IndianRupee size={16}/> Est. Monthly Payout ({activePartner?.split_percentage}%)</div>
                                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#0284c7' }}>₹{formatINR(perfData?.stats?.monthly_payout)}</div>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginTop: '8px' }}>Annualized: ₹{formatINR((perfData?.stats?.monthly_payout || 0) * 12)}</div>
                                </div>
                            </div>

                            <button 
                              onClick={() => handleDownloadPartnerReport(activePartner.id, activePartner.name)}
                              style={{ 
                                marginBottom: '40px', width: '100%', padding: '14px', borderRadius: '12px', 
                                background: '#0F172A', color: 'white', fontWeight: '800', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer',
                                border: 'none', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                              }}
                            >
                              <FileText size={18} /> Download Partner Client Report
                            </button>

                            {/* Client List */}
                            <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={18} color="#0284c7" /> Associated Clients ({perfData?.clients?.length || 0})</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {perfData?.clients?.map((c, i) => (
                                    <div key={i} style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>{c.full_name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{c.client_code}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>₹{formatINR(c.client_invested_aum)}</div>
                                            <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>Invested AUM</div>
                                        </div>
                                    </div>
                                ))}
                                {perfData?.clients?.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: '600', border: '1px dashed var(--border)', borderRadius: '16px' }}>No clients linked to this partner yet.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </>
          )}
        </>
      ) : (
        /* 🟢 NEW: RENDER INVOICE MANAGER WHEN TAB IS CLICKED */
        <InvoiceManager />
      )}

      <style>{`
        .slide-in-right {
            animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default SubDistributors;
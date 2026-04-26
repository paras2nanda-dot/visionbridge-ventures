import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  User, Briefcase, TrendingUp, Calendar, Shield, Users, 
  ArrowLeft, AlertCircle, PieChart as PieIcon, Activity, Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/dashboard/client/${id}`);
        setData(res.data);
      } catch (err) {
        toast.error("Failed to load client profile");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, navigate]);

  const formatINR = (val) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(val || 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--text-muted)', fontWeight: '800' }}>
      <Activity className="spin" style={{ marginRight: '10px' }} /> ANALYZING PORTFOLIO...
    </div>
  );
  
  if (!data) return null;

  const { profile, summary, portfolio, familyMembers, review_history } = data;

  return (
    <div className="container fade-in" style={{ padding: '24px', paddingBottom: '60px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} className="sidebar-action-btn" style={{ width: 'auto', padding: '8px', borderRadius: '50%', background: 'var(--bg-card)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: 'var(--text-main)' }}>{profile.full_name}</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '13px' }}>
            Client Code: {profile.client_code} • Joined {profile.since_formatted}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* LEFT: KYC & ASSETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '20px', color: '#0284c7', textTransform: 'uppercase' }}>
              <User size={18} /> Core KYC Details
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <DetailRow label="Age" value={`${profile.age} Years`} />
              <DetailRow label="Risk Profile" value={profile.risk_profile || 'Moderate'} highlight="#f59e0b" />
              <DetailRow label="PAN" value={profile.pan || 'N/A'} />
              <DetailRow label="Aadhaar" value={profile.aadhaar || 'N/A'} />
            </div>
          </div>

          <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', borderRadius: '16px', border: 'none' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '20px', color: 'rgba(255,255,255,0.8)' }}>
              <Briefcase size={18} /> TOTAL INVESTED
            </h3>
            <div style={{ fontSize: '32px', fontWeight: '900' }}>{formatINR(summary.totalAUM)}</div>
            <p style={{ opacity: 0.8, fontSize: '12px', fontWeight: '700', marginTop: '10px' }}>Active Monthly SIP: {formatINR(summary.totalSipBook)}</p>
          </div>
        </div>

        {/* MIDDLE: ALLOCATION CHART */}
        <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '20px', color: '#8b5cf6', textTransform: 'uppercase' }}>
            <PieIcon size={18} /> Portfolio Split
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={portfolio} dataKey="invested_amount" nameKey="scheme_name" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {portfolio.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: FAMILY & REVIEWS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '20px', color: '#f59e0b', textTransform: 'uppercase' }}>
              <Users size={18} /> Family Context
            </h3>
            {familyMembers.length > 0 ? familyMembers.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>{m.full_name}</span>
                <span style={{ fontWeight: '800', color: '#0284c7', fontSize: '13px' }}>{formatINR(m.summary.totalAUM)}</span>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No family linked.</p>}
          </div>

          <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '20px', color: '#10b981', textTransform: 'uppercase' }}>
              <Clock size={18} /> Past Reviews
            </h3>
            {review_history.length > 0 ? review_history.slice(0, 3).map(h => (
              <div key={h.id} style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)' }}>{new Date(h.review_date).toLocaleDateString('en-IN')}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{h.notes || "Standard Review Conducted"}</div>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No review history found.</p>}
          </div>
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const DetailRow = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{label}</span>
    <span style={{ fontWeight: '800', color: highlight || 'var(--text-main)' }}>{value}</span>
  </div>
);

export default ClientProfile;
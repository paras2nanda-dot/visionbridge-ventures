/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { toast } from 'react-toastify';

const BusinessDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/business')
      .then(res => { 
        setData(res.data); 
        setLoading(false); 
      })
      .catch((err) => { 
        toast.error("Analytics sync failed");
        setLoading(false); 
      });
  }, []);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: '700' }}>EXECUTING EXECUTIVE ANALYTICS...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444' }}>Dashboard data unavailable.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  // 🖼️ SVGs FOR THE BRONZE 3D BUTTONS
  const Icons = {
    Users: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    Wallet: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>,
    Trending: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    Growth: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m12 14 4-4 4 4"/><path d="M3 3v18h18"/></svg>,
    Revenue: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  };

  const MetricCard = ({ label, value, sub, icon, color, pulse }) => (
    <div className="card fade-in">
      <div style={{ position: 'absolute', top: '22px', right: '22px' }} className="icon-button-3d">{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
        {pulse && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '8px', boxShadow: '0 0 8px #10b981' }}></span>}
        {label}
      </div>
      <h2 style={{ fontSize: '28px', fontWeight: '800', color: color || '#0f172a', margin: '0', letterSpacing: '-0.02em' }}>{value}</h2>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>{sub}</div>
    </div>
  );

  return (
    <div className="fade-in" style={{ fontFamily: "'Inter', sans-serif", maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 🏙️ BRANDING HEADER (Exact from Image) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
        <div style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/></svg>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', letterSpacing: '-1.5px' }}>VisionBridge</h1>
      </div>

      <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', marginBottom: '35px' }}>Dashboard</h2>

      {/* 🔔 SIP END ALERT BANNER */}
      {data.sipsEndingSoon && data.sipsEndingSoon.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', padding: '20px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: '800', color: '#92400e', fontSize: '15px' }}>{data.sipsEndingSoon.length} SIP Renewal(s) Required</div>
            <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '700' }}>Next up: {data.sipsEndingSoon[0].full_name} ({data.sipsEndingSoon[0].scheme_name}) in {data.sipsEndingSoon[0].days_left} days.</div>
          </div>
        </div>
      )}

      {/* 🟦 ROW 1: BASE METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <MetricCard label="Total Clients" value={data.total_clients} sub="Master Database" icon={Icons.Users} />
        <MetricCard label="Total Active Clients" value={data.total_active_clients} sub="With Net Assets > 0" icon={Icons.Users} />
        <MetricCard label="Total Invested AUM" value={`₹${formatINR(data.total_invested_aum)}`} sub="Principal Cost Basis" icon={Icons.Wallet} />
        <MetricCard label="Market Value AUM" value={`₹${formatINR(data.market_value_aum)}`} sub="Current Portfolio Value" icon={Icons.Trending} color="#10b981" pulse />
        <MetricCard label="Monthly SIP Book" value={`₹${formatINR(data.monthly_sip_book)}`} sub="Active Recurring Flow" icon={Icons.Trending} />
      </div>

      {/* 🟧 ROW 2: FORECASTS & REVENUE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <MetricCard label="Expected AUM (12M)" value={`₹${formatINR(data.expected_aum_12m)}`} sub="Cost + 1Y SIP Inflow" icon={Icons.Growth} color="#f59e0b" />
        <MetricCard label="Avg. Assets / Client" value={`₹${formatINR(data.avg_assets_per_client)}`} sub="Per Active Investor" icon={Icons.Users} />
        <MetricCard label="Comm. (Invested)" value={`₹${formatINR(data.comm_inv_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_inv_annual)}`} icon={Icons.Revenue} color="#3b82f6" />
        <MetricCard label="Comm. (Market)" value={`₹${formatINR(data.comm_mkt_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_mkt_annual)}`} icon={Icons.Revenue} color="#3b82f6" pulse />
        <MetricCard label="Clients Onboarded" value={data.new_clients_30d} sub="Last 30 Days" icon={Icons.Users} />
      </div>

      {/* 🟨 BOTTOM ROW: INSIGHTS (Metallic Skin Applied) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px' }}>
        <div className="card">
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>🏆 Top Funds by Exposure</h3>
          {data.topFunds?.map((fund, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255,255,255,0.6)', marginBottom: '10px' }}>
              <div style={{ width: '30px', fontWeight: '800', color: '#3b82f6' }}>0{idx + 1}</div>
              <div style={{ flex: 1, fontWeight: '700' }}>{fund.scheme_name}</div>
              <div style={{ fontWeight: '900', color: '#10b981' }}>₹{formatINR(fund.invested_value)}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>🎂 Client Birthdays (7 Days)</h3>
          {data.upcomingBirthdays?.length > 0 ? data.upcomingBirthdays.map((client, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div>
                <div style={{ fontWeight: '700' }}>{client.full_name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', background: client.days_left === 0 ? '#fee2e2' : '#eff6ff', color: client.days_left === 0 ? '#ef4444' : '#3b82f6', padding: '6px 12px', borderRadius: '20px' }}>
                {client.days_left === 0 ? 'TODAY' : `${client.days_left}D LEFT`}
              </span>
            </div>
          )) : <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No birthdays this week</div>}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
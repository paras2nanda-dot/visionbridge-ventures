/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { toast } from 'react-toastify';

const BusinessDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 💡 Fetching data with logic preserved
    api.get('/dashboard/business')
      .then(res => { 
        setData(res.data); 
        setLoading(false); 
      })
      .catch((err) => { 
        console.error("Dashboard Fetch Error:", err);
        toast.error("Analytics sync failed");
        setLoading(false); 
      });
  }, []);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#64748b', fontSize: '16px', fontWeight: '800' }}>REBUILDING EXECUTIVE SUITE...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444' }}>❌ Connection Error.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  // 🖼️ COLORED SVGs FOR THE NAVY CARDS
  const Icons = {
    Users: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    Wallet: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>,
    Trending: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    Growth: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><path d="m12 14 4-4 4 4"/><path d="M3 3v18h18"/></svg>,
    Revenue: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  };

  const MetricCard = ({ label, value, sub, icon, figureColor, pulse }) => (
    <div className="card fade-in">
      <div style={{ position: 'absolute', top: '22px', right: '22px' }} className="icon-container-3d">{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', letterSpacing: '0.05em' }}>
        {pulse && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '8px', boxShadow: '0 0 12px #10b981' }}></span>}
        {label}
      </div>
      <h2 style={{ fontSize: '30px', fontWeight: '900', color: figureColor || '#ffffff', margin: '0', letterSpacing: '-0.04em' }}>{value}</h2>
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px', fontWeight: '700' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* 🏙️ BRANDING HEADER (Blue Logo + VisionBridge) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '45px' }}>
        <div style={{ width: '52px', height: '52px', background: 'linear-gradient(145deg, #1e3a8a, #1e40af)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(30, 58, 138, 0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/></svg>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-1.8px', margin: 0 }}>VisionBridge</h1>
      </div>

      <h2 style={{ fontSize: '38px', fontWeight: '950', color: 'var(--text-main)', marginBottom: '35px', letterSpacing: '-2px' }}>Dashboard</h2>

      {/* 🔔 SIP END ALERT (Preserved Logic) */}
      {data.sipsEndingSoon && data.sipsEndingSoon.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fdba74', borderRadius: '18px', padding: '22px', marginBottom: '35px', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: '0 8px 25px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: '900', color: '#92400e', fontSize: '16px' }}>{data.sipsEndingSoon.length} SIP Renewal(s) Required</div>
            <div style={{ fontSize: '13px', color: '#b45309', fontWeight: '700' }}>Next up: {data.sipsEndingSoon[0].full_name} for {data.sipsEndingSoon[0].scheme_name} in {data.sipsEndingSoon[0].days_left} days.</div>
          </div>
        </div>
      )}

      {/* 🟦 GRID ROW 1: 5 CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '22px', marginBottom: '22px' }}>
        <MetricCard label="Total Clients" value={data.total_clients} sub="Master Database" icon={Icons.Users} />
        <MetricCard label="Total Active Clients" value={data.total_active_clients} sub="Portfolio Value > 0" icon={Icons.Users} />
        <MetricCard label="Total Invested AUM" value={`₹${formatINR(data.total_invested_aum)}`} sub="Principal Cost" icon={Icons.Wallet} />
        <MetricCard label="Market Value AUM" value={`₹${formatINR(data.market_value_aum)}`} sub="Current Asset Value" icon={Icons.Trending} figureColor="#10b981" pulse />
        <MetricCard label="Monthly SIP Book" value={`₹${formatINR(data.monthly_sip_book)}`} sub="Recurring Inflow" icon={Icons.Trending} />
      </div>

      {/* 🟧 GRID ROW 2: 5 CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '22px', marginBottom: '50px' }}>
        <MetricCard label="Expected AUM (12M)" value={`₹${formatINR(data.expected_aum_12m)}`} sub="Projected Growth" icon={Icons.Growth} figureColor="#f59e0b" />
        <MetricCard label="Avg. Assets / Client" value={`₹${formatINR(data.avg_assets_per_client)}`} sub="Portfolio Quality" icon={Icons.Users} />
        <MetricCard label="Comm. (Invested)" value={`₹${formatINR(data.comm_inv_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_inv_annual)}`} icon={Icons.Revenue} figureColor="#38bdf8" />
        <MetricCard label="Comm. (Market)" value={`₹${formatINR(data.comm_mkt_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_mkt_annual)}`} icon={Icons.Revenue} figureColor="#38bdf8" pulse />
        <MetricCard label="Clients Onboarded" value={data.new_clients_30d} sub="Last 30 Days" icon={Icons.Users} />
      </div>

      {/* 🟨 BOTTOM ROW: INSIGHTS (Preserved Features) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '25px', fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>🏆 Top Funds by Exposure</h3>
          {data.topFunds?.map((fund, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 22px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', marginBottom: '12px' }}>
              <span style={{ fontWeight: '800', color: '#cbd5e1' }}>0{idx + 1} &nbsp; {fund.scheme_name}</span>
              <span style={{ fontWeight: '900', color: '#10b981' }}>₹{formatINR(fund.invested_value)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '25px', fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>🎂 Client Birthdays (7 Days)</h3>
          {data.upcomingBirthdays?.length > 0 ? data.upcomingBirthdays.map((client, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1.5px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontWeight: '800', color: '#ffffff' }}>{client.full_name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '900', background: client.days_left === 0 ? '#ef4444' : 'rgba(255,255,255,0.05)', color: '#ffffff', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {client.days_left === 0 ? 'TODAY' : `${client.days_left}d LEFT`}
              </span>
            </div>
          )) : <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No birthdays this week</div>}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
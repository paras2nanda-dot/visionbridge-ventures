/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { toast } from 'react-toastify';

const BusinessDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 💡 Fetching complete dashboard payload from backend
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

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#64748b', fontSize: '16px', fontWeight: '800' }}>REFINING METALLIC ANALYTICS...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444', fontWeight: '800' }}>❌ Connection Error.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  // 🖼️ WHITE-STROKE SVGs FOR THE BRONZE 3D BUTTONS
  const Icons = {
    Users: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    Wallet: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>,
    Trending: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    Growth: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4 4 4"/><path d="M3 3v18h18"/></svg>,
    Revenue: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  };

  const MetricCard = ({ label, value, sub, icon, color, pulse }) => (
    <div className="card fade-in">
      <div style={{ position: 'absolute', top: '22px', right: '22px' }} className="icon-button-executive">{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', letterSpacing: '0.05em' }}>
        {pulse && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '8px', boxShadow: '0 0 10px #10b981' }}></span>}
        {label}
      </div>
      <h2 style={{ fontSize: '32px', fontWeight: '900', color: color || '#0f172a', margin: '0', letterSpacing: '-0.04em' }}>{value}</h2>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', fontWeight: '700' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* 🏙️ BRANDING HEADER (Exact from Reference Image) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '45px' }}>
        <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(30, 58, 138, 0.3)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/></svg>
        </div>
        <h1 style={{ fontSize: '34px', fontWeight: '900', color: '#1e293b', letterSpacing: '-2px', margin: 0 }}>VisionBridge</h1>
      </div>

      <h2 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', marginBottom: '40px', letterSpacing: '-2.5px' }}>Dashboard</h2>

      {/* 🔔 SIP END ALERT BANNER */}
      {data.sipsEndingSoon && data.sipsEndingSoon.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '20px', padding: '24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '32px' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: '900', color: '#92400e', fontSize: '17px' }}>{data.sipsEndingSoon.length} SIP Renewal(s) Required</div>
            <div style={{ fontSize: '14px', color: '#b45309', fontWeight: '700' }}>Next up: {data.sipsEndingSoon[0].full_name} for {data.sipsEndingSoon[0].scheme_name} in {data.sipsEndingSoon[0].days_left} days.</div>
          </div>
        </div>
      )}

      {/* 🟦 GRID ROW 1: 5 CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <MetricCard label="Total Clients" value={data.total_clients} sub="Master Database" icon={Icons.Users} />
        <MetricCard label="Total Active Clients" value={data.total_active_clients} sub="With Net Assets > 0" icon={Icons.Users} />
        <MetricCard label="Total Invested AUM" value={`₹${formatINR(data.total_invested_aum)}`} sub="Principal Cost Basis" icon={Icons.Wallet} />
        <MetricCard label="Market Value AUM" value={`₹${formatINR(data.market_value_aum)}`} sub="Current Portfolio Value" icon={Icons.Trending} color="#10b981" pulse />
        <MetricCard label="Monthly SIP Book" value={`₹${formatINR(data.monthly_sip_book)}`} sub="Active Recurring Flow" icon={Icons.Trending} />
      </div>

      {/* 🟧 GRID ROW 2: 5 CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px', marginBottom: '50px' }}>
        <MetricCard label="Expected AUM (12M)" value={`₹${formatINR(data.expected_aum_12m)}`} sub="Cost + 1Y SIP Inflow" icon={Icons.Growth} color="#f59e0b" />
        <MetricCard label="Avg. Assets / Client" value={`₹${formatINR(data.avg_assets_per_client)}`} sub="Per Active Investor" icon={Icons.Users} />
        <MetricCard label="Comm. (Invested)" value={`₹${formatINR(data.comm_inv_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_inv_annual)}`} icon={Icons.Revenue} color="#3b82f6" />
        <MetricCard label="Comm. (Market)" value={`₹${formatINR(data.comm_mkt_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_mkt_annual)}`} icon={Icons.Revenue} color="#3b82f6" pulse />
        <MetricCard label="Clients Onboarded" value={data.new_clients_30d} sub="Last 30 Days" icon={Icons.Users} />
      </div>

      {/* 🟨 BOTTOM ROW: DETAILED INSIGHTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '35px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '30px', fontSize: '22px', fontWeight: '900' }}>🏆 Top Funds by Exposure</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {data.topFunds?.map((fund, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', background: 'rgba(255, 255, 255, 0.4)', border: '1.5px solid rgba(255,255,255,0.7)', borderRadius: '16px' }}>
                <span style={{ fontWeight: '800', color: '#334155', fontSize: '15px' }}>0{idx + 1} &nbsp; {fund.scheme_name}</span>
                <span style={{ fontWeight: '900', color: '#10b981', fontSize: '16px' }}>₹{formatINR(fund.invested_value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '30px', fontSize: '22px', fontWeight: '900' }}>🎂 Client Birthdays (7 Days)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.upcomingBirthdays?.length > 0 ? data.upcomingBirthdays.map((client, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1.5px solid rgba(0,0,0,0.06)' }}>
                <div>
                  <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px' }}>{client.full_name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '900', background: client.days_left === 0 ? '#fee2e2' : '#eff6ff', color: client.days_left === 0 ? '#ef4444' : '#3b82f6', padding: '8px 16px', borderRadius: '20px' }}>
                  {client.days_left === 0 ? 'TODAY' : `${client.days_left}d LEFT`}
                </span>
              </div>
            )) : <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '15px' }}>No birthdays this week</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
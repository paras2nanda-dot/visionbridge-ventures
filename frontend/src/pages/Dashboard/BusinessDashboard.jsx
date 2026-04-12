/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { toast } from 'react-toastify';

const BusinessDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🛡️ Safe Date Parser Helper (Preserved)
  const parseSafeDate = (dateStr) => {
    if (!dateStr || String(dateStr).trim() === "") return null;
    if (dateStr instanceof Date) return dateStr;
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    const parts = String(dateStr).split('-');
    if (parts.length === 3 && parts[2].length === 4) { 
      d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  // 🛡️ Safe Age Calculator Helper (Preserved)
  const calculateAge = (dobString) => {
    const birthDate = parseSafeDate(dobString);
    if (!birthDate) return "N/A";
    return Math.floor((new Date() - birthDate) / 31557600000);
  };

  useEffect(() => {
    api.get('/dashboard/business')
      .then(res => { 
        setData(res.data); 
        setLoading(false); 
      })
      .catch((err) => {
        console.error("Dashboard Sync Error:", err);
        toast.error("Analytics sync failed");
        setLoading(false); 
      });
  }, []);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#64748b', fontSize: '16px', fontWeight: '800' }}>LOADING EXECUTIVE ANALYTICS...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444' }}>❌ Connection Failure.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  // 🖼️ WHITE-STROKE ICONS FOR THE NAVY CARDS (Preserved)
  const Icons = {
    Users: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    Wallet: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>,
    Trending: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    Growth: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m12 14 4-4 4 4"/><path d="M3 3v18h18"/></svg>,
    Revenue: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  };

  const MetricCard = ({ label, value, sub, icon, figureColor, pulse }) => (
    <div className="card fade-in">
      <div style={{ position: 'absolute', top: '22px', right: '22px' }} className="icon-container-3d">{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', letterSpacing: '0.08em' }}>
        {pulse && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', marginRight: '10px', boxShadow: '0 0 12px #10b981' }}></span>}
        {label}
      </div>
      <h2 style={{ fontSize: '32px', fontWeight: '900', color: figureColor || '#ffffff', margin: '0', letterSpacing: '-0.04em' }}>{value}</h2>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', fontWeight: '700' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* 🚀 PRIMARY HEADER */}
      <h2 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', marginBottom: '35px', letterSpacing: '-2.5px' }}>Dashboard</h2>

      {/* 🔔 SIP END ALERT (Preserved) */}
      {data.sipsEndingSoon && data.sipsEndingSoon.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fdba74', borderRadius: '20px', padding: '24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
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
        <MetricCard label="Total Active Clients" value={data.total_active_clients} sub="Portfolio Value > 0" icon={Icons.Users} />
        <MetricCard label="Total Invested AUM" value={`₹${formatINR(data.total_invested_aum)}`} sub="Principal Cost" icon={Icons.Wallet} />
        <MetricCard label="Market Value AUM" value={`₹${formatINR(data.market_value_aum)}`} sub="Current Asset Value" icon={Icons.Trending} figureColor="#34d399" pulse />
        <MetricCard label="Monthly SIP Book" value={`₹${formatINR(data.monthly_sip_book)}`} sub="Recurring Inflow" icon={Icons.Trending} />
      </div>

      {/* 🟧 GRID ROW 2: 5 CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px', marginBottom: '50px' }}>
        <MetricCard label="Expected AUM (12M)" value={`₹${formatINR(data.expected_aum_12m)}`} sub="Projected Growth" icon={Icons.Growth} figureColor="#fbbf24" />
        <MetricCard label="Avg. Assets / Client" value={`₹${formatINR(data.avg_assets_per_client)}`} sub="Portfolio Quality" icon={Icons.Users} />
        <MetricCard label="Comm. (Invested)" value={`₹${formatINR(data.comm_inv_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_inv_annual)}`} icon={Icons.Revenue} figureColor="#60a5fa" />
        <MetricCard label="Comm. (Market)" value={`₹${formatINR(data.comm_mkt_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_mkt_annual)}`} icon={Icons.Revenue} figureColor="#60a5fa" pulse />
        <MetricCard label="Clients Onboarded" value={data.new_clients_30d} sub="Last 30 Days" icon={Icons.Users} />
      </div>

      {/* 🟨 BOTTOM ROW: INSIGHTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '35px' }}>
        
        {/* TOP FUNDS WITH PERCENTAGE LOGIC */}
        <div className="card">
          <h3 style={{ marginBottom: '30px', fontSize: '22px', fontWeight: '900' }}>🏆 Top Funds by Exposure</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {data.topFunds?.map((fund, idx) => {
              // Calculate % of Total Invested AUM
              const percentage = data.total_invested_aum > 0 
                ? ((Number(fund.invested_value) / Number(data.total_invested_aum)) * 100).toFixed(1) 
                : 0;

              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                  <span style={{ fontWeight: '800', color: '#cbd5e1', fontSize: '15px' }}>0{idx + 1} &nbsp; {fund.scheme_name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '900', color: '#34d399', fontSize: '16px' }}>₹{formatINR(fund.invested_value)}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginTop: '2px' }}>{percentage}% of AUM</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BIRTHDAYS (Preserved) */}
        <div className="card">
          <h3 style={{ marginBottom: '30px', fontSize: '22px', fontWeight: '900' }}>🎂 Client Birthdays (7 Days)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.upcomingBirthdays?.length > 0 ? data.upcomingBirthdays.map((client, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1.5px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontWeight: '800', color: '#ffffff' }}>{client.full_name}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '900', background: client.days_left === 0 ? '#ef4444' : 'rgba(255,255,255,0.05)', color: '#ffffff', padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
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
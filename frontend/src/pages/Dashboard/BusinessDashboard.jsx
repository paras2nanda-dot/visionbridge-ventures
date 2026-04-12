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

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#64748b', fontSize: '14px', letterSpacing: '1px' }}>RE-CALCULATING PORTFOLIO DATA...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444' }}>Dashboard data unavailable.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  // 🎨 PREMIUM THEME CONSTANTS
  const cardStyle = {
    background: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid rgba(226, 232, 240, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '145px',
    // Soft Multi-layered Shadow
    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
    transition: 'transform 0.2s ease',
    position: 'relative'
  };

  const iconContainerStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    opacity: 0.5
  };

  const labelStyle = { 
    fontSize: '12px', 
    fontWeight: '500', 
    color: '#64748b', 
    textTransform: 'capitalize', 
    letterSpacing: '0.01em', 
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const figureStyle = { 
    fontSize: '26px', 
    fontWeight: '700', 
    color: '#1e293b', 
    margin: '0',
    letterSpacing: '-0.02em'
  };

  const subTextStyle = { fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontWeight: '500' };

  // 🕯️ PULSE INDICATOR FOR LIVE DATA
  const Pulse = () => (
    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginRight: '6px', boxShadow: '0 0 8px #10b981' }}></span>
  );

  // 🖼️ ICON ASSETS (Inline SVGs)
  const Icons = {
    Users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    Wallet: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>,
    Trending: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    Growth: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4 4 4"/><path d="M3 3v18h18"/><path d="m12 10-4 4-4-4"/></svg>,
    Revenue: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  };

  return (
    <div className="fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🟦 ROW 1: BASE METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <div style={iconContainerStyle}>{Icons.Users}</div>
          <div style={labelStyle}>Total Clients</div>
          <h2 style={figureStyle}>{data.total_clients}</h2>
          <div style={subTextStyle}>Master Database</div>
        </div>

        <div style={cardStyle}>
          <div style={iconContainerStyle}>{Icons.Users}</div>
          <div style={labelStyle}>Total Active Clients</div>
          <h2 style={figureStyle}>{data.total_active_clients}</h2>
          <div style={subTextStyle}>With Portfolio Value</div>
        </div>

        <div style={cardStyle}>
          <div style={iconContainerStyle}>{Icons.Wallet}</div>
          <div style={labelStyle}>Total Invested AUM</div>
          <h2 style={figureStyle}>₹{formatINR(data.total_invested_aum)}</h2>
          <div style={subTextStyle}>Principal Cost Basis</div>
        </div>

        <div style={cardStyle}>
          <div style={iconContainerStyle}>{Icons.Trending}</div>
          <div style={labelStyle}><Pulse />Market Value AUM</div>
          <h2 style={figureStyle}><span style={{color: '#10b981'}}>₹{formatINR(data.market_value_aum)}</span></h2>
          <div style={subTextStyle}>Current Asset Value</div>
        </div>

        <div style={cardStyle}>
          <div style={iconContainerStyle}>{Icons.Trending}</div>
          <div style={labelStyle}>Monthly SIP Book</div>
          <h2 style={figureStyle}>₹{formatINR(data.monthly_sip_book)}</h2>
          <div style={subTextStyle}>Active Recurring Flow</div>
        </div>
      </div>

      {/* 🟧 ROW 2: FORECASTS & REVENUE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <div style={iconContainerStyle}>{Icons.Growth}</div>
          <div style={labelStyle}>Expected AUM (12M)</div>
          <h2 style={figureStyle}>₹{formatINR(data.expected_aum_12m)}</h2>
          <div style={subTextStyle}>Projected Growth</div>
        </div>

        <div style={cardStyle}>
          <div style={iconContainerStyle}>{Icons.Users}</div>
          <div style={labelStyle}>Avg. Assets / Client</div>
          <h2 style={figureStyle}>₹{formatINR(data.avg_assets_per_client)}</h2>
          <div style={subTextStyle}>Portfolio Quality</div>
        </div>

        <div style={cardStyle}>
          <div style={iconContainerStyle}>{Icons.Revenue}</div>
          <div style={labelStyle}>Comm. (Invested)</div>
          <h2 style={figureStyle}>₹{formatINR(data.comm_inv_monthly)}<small style={{fontSize: '12px', color: '#94a3b8'}}>/mo</small></h2>
          <div style={subTextStyle}>Annual: ₹{formatINR(data.comm_inv_annual)}</div>
        </div>

        <div style={cardStyle}>
          <div style={iconContainerStyle}>{Icons.Revenue}</div>
          <div style={labelStyle}><Pulse />Comm. (Market)</div>
          <h2 style={figureStyle}>₹{formatINR(data.comm_mkt_monthly)}<small style={{fontSize: '12px', color: '#94a3b8'}}>/mo</small></h2>
          <div style={subTextStyle}>Annual: ₹{formatINR(data.comm_mkt_annual)}</div>
        </div>

        <div style={cardStyle}>
          <div style={iconContainerStyle}>{Icons.Users}</div>
          <div style={labelStyle}>Clients Onboarded</div>
          <h2 style={figureStyle}>{data.new_clients_30d}</h2>
          <div style={subTextStyle}>Last 30 Days</div>
        </div>
      </div>

      {/* 🟨 BOTTOM ROW (Preserved) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>🏆 Top Funds by Exposure</h3>
          {data.topFunds?.map((fund, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '10px' }}>
              <span style={{ width: '30px', fontWeight: '700', color: '#3b82f6' }}>0{idx + 1}</span>
              <span style={{ flex: 1, fontWeight: '600', fontSize: '13px' }}>{fund.scheme_name}</span>
              <span style={{ fontWeight: '700', color: '#10b981' }}>₹{formatINR(fund.invested_value)}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>🎂 Client Birthdays (7 Days)</h3>
          {data.upcomingBirthdays?.length > 0 ? data.upcomingBirthdays.map((client, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div><div style={{ fontWeight: '600', fontSize: '13px' }}>{client.full_name}</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div></div>
              <span style={{ fontSize: '10px', fontWeight: '700', background: client.days_left === 0 ? '#fee2e2' : '#eff6ff', color: client.days_left === 0 ? '#ef4444' : '#3b82f6', padding: '4px 8px', borderRadius: '20px' }}>
                {client.days_left === 0 ? 'TODAY' : `${client.days_left}d left`}
              </span>
            </div>
          )) : <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px' }}>No birthdays this week</div>}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
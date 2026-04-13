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

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#64748b', fontSize: '18px', fontWeight: '800' }}>POLISHING EXECUTIVE ANALYTICS...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444' }}>❌ Connection Error.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  // 💎 PROFESSIONAL STROKE ICONS (Lucide Style)
  const Icons = {
    Users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    Wallet: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/><path d="M16 12h5"/></svg>,
    Trending: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    Growth: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="m18 20-6-6-6 6"/><path d="M3 3v18h18"/></svg>,
    Revenue: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
  };

  const MetricCard = ({ label, value, sub, icon, figureColor, pulse }) => (
    <div className="fade-in" style={{ 
      background: 'linear-gradient(145deg, #1e293b, #0f172a)', 
      padding: '24px', 
      borderRadius: '20px', 
      position: 'relative', 
      overflow: 'hidden', 
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
      minHeight: '160px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      {/* 💎 Dynamic Glow Halo */}
      <div style={{ 
        position: 'absolute', top: '22px', right: '22px', zIndex: 10,
        color: figureColor || '#6366f1',
        background: figureColor ? `${figureColor}15` : 'rgba(99, 102, 241, 0.1)'
      }} className="icon-container-3d">
        {icon}
      </div>

      <div style={{ fontSize: '11px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', letterSpacing: '0.1em', paddingRight: '60px', opacity: 0.6 }}>
        {pulse && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '10px', boxShadow: '0 0 12px #10b981' }}></span>}
        {label}
      </div>
      
      <h2 style={{ fontSize: '32px', fontWeight: '950', color: figureColor || '#ffffff', margin: '0', letterSpacing: '-0.04em', paddingRight: '60px', wordBreak: 'break-word' }}>
        {value}
      </h2>
      
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '14px', fontWeight: '800', letterSpacing: '0.05em' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <MetricCard label="Total Clients" value={data.total_clients} sub="MASTER DATABASE" icon={Icons.Users} />
        <MetricCard label="Total Active Clients" value={data.total_active_clients} sub="PORTFOLIO VALUE > 0" icon={Icons.Users} />
        <MetricCard label="Total Invested AUM" value={`₹${formatINR(data.total_invested_aum)}`} sub="PRINCIPAL COST BASIS" icon={Icons.Wallet} />
        <MetricCard label="Market Value AUM" value={`₹${formatINR(data.market_value_aum)}`} sub="CURRENT ASSET VALUE" icon={Icons.Trending} figureColor="#34d399" pulse />
        <MetricCard label="Monthly SIP Book" value={`₹${formatINR(data.monthly_sip_book)}`} sub="RECURRING INFLOW" icon={Icons.Trending} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '24px', marginBottom: '50px' }}>
        <MetricCard label="Expected AUM (12M)" value={`₹${formatINR(data.expected_aum_12m)}`} sub="PROJECTED GROWTH" icon={Icons.Growth} figureColor="#fbbf24" />
        <MetricCard label="Avg. Assets / Client" value={`₹${formatINR(data.avg_assets_per_client)}`} sub="PORTFOLIO QUALITY" icon={Icons.Users} />
        <MetricCard label="Comm. (Invested)" value={`₹${formatINR(data.comm_inv_monthly)}/mo`} sub={`ANNUAL: ₹${formatINR(data.comm_inv_annual)}`} icon={Icons.Revenue} figureColor="#60a5fa" />
        <MetricCard label="Comm. (Market)" value={`₹${formatINR(data.comm_mkt_monthly)}/mo`} sub={`ANNUAL: ₹${formatINR(data.comm_mkt_annual)}`} icon={Icons.Revenue} figureColor="#60a5fa" pulse />
        <MetricCard label="Clients Onboarded" value={data.new_clients_30d} sub="LAST 30 DAYS" icon={Icons.Users} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '35px' }}>
        <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: '30px', fontSize: '22px', fontWeight: '950', color: '#ffffff', letterSpacing: '-0.02em' }}>🏆 Top Funds by Exposure</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {data.topFunds?.map((fund, idx) => {
              const percentage = data.total_invested_aum > 0 ? ((Number(fund.invested_value) / Number(data.total_invested_aum)) * 100).toFixed(1) : 0;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
                  <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '15px' }}>{fund.scheme_name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '950', color: '#34d399', fontSize: '17px' }}>₹{formatINR(fund.invested_value)}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', marginTop: '4px' }}>{percentage}% OF TOTAL</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: '30px', fontSize: '22px', fontWeight: '950', color: '#ffffff', letterSpacing: '-0.02em' }}>🎂 Birthdays (7 Days)</h3>
          {data.upcomingBirthdays?.map((client, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '16px' }}>{client.full_name}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '950', background: client.days_left === 0 ? '#ef4444' : 'rgba(255,255,255,0.05)', color: '#ffffff', padding: '6px 14px', borderRadius: '12px' }}>
                {client.days_left === 0 ? 'TODAY' : `${client.days_left}D`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
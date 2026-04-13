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

  const Icons = {
    Users: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    Wallet: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>,
    Trending: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    Growth: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m12 14 4-4 4 4"/><path d="M3 3v18h18"/></svg>,
    Revenue: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  };

  const MetricCard = ({ label, value, sub, icon, figureColor, pulse }) => (
    <div className="executive-card fade-in">
      <div style={{ position: 'absolute', top: '22px', right: '22px', zIndex: 10 }} className="icon-container-3d">{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', letterSpacing: '0.1em', paddingRight: '60px' }}>
        {pulse && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', marginRight: '10px', boxShadow: '0 0 12px #10b981' }}></span>}
        {label}
      </div>
      {/* 💡 FIX: Added wordBreak so massive numbers wrap cleanly when zoomed in */}
      <h2 style={{ fontSize: '34px', fontWeight: '950', color: figureColor || '#ffffff', margin: '0', letterSpacing: '-0.04em', paddingRight: '60px', wordBreak: 'break-word' }}>
        {value}
      </h2>
      <div style={{ fontSize: '12px', color: '#ffffff', marginTop: '14px', fontWeight: '800', letterSpacing: '0.02em', opacity: 0.8 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* 💡 FIX: Replaced "repeat(5, 1fr)" with "repeat(auto-fit, minmax(210px, 1fr))" to allow safe wrapping on zoom */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <MetricCard label="Total Clients" value={data.total_clients} sub="MASTER DATABASE" icon={Icons.Users} />
        <MetricCard label="Total Active Clients" value={data.total_active_clients} sub="PORTFOLIO VALUE > 0" icon={Icons.Users} />
        <MetricCard label="Total Invested AUM" value={`₹${formatINR(data.total_invested_aum)}`} sub="PRINCIPAL COST BASIS" icon={Icons.Wallet} />
        <MetricCard label="Market Value AUM" value={`₹${formatINR(data.market_value_aum)}`} sub="CURRENT ASSET VALUE" icon={Icons.Trending} figureColor="#34d399" pulse />
        <MetricCard label="Monthly SIP Book" value={`₹${formatINR(data.monthly_sip_book)}`} sub="RECURRING INFLOW" icon={Icons.Trending} />
      </div>

      {/* 💡 FIX: Replaced "repeat(5, 1fr)" here as well */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '24px', marginBottom: '50px' }}>
        <MetricCard label="Expected AUM (12M)" value={`₹${formatINR(data.expected_aum_12m)}`} sub="PROJECTED GROWTH" icon={Icons.Growth} figureColor="#fbbf24" />
        <MetricCard label="Avg. Assets / Client" value={`₹${formatINR(data.avg_assets_per_client)}`} sub="PORTFOLIO QUALITY" icon={Icons.Users} />
        <MetricCard label="Comm. (Invested)" value={`₹${formatINR(data.comm_inv_monthly)}/mo`} sub={`ANNUAL: ₹${formatINR(data.comm_inv_annual)}`} icon={Icons.Revenue} figureColor="#60a5fa" />
        <MetricCard label="Comm. (Market)" value={`₹${formatINR(data.comm_mkt_monthly)}/mo`} sub={`ANNUAL: ₹${formatINR(data.comm_mkt_annual)}`} icon={Icons.Revenue} figureColor="#60a5fa" pulse />
        <MetricCard label="Clients Onboarded" value={data.new_clients_30d} sub="LAST 30 DAYS" icon={Icons.Users} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '35px' }}>
        <div className="executive-card">
          <h3 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: '950', color: '#ffffff' }}>🏆 Top Funds by Exposure</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {data.topFunds?.map((fund, idx) => {
              const percentage = data.total_invested_aum > 0 ? ((Number(fund.invested_value) / Number(data.total_invested_aum)) * 100).toFixed(1) : 0;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '22px 26px', background: 'rgba(255, 255, 255, 0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '18px' }}>
                  <span style={{ fontWeight: '900', color: '#ffffff', fontSize: '16px' }}>0{idx + 1} &nbsp; {fund.scheme_name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '950', color: '#34d399', fontSize: '18px' }}>₹{formatINR(fund.invested_value)}</div>
                    <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: '800', marginTop: '4px', opacity: 0.7 }}>{percentage}% OF TOTAL AUM</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="executive-card">
          <h3 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: '950', color: '#ffffff' }}>🎂 Client Birthdays (7 Days)</h3>
          {data.upcomingBirthdays?.map((client, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1.5px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div style={{ fontWeight: '900', color: '#ffffff', fontSize: '17px' }}>{client.full_name}</div>
                <div style={{ fontSize: '14px', color: '#ffffff', opacity: 0.8 }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '950', background: client.days_left === 0 ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#ffffff', padding: '8px 18px', borderRadius: '20px' }}>
                {client.days_left === 0 ? 'TODAY' : `${client.days_left}d LEFT`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
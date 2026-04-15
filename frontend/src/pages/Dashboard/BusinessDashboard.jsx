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

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-main)', fontSize: '18px', fontWeight: '800' }}>Polishing Analytics...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444' }}>❌ Connection Error.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  // 💎 VisionBridge Executive Icons (Consistent Stroke)
  const Icons = {
    Users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    Wallet: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/><path d="M16 12h5"/></svg>,
    Trending: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    Growth: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="m18 20-6-6-6 6"/><path d="M3 3v18h18"/></svg>,
    Revenue: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
  };

  const MetricCard = ({ label, value, sub, icon, figureColor, pulse }) => (
    <div className="card-bold" style={{ 
      background: 'var(--bg-card)', 
      padding: '24px', 
      borderRadius: '12px', 
      position: 'relative', 
      border: '2.5px solid var(--border)',
      boxShadow: '6px 6px 0px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s ease'
    }}>
      <div style={{ 
        position: 'absolute', top: '20px', right: '20px', 
        color: '#38bdf8',
        background: 'rgba(56, 189, 248, 0.1)',
        width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px',
        border: '1.5px solid #38bdf8'
      }}>
        {icon}
      </div>

      <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', letterSpacing: '0.02em' }}>
        {pulse && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '8px', boxShadow: '0 0 8px #10b981' }}></span>}
        {label}
      </div>
      
      <h2 style={{ fontSize: '28px', fontWeight: '900', color: figureColor || 'var(--text-main)', margin: '0', letterSpacing: '-0.02em' }}>
        {value}
      </h2>
      
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Upper Grid: 5 Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <MetricCard label="Total Clients" value={data.total_clients} sub="Master Database" icon={Icons.Users} />
        <MetricCard label="Total Active Clients" value={data.total_active_clients} sub="Portfolio Value > 0" icon={Icons.Users} />
        <MetricCard label="Total Invested AUM" value={`₹${formatINR(data.total_invested_aum)}`} sub="Principal Cost Basis" icon={Icons.Wallet} />
        <MetricCard label="Market Value AUM" value={`₹${formatINR(data.market_value_aum)}`} sub="Current Asset Value" icon={Icons.Trending} figureColor="#10b981" pulse />
        <MetricCard label="Monthly SIP Book" value={`₹${formatINR(data.monthly_sip_book)}`} sub="Recurring Inflow" icon={Icons.Trending} />
      </div>

      {/* Lower Grid: 5 Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <MetricCard label="Expected AUM (12M)" value={`₹${formatINR(data.expected_aum_12m)}`} sub="Projected Growth" icon={Icons.Growth} figureColor="#f59e0b" />
        <MetricCard label="Avg. Assets / Client" value={`₹${formatINR(data.avg_assets_per_client)}`} sub="Portfolio Quality" icon={Icons.Users} />
        <MetricCard label="Comm. (Invested)" value={`₹${formatINR(data.comm_inv_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_inv_annual)}`} icon={Icons.Revenue} figureColor="#38bdf8" />
        <MetricCard label="Comm. (Market)" value={`₹${formatINR(data.comm_mkt_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_mkt_annual)}`} icon={Icons.Revenue} figureColor="#38bdf8" pulse />
        <MetricCard label="Clients Onboarded" value={data.new_clients_30d} sub="Last 30 Days" icon={Icons.Users} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        {/* Top Funds Section */}
        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '2.5px solid var(--border)', boxShadow: '6px 6px 0px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '25px', fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🏆 Top Funds by Exposure
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.topFunds?.map((fund, idx) => {
              const percentage = data.total_invested_aum > 0 ? ((Number(fund.invested_value) / Number(data.total_invested_aum)) * 100).toFixed(1) : 0;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--bg-main)', border: '2px solid var(--border)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>{fund.scheme_name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '900', color: '#10b981', fontSize: '16px' }}>₹{formatINR(fund.invested_value)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', marginTop: '2px' }}>{percentage}% OF TOTAL</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Birthdays Section */}
        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '2.5px solid var(--border)', boxShadow: '6px 6px 0px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '25px', fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🎂 Upcoming Birthdays
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.upcomingBirthdays?.map((client, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '2px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '15px' }}>{client.full_name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '900', background: client.days_left === 0 ? '#ef4444' : 'var(--bg-main)', border: '1.5px solid var(--border)', color: client.days_left === 0 ? '#fff' : 'var(--text-main)', padding: '6px 14px', borderRadius: '20px' }}>
                  {client.days_left === 0 ? 'TODAY' : `${client.days_left}D LEFT`}
                </span>
              </div>
            ))}
            {(!data.upcomingBirthdays || data.upcomingBirthdays.length === 0) && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>No birthdays in the next 7 days.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { toast } from 'react-toastify';
import { Users, Wallet, TrendingUp, BarChart3, CircleDollarSign, Award, Cake } from 'lucide-react';

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

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-main)', fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px' }}>SYNCING METRICS...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444', fontWeight: '800' }}>❌ Connection Error.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  const MetricCard = ({ label, value, sub, icon, figureColor, pulse }) => (
    <div className="card-bold" style={{ 
      background: 'var(--bg-card)', 
      padding: '24px', 
      borderRadius: '16px', 
      position: 'relative', 
      border: '1px solid var(--border)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute', top: '24px', right: '24px', 
        color: '#0284c7', 
        background: 'rgba(2, 132, 199, 0.08)',
        width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px'
      }}>
        {icon}
      </div>

      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', letterSpacing: '0.3px' }}>
        {pulse && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '8px', boxShadow: '0 0 8px #10b981' }}></span>}
        {label}
      </div>
      
      <h2 style={{ fontSize: '28px', fontWeight: '800', color: figureColor || 'var(--text-main)', margin: '0', letterSpacing: '-0.5px' }}>
        {value}
      </h2>
      
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* 🚀 Unified Grid: Flows naturally to 4 columns on desktop, spacing out the 10 metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <MetricCard label="Total Clients" value={data.total_clients} sub="Master Database" icon={<Users size={24} strokeWidth={2} />} />
        <MetricCard label="Total Active Clients" value={data.total_active_clients} sub="Portfolio Value > 0" icon={<Users size={24} strokeWidth={2} />} />
        <MetricCard label="Total Invested AUM" value={`₹${formatINR(data.total_invested_aum)}`} sub="Principal Cost Basis" icon={<Wallet size={24} strokeWidth={2} />} />
        <MetricCard label="Market Value AUM" value={`₹${formatINR(data.market_value_aum)}`} sub="Current Asset Value" icon={<TrendingUp size={24} strokeWidth={2} />} figureColor="#10b981" pulse />
        <MetricCard label="Monthly SIP Book" value={`₹${formatINR(data.monthly_sip_book)}`} sub="Recurring Inflow" icon={<TrendingUp size={24} strokeWidth={2} />} />
        
        <MetricCard label="Expected AUM (12M)" value={`₹${formatINR(data.expected_aum_12m)}`} sub="Projected Growth" icon={<BarChart3 size={24} strokeWidth={2} />} figureColor="#f59e0b" />
        <MetricCard label="Avg. Assets / Client" value={`₹${formatINR(data.avg_assets_per_client)}`} sub="Portfolio Quality" icon={<Users size={24} strokeWidth={2} />} />
        <MetricCard label="Comm. (Invested)" value={`₹${formatINR(data.comm_inv_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_inv_annual)}`} icon={<CircleDollarSign size={24} strokeWidth={2} />} figureColor="#0284c7" />
        <MetricCard label="Comm. (Market)" value={`₹${formatINR(data.comm_mkt_monthly)}/mo`} sub={`Annual: ₹${formatINR(data.comm_mkt_annual)}`} icon={<CircleDollarSign size={24} strokeWidth={2} />} figureColor="#0284c7" pulse />
        <MetricCard label="Clients Onboarded" value={data.new_clients_30d} sub="Last 30 Days" icon={<Users size={24} strokeWidth={2} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* Top Funds Section */}
        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.5px' }}>
            <Award size={22} color="#0284c7" /> Top Funds by Exposure
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.topFunds?.map((fund, idx) => {
              const percentage = data.total_invested_aum > 0 ? ((Number(fund.invested_value) / Number(data.total_invested_aum)) * 100).toFixed(1) : 0;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14px', maxWidth: '60%', lineHeight: '1.4' }}>{fund.scheme_name}</span>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '800', color: '#10b981', fontSize: '16px' }}>₹{formatINR(fund.invested_value)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{percentage}% of Total</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Birthdays Section */}
        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.5px' }}>
            <Cake size={22} color="#0284c7" /> Upcoming Birthdays
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.upcomingBirthdays?.map((client, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '15px' }}>{client.full_name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
                </div>
                <span style={{ 
                    fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: client.days_left === 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-main)', 
                    border: `1px solid ${client.days_left === 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`, 
                    color: client.days_left === 0 ? '#ef4444' : 'var(--text-main)', 
                    padding: '8px 14px', borderRadius: '8px' 
                }}>
                  {client.days_left === 0 ? 'Today' : `${client.days_left} Days Left`}
                </span>
              </div>
            ))}
            {(!data.upcomingBirthdays || data.upcomingBirthdays.length === 0) && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border)', fontWeight: '600' }}>
                No birthdays in the next 7 days.
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default BusinessDashboard;
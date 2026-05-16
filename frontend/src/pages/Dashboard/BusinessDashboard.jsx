/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { toast } from 'react-toastify';
import { 
  Users, Wallet, TrendingUp, BarChart3, 
  CircleDollarSign, Cake, AlertTriangle, Clock, 
  CalendarClock, ShieldAlert, Landmark, Handshake 
} from 'lucide-react';

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
        console.error("Dashboard Sync Error:", err);
        toast.error("Failed to sync live business metrics");
        setLoading(false); 
      });
  }, []);

  if (loading) return (
    <div style={{ padding: '120px', textAlign: 'center' }}>
        <div className="pulse" style={{ color: '#0284c7', fontSize: '14px', fontWeight: '900', letterSpacing: '2px' }}>
            REFRESHING VISIONBRIDGE ENGINE...
        </div>
    </div>
  );

  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444', fontWeight: '800' }}>❌ Connection Lost. Check Backend.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(Math.round(Number(val) || 0));

  const MetricCard = ({ label, value, sub, icon, figureColor, pulse }) => (
    <div className="card-bold" style={{ 
      background: 'var(--bg-card)', 
      padding: '24px', 
      borderRadius: '16px', 
      position: 'relative', 
      border: '1px solid var(--border)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute', top: '24px', right: '24px', 
        color: figureColor || '#0284c7', 
        background: figureColor ? `${figureColor}15` : 'rgba(2, 132, 199, 0.08)',
        width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px'
      }}>
        {icon}
      </div>

      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {pulse && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: figureColor || '#10b981', marginRight: '8px', animation: 'pulse 2s infinite' }}></span>}
        {label}
      </div>
      
      <h2 style={{ fontSize: '30px', fontWeight: '900', color: figureColor || 'var(--text-main)', margin: '0', letterSpacing: '-0.8px' }}>
        {value}
      </h2>
      
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sub}</div>
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* 🟢 BRAND NEW ROW: STRATEGIC ACQUISITION & STRUCTURAL METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <MetricCard 
            label="Nominee Pending" 
            value={data.nominee_pending || 0} 
            sub="Missing Beneficiary Update" 
            icon={<ShieldAlert size={24} />} 
            figureColor="#f59e0b" 
        />
        <MetricCard 
            label="Total Families" 
            value={data.total_families || 0} 
            sub="Group Portfolios Mapped" 
            icon={<Landmark size={24} />} 
            figureColor="#8b5cf6" 
        />
        <MetricCard 
            label="Sub Distributors" 
            value={data.total_sub_distributors || 0} 
            sub="Active Channel Network" 
            icon={<Handshake size={24} />} 
            figureColor="#0284c7" 
        />
        <MetricCard 
            label="Internal AUM Share" 
            value={`${data.internal_aum_pct || 0}%`} 
            sub="Acquired Direct-to-Firm" 
            icon={<BarChart3 size={24} />} 
            figureColor="#10b981" 
        />
      </div>

      {/* 🟢 ORIGINAL TOP ROW: COMPLIANCE & CLIENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <MetricCard 
            label="Reviews Overdue" 
            value={data.review_stats?.overdue || 0} 
            sub="Critical Action Required" 
            icon={<AlertTriangle size={24} />} 
            figureColor="#ef4444" 
            pulse 
        />
        <MetricCard 
            label="Reviews Due (7D)" 
            value={data.review_stats?.due_7d || 0} 
            sub="Upcoming Cycle" 
            icon={<Clock size={24} />} 
            figureColor="#f59e0b" 
        />
        <MetricCard label="Total Clients" value={data.total_clients || 0} sub="Master Database Size" icon={<Users size={24} />} />
        <MetricCard label="Onboarded (30D)" value={data.new_clients_30d || 0} sub="Recent Growth" icon={<Users size={24} />} figureColor="#10b981" />
      </div>

      {/* 🟢 ORIGINAL SECOND ROW: WEALTH & ASSETS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <MetricCard 
            label="Total Invested AUM" 
            value={`₹${formatINR(data.total_invested_aum)}`} 
            sub="Net Cost (Missed SIPs Deducted)" 
            icon={<Wallet size={24} />} 
        />
        <MetricCard 
            label="Market Value AUM" 
            value={`₹${formatINR(data.market_value_aum)}`} 
            sub="Current Portfolio Valuation" 
            icon={<TrendingUp size={24} />} 
            figureColor="#10b981" 
            pulse 
        />
        <MetricCard 
            label="Monthly SIP Book" 
            value={`₹${formatINR(data.monthly_sip_book)}`} 
            sub="Committed Monthly Inflow" 
            icon={<TrendingUp size={24} />} 
        />
        <MetricCard 
            label="Expected AUM (12M)" 
            value={`₹${formatINR(data.expected_aum_12m)}`} 
            sub="1Y Linear Projection" 
            icon={<BarChart3 size={24} />} 
            figureColor="#8b5cf6" 
        />
      </div>

      {/* 🟢 ORIGINAL THIRD ROW: REVENUE INSIGHTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <MetricCard 
            label="Comm. (Invested)" 
            value={`₹${formatINR(data.comm_inv_monthly)}/mo`} 
            sub="Floor Revenue Projection" 
            icon={<CircleDollarSign size={24} />} 
            figureColor="#0284c7" 
        />
        <MetricCard 
            label="Comm. (Market)" 
            value={`₹${formatINR(data.comm_mkt_monthly)}/mo`} 
            sub="Est. Real Monthly Payout" 
            icon={<CircleDollarSign size={24} />} 
            figureColor="#0284c7" 
            pulse 
        />
      </div>

      {/* 🟢 ORIGINAL ANALYTICS GRID: BIRTHDAYS & SIP EXPIRY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* SIPs Ending Soon */}
        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarClock size={22} color="#f59e0b" /> SIP Expiry Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.sipsEndingSoon?.map((sip, idx) => (
              <div key={idx} style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '14px' }}>{sip.full_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{sip.scheme_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase' }}>{sip.days_left} Days Remaining</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Ends: {new Date(sip.end_date).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            ))}
            {(!data.sipsEndingSoon || data.sipsEndingSoon.length === 0) && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px dashed var(--border)', fontSize: '13px', fontWeight: '600' }}>
                All active mandates are healthy.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cake size={22} color="#0284c7" /> Client Birthdays
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.upcomingBirthdays?.map((client, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '15px' }}>{client.full_name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
                </div>
                <span style={{ 
                    fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: client.days_left === 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-main)', 
                    color: client.days_left === 0 ? '#ef4444' : 'var(--text-main)', 
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)'
                }}>
                  {client.days_left === 0 ? 'Happening Today' : `In ${client.days_left} Days`}
                </span>
              </div>
            ))}
            {(!data.upcomingBirthdays || data.upcomingBirthdays.length === 0) && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px dashed var(--border)', fontSize: '13px', fontWeight: '600' }}>
                No birthdays this week.
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default BusinessDashboard;
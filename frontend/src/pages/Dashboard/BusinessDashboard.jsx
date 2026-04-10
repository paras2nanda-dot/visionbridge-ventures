import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 

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
        console.error("Dashboard Fetch Error:", err); 
        setLoading(false); 
      });
  }, []);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '900', color: 'var(--text-main)' }}>📊 LOADING ANALYTICS...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444', fontWeight: '900' }}>❌ Error loading data.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  const TrendBadge = ({ value, label, positive = true }) => (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '10px',
      fontWeight: '900',
      background: positive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
      color: positive ? '#10b981' : '#f59e0b',
      marginTop: '8px'
    }}>
      {positive ? '↑' : '→'} {value} <span style={{ opacity: 0.8, fontWeight: '700' }}>{label}</span>
    </div>
  );

  // 💡 Updated style to use Theme Variables
  const cardStyle = (accentColor) => ({
    background: 'var(--bg-card, #ffffff)', 
    border: `1px solid var(--border, #cbd5e1)`, 
    borderLeft: `5px solid ${accentColor}`, // Keeps the colorful side-strip for professional look
    padding: '24px', 
    borderRadius: '20px',
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'space-between', 
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
    minHeight: '160px',
    transition: 'all 0.3s ease'
  });

  const labelStyle = (color) => ({
    fontSize: '12px', 
    fontWeight: '900', 
    color: color, 
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  });

  return (
    <div className="fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* 💡 Top Row Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        
        <div style={cardStyle('#0ea5e9')} className="card">
          <span style={labelStyle('#0ea5e9')}>Total Clients</span>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-main)', margin: '5px 0' }}>{data.total_clients}</h2>
            <TrendBadge value={data.new_clients_30d} label="NEW" />
          </div>
        </div>

        <div style={cardStyle('#10b981')} className="card">
          <span style={labelStyle('#10b981')}>Invested AUM</span>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-main)', margin: '5px 0' }}>₹{formatINR(data.total_invested_aum)}</h2>
            <TrendBadge value="Live" label="TRACKING" />
          </div>
        </div>

        <div style={cardStyle('#8b5cf6')} className="card">
          <span style={labelStyle('#8b5cf6')}>Monthly SIP Book</span>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-main)', margin: '5px 0' }}>₹{formatINR(data.monthly_sip_book)}</h2>
            <TrendBadge value="Active" label="MANDATES" />
          </div>
        </div>

        <div style={cardStyle('#94a3b8')} className="card">
          <span style={labelStyle('#94a3b8')}>Market Value AUM</span>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-main)', margin: '5px 0' }}>₹{formatINR(data.total_market_value)}</h2>
            <TrendBadge value="Real-time" label="VALUATION" />
          </div>
        </div>
      </div>

      {/* 💡 Middle Row Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={cardStyle('#f43f5e')} className="card">
          <span style={labelStyle('#f43f5e')}>30D Acquisition</span>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-main)', margin: '5px 0' }}>{data.new_clients_30d}</h2>
            <div style={{ background: '#e11d48', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', marginTop: '10px', display: 'inline-block' }}>RECENT GROWTH</div>
          </div>
        </div>
        
        <div style={cardStyle('#f59e0b')} className="card">
          <span style={labelStyle('#f59e0b')}>Monthly Revenue</span>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-main)', margin: '5px 0' }}>₹{formatINR(data.monthly_revenue)}</h2>
            <TrendBadge value="Est." label="YIELD" positive={false} />
          </div>
        </div>

        <div style={cardStyle('#f59e0b')} className="card">
          <span style={labelStyle('#f59e0b')}>Annual Forecast</span>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-main)', margin: '5px 0' }}>₹{formatINR(data.annual_yield)}</h2>
            <TrendBadge value="12M" label="PROJECTED" />
          </div>
        </div>

        <div style={cardStyle('#0ea5e9')} className="card">
          <span style={labelStyle('#0ea5e9')}>System Health</span>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-main)', margin: '5px 0' }}>Active</h2>
            <TrendBadge value="99.9%" label="UPTIME" />
          </div>
        </div>
      </div>

      {/* 💡 Bottom Row: Best Sellers & Birthdays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '30px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '900', color: 'var(--text-main)' }}>🏆 Best Selling Funds</h3>
          {data.topFunds?.map((fund, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', marginBottom: '10px' }}>
              <div style={{ width: '30px', fontWeight: '900', color: '#3b82f6' }}>0{idx + 1}</div>
              <div style={{ flex: 1, fontWeight: '900', color: 'var(--text-main)' }}>{fund.scheme_name}</div>
              <div style={{ fontWeight: '900', color: '#10b981' }}>₹{formatINR(fund.invested_value)}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '30px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '900', color: 'var(--text-main)' }}>🎂 Birthdays (7 Days)</h3>
          {data.upcomingBirthdays?.length > 0 ? data.upcomingBirthdays.map((client, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: '900', color: 'var(--text-main)' }}>{client.full_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>
                  {new Date(client.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '900', 
                color: '#fff', 
                background: Number(client.days_left) <= 0 ? '#ef4444' : '#3b82f6', 
                padding: '5px 10px', 
                borderRadius: '6px' 
              }}>
                {Number(client.days_left) <= 0 ? 'TODAY' : `IN ${client.days_left} DAYS`}
              </span>
            </div>
          )) : <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No birthdays this week</div>}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
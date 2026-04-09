import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // 💡 Imported the secure API instance

const BusinessDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 💡 api.get automatically attaches the HttpOnly cookie!
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

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '900' }}>📊 LOADING ANALYTICS...</div>;

  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444', fontWeight: '900', fontSize: '20px' }}>❌ Error loading dashboard data. Please log in again or check the backend.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  const THEME = {
    blue:   { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    green:  { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
    purple: { bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6' },
    slate:  { bg: '#f8fafc', border: '#cbd5e1', text: '#0f172a' },
    amber:  { bg: '#fffbeb', border: '#fef3c7', text: '#92400e' },
    rose:   { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239' }
  };

  const cardStyle = (colorSet) => ({
    background: colorSet.bg, border: `2px solid ${colorSet.border}`, padding: '24px', borderRadius: '20px',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)', minHeight: '150px'
  });

  return (
    <div style={{ background: '#ffffff', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
        <div style={cardStyle(THEME.blue)}>
          <span style={{ fontSize: '12px', fontWeight: '900', color: THEME.blue.text }}>Total Clients</span>
          <div><h2 style={{ fontSize: '30px', fontWeight: '900' }}>{data.total_clients}</h2><p style={{ fontSize: '11px', fontWeight: '900', opacity: 0.7 }}>TOTAL DATABASE SIZE</p></div>
        </div>
        <div style={cardStyle(THEME.green)}>
          <span style={{ fontSize: '12px', fontWeight: '900', color: THEME.green.text }}>Invested AUM</span>
          <div><h2 style={{ fontSize: '30px', fontWeight: '900' }}>₹{formatINR(data.total_invested_aum)}</h2><p style={{ fontSize: '11px', fontWeight: '900', opacity: 0.7 }}>NET COST BASIS</p></div>
        </div>
        <div style={cardStyle(THEME.purple)}>
          <span style={{ fontSize: '12px', fontWeight: '900', color: THEME.purple.text }}>Monthly SIP Book</span>
          <div><h2 style={{ fontSize: '30px', fontWeight: '900' }}>₹{formatINR(data.monthly_sip_book)}</h2><p style={{ fontSize: '11px', fontWeight: '900', opacity: 0.7 }}>ACTIVE MANDATES</p></div>
        </div>
        <div style={cardStyle(THEME.slate)}>
          <span style={{ fontSize: '12px', fontWeight: '900', color: THEME.slate.text }}>Market Value AUM</span>
          <div><h2 style={{ fontSize: '30px', fontWeight: '900' }}>₹{formatINR(data.total_market_value)}</h2><p style={{ fontSize: '11px', fontWeight: '900', opacity: 0.7 }}>LIVE VALUATION</p></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
        <div style={cardStyle(THEME.rose)}>
          <span style={{ fontSize: '12px', fontWeight: '900', color: THEME.rose.text }}>New Clients (30D)</span>
          <div><h2 style={{ fontSize: '30px', fontWeight: '900' }}>{data.new_clients_30d}</h2><div style={{ background: '#e11d48', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', marginTop: '10px', display: 'inline-block' }}>RECENT GROWTH</div></div>
        </div>
        <div style={cardStyle(THEME.slate)}>
          <span style={{ fontSize: '12px', fontWeight: '900', color: THEME.slate.text }}>12-Month Forecast</span>
          <div><h2 style={{ fontSize: '30px', fontWeight: '900' }}>₹{formatINR(data.forecast_aum)}</h2><p style={{ fontSize: '11px', fontWeight: '900', opacity: 0.7 }}>PROJECTED AUM</p></div>
        </div>
        <div style={cardStyle(THEME.amber)}>
          <span style={{ fontSize: '12px', fontWeight: '900', color: THEME.amber.text }}>Monthly Revenue</span>
          <div><h2 style={{ fontSize: '30px', fontWeight: '900' }}>₹{formatINR(data.monthly_revenue)}</h2><p style={{ fontSize: '11px', fontWeight: '900', opacity: 0.7 }}>EST. TRAILING COMM.</p></div>
        </div>
        <div style={cardStyle(THEME.amber)}>
          <span style={{ fontSize: '12px', fontWeight: '900', color: THEME.amber.text }}>Annual Yield</span>
          <div><h2 style={{ fontSize: '30px', fontWeight: '900' }}>₹{formatINR(data.annual_yield)}</h2><p style={{ fontSize: '11px', fontWeight: '900', opacity: 0.7 }}>PROJECTED YEARLY</p></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
        <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '30px', border: '2px solid #cbd5e1' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>🏆 Best Selling Funds</h3>
          {data.topFunds?.map((fund, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', borderRadius: '12px', background: '#fff', border: '1px solid #cbd5e1', marginBottom: '10px' }}>
              <div style={{ width: '30px', fontWeight: '900', color: '#1e40af' }}>0{idx + 1}</div>
              <div style={{ flex: 1, fontWeight: '900', color: '#0f172a' }}>{fund.scheme_name}</div>
              <div style={{ fontWeight: '900', color: '#166534' }}>₹{formatINR(fund.invested_value)}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#eff6ff', borderRadius: '24px', padding: '30px', border: '2px solid #bfdbfe' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '900', color: '#1e40af' }}>🎂 Birthdays (7 Days)</h3>
          {data.upcomingBirthdays?.length > 0 ? data.upcomingBirthdays.map((client, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 18px', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: '900', color: '#0f172a' }}>{client.full_name}</div>
                <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '700' }}>
                  {new Date(client.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '900', 
                color: '#fff', 
                background: Number(client.days_left) <= 0 ? '#dc2626' : '#2563eb', 
                padding: '5px 10px', 
                borderRadius: '6px' 
              }}>
                {Number(client.days_left) <= 0 ? 'TODAY' : `IN ${client.days_left} DAYS`}
              </span>
            </div>
          )) : <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No birthdays this week</div>}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
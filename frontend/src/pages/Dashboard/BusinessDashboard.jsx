import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 

const BusinessDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 💡 Fetching data that includes your specific logic:
    // Total Clients, Invested AUM (Transactions + SIP Served), Monthly SIP Book, etc.
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

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '900', color: 'var(--text-main)' }}>📊 CALCULATING ANALYTICS...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444', fontWeight: '900' }}>❌ Error loading data.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  const cardStyle = (accentColor) => ({
    background: 'var(--bg-card, #ffffff)', 
    border: `1px solid var(--border, #cbd5e1)`, 
    borderLeft: `5px solid ${accentColor}`,
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
    fontSize: '11px', 
    fontWeight: '900', 
    color: color, 
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    marginBottom: '8px'
  });

  return (
    <div className="fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🟦 TOP ROW: Core Business Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        
        <div style={cardStyle('#0ea5e9')}>
          <span style={labelStyle('#0ea5e9')}>Total Clients</span>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)' }}>{data.total_clients}</h2>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>FROM CLIENT DATABASE</div>
        </div>

        <div style={cardStyle('#10b981')}>
          <span style={labelStyle('#10b981')}>Total Invested AUM</span>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR(data.total_invested_aum)}</h2>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>TRANSACTIONS + SIP SERVED</div>
        </div>

        <div style={cardStyle('#8b5cf6')}>
          <span style={labelStyle('#8b5cf6')}>Monthly SIP Book</span>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR(data.monthly_sip_book)}</h2>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL ACTIVE SIPs</div>
        </div>

        <div style={cardStyle('#f59e0b')}>
          <span style={labelStyle('#f59e0b')}>Expected AUM (12M)</span>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR(data.total_invested_aum + (data.monthly_sip_book * 12))}</h2>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>AUM + (SIP BOOK × 12)</div>
        </div>
      </div>

      {/* 🟧 MIDDLE ROW: Revenue & Forecasts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        
        <div style={cardStyle('#065f46')}>
          <span style={labelStyle('#10b981')}>Expected Commission (Monthly)</span>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR((data.total_invested_aum * 0.008) / 12)}</h2>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>(AUM × 0.8%) / 12</div>
        </div>

        <div style={cardStyle('#f43f5e')}>
          <span style={labelStyle('#f43f5e')}>30D Acquisition</span>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)' }}>{data.new_clients_30d}</h2>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>NEW CLIENTS THIS MONTH</div>
        </div>

        <div style={cardStyle('#64748b')}>
          <span style={labelStyle('#94a3b8')}>System Health</span>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)' }}>Active</h2>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>UPTIME: 99.9%</div>
        </div>
      </div>

      {/* 🟨 BOTTOM ROW: Detailed Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* 🏆 Best Selling Fund Section */}
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

        {/* 🎂 Upcoming Birthdays Section */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '30px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '900', color: 'var(--text-main)' }}>🎂 Birthdays (Next 7 Days)</h3>
          {data.upcomingBirthdays?.length > 0 ? data.upcomingBirthdays.map((client, idx) => {
            const dob = new Date(client.dob);
            const day = dob.getDate();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            
            // Ordinal suffix (1st, 2nd, 3rd, 4th...)
            const suffix = (day) => {
              if (day > 3 && day < 21) return 'th';
              switch (day % 10) {
                case 1:  return "st";
                case 2:  return "nd";
                case 3:  return "rd";
                default: return "th";
              }
            };

            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: '900', color: 'var(--text-main)' }}>{client.full_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>
                    {day}{suffix(day)} {monthNames[dob.getMonth()]}
                  </div>
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: '900', 
                  color: '#fff', 
                  background: Number(client.days_left) === 0 ? '#ef4444' : '#3b82f6', 
                  padding: '5px 10px', 
                  borderRadius: '6px' 
                }}>
                  {Number(client.days_left) === 0 ? 'TODAY' : `${client.days_left} DAYS LEFT`}
                </span>
              </div>
            );
          }) : <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No birthdays this week</div>}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
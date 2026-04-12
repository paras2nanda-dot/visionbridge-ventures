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
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444' }}>Dashboard data unavailable. Check connection.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(Number(val) || 0));

  // 🎨 PROFESSIONAL UI THEME
  const cardStyle = {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '130px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    transition: 'all 0.2s ease'
  };

  const labelStyle = { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' };
  const figureStyle = { fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0' };
  const subTextStyle = { fontSize: '11px', color: '#94a3b8', marginTop: '4px', fontWeight: '600' };

  return (
    <div className="fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🔔 SIP END ALERT BANNER (Preserved) */}
      {data.sipsEndingSoon && data.sipsEndingSoon.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '14px 20px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '800', color: '#92400e', fontSize: '14px' }}>{data.sipsEndingSoon.length} SIP Renewal(s) Required</div>
            <div style={{ fontSize: '12px', color: '#b45309' }}>Next up: {data.sipsEndingSoon[0].full_name} ({data.sipsEndingSoon[0].scheme_name}) in {data.sipsEndingSoon[0].days_left} days.</div>
          </div>
        </div>
      )}

      {/* 🟦 ROW 1: CLIENTS & AUM BASIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Total Clients</div>
          <h2 style={figureStyle}>{data.total_clients}</h2>
          <div style={subTextStyle}>MASTER DATABASE</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Total Active Clients</div>
          <h2 style={figureStyle}>{data.total_active_clients}</h2>
          <div style={subTextStyle}>WITH NET ASSETS {'>'} 0</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Total Invested AUM</div>
          <h2 style={figureStyle}>₹{formatINR(data.total_invested_aum)}</h2>
          <div style={subTextStyle}>PRINCIPAL COST BASIS</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Market Value AUM</div>
          <h2 style={figureStyle}><span style={{color: '#10b981'}}>₹{formatINR(data.market_value_aum)}</span></h2>
          <div style={subTextStyle}>AS PER PORTAL EXPORT</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Monthly SIP Book</div>
          <h2 style={figureStyle}>₹{formatINR(data.monthly_sip_book)}</h2>
          <div style={subTextStyle}>ACTIVE RECURRING FLOW</div>
        </div>
      </div>

      {/* 🟧 ROW 2: FORECASTS & REVENUE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Expected AUM (12M)</div>
          <h2 style={figureStyle}>₹{formatINR(data.expected_aum_12m)}</h2>
          <div style={subTextStyle}>COST + 1Y SIP INFLOW</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Avg. Assets / Client</div>
          <h2 style={figureStyle}>₹{formatINR(data.avg_assets_per_client)}</h2>
          <div style={subTextStyle}>PER ACTIVE INVESTOR</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Comm. (Invested)</div>
          <h2 style={figureStyle}>₹{formatINR(data.comm_inv_monthly)}<small style={{fontSize: '12px', color: '#94a3b8'}}>/mo</small></h2>
          <div style={subTextStyle}>ANNUAL: ₹{formatINR(data.comm_inv_annual)}</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Comm. (Market)</div>
          <h2 style={figureStyle}>₹{formatINR(data.comm_mkt_monthly)}<small style={{fontSize: '12px', color: '#94a3b8'}}>/mo</small></h2>
          <div style={subTextStyle}>ANNUAL: ₹{formatINR(data.comm_mkt_annual)}</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>New Onboarding</div>
          <h2 style={figureStyle}>{data.new_clients_30d}</h2>
          <div style={subTextStyle}>LAST 30 DAYS</div>
        </div>
      </div>

      {/* 🟨 BOTTOM ROW: INSIGHTS (Preserved) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        
        {/* BEST SELLING FUNDS */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '800' }}>🏆 Top Funds by Exposure</h3>
          {data.topFunds?.map((fund, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '10px' }}>
              <span style={{ width: '30px', fontWeight: '800', color: '#3b82f6' }}>0{idx + 1}</span>
              <span style={{ flex: 1, fontWeight: '700', fontSize: '13px' }}>{fund.scheme_name}</span>
              <span style={{ fontWeight: '800', color: '#10b981' }}>₹{formatINR(fund.invested_value)}</span>
            </div>
          ))}
        </div>

        {/* BIRTHDAYS */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '800' }}>🎂 Client Birthdays (7 Days)</h3>
          {data.upcomingBirthdays?.length > 0 ? data.upcomingBirthdays.map((client, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>{client.full_name}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(client.dob).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', background: client.days_left === 0 ? '#fee2e2' : '#eff6ff', color: client.days_left === 0 ? '#ef4444' : '#3b82f6', padding: '4px 8px', borderRadius: '6px' }}>
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
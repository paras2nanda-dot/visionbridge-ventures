/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line 
} from 'recharts';

const Charts = () => {
  const [charts, setCharts] = useState(null);
  const [upcomingClosures, setUpcomingClosures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Premium High-Contrast Palette
  const COLORS = ['#0284c7', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  const formatINR = (val) => {
    if (!val) return "0";
    return new Intl.NumberFormat('en-IN').format(val);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    Promise.all([
      fetch('https://visionbridge-backend.onrender.com/api/dashboard/charts', { headers }),
      fetch('https://visionbridge-backend.onrender.com/api/sips', { headers })
    ])
    .then(async ([chartRes, sipRes]) => {
      const chartJson = await chartRes.json();
      const sipJson = await sipRes.json();

      if (chartJson.success) setCharts(chartJson.data);
      
      if (Array.isArray(sipJson)) {
        const today = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(today.getDate() + 60);

        const closingSoon = sipJson
          .filter(sip => {
            if (!sip.end_date || sip.status !== 'Active') return false;
            const endDate = new Date(sip.end_date);
            return endDate >= today && endDate <= sixtyDaysFromNow;
          })
          .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));

        setUpcomingClosures(closingSoon);
      }

      setLoading(false);
    })
    .catch(err => {
      console.error("Data Fetch Error:", err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '900', color: 'var(--text-muted)' }}>📊 SYNCING EXECUTIVE ANALYTICS...</div>;
  if (!charts) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '900', color: '#ef4444' }}>❌ Session Expired. Please log in again.</div>;

  const sectionHeader = (title, color) => (
    <h2 style={{ fontWeight: '900', color: 'var(--text-main)', marginBottom: '24px', borderLeft: `6px solid ${color}`, paddingLeft: '16px', fontSize: '20px', letterSpacing: '0.5px' }}>
      {title}
    </h2>
  );

  const chartLabel = { textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px', letterSpacing: '0.5px' };

  const renderDonut = (data = []) => {
    const total = data.reduce((sum, entry) => sum + (entry.value || 0), 0);
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie 
            data={data} 
            innerRadius={70} 
            outerRadius={95} 
            paddingAngle={5} 
            dataKey="value"
            labelLine={false}
            stroke="none"
            label={({ value }) => {
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${percent}%`;
            }}
          >
            {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', fontWeight: '800', background: 'var(--bg-card)', border: '2.5px solid var(--border)', color: 'var(--text-main)', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' }} 
            itemStyle={{ color: 'var(--text-main)', fontWeight: '800' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontWeight: '800', fontSize: '12px', paddingTop: '20px', color: 'var(--text-muted)' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="container fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* 🔴 ALERT: UPCOMING SIP CLOSURES */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          {sectionHeader("Attention: Upcoming SIP Closures (Next 60 Days)", "#ef4444")}
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', fontWeight: '900', fontSize: '12px', border: '1.5px solid rgba(239, 68, 68, 0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {upcomingClosures.length} Maturities Tracked
          </div>
        </div>

        <div className="card" style={{ padding: '0', overflow: 'hidden', borderColor: 'rgba(239, 68, 68, 0.4) !important' }}>
          <div className="table-container" style={{ overflowX: 'auto', border: 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#ef4444', fontWeight: '900' }}>Client name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#ef4444', fontWeight: '900' }}>Fund name</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#ef4444', fontWeight: '900' }}>Closure date</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#ef4444', fontWeight: '900' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {upcomingClosures.length > 0 ? upcomingClosures.map((sip) => (
                  <tr key={sip.id} style={{ borderBottom: '2px solid var(--border)' }}>
                    <td style={{ padding: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{sip.client_name}</td>
                    <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-muted)' }}>{sip.scheme_name}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontWeight: '900', fontSize: '12px' }}>
                        {new Date(sip.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR(sip.amount)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '60px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)' }}>
                      ✅ No SIPs are set to close in the next 60 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🟦 CATEGORY 1: DEMOGRAPHICS */}
      {sectionHeader("Client Demographics (Count %)", "#0284c7")}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        <div className="card"><p style={chartLabel}>Added By</p>{renderDonut(charts.category1?.addedBy)}</div>
        <div className="card"><p style={chartLabel}>Client Sourcing</p>{renderDonut(charts.category1?.sourcing)}</div>
        <div className="card"><p style={chartLabel}>Sourcing Type</p>{renderDonut(charts.category1?.sourcingType)}</div>
        <div className="card"><p style={chartLabel}>Risk Profile</p>{renderDonut(charts.category1?.riskProfile)}</div>
        <div className="card"><p style={chartLabel}>Experience</p>{renderDonut(charts.category1?.investmentExp)}</div>
        <div className="card"><p style={chartLabel}>Age Buckets</p>{renderDonut(charts.category1?.ageBucketsCount)}</div>
      </div>

      {/* 🟩 CATEGORY 2: AUM SPLITS */}
      {sectionHeader("AUM-Based Analytics (Value)", "#10b981")}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        <div className="card"><p style={chartLabel}>SIP AUM vs Transaction AUM</p>{renderDonut(charts.category2?.sipVsTrans)}</div>
        <div className="card"><p style={chartLabel}>Age Buckets (AUM %)</p>{renderDonut(charts.category2?.ageBucketsAum)}</div>
      </div>

      {/* 📈 GROWTH PERFORMANCE TRENDS */}
      {sectionHeader("Growth Performance Trends", "#8b5cf6")}
      
      <div className="card" style={{ marginBottom: '24px' }}>
        <p style={chartLabel}>Invested AUM vs Market Value AUM</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={charts.trends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
            <XAxis dataKey="month" tick={{fontWeight: 800, fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{fontWeight: 800, fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip contentStyle={{borderRadius: '12px', fontWeight: '800', background: 'var(--bg-card)', border: '2.5px solid var(--border)', color: 'var(--text-main)', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)'}} itemStyle={{fontWeight: '900'}} />
            <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{fontWeight: '800', fontSize: '13px', color: 'var(--text-muted)'}} />
            <Area name="Market Value" type="monotone" dataKey="market_value_aum" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorMarket)" />
            <Line name="Invested Value" type="monotone" dataKey="invested_aum" stroke="#10b981" strokeWidth={4} dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: 'var(--bg-card)' }} activeDot={{ r: 7 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        <div className="card">
          <p style={chartLabel}>Monthly Actual Commission</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.trends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
              <XAxis dataKey="month" tick={{fontWeight: 800, fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fontWeight: 800, fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip contentStyle={{borderRadius: '12px', fontWeight: '800', background: 'var(--bg-card)', border: '2.5px solid var(--border)', color: 'var(--text-main)', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)'}} itemStyle={{fontWeight: '900'}} />
              <Line type="stepAfter" name="Commission" dataKey="commission" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5, fill: '#f59e0b', stroke: 'var(--bg-card)', strokeWidth: 2 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p style={chartLabel}>SIP Book Growth</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={charts.trends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSIP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
              <XAxis dataKey="month" tick={{fontWeight: 800, fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fontWeight: 800, fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip contentStyle={{borderRadius: '12px', fontWeight: '800', background: 'var(--bg-card)', border: '2.5px solid var(--border)', color: 'var(--text-main)', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)'}} itemStyle={{fontWeight: '900'}} />
              <Area type="monotone" name="SIP Book" dataKey="sip_growth" stroke="#06b6d4" strokeWidth={4} fillOpacity={1} fill="url(#colorSIP)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;
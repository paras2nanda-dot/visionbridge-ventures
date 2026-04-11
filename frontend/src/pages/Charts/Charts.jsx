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
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

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

    // Fetch both Chart Analytics and Raw SIP Data for the closure table
    Promise.all([
      fetch('https://visionbridge-backend.onrender.com/api/dashboard/charts', { headers }),
      fetch('https://visionbridge-backend.onrender.com/api/sips', { headers })
    ])
    .then(async ([chartRes, sipRes]) => {
      const chartJson = await chartRes.json();
      const sipJson = await sipRes.json();

      if (chartJson.success) setCharts(chartJson.data);
      
      // LOGIC: Filter SIPs closing in next 60 days
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
          .sort((a, b) => new Date(a.end_date) - new Date(b.end_date)); // Soonest on top

        setUpcomingClosures(closingSoon);
      }

      setLoading(false);
    })
    .catch(err => {
      console.error("Data Fetch Error:", err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '900', color: '#1e293b' }}>📊 GENERATING PREMIUM ANALYTICS...</div>;
  if (!charts) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '900', color: '#ef4444' }}>❌ FAILED TO LOAD CHART DATA. Please log in again.</div>;

  const cardStyle = {
    background: 'var(--bg-card, #ffffff)',
    border: '2px solid var(--border, #cbd5e1)',
    borderRadius: '24px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
  };

  const sectionHeader = (title, color) => (
    <h2 style={{ fontWeight: '900', color: 'var(--text-main, #0f172a)', marginBottom: '30px', borderLeft: `8px solid ${color}`, paddingLeft: '15px', textTransform: 'uppercase', fontSize: '18px' }}>
      {title}
    </h2>
  );

  const chartLabel = { textAlign: 'center', fontWeight: '900', color: 'var(--text-muted, #334155)', marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase' };

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
            label={({ value }) => {
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${percent}%`;
            }}
          >
            {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip 
            formatter={(value) => {
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return [`${value} (${percent}%)`, 'Value'];
            }}
            contentStyle={{ borderRadius: '12px', fontWeight: '900', background: 'var(--bg-card)', border: '2px solid var(--border)' }} 
          />
          <Legend iconType="circle" wrapperStyle={{ fontWeight: '900', fontSize: '12px', paddingTop: '15px' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '50px' }}>
      
      {/* 🔴 NEW SECTION: UPCOMING SIP CLOSURES */}
      <div style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          {sectionHeader("Attention: Upcoming SIP Closures (Next 60 Days)", "#ef4444")}
          <div style={{ background: '#ef4444', color: 'white', padding: '8px 20px', borderRadius: '50px', fontWeight: '900', fontSize: '14px' }}>
            {upcomingClosures.length} MATURITIES TRACKED
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#ef4444', fontWeight: '900', fontSize: '12px', borderBottom: '2px solid var(--border)' }}>CLIENT NAME</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#ef4444', fontWeight: '900', fontSize: '12px', borderBottom: '2px solid var(--border)' }}>FUND NAME</th>
                <th style={{ padding: '15px 20px', textAlign: 'center', color: '#ef4444', fontWeight: '900', fontSize: '12px', borderBottom: '2px solid var(--border)' }}>CLOSURE DATE</th>
                <th style={{ padding: '15px 20px', textAlign: 'right', color: '#ef4444', fontWeight: '900', fontSize: '12px', borderBottom: '2px solid var(--border)' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {upcomingClosures.length > 0 ? upcomingClosures.map((sip, idx) => (
                <tr key={sip.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px 20px', fontWeight: '800', color: 'var(--text-main)' }}>{sip.client_name}</td>
                  <td style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--text-muted)' }}>{sip.scheme_name}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <span style={{ background: '#fef2f2', color: '#ef4444', padding: '5px 12px', borderRadius: '6px', fontWeight: '900', fontSize: '12px' }}>
                      {new Date(sip.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: '900', color: '#10b981' }}>₹{formatINR(sip.amount)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
                    ✅ No SIPs are set to close in the next 60 days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🟦 CATEGORY 1: DEMOGRAPHICS */}
      {sectionHeader("Category 1: Client Demographics (Count %)", "#3b82f6")}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '60px' }}>
        <div style={cardStyle}><p style={chartLabel}>Added By</p>{renderDonut(charts.category1?.addedBy)}</div>
        <div style={cardStyle}><p style={chartLabel}>Client Sourcing</p>{renderDonut(charts.category1?.sourcing)}</div>
        <div style={cardStyle}><p style={chartLabel}>Sourcing Type</p>{renderDonut(charts.category1?.sourcingType)}</div>
        <div style={cardStyle}><p style={chartLabel}>Risk Profile</p>{renderDonut(charts.category1?.riskProfile)}</div>
        <div style={cardStyle}><p style={chartLabel}>Experience</p>{renderDonut(charts.category1?.investmentExp)}</div>
        <div style={cardStyle}><p style={chartLabel}>Age Buckets (Count)</p>{renderDonut(charts.category1?.ageBucketsCount)}</div>
      </div>

      {/* 🟩 CATEGORY 2: AUM SPLITS */}
      {sectionHeader("Category 2: AUM-Based Analytics (Value)", "#10b981")}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '60px' }}>
        <div style={cardStyle}><p style={chartLabel}>SIP AUM vs Transaction AUM</p>{renderDonut(charts.category2?.sipVsTrans)}</div>
        <div style={cardStyle}><p style={chartLabel}>Age Buckets (AUM %)</p>{renderDonut(charts.category2?.ageBucketsAum)}</div>
      </div>

      {/* 📈 GROWTH PERFORMANCE TRENDS */}
      {sectionHeader("Growth Performance Trends", "#8b5cf6")}
      
      <div style={{ ...cardStyle, marginBottom: '25px' }}>
        <p style={chartLabel}>Invested AUM vs Market Value AUM</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={charts.trends || []}>
            <defs>
              <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{fontWeight: 900, fill: '#475569'}} axisLine={false} />
            <YAxis tick={{fontWeight: 900, fill: '#475569'}} axisLine={false} />
            <Tooltip contentStyle={{borderRadius: '15px', fontWeight: '900', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Area name="Market Value" type="monotone" dataKey="market_value_aum" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorMarket)" />
            <Line name="Invested Value" type="monotone" dataKey="invested_aum" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
        <div style={cardStyle}>
          <p style={chartLabel}>Monthly Actual Commission</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.trends || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{fontWeight: 900}} axisLine={false} />
              <YAxis tick={{fontWeight: 900}} axisLine={false} />
              <Tooltip contentStyle={{borderRadius: '15px', fontWeight: '900'}} />
              <Line type="stepAfter" dataKey="commission" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <p style={chartLabel}>SIP Book Growth</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={charts.trends || []}>
              <defs>
                <linearGradient id="colorSIP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{fontWeight: 900}} axisLine={false} />
              <YAxis tick={{fontWeight: 900}} axisLine={false} />
              <Tooltip contentStyle={{borderRadius: '15px', fontWeight: '900'}} />
              <Area type="monotone" dataKey="sip_growth" stroke="#06b6d4" strokeWidth={4} fillOpacity={1} fill="url(#colorSIP)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;
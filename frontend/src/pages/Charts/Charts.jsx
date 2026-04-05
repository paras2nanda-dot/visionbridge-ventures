import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line 
} from 'recharts';

const Charts = () => {
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  // Premium High-Contrast Palette
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  useEffect(() => {
    // 💡 THE FIX: Retrieve the JWT token from local storage
    const token = sessionStorage.getItem("token");

    // 💡 THE FIX: Pass the token in the Authorization header to pass the backend middleware
    fetch('https://visionbridge-backend.onrender.com/api/dashboard/charts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }) 
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(res => { 
        if(res.success) setCharts(res.data);
        setLoading(false); 
      })
      .catch(err => {
        console.error("Charts Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '900', color: '#1e293b' }}>📊 GENERATING PREMIUM ANALYTICS...</div>;
  
  // 💡 SAFETY NET: Prevent app crash if backend is down or token is invalid
  if (!charts) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '900', color: '#ef4444' }}>❌ FAILED TO LOAD CHART DATA. Please log in again.</div>;

  const cardStyle = {
    background: '#ffffff',
    border: '2px solid #cbd5e1',
    borderRadius: '24px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
  };

  const sectionHeader = (title, color) => (
    <h2 style={{ fontWeight: '900', color: '#0f172a', marginBottom: '30px', borderLeft: `8px solid ${color}`, paddingLeft: '15px', textTransform: 'uppercase', fontSize: '18px' }}>
      {title}
    </h2>
  );

  const chartLabel = { textAlign: 'center', fontWeight: '900', color: '#334155', marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase' };

  // --- RENDER DONUT WITH PERCENTAGES ---
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
            contentStyle={{ borderRadius: '12px', fontWeight: '900', border: '2px solid #cbd5e1' }} 
          />
          <Legend iconType="circle" wrapperStyle={{ fontWeight: '900', fontSize: '12px', paddingTop: '15px' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '50px' }}>
      
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
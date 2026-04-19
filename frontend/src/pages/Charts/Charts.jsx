/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line 
} from 'recharts';
import { AlertTriangle, PieChart as PieChartIcon, TrendingUp, Activity, CheckCircle2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const Charts = () => {
  const [charts, setCharts] = useState(null);
  const [upcomingClosures, setUpcomingClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [isSnapshotting, setIsSnapshotting] = useState(false);

  const COLORS = ['#0284c7', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  const formatINR = (val) => {
    if (!val) return "0";
    return new Intl.NumberFormat('en-IN').format(val);
  };

  // 💰 SMART Y-AXIS FORMATTER (Indian Financial System)
  const formatYAxis = (val) => {
    if (val >= 10000000) return (val / 10000000).toFixed(1) + ' Cr';
    if (val >= 100000) return (val / 100000).toFixed(1) + ' L';
    if (val >= 1000) return (val / 1000).toFixed(1) + ' K';
    return val;
  };

  const fetchData = () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCaptureSnapshot = async () => {
    const token = sessionStorage.getItem("token");
    if (!window.confirm("Capture current AUM & SIP data for history trends? This will create a data point for today.")) return;
    
    setIsSnapshotting(true);
    try {
      const res = await fetch('https://visionbridge-backend.onrender.com/api/dashboard/snapshot', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("✅ History Snapshot Captured!");
        fetchData(); 
      } else {
        toast.error("Failed to capture snapshot");
      }
    } catch (err) {
      toast.error("Connection Error");
    } finally {
      setIsSnapshotting(false);
    }
  };

  // 📈 SMART X-AXIS FORMATTER (Stock Chart Logic)
  const formatXAxis = (tickItem) => {
    if (!charts?.trends || charts.trends.length === 0) return '';
    const date = new Date(tickItem);
    
    const firstDate = new Date(charts.trends[0].timestamp);
    const lastDate = new Date(charts.trends[charts.trends.length - 1].timestamp);
    const diffYears = lastDate.getFullYear() - firstDate.getFullYear();

    if (diffYears >= 3) {
      return date.getFullYear().toString(); 
    } else if (diffYears >= 1) {
      return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    } else {
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); 
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>SYNCING EXECUTIVE ANALYTICS...</div>;
  if (!charts) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '700', color: '#ef4444' }}>Session Expired. Please log in again.</div>;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 15; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="var(--text-main)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        style={{ fontSize: '11px', fontWeight: '800' }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const renderDonut = (data = []) => {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <Pie 
            data={data} 
            innerRadius={55} 
            outerRadius={75} 
            paddingAngle={5} 
            dataKey="value"
            labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
            stroke="none"
            label={renderCustomizedLabel}
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', fontWeight: '700', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)' }} 
            itemStyle={{ color: 'var(--text-main)', fontWeight: '700' }} 
          />
          <Legend iconType="circle" wrapperStyle={{ fontWeight: '700', fontSize: '11px', paddingTop: '30px', color: 'var(--text-muted)' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const sectionHeader = (title, color, Icon) => (
    <h2 style={{ fontWeight: '800', color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', letterSpacing: '0.5px' }}>
      {Icon && <Icon size={22} color={color} />}
      {title}
    </h2>
  );

  const chartCardStyle = { background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'visible' };
  const chartLabel = { textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px', letterSpacing: '0.3px' };
  const tooltipStyle = { borderRadius: '12px', fontWeight: '700', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };

  return (
    <div className="container fade-in" style={{ paddingBottom: '60px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* UPCOMING SIP CLOSURES */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          {sectionHeader("Upcoming SIP Closures (Next 60 Days)", "#ef4444", AlertTriangle)}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowUpcoming(!showUpcoming)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {showUpcoming ? <><EyeOff size={14} /> HIDE DETAILS</> : <><Eye size={14} /> VIEW DETAILS</>}
            </button>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {upcomingClosures.length} Maturities Tracked
            </div>
          </div>
        </div>

        {showUpcoming && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.05)', transition: 'all 0.3s ease' }}>
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(239, 68, 68, 0.05)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#ef4444', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client name</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#ef4444', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fund name</th>
                    <th style={{ padding: '16px', textAlign: 'center', color: '#ef4444', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Closure date</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: '#ef4444', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingClosures.length > 0 ? upcomingClosures.map((sip) => (
                    <tr key={sip.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{sip.client_name}</td>
                      <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>{sip.scheme_name}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '12px' }}>
                          {new Date(sip.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>₹{formatINR(sip.amount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '60px', textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <CheckCircle2 size={32} color="#10b981" />
                          No SIPs are set to close in the next 60 days.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CATEGORY 1: DEMOGRAPHICS */}
      {sectionHeader("Client Demographics", "#0284c7", PieChartIcon)}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        <div style={chartCardStyle}><p style={chartLabel}>Added By</p>{renderDonut(charts.category1?.addedBy)}</div>
        <div style={chartCardStyle}><p style={chartLabel}>Client Sourcing</p>{renderDonut(charts.category1?.sourcing)}</div>
        <div style={chartCardStyle}><p style={chartLabel}>Sourcing Type</p>{renderDonut(charts.category1?.sourcingType)}</div>
        <div style={chartCardStyle}><p style={chartLabel}>Risk Profile</p>{renderDonut(charts.category1?.riskProfile)}</div>
        <div style={chartCardStyle}><p style={chartLabel}>Experience</p>{renderDonut(charts.category1?.investmentExp)}</div>
        <div style={chartCardStyle}><p style={chartLabel}>Age Buckets</p>{renderDonut(charts.category1?.ageBucketsCount)}</div>
      </div>

      {/* CATEGORY 2: AUM SPLITS */}
      {sectionHeader("AUM-Based Analytics", "#10b981", Activity)}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        <div style={chartCardStyle}><p style={chartLabel}>SIP AUM vs Transaction AUM</p>{renderDonut(charts.category2?.sipVsTrans)}</div>
        <div style={chartCardStyle}><p style={chartLabel}>Age Buckets (AUM %)</p>{renderDonut(charts.category2?.ageBucketsAum)}</div>
      </div>

      {/* 📈 GROWTH PERFORMANCE TRENDS (Time-Series / Stock Chart Style) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        {sectionHeader("Growth Performance Trends", "#8b5cf6", TrendingUp)}
        
        <button 
          onClick={handleCaptureSnapshot}
          disabled={isSnapshotting}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: '#0F172A', color: 'white', borderRadius: '10px',
            fontWeight: '700', fontSize: '13px', cursor: isSnapshotting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          {isSnapshotting ? <RefreshCw size={16} className="spin" /> : <Activity size={16} />}
          {isSnapshotting ? "CAPTURING..." : "CAPTURE MONTHLY SNAPSHOT"}
        </button>
      </div>

      <div style={{ ...chartCardStyle, marginBottom: '24px' }}>
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
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              domain={['dataMin', 'dataMax']} 
              tickFormatter={formatXAxis} 
              tick={{fontWeight: 700, fontSize: 11, fill: 'var(--text-muted)'}}
              minTickGap={30}
            />
            <YAxis tickFormatter={formatYAxis} tick={{fontWeight: 700, fontSize: 11, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip 
              labelFormatter={(val) => new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              contentStyle={tooltipStyle} 
              itemStyle={{fontWeight: '800'}} 
            />
            <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)'}} />
            <Area name="Market Value" type="monotone" dataKey="market_value_aum" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMarket)" />
            <Line name="Invested Value" type="monotone" dataKey="invested_aum" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        <div style={chartCardStyle}>
          <p style={chartLabel}>Monthly Actual Commission</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.trends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatXAxis} tick={{fontWeight: 700, fontSize: 11, fill: 'var(--text-muted)'}} />
              <YAxis tickFormatter={formatYAxis} tick={{fontWeight: 700, fontSize: 11, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                labelFormatter={(val) => new Date(val).toLocaleDateString('en-GB')}
                contentStyle={tooltipStyle} 
                itemStyle={{fontWeight: '800'}} 
              />
              <Line type="stepAfter" name="Commission" dataKey="commission" stroke="#f59e0b" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={chartCardStyle}>
          <p style={chartLabel}>SIP Book Growth</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={charts.trends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSIP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatXAxis} tick={{fontWeight: 700, fontSize: 11, fill: 'var(--text-muted)'}} />
              <YAxis tickFormatter={formatYAxis} tick={{fontWeight: 700, fontSize: 11, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                labelFormatter={(val) => new Date(val).toLocaleDateString('en-GB')}
                contentStyle={tooltipStyle} 
                itemStyle={{fontWeight: '800'}} 
              />
              <Area type="monotone" name="SIP Book" dataKey="sip_growth" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorSIP)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default Charts;
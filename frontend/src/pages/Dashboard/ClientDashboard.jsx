import React, { useState, useEffect } from 'react';

// --- Internal Premium Donut Chart Component ---
const AssetDonut = ({ data }) => {
  if (!data || data.length === 0) return <div style={{color: 'var(--text-muted)', fontWeight: '700', fontSize: '12px'}}>No allocation data.</div>;
  
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '140px', height: '140px' }}>
        {data.map((item, i) => {
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += item.value / total;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = item.value / total > 0.5 ? 1 : 0;
          const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
          return <path key={i} d={pathData} fill={item.color} />;
        })}
        <circle r="0.65" fill="var(--bg-card)" cx="0" cy="0" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }}></div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)' }}>{item.label}: {((item.value/total)*100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ClientDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [allocation, setAllocation] = useState([]);
  const [summary, setSummary] = useState({ totalAUM: 0, totalSipBook: 0, sipCount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    fetch('https://visionbridge-backend.onrender.com/api/clients', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching clients:", err));
  }, []);

  const handleSelectClient = (client) => {
    const token = sessionStorage.getItem("token");
    setSearchTerm(`${client.full_name} (${client.client_code || 'C' + client.id})`);
    setIsLoading(true);
    setSelectedClient({ id: client.id }); 

    fetch(`https://visionbridge-backend.onrender.com/api/client-dashboard/${client.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSelectedClient(data.profile);
        setPortfolio(data.portfolio || []);
        setSummary(data.summary || { totalAUM: 0, totalSipBook: 0, sipCount: 0 });
        
        // Map allocation data or provide defaults based on portfolio
        setAllocation(data.allocation || [
            { label: 'Equity', value: 70, color: '#38bdf8' },
            { label: 'Debt', value: 20, color: '#6366f1' },
            { label: 'Gold', value: 10, color: '#fbbf24' }
        ]);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setIsLoading(false);
      });
  };

  const safeNum = (val) => Number(val) || 0;
  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(safeNum(val)));

  // 💎 Executive Theme Styles
  const cardStyle = { 
    background: 'var(--bg-card)', 
    padding: '24px', 
    borderRadius: '12px', 
    border: '2.5px solid var(--border)',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.05)',
    marginBottom: '20px'
  };

  const labelStyle = { 
    fontSize: '13px', 
    color: 'var(--text-muted)', 
    fontWeight: '700', 
    letterSpacing: '0.3px',
    marginBottom: '8px'
  };

  const valStyle = { 
    fontSize: '28px', 
    fontWeight: '900', 
    color: 'var(--text-main)', 
    margin: '0',
    letterSpacing: '-0.5px'
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* 🔍 Search Header */}
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Search by Client ID or Name..." 
          style={{ 
            width: '100%', 
            padding: '16px 20px', 
            paddingLeft: '50px',
            fontSize: '15px', 
            fontWeight: '600',
            borderRadius: '12px', 
            border: '2.5px solid var(--border)', 
            background: 'var(--bg-card)', 
            color: 'var(--text-main)', 
            outline: 'none',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedClient(null); }}
        />
        <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7, fontSize: '18px', pointerEvents: 'none' }}>🔍</span>
        
        {searchTerm && !selectedClient?.full_name && (
          <div style={{ 
            position: 'absolute', 
            width: '100%', 
            background: 'var(--bg-card)', 
            zIndex: 100, 
            border: '2.5px solid var(--border)', 
            borderRadius: '12px', 
            marginTop: '8px', 
            maxHeight: '250px', 
            overflowY: 'auto',
            boxShadow: '6px 6px 0px rgba(0,0,0,0.05)'
          }}>
            {clients
              .filter(c => (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.client_code || '').toLowerCase().includes(searchTerm.toLowerCase()))
              .map(c => (
                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '16px 20px', cursor: 'pointer', borderBottom: '2px solid var(--border)', color: 'var(--text-main)', fontWeight: '700' }}>
                  <span style={{ color: '#0284c7', marginRight: '12px', fontWeight: '900' }}>{c.client_code || 'C'+c.id}</span> {c.full_name}
                </div>
              ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-main)', fontWeight: '900', fontSize: '15px' }}>SYNCING CLIENT PROFILE...</div>
      ) : selectedClient && selectedClient.full_name ? (
        <>
          {/* Profile Header */}
          <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                {selectedClient.full_name} 
                <span style={{fontSize: '18px', color: '#0284c7', marginLeft: '12px', fontWeight: '800'}}>({selectedClient.client_code || 'C' + selectedClient.id})</span>
              </h2>
              <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700', flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--bg-main)', padding: '6px 12px', borderRadius: '8px', border: '1.5px solid var(--border)' }}>
                  Age: <strong style={{ color: 'var(--text-main)', fontWeight: '900' }}>{selectedClient.age || 'N/A'} yrs</strong>
                </span>
                <span style={{ background: 'var(--bg-main)', padding: '6px 12px', borderRadius: '8px', border: '1.5px solid var(--border)' }}>
                  Risk: <strong style={{ color: '#10b981', fontWeight: '900' }}>{selectedClient.risk_profile || 'N/A'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={cardStyle}><div style={labelStyle}>Invested AUM</div><div style={{...valStyle, color: '#0284c7'}}>₹{formatINR(summary.totalAUM)}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Monthly SIP</div><div style={{...valStyle, color: '#10b981'}}>₹{formatINR(summary.totalSipBook)}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Active SIPs</div><div style={valStyle}>{summary.sipCount}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Client Since</div><div style={valStyle}>{selectedClient.since_formatted || formatDateForDisplay(selectedClient.onboarding_date)}</div></div>
          </div>

          {/* Portfolio Table */}
          <div style={{ ...cardStyle, padding: '0', overflow: 'hidden', marginBottom: '30px' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ background: 'rgba(0,0,0,0.03)' }}>
                  <tr style={{ borderBottom: '2.5px solid var(--border)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-main)', fontWeight: '900', fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Scheme Name</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '900', fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>SIP p.m.</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '900', fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Invested AUM</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '2px solid var(--border)' }}>
                      <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '800' }}>{item.scheme_name}</td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#10b981', fontWeight: '900' }}>{safeNum(item.sip_amount) > 0 ? `₹${formatINR(item.sip_amount)}` : '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR(item.invested_amount)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>

          {/* 💎 Bottom Insights Grid (Asset Allocation & Nominee) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Asset Allocation Card */}
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Asset Allocation</h3>
                <AssetDonut data={allocation} />
            </div>

            {/* Nomination Status Card */}
            <div style={{ 
                ...cardStyle, 
                borderLeft: selectedClient.nominee_name ? '6px solid #10b981' : '6px solid #f59e0b',
                background: selectedClient.nominee_name ? 'rgba(16, 185, 129, 0.02)' : 'rgba(245, 158, 11, 0.02)'
            }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Nominee Status</h3>
                {selectedClient.nominee_name ? (
                    <div>
                        <div style={{ color: '#10b981', fontWeight: '900', fontSize: '18px', marginBottom: '4px' }}>✅ Registered</div>
                        <div style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '14px' }}>{selectedClient.nominee_name} <span style={{opacity: 0.6, fontSize: '12px'}}>({selectedClient.nominee_relation})</span></div>
                    </div>
                ) : (
                    <div>
                        <div style={{ color: '#f59e0b', fontWeight: '900', fontSize: '18px', marginBottom: '4px' }}>⚠️ Not Registered</div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '13px', lineHeight: 1.5 }}>No nominee details found for this profile. Please update the client record to ensure regulatory compliance.</div>
                    </div>
                )}
            </div>

          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-card)', borderRadius: '12px', border: '2.5px solid var(--border)', color: 'var(--text-muted)' }}>
          <h2 style={{ fontWeight: '900', fontSize: '24px', color: 'var(--text-main)', marginBottom: '12px' }}>Client Insights Hub</h2>
          <p style={{ fontWeight: '600' }}>Search a Client to view deep portfolio analytics.</p>
        </div>
      )}
    </div>
  );
};

// Helper for display formatting inside the component
const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB').replace(/\//g, '-'); 
};

export default ClientDashboard;
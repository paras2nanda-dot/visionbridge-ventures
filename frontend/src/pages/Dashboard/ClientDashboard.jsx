import React, { useState, useEffect } from 'react';

// --- Premium Donut Chart with Dynamic Legends ---
const AssetDonut = ({ data }) => {
  if (!data || data.length === 0) return (
    <div style={{ padding: '40px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '2.5px dashed var(--border)', textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: '28px', marginBottom: '10px' }}>📊</div>
        <div style={{ color: 'var(--text-main)', fontWeight: '900', fontSize: '14px' }}>Allocation Data Unavailable</div>
        <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', marginTop: '4px' }}>Ensure scheme names in Master and Portfolio match exactly.</div>
    </div>
  );
  
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '150px', height: '150px' }}>
        {data.map((item, i) => {
          if (item.value <= 0) return null;
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += item.value / total;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = item.value / total > 0.5 ? 1 : 0;
          const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
          return <path key={i} d={pathData} fill={item.color} style={{ transition: 'all 0.3s ease' }} />;
        })}
        <circle r="0.68" fill="var(--bg-card)" cx="0" cy="0" />
      </svg>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 30px' }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
            <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              {item.label}: <span style={{color: 'var(--text-muted)', fontWeight: '700'}}>{((item.value/total)*100).toFixed(1)}%</span>
            </span>
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
  const [schemes, setSchemes] = useState([]); 
  const [summary, setSummary] = useState({ totalAUM: 0, totalSipBook: 0, sipCount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch('https://visionbridge-backend.onrender.com/api/clients', { headers })
      .then(res => res.json())
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error:", err));

    fetch('https://visionbridge-backend.onrender.com/api/mf-schemes', { headers })
      .then(res => res.json())
      .then(data => setSchemes(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error:", err));
  }, []);

  const handleSelectClient = (client) => {
    const token = sessionStorage.getItem("token");
    setSearchTerm(`${client.full_name} (${client.client_code || 'C' + client.id})`);
    setIsLoading(true);

    fetch(`https://visionbridge-backend.onrender.com/api/client-dashboard/${client.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSelectedClient(data.profile);
        setPortfolio(data.portfolio || []);
        setSummary(data.summary || { totalAUM: 0, totalSipBook: 0, sipCount: 0 });
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setIsLoading(false);
      });
  };

  const safeNum = (val) => parseFloat(val) || 0;
  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(safeNum(val)));

  // 🧪 FUZZY SYNC LOGIC: Matches Portfolio to Master Weights
  const getAssetAllocation = () => {
    const totals = { large: 0, mid: 0, small: 0, debt: 0, gold: 0 };
    
    portfolio.forEach(item => {
      // Use Invested AUM if available, otherwise fallback to SIP amount for projected allocation
      const value = safeNum(item.invested_amount) > 0 ? safeNum(item.invested_amount) : safeNum(item.sip_amount);
      
      const master = schemes.find(s => 
        s.scheme_name.trim().toLowerCase() === item.scheme_name.trim().toLowerCase()
      );
      
      if (master && value > 0) {
          // Check for multiple possible database key names (large vs large_percent vs large_cap)
          totals.large += value * (safeNum(master.large_percent || master.large_cap || master.large) / 100);
          totals.mid += value * (safeNum(master.mid_percent || master.mid_cap || master.mid) / 100);
          totals.small += value * (safeNum(master.small_percent || master.small_cap || master.small) / 100);
          totals.debt += value * (safeNum(master.debt_percent || master.debt || master.debt_cap) / 100);
          totals.gold += value * (safeNum(master.gold_percent || master.gold || master.gold_cap) / 100);
      }
    });

    return [
      { label: 'Large', value: totals.large, color: '#3b82f6' },
      { label: 'Mid', value: totals.mid, color: '#a855f7' },
      { label: 'Small', value: totals.small, color: '#f59e0b' },
      { label: 'Debt', value: totals.debt, color: '#10b981' },
      { label: 'Gold', value: totals.gold, color: '#fbbf24' }
    ].filter(a => a.value > 0);
  };

  const cardStyle = { 
    background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '2.5px solid var(--border)',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.05)', marginBottom: '20px'
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* 🔍 Search Header */}
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Search by Client ID or Name..." 
          style={{ width: '100%', padding: '16px 20px', paddingLeft: '50px', fontSize: '15px', fontWeight: '600', borderRadius: '12px', border: '2.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedClient(null); }}
        />
        <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7, fontSize: '18px' }}>🔍</span>
        
        {searchTerm && !selectedClient?.full_name && (
          <div style={{ position: 'absolute', width: '100%', background: 'var(--bg-card)', zIndex: 100, border: '2.5px solid var(--border)', borderRadius: '12px', marginTop: '8px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            {clients.filter(c => (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.client_code || '').toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '16px 20px', cursor: 'pointer', borderBottom: '2px solid var(--border)', color: 'var(--text-main)', fontWeight: '700' }}>
                  <span style={{ color: '#0284c7', marginRight: '12px', fontWeight: '900' }}>{c.client_code}</span> {c.full_name}
                </div>
              ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-main)', fontWeight: '900', fontSize: '15px' }}>SYNCING CLIENT PROFILE...</div>
      ) : selectedClient && selectedClient.full_name ? (
        <>
          {/* Header Card */}
          <div style={cardStyle}>
              <h2 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                {selectedClient.full_name} 
                <span style={{fontSize: '18px', color: '#0284c7', marginLeft: '12px'}}>({selectedClient.client_code})</span>
              </h2>
              <div style={{ display: 'flex', gap: '15px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', alignItems: 'center' }}>
                <span>Age: <strong style={{color: 'var(--text-main)'}}>{selectedClient.age || 'N/A'} yrs</strong></span>
                <span style={{width: '1px', height: '12px', background: 'var(--border)'}}></span>
                <span>Risk Profile: <strong style={{color: '#f59e0b'}}>{selectedClient.risk_profile || 'Medium'}</strong></span>
              </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={cardStyle}><div style={{fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px'}}>Client Invested AUM</div><div style={{fontSize: '24px', fontWeight: '900', color: '#0284c7'}}>₹{formatINR(summary.totalAUM)}</div></div>
            <div style={cardStyle}><div style={{fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px'}}>Active SIP Amount</div><div style={{fontSize: '24px', fontWeight: '900', color: '#a855f7'}}>₹{formatINR(summary.totalSipBook)} <span style={{fontSize: '12px', opacity: 0.6}}>/ mo</span></div></div>
            <div style={cardStyle}><div style={{fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px'}}>Active SIPs</div><div style={{fontSize: '24px', fontWeight: '900', color: 'var(--text-main)'}}>{summary.sipCount}</div></div>
            <div style={cardStyle}><div style={{fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px'}}>Client Since</div><div style={{fontSize: '24px', fontWeight: '900', color: 'var(--text-main)'}}>{selectedClient.since_formatted || formatDateForDisplay(selectedClient.onboarding_date)}</div></div>
          </div>

          {/* 📂 FULL PORTFOLIO TABLE (Restored TOTAL & %) */}
          <div style={{ ...cardStyle, padding: '0', overflow: 'hidden', marginBottom: '30px' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <tr style={{ borderBottom: '2.5px solid var(--border)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}>Scheme Name</th>
                    <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}>SIP p.m.</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}>Invested AUM</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '700' }}>{item.scheme_name}</td>
                      <td style={{ padding: '16px', textAlign: 'center', color: '#10b981', fontWeight: '800' }}>{safeNum(item.sip_amount) > 0 ? `₹${formatINR(item.sip_amount)}` : '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>₹{formatINR(item.invested_amount)}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>{summary.totalAUM > 0 ? ((safeNum(item.invested_amount) / summary.totalAUM) * 100).toFixed(1) : '0'}%</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(0,0,0,0.03)', fontWeight: '900' }}>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>TOTAL</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: 'var(--text-main)' }}>₹{formatINR(summary.totalSipBook)}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)' }}>₹{formatINR(summary.totalAUM)}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)' }}>100%</td>
                  </tr>
                </tbody>
             </table>
          </div>

          {/* Allocation & Nominee Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '13px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Asset Allocation</h3>
                <AssetDonut data={getAssetAllocation()} />
            </div>

            <div style={{ ...cardStyle, borderLeft: selectedClient.nominee_name ? '6px solid #10b981' : '6px solid #f59e0b' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Nominee Status</h3>
                {selectedClient.nominee_name ? (
                    <div>
                        <div style={{ color: '#10b981', fontWeight: '900', fontSize: '18px', marginBottom: '4px' }}>✅ Registered</div>
                        <div style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '14px' }}>{selectedClient.nominee_name} <span style={{opacity: 0.6, fontSize: '12px'}}>({selectedClient.nominee_relation})</span></div>
                    </div>
                ) : (
                    <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px' }}>
                        <div style={{ color: '#f59e0b', fontWeight: '900', fontSize: '18px', marginBottom: '6px' }}>⚠️ Nominee Not Registered</div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '12px', lineHeight: 1.4 }}>Update nominee details in the Clients Database to ensure regulatory compliance.</div>
                    </div>
                )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'var(--bg-card)', borderRadius: '12px', border: '2.5px dashed var(--border)', color: 'var(--text-muted)' }}>
          <h2 style={{ fontWeight: '900', fontSize: '24px', color: 'var(--text-main)', marginBottom: '10px' }}>Client Insights Hub</h2>
          <p style={{ fontWeight: '600' }}>Search a Client to view detailed portfolio analytics.</p>
        </div>
      )}
    </div>
  );
};

const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB').replace(/\//g, '-'); 
};

export default ClientDashboard;
import React, { useState, useEffect } from 'react';

const ClientDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [alerts, setAlerts] = useState(0);
  const [summary, setSummary] = useState({ totalAUM: 0, totalSipBook: 0, sipCount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // 1. 💡 THE FIX: Fetch all clients with Authorization Header
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    fetch('https://visionbridge-backend.onrender.com/api/clients', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching clients:", err));
  }, []);

  // 2. 💡 THE FIX: Fetch individual client portfolio with Authorization Header
  const handleSelectClient = (client) => {
    const token = sessionStorage.getItem("token");
    setSearchTerm(`${client.full_name} (${client.client_code || 'C' + client.id})`);
    setIsLoading(true);
    setSelectedClient({ id: client.id }); 

    fetch(`https://visionbridge-backend.onrender.com/api/client-dashboard/${client.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized or Network error");
        return res.json();
      })
      .then(data => {
        setSelectedClient(data.profile);
        setPortfolio(data.portfolio || []);
        setSummary(data.summary || { totalAUM: 0, totalSipBook: 0, sipCount: 0 });
        setAlerts(data.alerts || 0);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching portfolio:", err);
        alert("❌ Error: Could not fetch client data. Please check if you are logged in.");
        setSelectedClient(null);
        setIsLoading(false);
      });
  };

  // Safe Math Helpers
  const safeNum = (val) => Number(val) || 0;
  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(safeNum(val)));

  // 📊 CALCULATE ASSET ALLOCATION
  const totalInvestedAUM = safeNum(summary.totalAUM);
  
  const alloc = portfolio.reduce((acc, item) => {
    const aum = safeNum(item.invested_amount);
    acc.large += aum * (safeNum(item.large_cap) / 100);
    acc.mid += aum * (safeNum(item.mid_cap) / 100);
    acc.small += aum * (safeNum(item.small_cap) / 100);
    acc.debt += aum * (safeNum(item.debt_allocation) / 100);
    acc.gold += aum * (safeNum(item.gold_allocation) / 100);
    return acc;
  }, { large: 0, mid: 0, small: 0, debt: 0, gold: 0 });

  const pct = {
    large: totalInvestedAUM ? (alloc.large / totalInvestedAUM) * 100 : 0,
    mid: totalInvestedAUM ? (alloc.mid / totalInvestedAUM) * 100 : 0,
    small: totalInvestedAUM ? (alloc.small / totalInvestedAUM) * 100 : 0,
    debt: totalInvestedAUM ? (alloc.debt / totalInvestedAUM) * 100 : 0,
    gold: totalInvestedAUM ? (alloc.gold / totalInvestedAUM) * 100 : 0,
  };

  const conicGradient = `conic-gradient(
    #3b82f6 0% ${pct.large}%, 
    #8b5cf6 ${pct.large}% ${pct.large + pct.mid}%, 
    #f59e0b ${pct.large + pct.mid}% ${pct.large + pct.mid + pct.small}%, 
    #10b981 ${pct.large + pct.mid + pct.small}% ${pct.large + pct.mid + pct.small + pct.debt}%, 
    #eab308 ${pct.large + pct.mid + pct.small + pct.debt}% 100%
  )`;

  const cardStyle = { background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
  const labelStyle = { fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' };
  const valStyle = { fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '5px' };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* 🔍 SEARCH BAR */}
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search by Client ID or Name..." 
          style={{ width: '100%', padding: '16px 20px', fontSize: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedClient(null); }}
        />
        {searchTerm && !selectedClient?.full_name && (
          <div style={{ position: 'absolute', width: '100%', background: 'white', zIndex: 100, border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '5px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            {clients
              .filter(c => (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.client_code || '').toLowerCase().includes(searchTerm.toLowerCase()))
              .map(c => (
                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: '500', color: '#334155' }}>
                  <span style={{ color: '#38bdf8', marginRight: '10px' }}>{c.client_code || 'C'+c.id}</span> {c.full_name}
                </div>
              ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 'bold' }}>⏳ Loading Client Portfolio...</div>
      ) : selectedClient && selectedClient.full_name ? (
        <>
          {/* 🧑‍💼 CLIENT HEADER */}
          <div style={{ background: 'linear-gradient(to right, #f0f9ff, #ffffff)', padding: '20px', borderRadius: '12px', borderLeft: '6px solid #0ea5e9', marginBottom: '25px', borderTop: '1px solid #e0f2fe', borderRight: '1px solid #e0f2fe', borderBottom: '1px solid #e0f2fe' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '26px' }}>{selectedClient.full_name} <span style={{fontSize: '16px', color: '#64748b', fontWeight: '500'}}>({selectedClient.client_code || 'C' + selectedClient.id})</span></h2>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#475569' }}>
              <span>Age: <strong style={{ color: selectedClient.age === 'N/A' ? '#94a3b8' : '#0f172a' }}>{selectedClient.age === 'N/A' ? 'Not Set' : `${selectedClient.age} years`}</strong></span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span>Risk Profile: <strong style={{ color: selectedClient.risk_profile === 'High' ? '#ef4444' : selectedClient.risk_profile === 'Medium' ? '#f59e0b' : '#10b981' }}>{selectedClient.risk_profile || 'Not Set'}</strong></span>
            </div>
          </div>

          {/* 🟦 CLIENT SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={cardStyle}><div style={labelStyle}>Client Invested AUM</div><div style={{...valStyle, color: '#0ea5e9'}}>₹{formatINR(summary.totalAUM)}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Active SIP Amount</div><div style={{...valStyle, color: '#8b5cf6'}}>₹{formatINR(summary.totalSipBook)} <span style={{fontSize: '14px', color: '#94a3b8', fontWeight: '500'}}>/ mo</span></div></div>
            <div style={cardStyle}><div style={labelStyle}>Active SIPs</div><div style={valStyle}>{summary.sipCount}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Client Since</div><div style={valStyle}>{selectedClient.since_formatted}</div></div>
          </div>

          {/* 📋 CLIENT PORTFOLIO SUMMARY – CORE TABLE */}
          <div className="card" style={{ padding: '0', overflowX: 'auto', marginBottom: '30px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#475569' }}>Scheme Name</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#475569' }}>SIP p.m.</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#475569' }}>Invested AUM</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#475569' }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.length > 0 ? portfolio.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontWeight: '500', color: '#1e293b' }}>{item.scheme_name}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: safeNum(item.sip_amount) > 0 ? '#10b981' : '#94a3b8' }}>
                      {safeNum(item.sip_amount) > 0 ? `₹${formatINR(item.sip_amount)}` : '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600' }}>₹{formatINR(item.invested_amount)}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: '#64748b' }}>{item.percentage}%</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No investments found for this client.</td></tr>
                )}
                
                {portfolio.length > 0 && (
                  <tr style={{ background: '#f0f9ff', borderTop: '2px solid #0ea5e9' }}>
                    <td style={{ padding: '16px', fontWeight: '800', color: '#0f172a' }}>TOTAL</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>₹{formatINR(summary.totalSipBook)}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>₹{formatINR(summary.totalAUM)}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>100%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 📊 ASSET ALLOCATION & 🏷️ OPERATIONAL INFO GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '30px' }}>
              <div style={{ flex: '0 0 120px', height: '120px', borderRadius: '50%', background: conicGradient, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '20%', left: '20%', width: '60%', height: '60%', background: '#fff', borderRadius: '50%' }}></div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={labelStyle}>Asset Allocation</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginTop: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }}></div>Large Cap: <strong>{pct.large.toFixed(1)}%</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '2px' }}></div>Mid Cap: <strong>{pct.mid.toFixed(1)}%</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }}></div>Small Cap: <strong>{pct.small.toFixed(1)}%</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></div>Debt: <strong>{pct.debt.toFixed(1)}%</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#eab308', borderRadius: '2px' }}></div>Gold: <strong>{pct.gold.toFixed(1)}%</strong></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ ...cardStyle, padding: '15px 20px', borderLeft: (selectedClient.nominee_name && selectedClient.nominee_name.length > 2) ? '6px solid #10b981' : '6px solid #f59e0b' }}>
                <div style={labelStyle}>Nominee Status</div>
                {(selectedClient.nominee_name && selectedClient.nominee_name.length > 2) ? (
                  <div style={{ marginTop: '5px', fontSize: '15px', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✔ Nominee Registered
                  </div>
                ) : (
                  <div style={{ marginTop: '5px', fontSize: '15px', fontWeight: '700', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠ Nominee Not Registered
                  </div>
                )}
              </div>

              {alerts > 0 && (
                <div style={{ ...cardStyle, padding: '15px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '6px solid #ef4444' }}>
                  <div style={{...labelStyle, color: '#b91c1c'}}>🔔 SIP End Alert</div>
                  <div style={{ marginTop: '5px', fontSize: '15px', fontWeight: '700', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠ {alerts} SIP{alerts > 1 ? 's' : ''} ending in next 60 days
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', color: '#64748b' }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔎</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#334155' }}>Select a Client</h3>
          <p style={{ margin: 0 }}>Use the search bar above to view a client's complete portfolio and insights.</p>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
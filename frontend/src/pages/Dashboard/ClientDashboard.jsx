import React, { useState, useEffect } from 'react';

const ClientDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
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
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setIsLoading(false);
      });
  };

  const safeNum = (val) => Number(val) || 0;
  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(safeNum(val)));

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

  const conicGradient = `conic-gradient(#3b82f6 0% ${pct.large}%, #8b5cf6 ${pct.large}% ${pct.large + pct.mid}%, #f59e0b ${pct.large + pct.mid}% ${pct.large + pct.mid + pct.small}%, #10b981 ${pct.large + pct.mid + pct.small}% ${pct.large + pct.mid + pct.small + pct.debt}%, #eab308 ${pct.large + pct.mid + pct.small + pct.debt}% 100%)`;

  /* 💡 RESTORED: Executive Card Styling specifically for metrics */
  const executiveCardStyle = { 
    background: 'linear-gradient(145deg, #1e293b, #0f172a)', 
    padding: '20px', 
    borderRadius: '16px', 
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)' 
  };
  const labelStyle = { fontSize: '11px', color: '#ffffff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const valStyle = { fontSize: '26px', fontWeight: '900', color: '#ffffff', marginTop: '8px' };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search by Client ID or Name..." 
          style={{ width: '100%', padding: '16px 20px', fontSize: '15px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedClient(null); }}
        />
        {searchTerm && !selectedClient?.full_name && (
          <div style={{ position: 'absolute', width: '100%', background: 'var(--bg-card)', zIndex: 100, border: '1px solid var(--border)', borderRadius: '8px', marginTop: '5px', maxHeight: '250px', overflowY: 'auto' }}>
            {clients
              .filter(c => (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.client_code || '').toLowerCase().includes(searchTerm.toLowerCase()))
              .map(c => (
                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid var(--border)', color: 'var(--text-main)' }}>
                  <span style={{ color: '#6366f1', marginRight: '10px' }}>{c.client_code || 'C'+c.id}</span> {c.full_name}
                </div>
              ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)', fontWeight: 'bold' }}>⏳ Loading Client Portfolio...</div>
      ) : selectedClient && selectedClient.full_name ? (
        <>
          <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '16px', marginBottom: '25px' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#ffffff', fontSize: '26px' }}>{selectedClient.full_name} <span style={{fontSize: '16px', color: '#94a3b8'}}>({selectedClient.client_code || 'C' + selectedClient.id})</span></h2>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#94a3b8' }}>
              <span>Age: <strong style={{ color: '#ffffff' }}>{selectedClient.age ? `${selectedClient.age} years` : 'Not Set'}</strong></span>
              <span>|</span>
              <span>Risk Profile: <strong style={{ color: selectedClient.risk_profile === 'High' ? '#ef4444' : '#10b981' }}>{selectedClient.risk_profile || 'Not Set'}</strong></span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={executiveCardStyle}><div style={labelStyle}>Client Invested AUM</div><div style={{...valStyle, color: '#6366f1'}}>₹{formatINR(summary.totalAUM)}</div></div>
            <div style={executiveCardStyle}><div style={labelStyle}>Active SIP Amount</div><div style={{...valStyle, color: '#34d399'}}>₹{formatINR(summary.totalSipBook)} <span style={{fontSize: '14px', color: '#94a3b8'}}>/ mo</span></div></div>
            <div style={executiveCardStyle}><div style={labelStyle}>Active SIPs</div><div style={valStyle}>{summary.sipCount}</div></div>
            <div style={executiveCardStyle}><div style={labelStyle}>Client Since</div><div style={valStyle}>{selectedClient.since_formatted}</div></div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '30px' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ background: 'var(--bg-main)' }}><tr style={{ borderBottom: '2px solid var(--border)' }}><th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)' }}>Scheme Name</th><th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)' }}>SIP p.m.</th><th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)' }}>Invested AUM</th></tr></thead>
                <tbody>
                  {portfolio.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px', color: 'var(--text-main)' }}>{item.scheme_name}</td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#10b981' }}>{safeNum(item.sip_amount) > 0 ? `₹${formatINR(item.sip_amount)}` : '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>₹{formatINR(item.invested_amount)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-main)', borderRadius: '16px', border: '2px dashed var(--border)', color: 'var(--text-muted)' }}>
          <h3>Select a Client</h3>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
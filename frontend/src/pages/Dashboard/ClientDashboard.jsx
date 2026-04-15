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
            paddingLeft: '50px', // Space for the icon
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
        
        {/* Autocomplete Dropdown */}
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
                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '16px 20px', cursor: 'pointer', borderBottom: '2px solid var(--border)', color: 'var(--text-main)', fontWeight: '700', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ color: '#0284c7', marginRight: '12px', fontWeight: '900' }}>{c.client_code || 'C'+c.id}</span> {c.full_name}
                </div>
              ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-main)', fontWeight: '900', fontSize: '15px', letterSpacing: '0.5px' }}>SYNCING CLIENT PROFILE...</div>
      ) : selectedClient && selectedClient.full_name ? (
        <>
          {/* 💎 Client Profile Header */}
          <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                {selectedClient.full_name} 
                <span style={{fontSize: '18px', color: '#0284c7', marginLeft: '12px', fontWeight: '800'}}>({selectedClient.client_code || 'C' + selectedClient.id})</span>
              </h2>
              <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700', flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--bg-main)', padding: '6px 12px', borderRadius: '8px', border: '1.5px solid var(--border)' }}>
                  Age: <strong style={{ color: 'var(--text-main)', fontWeight: '900' }}>{selectedClient.age ? `${selectedClient.age} yrs` : 'N/A'}</strong>
                </span>
                <span style={{ background: 'var(--bg-main)', padding: '6px 12px', borderRadius: '8px', border: '1.5px solid var(--border)' }}>
                  Risk Profile: <strong style={{ color: selectedClient.risk_profile === 'High' ? '#ef4444' : '#10b981', fontWeight: '900' }}>{selectedClient.risk_profile || 'N/A'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 📊 Client Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={cardStyle}><div style={labelStyle}>Invested AUM</div><div style={{...valStyle, color: '#0284c7'}}>₹{formatINR(summary.totalAUM)}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Monthly SIP</div><div style={{...valStyle, color: '#10b981'}}>₹{formatINR(summary.totalSipBook)}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Active SIPs</div><div style={valStyle}>{summary.sipCount}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Relationship Since</div><div style={valStyle}>{selectedClient.since_formatted}</div></div>
          </div>

          {/* 📂 Portfolio Table */}
          <div className="table-container" style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '2.5px solid var(--border)', overflow: 'hidden', boxShadow: '6px 6px 0px rgba(0,0,0,0.05)' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ background: 'rgba(0,0,0,0.03)' }}>
                  <tr style={{ borderBottom: '2.5px solid var(--border)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-main)', fontWeight: '900' }}>Scheme Name</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '900' }}>SIP Amount (p.m.)</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '900' }}>Invested Value</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '2px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '800' }}>{item.scheme_name}</td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#10b981', fontWeight: '900' }}>{safeNum(item.sip_amount) > 0 ? `₹${formatINR(item.sip_amount)}` : '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR(item.invested_amount)}</td>
                    </tr>
                  ))}
                  {portfolio.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800' }}>No investments found for this client.</td>
                    </tr>
                  )}
                </tbody>
             </table>
          </div>
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 20px', 
          background: 'var(--bg-card)', 
          borderRadius: '12px', 
          border: '2.5px solid var(--border)', 
          color: 'var(--text-muted)',
          boxShadow: '4px 4px 0px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontWeight: '900', fontSize: '24px', color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-0.5px' }}>Client Insights Hub</h2>
          <p style={{ fontWeight: '600', fontSize: '15px' }}>Type a Name or ID in the search bar above to pull their complete portfolio.</p>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
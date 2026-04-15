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
    boxShadow: '6px 6px 0px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  };

  const labelStyle = { 
    fontSize: '11px', 
    color: 'var(--text-muted)', 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em' 
  };

  const valStyle = { 
    fontSize: '24px', 
    fontWeight: '900', 
    color: 'var(--text-main)', 
    marginTop: '6px' 
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      {/* 🔍 Search Header */}
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search by Client ID or Name..." 
          style={{ 
            width: '100%', 
            padding: '16px 20px', 
            fontSize: '16px', 
            fontWeight: '600',
            borderRadius: '12px', 
            border: '2.5px solid var(--border)', 
            background: 'var(--bg-card)', 
            color: 'var(--text-main)', 
            outline: 'none',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.05)'
          }}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedClient(null); }}
        />
        {searchTerm && !selectedClient?.full_name && (
          <div style={{ 
            position: 'absolute', 
            width: '100%', 
            background: 'var(--bg-card)', 
            zIndex: 100, 
            border: '2.5px solid var(--border)', 
            borderRadius: '8px', 
            marginTop: '8px', 
            maxHeight: '250px', 
            overflowY: 'auto',
            boxShadow: '10px 10px 20px rgba(0,0,0,0.1)'
          }}>
            {clients
              .filter(c => (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.client_code || '').toLowerCase().includes(searchTerm.toLowerCase()))
              .map(c => (
                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '14px 20px', cursor: 'pointer', borderBottom: '2px solid var(--border)', color: 'var(--text-main)', fontWeight: '700' }}>
                  <span style={{ color: '#38bdf8', marginRight: '10px' }}>{c.client_code || 'C'+c.id}</span> {c.full_name}
                </div>
              ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-main)', fontWeight: '900', fontSize: '18px' }}>⏳ SYNCING CLIENT PROFILE...</div>
      ) : selectedClient && selectedClient.full_name ? (
        <>
          {/* 💎 Client Profile Header */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '28px', fontWeight: '900' }}>
              {selectedClient.full_name} 
              <span style={{fontSize: '16px', color: '#38bdf8', marginLeft: '12px'}}>({selectedClient.client_code || 'C' + selectedClient.id})</span>
            </h2>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '700' }}>
              <span>Age: <span style={{ color: 'var(--text-main)' }}>{selectedClient.age ? `${selectedClient.age} years` : 'Not Set'}</span></span>
              <span>|</span>
              <span>Risk Profile: <span style={{ color: selectedClient.risk_profile === 'High' ? '#ef4444' : '#10b981' }}>{selectedClient.risk_profile || 'Not Set'}</span></span>
            </div>
          </div>

          {/* 📊 Client Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={cardStyle}><div style={labelStyle}>Invested AUM</div><div style={{...valStyle, color: '#38bdf8'}}>₹{formatINR(summary.totalAUM)}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Monthly SIP</div><div style={{...valStyle, color: '#10b981'}}>₹{formatINR(summary.totalSipBook)}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Active SIPs</div><div style={valStyle}>{summary.sipCount}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Relationship Since</div><div style={valStyle}>{selectedClient.since_formatted}</div></div>
          </div>

          {/* 📂 Portfolio Table */}
          <div className="table-container" style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '2.5px solid var(--border)', overflow: 'hidden', boxShadow: '6px 6px 0px rgba(0,0,0,0.1)' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ background: 'rgba(0,0,0,0.05)' }}>
                  <tr style={{ borderBottom: '2.5px solid var(--border)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-main)', fontWeight: '900', textTransform: 'uppercase' }}>Scheme Name</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '900', textTransform: 'uppercase' }}>SIP p.m.</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '900', textTransform: 'uppercase' }}>Invested Value</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '2px solid var(--border)' }}>
                      <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '700' }}>{item.scheme_name}</td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#10b981', fontWeight: '800' }}>{safeNum(item.sip_amount) > 0 ? `₹${formatINR(item.sip_amount)}` : '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', color: 'var(--text-main)' }}>₹{formatINR(item.invested_amount)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px', 
          background: 'var(--bg-card)', 
          borderRadius: '16px', 
          border: '3px dashed var(--border)', 
          color: 'var(--text-muted)' 
        }}>
          <h2 style={{ fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>Select Client to View Insights</h2>
          <p style={{ marginTop: '10px', fontWeight: '600' }}>Type a name in the search bar above to begin.</p>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
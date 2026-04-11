import React, { useState, useEffect } from 'react';

const ClientDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [alerts, setAlerts] = useState(0);
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
      .then(res => {
        if (!res.ok) throw new Error("Network error");
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
        console.error("Error fetching data:", err);
        setIsLoading(false);
      });
  };

  const safeNum = (val) => Number(val) || 0;
  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(safeNum(val)));

  const cardStyle = { background: 'var(--bg-card, #fff)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
  const labelStyle = { fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: 'bold', textTransform: 'uppercase' };
  const valStyle = { fontSize: '24px', fontWeight: '800', color: 'var(--text-main, #0f172a)', marginTop: '5px' };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search Client..." 
          style={{ width: '100%', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border, #cbd5e1)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedClient(null); }}
        />
        {searchTerm && !selectedClient?.full_name && (
          <div style={{ position: 'absolute', width: '100%', background: 'var(--bg-card)', zIndex: 100, border: '1px solid var(--border)', borderRadius: '8px', marginTop: '5px', maxHeight: '200px', overflowY: 'auto' }}>
            {clients
              .filter(c => c.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(c => (
                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                  {c.full_name}
                </div>
              ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Loading...</div>
      ) : selectedClient && selectedClient.full_name ? (
        <>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', borderLeft: '6px solid #0ea5e9', marginBottom: '25px', border: '1px solid var(--border)' }}>
            <h2 style={{ margin: '0' }}>{selectedClient.full_name} ({selectedClient.client_code || 'C' + selectedClient.id})</h2>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-muted)', marginTop: '5px' }}>
              <span>Age: <strong>{selectedClient.age || 'N/A'}</strong></span>
              <span>Risk Profile: <strong>{selectedClient.risk_profile}</strong></span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={cardStyle}><div style={labelStyle}>Client Invested AUM</div><div style={{...valStyle, color: '#0ea5e9'}}>₹{formatINR(summary.totalAUM)}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Active SIP Amount</div><div style={{...valStyle, color: '#8b5cf6'}}>₹{formatINR(summary.totalSipBook)} <span style={{fontSize: '14px', color: '#94a3b8'}}>/ mo</span></div></div>
            <div style={cardStyle}><div style={labelStyle}>Active SIPs</div><div style={valStyle}>{summary.sipCount}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Client Since</div><div style={valStyle}>{selectedClient.since_formatted}</div></div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px', border: '2px dashed var(--border)', borderRadius: '16px' }}>
          Select a client to view insights.
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
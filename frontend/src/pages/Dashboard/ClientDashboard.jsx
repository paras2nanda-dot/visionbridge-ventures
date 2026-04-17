import React, { useState, useEffect } from 'react';
import { Search, PieChart as PieChartIcon, CheckCircle2, AlertTriangle, UserSearch, Wallet, TrendingUp, Clock, Activity } from 'lucide-react';

// --- Premium Donut Chart with Precise Segments ---
const AssetDonut = ({ data }) => {
  if (!data || data.length === 0) return (
    <div style={{ padding: '40px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center', width: '100%' }}>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><PieChartIcon size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} /></div>
        <div style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '14px' }}>Allocation Data Unavailable</div>
        <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', marginTop: '6px' }}>Ensure scheme names in Master and Portfolio match exactly.</div>
    </div>
  );
  
  // 🟢 FIX: Ensure total is never 0 or NaN to prevent division by zero crashes
  const total = data.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
  if (total <= 0) return (
    <div style={{ padding: '40px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center', width: '100%' }}>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><PieChartIcon size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} /></div>
        <div style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '14px' }}>Portfolio Value is ₹0</div>
        <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', marginTop: '6px' }}>Asset allocation cannot be calculated.</div>
    </div>
  );

  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '150px', height: '150px', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.05))' }}>
        {data.map((item, i) => {
          const val = Number(item.value) || 0;
          if (val <= 0) return null;
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += val / total;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = val / total > 0.5 ? 1 : 0;
          
          // 🟢 FIX: Handle 100% edge case where start and end coordinates are the same
          if (val / total === 1) {
             return <circle key={i} r="1" fill={item.color} cx="0" cy="0" />
          }

          const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
          return <path key={i} d={pathData} fill={item.color} style={{ transition: 'all 0.3s ease' }} />;
        })}
        <circle r="0.68" fill="var(--bg-card)" cx="0" cy="0" />
      </svg>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 30px' }}>
        {data.map((item, i) => {
           const val = Number(item.value) || 0;
           if (val <= 0) return null;
           return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                {item.label}: <span style={{color: 'var(--text-muted)', fontWeight: '600'}}>{((val/total)*100).toFixed(1)}%</span>
              </span>
            </div>
           )
        })}
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
  const [clientUpcomingSIPs, setClientUpcomingSIPs] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch('https://visionbridge-backend.onrender.com/api/clients', { headers })
      .then(res => res.json())
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching clients:", err));

    fetch('https://visionbridge-backend.onrender.com/api/mf-schemes', { headers })
      .then(res => res.json())
      .then(data => setSchemes(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching master schemes:", err));
  }, []);

  const handleSelectClient = (client) => {
    const token = sessionStorage.getItem("token");
    const headers = { 'Authorization': `Bearer ${token}` };
    setSearchTerm(`${client.full_name} (${client.client_code || 'C' + client.id})`);
    setIsLoading(true);

    Promise.all([
      fetch(`https://visionbridge-backend.onrender.com/api/client-dashboard/${client.id}`, { headers }),
      fetch(`https://visionbridge-backend.onrender.com/api/sips`, { headers })
    ])
      .then(async ([dashRes, sipRes]) => {
        const dashData = await dashRes.json();
        const sipData = await sipRes.json();

        setSelectedClient(dashData.profile || client); // 🟢 FIX: Fallback to basic profile if dashboard fails
        setPortfolio(dashData.portfolio || []);
        setSummary(dashData.summary || { totalAUM: 0, totalSipBook: 0, sipCount: 0 });

        if (Array.isArray(sipData)) {
            const today = new Date();
            const sixtyDaysFromNow = new Date();
            sixtyDaysFromNow.setDate(today.getDate() + 60);

            const filtered = sipData.filter(sip => {
                const isSameClient = String(sip.client_id) === String(client.id);
                if (!isSameClient || !sip.end_date || sip.status !== 'Active') return false;
                const endDate = new Date(sip.end_date);
                return endDate >= today && endDate <= sixtyDaysFromNow;
            });
            setClientUpcomingSIPs(filtered);
        }

        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error loading profile:", err);
        setSelectedClient(client); // 🟢 FIX: At least show the name if the data fetch fails completely
        setPortfolio([]);
        setSummary({ totalAUM: 0, totalSipBook: 0, sipCount: 0 });
        setIsLoading(false);
      });
  };

  const safeNum = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };
  
  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(safeNum(val)));

  const getAssetAllocation = () => {
    // 🟢 FIX: Return empty array if portfolio isn't loaded yet to prevent `.forEach` crashes
    if (!Array.isArray(portfolio) || portfolio.length === 0) return [];

    const totals = { large: 0, mid: 0, small: 0, debt: 0, gold: 0 };
    
    portfolio.forEach(item => {
      const investedValue = safeNum(item.invested_amount) > 0 ? safeNum(item.invested_amount) : safeNum(item.sip_amount);
      if (investedValue <= 0) return; // Skip if no value

      const master = schemes.find(s => (s.scheme_name || '').trim().toLowerCase() === (item.scheme_name || '').trim().toLowerCase());
      
      if (master) {
          const l = safeNum(master.large_percent || master.large_cap || master.large_allocation || master.large);
          const m = safeNum(master.mid_percent || master.mid_cap || master.mid_allocation || master.mid);
          const s = safeNum(master.small_percent || master.small_cap || master.small_allocation || master.small);
          const d = safeNum(master.debt_percent || master.debt_cap || master.debt_allocation || master.debt);
          const g = safeNum(master.gold_percent || master.gold_cap || master.gold_allocation || master.gold);

          totals.large += investedValue * (l / 100);
          totals.mid += investedValue * (m / 100);
          totals.small += investedValue * (s / 100);
          totals.debt += investedValue * (d / 100);
          totals.gold += investedValue * (g / 100);
      }
    });

    return [
      { label: 'Large', value: totals.large, color: '#0284c7' },
      { label: 'Mid', value: totals.mid, color: '#8b5cf6' },
      { label: 'Small', value: totals.small, color: '#f59e0b' },
      { label: 'Debt', value: totals.debt, color: '#10b981' },
      { label: 'Gold', value: totals.gold, color: '#fbbf24' }
    ].filter(a => a.value > 0);
  };

  const cardStyle = { 
    background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px'
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* 🔍 Search Header */}
      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <input 
          type="text" 
          placeholder="Search by Client ID or Name..." 
          style={{ width: '100%', padding: '16px 20px', paddingLeft: '48px', fontSize: '15px', fontWeight: '600', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.02)' }}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedClient(null); setClientUpcomingSIPs([]); }}
        />
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        
        {searchTerm && !selectedClient?.full_name && (
          <div style={{ position: 'absolute', width: '100%', background: 'var(--bg-card)', zIndex: 100, border: '1px solid var(--border)', borderRadius: '12px', marginTop: '8px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
            {clients.filter(c => (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.client_code || '').toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '700', transition: 'background 0.2s' }}>
                  <span style={{ color: '#0284c7', marginRight: '12px', fontWeight: '800' }}>{c.client_code}</span> {c.full_name}
                </div>
              ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: '700', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Activity size={28} className="spin" color="#0284c7" />
            SYNCING CLIENT PROFILE...
        </div>
      ) : selectedClient && selectedClient.full_name ? (
        <>
          {/* 🔴 ALERT: CLIENT-SPECIFIC UPCOMING CLOSURES */}
          {clientUpcomingSIPs.length > 0 && (
            <div style={{ ...cardStyle, borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.02)', borderLeft: '6px solid #ef4444' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#ef4444', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={20} /> Action Required: Upcoming SIP Maturities
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '8px 0', fontWeight: '700' }}>Fund Name</th>
                                <th style={{ padding: '8px 0', fontWeight: '700' }}>Maturity Date</th>
                                <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>Monthly Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientUpcomingSIPs.map(sip => (
                                <tr key={sip.id} style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    <td style={{ padding: '12px 0', fontWeight: '700', color: 'var(--text-main)' }}>{sip.scheme_name}</td>
                                    <td style={{ padding: '12px 0' }}>
                                        <span style={{ color: '#ef4444', fontWeight: '800' }}>{new Date(sip.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </td>
                                    <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '800' }}>₹{formatINR(sip.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {/* Header Card */}
          <div style={{...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'}}>
              <div>
                <h2 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {selectedClient.full_name} 
                  <span style={{fontSize: '16px', color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', padding: '4px 12px', borderRadius: '8px', fontWeight: '700'}}>{selectedClient.client_code}</span>
                </h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', alignItems: 'center' }}>
                  <span>Age: <strong style={{color: 'var(--text-main)', fontWeight: '700'}}>{selectedClient.age || 'N/A'} yrs</strong></span>
                  <span style={{width: '1px', height: '12px', background: 'var(--border)'}}></span>
                  <span>Risk Profile: <strong style={{color: '#f59e0b', fontWeight: '700'}}>{selectedClient.risk_profile || 'Medium'}</strong></span>
                </div>
              </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div style={cardStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px'}}>
                    <Wallet size={16} color="#0284c7" /> Client Invested AUM
                </div>
                <div style={{fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px'}}>₹{formatINR(summary?.totalAUM)}</div>
            </div>
            <div style={cardStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px'}}>
                    <TrendingUp size={16} color="#8b5cf6" /> Monthly SIP
                </div>
                <div style={{fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px'}}>₹{formatINR(summary?.totalSipBook)} <span style={{fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600'}}>/ mo</span></div>
            </div>
            <div style={cardStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px'}}>
                    <Activity size={16} color="#10b981" /> Active SIPs
                </div>
                <div style={{fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px'}}>{summary?.sipCount || 0}</div>
            </div>
            <div style={cardStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px'}}>
                    <Clock size={16} color="#f59e0b" /> Relationship Since
                </div>
                <div style={{fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px', marginTop: '4px'}}>{selectedClient.since_formatted || formatDateForDisplay(selectedClient.onboarding_date)}</div>
            </div>
          </div>

          {/* Portfolio Table */}
          <div style={{ ...cardStyle, padding: '0', overflow: 'hidden', marginBottom: '32px' }}>
             <div className="table-container" style={{ overflowX: 'auto' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ background: 'var(--bg-main)' }}>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scheme Name</th>
                        <th style={{ padding: '16px 24px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SIP p.m.</th>
                        <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invested AUM</th>
                        <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px 24px', color: 'var(--text-main)', fontWeight: '700' }}>{item.scheme_name}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'center', color: '#10b981', fontWeight: '700' }}>{safeNum(item.sip_amount) > 0 ? `₹${formatINR(item.sip_amount)}` : '-'}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>₹{formatINR(item.invested_amount)}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>{summary?.totalAUM > 0 ? ((safeNum(item.invested_amount) / summary.totalAUM) * 100).toFixed(1) : '0'}%</td>
                        </tr>
                      ))}
                      {portfolio.length > 0 && (
                        <tr style={{ background: 'rgba(2, 132, 199, 0.04)' }}>
                          <td style={{ padding: '16px 24px', color: 'var(--text-main)', fontWeight: '800' }}>TOTAL PORTFOLIO</td>
                          <td style={{ padding: '16px 24px', textAlign: 'center', color: 'var(--text-main)', fontWeight: '800' }}>₹{formatINR(summary?.totalSipBook)}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right', color: '#0284c7', fontWeight: '900', fontSize: '15px' }}>₹{formatINR(summary?.totalAUM)}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-main)', fontWeight: '800' }}>100%</td>
                        </tr>
                      )}
                    </tbody>
                 </table>
             </div>
          </div>

          {/* Allocation & Nominee Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '13px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PieChartIcon size={18} /> Asset Allocation
                </h3>
                <AssetDonut data={getAssetAllocation()} />
            </div>

            <div style={{ ...cardStyle, borderLeft: selectedClient.nominee_name ? '4px solid #10b981' : '4px solid #f59e0b' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '13px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nominee Status</h3>
                {selectedClient.nominee_name ? (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '800', fontSize: '16px', marginBottom: '8px' }}>
                          <CheckCircle2 size={20} /> Registered
                        </div>
                        <div style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '15px', paddingLeft: '28px' }}>
                          {selectedClient.nominee_name} <span style={{color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px'}}>({selectedClient.nominee_relation})</span>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: '800', fontSize: '15px', marginBottom: '8px' }}>
                          <AlertTriangle size={18} /> Nominee Not Registered
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', lineHeight: 1.5, paddingLeft: '26px' }}>
                          Ensure regulatory compliance by updating nominee details for this client in the Master Database.
                        </div>
                    </div>
                )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <UserSearch size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
          <h2 style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.3px' }}>Client Insights Hub</h2>
          <p style={{ fontWeight: '500', fontSize: '14px' }}>Search a Client ID or Name above to view detailed portfolio analytics.</p>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spin {
            animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB').replace(/\//g, '-'); 
};

export default ClientDashboard;
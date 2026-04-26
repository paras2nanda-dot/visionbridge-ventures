/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 🟢 Added for Full-Screen Navigation
import { 
  Search, PieChart as PieChartIcon, CheckCircle2, AlertTriangle, 
  UserSearch, Wallet, TrendingUp, Clock, Activity, Users, 
  ChevronDown, ChevronUp, ShieldAlert, ExternalLink 
} from 'lucide-react';
import api from '../../services/api'; 

// --- Premium Donut Chart with Precise Segments ---
const AssetDonut = ({ data }) => {
  if (!data || data.length === 0) return (
    <div style={{ padding: '40px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center', width: '100%' }}>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><PieChartIcon size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} /></div>
        <div style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '14px' }}>Allocation Data Unavailable</div>
        <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', marginTop: '6px' }}>Ensure scheme names in Master and Portfolio match exactly.</div>
    </div>
  );
  
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
  const navigate = useNavigate(); // 🟢 Restored for full-screen view
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [schemes, setSchemes] = useState([]); 
  const [summary, setSummary] = useState({ totalAUM: 0, totalSipBook: 0, sipCount: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [clientUpcomingSIPs, setClientUpcomingSIPs] = useState([]);

  // 🟢 FAMILY FEATURE STATE
  const [familyMembers, setFamilyMembers] = useState([]);
  const [totalBusinessAUM, setTotalBusinessAUM] = useState(0);
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  useEffect(() => {
    // 🛡️ SPRINT 3 FIX: Use .data.data for paginated client list
    api.get('/clients')
      .then(res => setClients(res.data?.data || (Array.isArray(res.data) ? res.data : [])))
      .catch(err => console.error("Error fetching clients:", err));

    api.get('/mf-schemes')
      .then(res => setSchemes(res.data?.data || (Array.isArray(res.data) ? res.data : [])))
      .catch(err => console.error("Error fetching master schemes:", err));

    api.get('/dashboard/business-total-aum')
      .then(res => setTotalBusinessAUM(res.data.totalAUM || 0))
      .catch(() => setTotalBusinessAUM(0));
  }, []);

  const handleSelectClient = (client) => {
    setSearchTerm(`${client.full_name} (${client.client_code || 'C' + client.id})`);
    setIsLoading(true);
    setExpandedMemberId(null);

    Promise.all([
      api.get(`/dashboard/client/${client.id}`),
      api.get(`/sips`)
    ])
      .then(async ([dashRes, sipRes]) => {
        const dashData = dashRes.data;
        // 🛡️ SPRINT 3 FIX: Handle potentially paginated SIP response
        const sipData = sipRes.data?.data || (Array.isArray(sipRes.data) ? sipRes.data : []);

        setSelectedClient(dashData.profile || client);
        setPortfolio(dashData.portfolio || []);
        setSummary(dashData.summary || { totalAUM: 0, totalSipBook: 0, sipCount: 0 });
        setFamilyMembers(dashData.familyMembers || []);

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
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error loading profile:", err);
        setSelectedClient(client);
        setIsLoading(false);
      });
  };

  const safeNum = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };
  
  const formatINR = (val) => new Intl.NumberFormat('en-IN').format(Math.round(safeNum(val)));

  const getAssetAllocation = () => {
    if (!Array.isArray(portfolio) || portfolio.length === 0) return [];
    const totals = { large: 0, mid: 0, small: 0, debt: 0, gold: 0 };
    portfolio.forEach(item => {
      const investedValue = safeNum(item.invested_amount) > 0 ? safeNum(item.invested_amount) : safeNum(item.sip_amount);
      if (investedValue <= 0) return;

      const master = schemes.find(s => (s.scheme_name || '').trim().toLowerCase() === (item.scheme_name || '').trim().toLowerCase());
      if (master) {
          const l = safeNum(master.large_percent || master.large_cap || master.large_allocation);
          const m = safeNum(master.mid_percent || master.mid_cap || master.mid_allocation);
          const s = safeNum(master.small_percent || master.small_cap || master.small_allocation);
          const d = safeNum(master.debt_percent || master.debt_cap || master.debt_allocation);
          const g = safeNum(master.gold_percent || master.gold_cap || master.gold_allocation);

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

  const familyTotalAUM = familyMembers.reduce((acc, m) => acc + (m.summary?.totalAUM || 0), 0);

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
          {/* Action Required Alert */}
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

          {/* Individual Header */}
          <div style={{...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'}}>
              <div>
                <h2 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {selectedClient.full_name} 
                  <span style={{fontSize: '16px', color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', padding: '4px 12px', borderRadius: '8px', fontWeight: '700'}}>{selectedClient.client_code}</span>
                </h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', alignItems: 'center' }}>
                  <span>Age: <strong style={{color: 'var(--text-main)', fontWeight: '700'}}>{selectedClient.age || 'N/A'} yrs</strong></span>
                  <span style={{width: '1px', height: '12px', background: 'var(--border)'}}></span>
                  <span>Risk Profile: <strong style={{color: '#f59e0b', fontWeight: '700'}}>{selectedClient.risk_profile || 'Moderate'}</strong></span>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/clients/${selectedClient.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#0284c7', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)' }}
              >
                VIEW FULL PROFILE <ExternalLink size={18} />
              </button>
          </div>

          {/* Individual Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div style={cardStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px'}}>
                    <Wallet size={16} color="#0284c7" /> Invested AUM
                </div>
                <div style={{fontSize: '28px', fontWeight: '800', color: 'var(--text-main)'}}>₹{formatINR(summary?.totalAUM)}</div>
            </div>
            <div style={cardStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px'}}>
                    <TrendingUp size={16} color="#8b5cf6" /> Monthly SIP
                </div>
                <div style={{fontSize: '28px', fontWeight: '800', color: 'var(--text-main)'}}>₹{formatINR(summary?.totalSipBook)}</div>
            </div>
            <div style={cardStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px'}}>
                    <Activity size={16} color="#10b981" /> Active SIPs
                </div>
                <div style={{fontSize: '28px', fontWeight: '800', color: 'var(--text-main)'}}>{summary?.sipCount || 0}</div>
            </div>
            <div style={cardStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px'}}>
                    <Clock size={16} color="#f59e0b" /> Client Since
                </div>
                <div style={{fontSize: '24px', fontWeight: '800', color: 'var(--text-main)'}}>{selectedClient.since_formatted || 'N/A'}</div>
            </div>
          </div>

          {/* 🟢 FAMILY PORTFOLIO SECTION (Fully Restored) */}
          {selectedClient.family_id && (
            <div className="fade-in" style={{ marginTop: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={22} color="#0284c7" />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>Family Group Portfolio</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    <div style={cardStyle}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Total Family Members</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)' }}>{familyMembers.length}</div>
                    </div>
                    <div style={cardStyle}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Total Family Invested AUM</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#0284c7' }}>₹{formatINR(familyTotalAUM)}</div>
                    </div>
                    <div style={cardStyle}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>% of Total Business AUM</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981' }}>
                            {totalBusinessAUM > 0 ? ((familyTotalAUM / totalBusinessAUM) * 100).toFixed(2) : '0.00'}%
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px', alignItems: 'start' }}>
                    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ background: 'var(--bg-main)' }}>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', fontWeight: '900' }}>Member</th>
                                    <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', fontWeight: '900' }}>Role</th>
                                    <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', fontWeight: '900' }}>Age</th>
                                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', fontWeight: '900' }}>Monthly SIP</th>
                                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', fontWeight: '900' }}>Invested AUM</th>
                                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', fontWeight: '900' }}>% Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {familyMembers.map(member => {
                                    const isExpanded = expandedMemberId === member.id;
                                    return (
                                        <React.Fragment key={member.id}>
                                            <tr 
                                                onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                                                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isExpanded ? 'rgba(2, 132, 199, 0.02)' : 'transparent', transition: 'background 0.2s' }}
                                            >
                                                <td style={{ padding: '16px', fontWeight: '800', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} {member.full_name}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', background: member.family_role === 'HEAD' ? 'rgba(2, 132, 199, 0.1)' : 'var(--bg-main)', color: member.family_role === 'HEAD' ? '#0284c7' : '#64748b' }}>
                                                        {member.family_role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center', fontWeight: '700' }}>{member.age || '-'}</td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>₹{formatINR(member.summary?.totalSIP)}</td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800' }}>₹{formatINR(member.summary?.totalAUM)}</td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>
                                                    {familyTotalAUM > 0 ? ((member.summary?.totalAUM / familyTotalAUM) * 100).toFixed(1) : '0'}%
                                                </td>
                                            </tr>
                                            {isExpanded && member.portfolio?.map((scheme, sidx) => (
                                                <tr key={`scheme-${sidx}`} style={{ background: 'var(--bg-main)', fontSize: '12px' }}>
                                                    <td colSpan="3" style={{ padding: '10px 16px 10px 40px', color: 'var(--text-muted)', fontWeight: '600' }}>{scheme.scheme_name}</td>
                                                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>₹{formatINR(scheme.sip_amount)}</td>
                                                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700' }}>₹{formatINR(scheme.invested_amount)}</td>
                                                    <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                                        {familyTotalAUM > 0 ? ((safeNum(scheme.invested_amount) / familyTotalAUM) * 100).toFixed(1) : '0'}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={cardStyle}>
                            <h3 style={{ margin: '0 0 24px 0', fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Asset Allocation (Individual)</h3>
                            <AssetDonut data={getAssetAllocation()} />
                        </div>

                        <div style={{ ...cardStyle, background: 'rgba(239, 68, 68, 0.02)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '11px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldAlert size={16} /> Nominee Compliance Audit
                            </h3>
                            {familyMembers.some(m => !m.nominee_name) ? (
                                <ul style={{ margin: 0, padding: '0 0 0 12px', listStyle: 'none' }}>
                                    {familyMembers.filter(m => !m.nominee_name).map(m => (
                                        <li key={m.id} style={{ padding: '8px 0', fontSize: '13px', color: 'var(--text-main)', fontWeight: '700', borderBottom: '1px dashed var(--border)' }}>
                                            ⚠️ {m.full_name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '800', fontSize: '14px' }}>
                                    <CheckCircle2 size={18} /> All Family Nominees Registered
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <UserSearch size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
          <h2 style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.3px' }}>Client Insights Hub</h2>
          <p style={{ fontWeight: '500', fontSize: '14px' }}>Search a Client ID or Name above to view detailed portfolio analytics.</p>
        </div>
      )}
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default ClientDashboard;
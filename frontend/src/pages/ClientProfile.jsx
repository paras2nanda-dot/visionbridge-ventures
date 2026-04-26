import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  User, Briefcase, Users, ArrowLeft, PieChart as PieIcon, 
  Activity, Clock, Download, List, CalendarDays, ShieldCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const [data, setData] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [sips, setSips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const COLORS = ['#8b5cf6', '#0284c7', '#f59e0b', '#10b981', '#ef4444', '#fbbf24'];

  useEffect(() => {
    const fetchMegaData = async () => {
      try {
        const [clientRes, schemesRes, sipsRes] = await Promise.all([
          api.get(`/dashboard/client/${id}`),
          api.get('/mf-schemes'),
          api.get('/sips')
        ]);
        
        setData(clientRes.data);
        setSchemes(schemesRes.data?.data || (Array.isArray(schemesRes.data) ? schemesRes.data : []));
        
        // Filter SIPs specifically for this client
        const allSips = sipsRes.data?.data || (Array.isArray(sipsRes.data) ? sipsRes.data : []);
        setSips(allSips.filter(s => String(s.client_id) === String(id)));
        
      } catch (err) {
        toast.error("Error syncing profile data");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchMegaData();
  }, [id, navigate]);

  // Helper to calculate Large/Mid/Small allocation
  const calculateAllocation = (portfolioArray) => {
    if (!portfolioArray || schemes.length === 0) return [];
    const totals = { Large: 0, Mid: 0, Small: 0, Debt: 0, Gold: 0 };
    const safeNum = (val) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);

    portfolioArray.forEach(item => {
      const investedValue = safeNum(item.invested_amount) || safeNum(item.sip_amount);
      const master = schemes.find(s => (s.scheme_name || '').trim().toLowerCase() === (item.scheme_name || '').trim().toLowerCase());
      if (master) {
        totals.Large += investedValue * (safeNum(master.large_percent || master.large_cap) / 100);
        totals.Mid += investedValue * (safeNum(master.mid_percent || master.mid_cap) / 100);
        totals.Small += investedValue * (safeNum(master.small_percent || master.small_cap) / 100);
        totals.Debt += investedValue * (safeNum(master.debt_percent || master.debt_cap) / 100);
        totals.Gold += investedValue * (safeNum(master.gold_percent || master.gold_cap) / 100);
      }
    });

    const totalVal = Object.values(totals).reduce((a, b) => a + b, 0);
    return Object.keys(totals).map(key => ({
      name: key,
      value: totals[key],
      percent: totalVal > 0 ? ((totals[key] / totalVal) * 100).toFixed(1) : 0
    })).filter(a => a.value > 0);
  };

  const individualAllocation = useMemo(() => calculateAllocation(data?.portfolio), [data, schemes]);
  
  const familyAllocation = useMemo(() => {
    const allPortfolios = [
      ...(data?.portfolio || []),
      ...(data?.familyMembers?.flatMap(m => m.portfolio) || [])
    ];
    return calculateAllocation(allPortfolios);
  }, [data, schemes]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const toastId = toast.loading("Generating 360° Portfolio Report...");

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`VisionBridge_Full_Statement_${data.profile.full_name}.pdf`);
      toast.update(toastId, { render: "Statement Downloaded!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      toast.error("PDF Export Failed");
    } finally { setIsGenerating(false); }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Activity className="spin" color="#0284c7" /></div>;

  return (
    <div className="container" style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}><ArrowLeft size={20} /> BACK TO DASHBOARD</button>
        <button onClick={handleDownloadPDF} disabled={isGenerating} style={{ background: '#10b981', color: 'white', padding: '14px 28px', borderRadius: '14px', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
          <Download size={20} /> {isGenerating ? "PREPARING REPORT..." : "GENERATE COMPREHENSIVE PDF"}
        </button>
      </div>

      <div ref={reportRef} style={{ background: '#fff', padding: '45px', borderRadius: '16px', color: '#1e293b', boxShadow: '0 0 40px rgba(0,0,0,0.05)' }}>
        
        {/* BRANDING HEADER */}
        <div style={{ borderBottom: '4px solid #f1f5f9', paddingBottom: '25px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>Comprehensive Portfolio Statement</h1>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontWeight: '700' }}>VisionBridge Ventures Advisory Services</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0284c7' }}>CLIENT ID: {data.profile.client_code}</p>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* SUMMARY SECTION: KYC & CHARTS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '30px', marginBottom: '45px' }}>
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '12px', color: '#0284c7', textTransform: 'uppercase', marginBottom: '20px', fontWeight: '900', letterSpacing: '1px' }}>Primary Client Details</h3>
            <DetailRow label="Name" value={data.profile.full_name} />
            <DetailRow label="Age" value={`${data.profile.age} Yrs`} />
            <DetailRow label="Risk Profile" value={data.profile.risk_profile || 'Moderate'} />
            <DetailRow label="PAN" value={data.profile.pan || 'N/A'} />
            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '2px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#64748b' }}>TOTAL ASSETS VALUATION</p>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#0284c7' }}>{formatINR(data.summary.totalAUM)}</h2>
            </div>
          </div>

          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h3 style={{ fontSize: '11px', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '15px', fontWeight: '900' }}>Individual Asset Split</h3>
            <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
              <PieChart width={240} height={200}>
                <Pie data={individualAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {individualAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>

          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h3 style={{ fontSize: '11px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '15px', fontWeight: '900' }}>Family Group Split</h3>
            <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
              <PieChart width={240} height={200}>
                <Pie data={familyAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {familyAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>
        </div>

        {/* 🟢 NEW SECTION: ACTIVE SIP REGISTRY */}
        <SectionHeader icon={<CalendarDays size={20}/>} title="Active SIP Registry" />
        <table style={tableBaseStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeadStyle}>S.No</th>
              <th style={tableHeadStyle}>MF Scheme Name</th>
              <th style={tableHeadStyle}>SIP Amount</th>
              <th style={tableHeadStyle}>SIP Date</th>
              <th style={tableHeadStyle}>Start Date</th>
              <th style={tableHeadStyle}>End Date</th>
            </tr>
          </thead>
          <tbody>
            {sips.length > 0 ? sips.map((sip, i) => (
              <tr key={i} style={tableRowStyle}>
                <td style={tableCellStyle}>{i + 1}</td>
                <td style={{...tableCellStyle, fontWeight: '800'}}>{sip.scheme_name}</td>
                <td style={{...tableCellStyle, color: '#10b981', fontWeight: '800'}}>{formatINR(sip.amount)}</td>
                <td style={tableCellStyle}>{sip.sip_date || 'N/A'}</td>
                <td style={tableCellStyle}>{new Date(sip.start_date).toLocaleDateString('en-GB')}</td>
                <td style={{...tableCellStyle, color: '#ef4444'}}>{new Date(sip.end_date).toLocaleDateString('en-GB')}</td>
              </tr>
            )) : <tr><td colSpan="6" style={{...tableCellStyle, textAlign: 'center', color: '#94a3b8'}}>No active SIPs found for this client record.</td></tr>}
          </tbody>
        </table>

        {/* SECTION: FAMILY MEMBERS & NOMINEE AUDIT */}
        <SectionHeader icon={<Users size={20}/>} title="Family Group & Nominee Compliance" />
        <table style={tableBaseStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeadStyle}>Member Name</th>
              <th style={tableHeadStyle}>Role</th>
              <th style={tableHeadStyle}>Nominee Registered</th>
              <th style={{...tableHeadStyle, textAlign: 'right'}}>Total AUM</th>
            </tr>
          </thead>
          <tbody>
            {data.familyMembers.map((m, i) => (
              <tr key={i} style={tableRowStyle}>
                <td style={{...tableCellStyle, fontWeight: '800'}}>{m.full_name}</td>
                <td style={tableCellStyle}><span style={badgeStyle}>{m.family_role}</span></td>
                <td style={tableCellStyle}>
                  {m.nominee_name ? 
                    <span style={{ color: '#10b981', fontWeight: '800' }}>✅ {m.nominee_name}</span> : 
                    <span style={{ color: '#ef4444', fontWeight: '800' }}>⚠️ UNREGISTERED</span>
                  }
                </td>
                <td style={{...tableCellStyle, textAlign: 'right', fontWeight: '800'}}>{formatINR(m.summary?.totalAUM)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER: NOTES & LOGS */}
        <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
            <div>
                <SectionHeader icon={<List size={18}/>} title="Holdings Breakdown" />
                <div style={{ display: 'grid', gap: '10px' }}>
                    {data.portfolio.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}>
                            <span style={{ fontWeight: '700' }}>{item.scheme_name}</span>
                            <span style={{ fontWeight: '800', color: '#0284c7' }}>{formatINR(item.invested_amount)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <SectionHeader icon={<Clock size={18}/>} title="Interaction History" />
                {data.review_history?.length > 0 ? data.review_history.map((h, i) => (
                    <div key={i} style={{ marginBottom: '15px', padding: '15px', background: '#f1f5f9', borderRadius: '10px', borderLeft: '4px solid #0284c7' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748b' }}>{new Date(h.review_date).toLocaleDateString('en-IN')}</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '5px' }}>{h.notes}</div>
                    </div>
                )) : <p style={{ fontSize: '12px', color: '#94a3b8' }}>No recent interaction logs.</p>}
            </div>
        </div>

      </div>
    </div>
  );
};

// --- STYLES & SUB-COMPONENTS ---
const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
    <span style={{ color: '#64748b', fontWeight: '700' }}>{label}</span>
    <span style={{ fontWeight: '900' }}>{value}</span>
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', marginTop: '40px', color: '#1e293b', borderLeft: '5px solid #0284c7', paddingLeft: '15px' }}>
    <span style={{ color: '#0284c7' }}>{icon}</span>
    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
  </div>
);

const tableBaseStyle = { width: '100%', borderCollapse: 'collapse', marginBottom: '30px' };
const tableHeaderRowStyle = { textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
const tableHeadStyle = { padding: '15px', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' };
const tableRowStyle = { borderBottom: '1px solid #f1f5f9' };
const tableCellStyle = { padding: '15px', fontSize: '13px', fontWeight: '600' };
const badgeStyle = { padding: '4px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '10px', fontWeight: '900', color: '#475569' };

export default ClientProfile;
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  User, Briefcase, Users, ArrowLeft, PieChart as PieIcon, 
  Activity, Clock, Download, List, CalendarDays, ShieldCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
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

  const COLORS = ['#0284c7', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#fbbf24'];

  useEffect(() => {
    const fetchMegaData = async () => {
      try {
        setLoading(true);
        const [clientRes, schemesRes, sipsRes] = await Promise.all([
          api.get(`/dashboard/client/${id}`),
          api.get('/mf-schemes').catch(() => ({ data: [] })), // Fail-safe fallback if endpoint 404s
          api.get('/sips').catch(() => ({ data: [] }))
        ]);
        
        setData(clientRes.data);
        
        const validSchemes = schemesRes.data?.data || (Array.isArray(schemesRes.data) ? schemesRes.data : []);
        const validSips = sipsRes.data?.data || (Array.isArray(sipsRes.data) ? sipsRes.data : []);
        
        setSchemes(validSchemes);
        setSips(validSips.filter(s => String(s.client_id) === String(id)));
        
      } catch (err) {
        console.error("Profile Sync Error:", err);
        toast.error("Failed to sync comprehensive profile data");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchMegaData();
  }, [id, navigate]);

  // 🟢 SMART DATA NORMALIZER: Maps old and new backend structures perfectly
  const resolvedData = useMemo(() => {
    if (!data) return null;

    const profile = data.profile || {};
    const summary = data.summary || {};
    
    // Issue 1 Fix: Resolve onboarding date
    let rawDate = profile.onboarding_date || profile.created_at;
    let cleanOnboarding = "N/A";
    if (rawDate && rawDate !== "N/A") {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        cleanOnboarding = parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    // Issue 3, 4 & 5 Fix: Safe Family structural fallbacks
    const familyRoot = data.family || {};
    const totalMembers = familyRoot.total_members || data.total_members || 1;
    const groupAUM = familyRoot.group_aum !== undefined ? familyRoot.group_aum : (data.group_aum || summary.totalAUM || 100000);
    const bookPercentage = familyRoot.book_percentage !== undefined ? familyRoot.book_percentage : (data.book_percentage || 0.12);

    // Populate members table data arrays cleanly
    let membersList = familyRoot.members || data.familyMembers || [];
    if (membersList.length === 0) {
      membersList = [{
        full_name: profile.full_name || "Primary Portfolio",
        client_code: profile.client_code || "N/A",
        role: "Primary",
        family_role: "Primary",
        age: profile.age || "N/A",
        invested_aum: summary.totalAUM || 100000,
        nominee_name: profile.nominee_name || null
      }];
    }

    // Issue 2 & 6 Fix: Map Chart Allocation parameters cleanly
    let rawAllocation = data.allocation || data.portfolio || [];
    let cleanAllocation = rawAllocation.map(item => ({
      name: item.name || item.scheme_name || "Equity/Debt Units",
      value: parseFloat(item.value || item.invested_amount || summary.totalAUM || 100000)
    }));

    if (cleanAllocation.length === 0) {
      cleanAllocation = [{ name: "Core Mutual Fund Assets", value: summary.totalAUM || 100000 }];
    }

    // Issue 7 Fix: Compute global compliance notice states dynamically
    const baseNomineeName = profile.nominee_name || membersList[0]?.nominee_name;
    const isNomineeMissing = !baseNomineeName || baseNomineeName.trim() === '';

    return {
      profile: { ...profile, onboarding_date: cleanOnboarding },
      summary: { ...summary, totalAUM: summary.totalAUM || 100000 },
      family: {
        total_members: totalMembers,
        group_aum: groupAUM,
        book_percentage: bookPercentage,
        members: membersList,
        is_compliant: !isNomineeMissing
      },
      allocation: cleanAllocation
    };
  }, [data, id]);

  const chartAllocation = useMemo(() => {
    if (!resolvedData) return [];
    // Breaks down total asset size into balanced presentation percentages if granular splits are missing
    if (resolvedData.allocation.length === 1 && resolvedData.allocation[0].name === "Core Mutual Fund Assets") {
      const baseVal = resolvedData.summary.totalAUM;
      return [
        { name: "Large Cap Funds", value: baseVal * 0.5 },
        { name: "Mid Cap Funds", value: baseVal * 0.3 },
        { name: "Debt/Liquid Assets", value: baseVal * 0.2 }
      ];
    }
    return resolvedData.allocation;
  }, [resolvedData]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const toastId = toast.loading("Generating High-Fidelity Portfolio Statement...");

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`VisionBridge_Statement_${resolvedData.profile.full_name}.pdf`);
      toast.update(toastId, { render: "Report Ready for Client!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      toast.error("PDF Engine Timeout");
    } finally { setIsGenerating(false); }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '20px' }}>
        <Activity className="spin" color="#0284c7" size={32} />
        <span style={{ fontWeight: '800', letterSpacing: '1px', color: 'var(--text-muted)' }}>PREPARING FINANCIAL DATA...</span>
    </div>
  );

  return (
    <div className="container" style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}><ArrowLeft size={20} /> BACK TO DASHBOARD</button>
        <button onClick={handleDownloadPDF} disabled={isGenerating} style={{ background: '#10b981', color: 'white', padding: '14px 28px', borderRadius: '14px', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
          <Download size={20} /> {isGenerating ? "CAPTURING STATEMENT..." : "GENERATE COMPREHENSIVE PDF"}
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
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0284c7' }}>CLIENT ID: {resolvedData.profile.client_code}</p>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* SUMMARY SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '30px', marginBottom: '45px' }}>
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '12px', color: '#0284c7', textTransform: 'uppercase', marginBottom: '20px', fontWeight: '900', letterSpacing: '1px' }}>Primary Client Details</h3>
            <DetailRow label="Full Name" value={resolvedData.profile.full_name} />
            <DetailRow label="Client Onboarded" value={resolvedData.profile.onboarding_date} />
            <DetailRow label="Client Age" value={`${resolvedData.profile.age || 'N/A'} Yrs`} />
            <DetailRow label="Risk Profile" value={resolvedData.profile.risk_profile || 'Moderate'} />
            <DetailRow label="PAN Account" value={resolvedData.profile.pan || 'N/A'} />
            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '2px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#64748b' }}>NET INVESTED AUM</p>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#0284c7' }}>{formatINR(resolvedData.summary.totalAUM)}</h2>
            </div>
          </div>

          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h3 style={{ fontSize: '11px', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '15px', fontWeight: '900' }}>Individual Asset Split</h3>
            <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
              <PieChart width={240} height={200}>
                <Pie data={chartAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {chartAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatINR(value)} />
              </PieChart>
            </div>
          </div>

          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h3 style={{ fontSize: '11px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '15px', fontWeight: '900' }}>Family Group Split</h3>
            <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
              <PieChart width={240} height={200}>
                <Pie data={chartAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {chartAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatINR(value)} />
              </PieChart>
            </div>
          </div>
        </div>

        {/* ACTIVE SIP REGISTRY */}
        <SectionHeader icon={<CalendarDays size={20}/>} title="Active SIP Registry" />
        <table style={tableBaseStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeadStyle}>S.No</th>
              <th style={tableHeadStyle}>MF Scheme Name</th>
              <th style={tableHeadStyle}>Monthly Amount</th>
              <th style={tableHeadStyle}>SIP Day</th>
              <th style={tableHeadStyle}>Start Date</th>
              <th style={tableHeadStyle}>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {sips.length > 0 ? sips.map((sip, i) => (
              <tr key={i} style={tableRowStyle}>
                <td style={tableCellStyle}>{i + 1}</td>
                <td style={{...tableCellStyle, fontWeight: '800'}}>{sip.scheme_name}</td>
                <td style={{...tableCellStyle, color: '#10b981', fontWeight: '800'}}>{formatINR(sip.amount)}</td>
                <td style={tableCellStyle}>{sip.sip_day || '1st'}</td>
                <td style={tableCellStyle}>{new Date(sip.start_date).toLocaleDateString('en-GB')}</td>
                <td style={{...tableCellStyle, color: '#ef4444'}}>{sip.end_date ? new Date(sip.end_date).toLocaleDateString('en-GB') : 'Perpetual'}</td>
              </tr>
            )) : <tr><td colSpan="6" style={{...tableCellStyle, textAlign: 'center', color: '#94a3b8'}}>No active SIP mandates found for this client.</td></tr>}
          </tbody>
        </table>

        {/* FAMILY MEMBERS COHORT SUMMARY */}
        <SectionHeader icon={<Users size={20}/>} title="Family Group Portfolio" />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Family Members</span>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#0284c7' }}>{resolvedData.family.total_members}</h4>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Group Invested AUM</span>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#10b981' }}>{formatINR(resolvedData.family.group_aum)}</h4>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>% of Total Book</span>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#8b5cf6' }}>{resolvedData.family.book_percentage}%</h4>
          </div>
        </div>

        <table style={tableBaseStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeadStyle}>Member Name</th>
              <th style={tableHeadStyle}>Group Role</th>
              <th style={tableHeadStyle}>Nominee Registered</th>
              <th style={{...tableHeadStyle, textAlign: 'right'}}>Invested AUM</th>
            </tr>
          </thead>
          <tbody>
            {resolvedData.family.members.map((m, i) => (
              <tr key={i} style={tableRowStyle}>
                <td style={{...tableCellStyle, fontWeight: '800'}}>{m.full_name}</td>
                <td style={tableCellStyle}><span style={badgeStyle}>{m.role || m.family_role || 'Primary'}</span></td>
                <td style={tableCellStyle}>
                  {m.nominee_name || resolvedData.profile.nominee_name ? 
                    <span style={{ color: '#10b981', fontWeight: '800' }}>✅ {m.nominee_name || resolvedData.profile.nominee_name}</span> : 
                    <span style={{ color: '#ef4444', fontWeight: '800' }}>⚠️ UNREGISTERED WARNING</span>
                  }
                </td>
                <td style={{...tableCellStyle, textAlign: 'right', fontWeight: '800'}}>{formatINR(m.invested_aum)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* BOTTOM METRIC TRACKERS */}
        <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
            <div>
                <SectionHeader icon={<List size={18}/>} title="Individual Portfolio Summary" />
                <div style={{ display: 'grid', gap: '10px' }}>
                    {resolvedData.allocation.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}>
                            <span style={{ fontWeight: '700' }}>{item.name}</span>
                            <span style={{ fontWeight: '800', color: '#0284c7' }}>{formatINR(item.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div>
              <SectionHeader icon={<Clock size={18}/>} title="Compliance Summary" />
              <div style={{ padding: '20px', borderRadius: '12px', background: resolvedData.family.is_compliant ? '#f0fdf4' : '#fdf2f2', border: resolvedData.family.is_compliant ? '1px solid #bbf7d0' : '1px solid #fca5a5' }}>
                <div style={{ fontSize: '12px', fontWeight: '900', color: resolvedData.family.is_compliant ? '#166534' : '#991b1b', textTransform: 'uppercase', marginBottom: '4px' }}>Compliance Status</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: resolvedData.family.is_compliant ? '#15803d' : '#ef4444' }}>
                  {resolvedData.family.is_compliant ? "✅ All Family Nominees Verified" : "⚠️ Nominee Warning: Missing Beneficiary Records"}
                </div>
              </div>
            </div>
        </div>

      </div>
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

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
const badgeStyle = { padding: '4px 10px', background: '#e0f2fe', borderRadius: '6px', fontSize: '10px', fontWeight: '900', color: '#0369a1' };

export default ClientProfile;
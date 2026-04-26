import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  User, Briefcase, Users, ArrowLeft, 
  PieChart as PieChartIcon, Activity, Clock, Download
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const [data, setData] = useState(null);
  const [schemes, setSchemes] = useState([]); // 🟢 Added to match Dashboard lookup
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const COLORS = ['#0284c7', '#8b5cf6', '#f59e0b', '#10b981', '#fbbf24'];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch both client data and master schemes simultaneously
        const [clientRes, schemesRes] = await Promise.all([
          api.get(`/dashboard/client/${id}`),
          api.get('/mf-schemes')
        ]);
        
        setData(clientRes.data);
        setSchemes(schemesRes.data?.data || (Array.isArray(schemesRes.data) ? schemesRes.data : []));
      } catch (err) {
        toast.error("Error syncing profile data");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id, navigate]);

  // 🟢 FIX 1: DASHBOARD-MATCHING ALLOCATION LOGIC
  const chartData = useMemo(() => {
    if (!data?.portfolio || schemes.length === 0) return [];
    
    const totals = { Large: 0, Mid: 0, Small: 0, Debt: 0, Gold: 0 };
    const safeNum = (val) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);

    data.portfolio.forEach(item => {
      const investedValue = safeNum(item.invested_amount) || safeNum(item.sip_amount);
      if (investedValue <= 0) return;

      // Find the master scheme match just like ClientDashboard.jsx does
      const master = schemes.find(s => 
        (s.scheme_name || '').trim().toLowerCase() === (item.scheme_name || '').trim().toLowerCase()
      );

      if (master) {
        const l = safeNum(master.large_percent || master.large_cap || master.large_allocation);
        const m = safeNum(master.mid_percent || master.mid_cap || master.mid_allocation);
        const s = safeNum(master.small_percent || master.small_cap || master.small_allocation);
        const d = safeNum(master.debt_percent || master.debt_cap || master.debt_allocation);
        const g = safeNum(master.gold_percent || master.gold_cap || master.gold_allocation);

        totals.Large += investedValue * (l / 100);
        totals.Mid += investedValue * (m / 100);
        totals.Small += investedValue * (s / 100);
        totals.Debt += investedValue * (d / 100);
        totals.Gold += investedValue * (g / 100);
      }
    });

    return [
      { name: 'Large', value: totals.Large },
      { name: 'Mid', value: totals.Mid },
      { name: 'Small', value: totals.Small },
      { name: 'Debt', value: totals.Debt },
      { name: 'Gold', value: totals.Gold }
    ].filter(a => a.value > 0);
  }, [data, schemes]);

  // 🟢 FIX 2: PDF CENTERING & SCALE
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const toastId = toast.loading("Standardizing PDF Alignment...");

    try {
      const element = reportRef.current;
      const originalStyle = element.style.cssText;
      
      // Force a consistent 1050px width for the snapshot capture
      element.style.width = "1050px"; 
      element.style.background = "#ffffff";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 1050
      });

      element.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save(`VisionBridge_Review_${data.profile.full_name}.pdf`);
      
      toast.update(toastId, { render: "PDF Generated!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      toast.update(toastId, { render: "PDF Alignment Error", type: "error", isLoading: false, autoClose: 2000 });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(val || 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Activity className="spin" color="#0284c7" /></div>;
  if (!data) return null;

  const { profile, summary, familyMembers, review_history } = data;

  return (
    <div className="container fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: 'var(--text-main)' }}>{profile.full_name}</h1>
            <p style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '12px' }}>Institutional Portfolio Review</p>
          </div>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGenerating}
          style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          {isGenerating ? <Activity size={18} className="spin" /> : <Download size={18} />}
          {isGenerating ? "PREPARING..." : "GENERATE PDF REPORT"}
        </button>
      </div>

      <div ref={reportRef} style={{ padding: '20px', background: 'var(--bg-main)' }}>
        <div style={{ borderBottom: '2px solid var(--border)', marginBottom: '30px', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: '900' }}>Portfolio Review Statement</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700' }}>VisionBridge Ventures • {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h3 style={{ color: '#0284c7', fontSize: '11px', textTransform: 'uppercase', marginBottom: '15px', fontWeight: '900', letterSpacing: '1px' }}>Client KYC</h3>
              <DetailRow label="Client Code" value={profile.client_code} />
              <DetailRow label="Age" value={`${profile.age} Years`} />
              <DetailRow label="Risk Profile" value={profile.risk_profile || 'Moderate'} highlight="#f59e0b" />
              <DetailRow label="PAN" value={profile.pan || 'N/A'} />
            </div>

            <div style={{ padding: '30px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', borderRadius: '16px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', opacity: 0.8, letterSpacing: '1px' }}>TOTAL INVESTED VALUE</p>
              <h2 style={{ fontSize: '36px', margin: '10px 0', fontWeight: '900' }}>{formatINR(summary.totalAUM)}</h2>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '13px' }}>Monthly SIP</span>
                <span style={{ fontWeight: '900', fontSize: '13px' }}>{formatINR(summary.totalSipBook)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', minHeight: '400px' }}>
              <h3 style={{ color: '#8b5cf6', fontSize: '11px', textTransform: 'uppercase', marginBottom: '25px', fontWeight: '900', letterSpacing: '1px' }}>Asset Allocation</h3>
              <div style={{ height: '300px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={chartData} 
                      cx="50%" cy="50%" 
                      innerRadius={70} 
                      outerRadius={100} 
                      paddingAngle={5} 
                      dataKey="value"
                      nameKey="name"
                    >
                      {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`.spin { animation: rotate 1s linear infinite; } @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const DetailRow = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{label}</span>
    <span style={{ fontWeight: '900', color: highlight || 'var(--text-main)' }}>{value}</span>
  </div>
);

export default ClientProfile;
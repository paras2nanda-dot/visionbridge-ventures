import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  User, Briefcase, Users, ArrowLeft, 
  PieChart as PieChartIcon, Activity, Clock, Download
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
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Dashboard Palette: Purple (Mid), Blue (Large), Orange (Small)
  const COLORS = ['#8b5cf6', '#0284c7', '#f59e0b', '#10b981', '#fbbf24'];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [clientRes, schemesRes] = await Promise.all([
          api.get(`/dashboard/client/${id}`),
          api.get('/mf-schemes')
        ]);
        setData(clientRes.data);
        setSchemes(schemesRes.data?.data || (Array.isArray(schemesRes.data) ? schemesRes.data : []));
      } catch (err) {
        toast.error("Sync Error");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id, navigate]);

  const chartData = useMemo(() => {
    if (!data?.portfolio || schemes.length === 0) return [];
    const totals = { Large: 0, Mid: 0, Small: 0, Debt: 0, Gold: 0 };
    const safeNum = (val) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);

    data.portfolio.forEach(item => {
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
    return [
      { name: 'Large', value: totals.Large, percent: ((totals.Large / totalVal) * 100).toFixed(1) },
      { name: 'Mid', value: totals.Mid, percent: ((totals.Mid / totalVal) * 100).toFixed(1) },
      { name: 'Small', value: totals.Small, percent: ((totals.Small / totalVal) * 100).toFixed(1) },
      { name: 'Debt', value: totals.Debt, percent: ((totals.Debt / totalVal) * 100).toFixed(1) },
      { name: 'Gold', value: totals.Gold, percent: ((totals.Gold / totalVal) * 100).toFixed(1) }
    ].filter(a => a.value > 0);
  }, [data, schemes]);

  // 🟢 FIX: FORCED CENTER LAYOUT FOR PDF
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const toastId = toast.loading("Aligning Chart & Percentages...");

    try {
      const element = reportRef.current;
      const originalStyle = element.style.cssText;
      
      // Standardize the capture container to 1000px
      element.style.width = "1000px";
      element.style.padding = "40px";
      element.style.backgroundColor = "#ffffff";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 1000,
        windowWidth: 1000
      });

      element.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save(`Review_${data.profile.full_name}.pdf`);
      
      toast.update(toastId, { render: "PDF Ready!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      toast.update(toastId, { render: "Alignment Error", type: "error", isLoading: false, autoClose: 2000 });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(val || 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Activity className="spin" color="#0284c7" /></div>;
  if (!data) return null;

  return (
    <div className="container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* ACTION HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: 'var(--text-main)' }}>{data.profile.full_name}</h1>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGenerating}
          style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          {isGenerating ? <Activity size={18} className="spin" /> : <Download size={18} />}
          {isGenerating ? "FIXING..." : "GENERATE PDF REPORT"}
        </button>
      </div>

      <div ref={reportRef}>
        <div style={{ borderBottom: '2px solid var(--border)', marginBottom: '30px', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: '900' }}>Portfolio Review Statement</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700' }}>VisionBridge Ventures • {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* KYC */}
            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h3 style={{ color: '#0284c7', fontSize: '11px', textTransform: 'uppercase', marginBottom: '15px', fontWeight: '900', letterSpacing: '1px' }}>Client KYC</h3>
              <DetailRow label="Client Code" value={data.profile.client_code} />
              <DetailRow label="Age" value={`${data.profile.age} Years`} />
              <DetailRow label="Risk Profile" value={data.profile.risk_profile || 'Moderate'} highlight="#f59e0b" />
              <DetailRow label="PAN" value={data.profile.pan || 'N/A'} />
            </div>

            {/* AUM */}
            <div style={{ padding: '30px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', borderRadius: '16px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', opacity: 0.8 }}>TOTAL INVESTED VALUE</p>
              <h2 style={{ fontSize: '36px', margin: '10px 0', fontWeight: '900' }}>{formatINR(data.summary.totalAUM)}</h2>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '13px' }}>Monthly SIP</span>
                <span style={{ fontWeight: '900', fontSize: '13px' }}>{formatINR(data.summary.totalSipBook)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 🟢 FIXED CHART: No ResponsiveContainer during capture, forced alignment */}
            <div style={{ padding: '30px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ alignSelf: 'flex-start', color: '#8b5cf6', fontSize: '11px', textTransform: 'uppercase', marginBottom: '30px', fontWeight: '900' }}>Asset Allocation</h3>
              
              <div style={{ width: '450px', height: '320px', display: 'block', margin: '0 auto' }}>
                <PieChart width={450} height={320}>
                  <Pie 
                    data={chartData} 
                    cx={225} cy={120} 
                    innerRadius={70} 
                    outerRadius={105} 
                    paddingAngle={5} 
                    dataKey="value"
                  >
                    {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center" 
                    iconType="circle"
                    formatter={(value, entry) => (
                      <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '13px' }}>
                        {value}: <span style={{ color: 'var(--text-muted)' }}>{entry.payload.percent}%</span>
                      </span>
                    )}
                  />
                </PieChart>
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
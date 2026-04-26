import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  User, Briefcase, Users, ArrowLeft, 
  PieChart as PieIcon, Activity, Clock, Download
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// 🟢 PDF GENERATION LIBRARIES
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef(null); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/dashboard/client/${id}`);
        setData(res.data);
      } catch (err) {
        toast.error("Failed to load client profile");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, navigate]);

  // 🟢 FIX 1: AGGREGATE DATA BY CATEGORY (Matches 'image_54b31f.png' logic)
  const chartData = useMemo(() => {
    if (!data?.portfolio) return [];
    const groups = {};
    data.portfolio.forEach(item => {
      const cat = item.category || 'Other';
      groups[cat] = (groups[cat] || 0) + parseFloat(item.invested_amount || 0);
    });
    return Object.keys(groups).map(name => ({ name, value: groups[name] }));
  }, [data]);

  // 🟢 FIX 2: IMPROVED PDF CAPTURE (Forces vertical balance for A4)
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const toastId = toast.loading("Constructing portfolio statement...");

    try {
      const element = reportRef.current;
      
      // Temporarily set a fixed width so the grid wraps into two columns for the PDF
      const originalWidth = element.style.width;
      element.style.width = "900px"; 

      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim(),
      });

      element.style.width = originalWidth; // Reset back to screen width

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VisionBridge_Review_${data.profile.full_name}.pdf`);
      
      toast.update(toastId, { render: "Statement Downloaded!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      toast.update(toastId, { render: "PDF Generation Failed", type: "error", isLoading: false, autoClose: 2000 });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(val || 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--text-muted)', fontWeight: '800' }}>
      <Activity className="spin" style={{ marginRight: '10px' }} /> ANALYZING PORTFOLIO...
    </div>
  );
  
  if (!data) return null;

  const { profile, summary, familyMembers, review_history } = data;

  return (
    <div className="container fade-in" style={{ padding: '24px', paddingBottom: '60px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 🔍 ACTION HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: 'var(--text-main)' }}>{profile.full_name}</h1>
            <p style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '13px' }}>Wealth Management Insights</p>
          </div>
        </div>

        <button 
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', 
            background: isGenerating ? 'var(--text-muted)' : '#10b981', 
            color: 'white', borderRadius: '12px', border: 'none', fontWeight: '800', 
            cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
          }}
        >
          {isGenerating ? <Activity size={18} className="spin" /> : <Download size={18} />}
          {isGenerating ? "GENERTING..." : "GENERATE PDF REPORT"}
        </button>
      </div>

      {/* 📄 REPORT CONTENT AREA */}
      <div ref={reportRef} style={{ padding: '10px', borderRadius: '16px' }}>
        
        <div style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '16px' }}>
            <h2 style={{ color: 'var(--text-main)', fontWeight: '900', marginBottom: '4px' }}>Portfolio Review Statement</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700' }}>VisionBridge Ventures • Generated on {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        {/* 🟢 MODIFIED GRID: Using 2 columns to ensure height is filled properly in PDF */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* LEFT COLUMN: KYC & ASSETS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '20px', color: '#0284c7', textTransform: 'uppercase', fontWeight: '900' }}>
                <User size={18} /> Client Details
              </h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <DetailRow label="Client Code" value={profile.client_code} />
                <DetailRow label="Age" value={`${profile.age} Years`} />
                <DetailRow label="Risk Profile" value={profile.risk_profile || 'Moderate'} highlight="#f59e0b" />
                <DetailRow label="PAN" value={profile.pan || 'N/A'} />
              </div>
            </div>

            <div style={{ padding: '24px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.3)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '16px', color: 'rgba(255,255,255,0.8)', fontWeight: '900' }}>
                <Briefcase size={18} /> INVESTED AUM
              </h3>
              <div style={{ fontSize: '36px', fontWeight: '900' }}>{formatINR(summary.totalAUM)}</div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '16px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9, fontSize: '13px', fontWeight: '800' }}>
                <span>Monthly SIP Book</span>
                <span>{formatINR(summary.totalSipBook)}</span>
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '20px', color: '#f59e0b', textTransform: 'uppercase', fontWeight: '900' }}>
                <Users size={18} /> Family Group
              </h3>
              {familyMembers.length > 0 ? familyMembers.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>{m.full_name}</span>
                  <span style={{ fontWeight: '800', color: '#0284c7', fontSize: '13px' }}>{formatINR(m.summary.totalAUM)}</span>
                </div>
              )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No linked family members.</p>}
            </div>
          </div>

          {/* RIGHT COLUMN: ALLOCATION & HISTORY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', minHeight: '380px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '20px', color: '#8b5cf6', textTransform: 'uppercase', fontWeight: '900' }}>
                <PieIcon size={18} /> Asset Allocation
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={5}>
                      {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '20px', color: '#10b981', textTransform: 'uppercase', fontWeight: '900' }}>
                <Clock size={18} /> Review History
              </h3>
              {review_history.length > 0 ? review_history.slice(0, 5).map(h => (
                <div key={h.id} style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px dashed var(--border)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>{new Date(h.review_date).toLocaleDateString('en-IN')}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{h.notes || "Standard portfolio check-up."}</div>
                </div>
              )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No previous logs available.</p>}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800' }}>
          PROPRIETARY DATA • FOR INTERNAL ADVISORY PURPOSES ONLY
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const DetailRow = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', paddingTop: '4px' }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{label}</span>
    <span style={{ fontWeight: '900', color: highlight || 'var(--text-main)' }}>{value}</span>
  </div>
);

export default ClientProfile;
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Download, DatabaseBackup, Loader2, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';

const Reports = () => {
  const [downloadingReport, setDownloadingReport] = useState(null);

  // 🛡️ DYNAMIC API HANDLER: Works on Localhost and Production
  const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://visionbridge-backend.onrender.com/api';

  const handleDownload = async (endpoint, filename) => {
    setDownloadingReport(endpoint);
    const toastId = toast.loading(`Generating ${filename}...`);
    
    try {
      /**
       * 🛡️ AUTH SYNC: Pulling token from the standard session storage.
       * Note: If you switched strictly to httpOnly cookies, the browser handles this automatically.
       */
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");

      const response = await fetch(`${API_BASE}/reports/${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Session expired. Please log in.');
        throw new Error('Reporting engine failed to generate file.');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.update(toastId, { render: "Report Downloaded!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      console.error("Download Error:", error);
      toast.update(toastId, { render: error.message, type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setDownloadingReport(null);
    }
  };

  const handleBackup = async () => {
    setDownloadingReport('system-backup');
    const toastId = toast.loading("Packaging System Backup...");
    
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/dashboard/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Backup failed. Administrative access required.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `VisionBridge_Master_Backup_${timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.update(toastId, { render: "Disaster Recovery File Saved!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      toast.update(toastId, { render: error.message, type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setDownloadingReport(null);
    }
  };

  return (
    <div className="container fade-in" style={{ paddingBottom: '60px', maxWidth: '1000px', margin: '0 auto' }}>
      
      <style>{`
        .report-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding: 24px 32px;
          background: var(--bg-card);
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .report-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
        }

        .report-btn {
          color: white;
          border: 1px solid transparent;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
          min-width: 200px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-transform: uppercase;
        }

        .report-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 768px) {
          .report-card { flex-direction: column; align-items: flex-start; padding: 24px; }
          .report-btn { width: 100%; min-width: unset; }
        }
      `}</style>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* CARD 1: CLIENT-WISE INVESTED AUM */}
        <div className="report-card">
          <div className="report-info">
            <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)', fontSize: '18px' }}>Client-wise Invested AUM</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Accurate metrics including net principal and missed SIP deductions.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('client-aum', 'Client_AUM_Statement.xlsx')}
            disabled={downloadingReport === 'client-aum'}
            style={{ background: '#1e293b' }}
          >
            {downloadingReport === 'client-aum' ? <><Loader2 size={18} className="spin" /> SYNCING...</> : <><FileSpreadsheet size={18} /> EXPORT EXCEL</>}
          </button>
        </div>

        {/* CARD 2: SCHEME-WISE AUM */}
        <div className="report-card">
          <div className="report-info">
            <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)', fontSize: '18px' }}>Scheme-wise AUM</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Master summary of fund exposure and commission benchmarks.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('scheme-aum', 'Scheme_Exposure_Report.xlsx')}
            disabled={downloadingReport === 'scheme-aum'}
            style={{ background: '#10b981' }}
          >
            {downloadingReport === 'scheme-aum' ? <><Loader2 size={18} className="spin" /> SYNCING...</> : <><FileSpreadsheet size={18} /> EXPORT EXCEL</>}
          </button>
        </div>

        {/* CARD 3: MONTHLY SIP BOOK */}
        <div className="report-card">
          <div className="report-info">
            <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)', fontSize: '18px' }}>Monthly SIP Registry</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Audit of all active mandates categorized by recurring amount.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('sip-book', 'Monthly_SIP_Book.xlsx')}
            disabled={downloadingReport === 'sip-book'}
            style={{ background: '#f59e0b' }}
          >
            {downloadingReport === 'sip-book' ? <><Loader2 size={18} className="spin" /> SYNCING...</> : <><FileSpreadsheet size={18} /> EXPORT EXCEL</>}
          </button>
        </div>

        {/* CARD 4: REVENUE PROJECTIONS */}
        <div className="report-card">
          <div className="report-info">
            <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)', fontSize: '18px' }}>Revenue & Commission Report</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Monthly income estimations based on net invested capital.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('commission-report', 'Revenue_Projections.xlsx')}
            disabled={downloadingReport === 'commission-report'}
            style={{ background: '#6366f1' }}
          >
             {downloadingReport === 'commission-report' ? <><Loader2 size={18} className="spin" /> SYNCING...</> : <><FileSpreadsheet size={18} /> EXPORT EXCEL</>}
          </button>
        </div>

        {/* CARD 5: FULL CLIENTS DATABASE */}
        <div className="report-card">
          <div className="report-info">
            <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)', fontSize: '18px' }}>Full CRM Database</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Complete archive of client contact and KYC information.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('clients-database', 'Master_Client_List.xlsx')}
            disabled={downloadingReport === 'clients-database'}
            style={{ background: '#0284c7' }}
          >
            {downloadingReport === 'clients-database' ? <><Loader2 size={18} className="spin" /> SYNCING...</> : <><FileSpreadsheet size={18} /> EXPORT EXCEL</>}
          </button>
        </div>

        {/* 🛡️ DISASTER RECOVERY */}
        <div className="report-card" style={{ 
          background: 'rgba(239, 68, 68, 0.04)', 
          marginTop: '24px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div className="report-info">
            <h3 style={{ margin: 0, fontWeight: '900', color: '#ef4444', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} /> DISASTER RECOVERY (JSON)
            </h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500', opacity: 0.8 }}>
              Encrypted raw database snapshot for off-site backup and emergency restoration.
            </p>
          </div>
          <button 
            className="report-btn"
            onClick={handleBackup}
            disabled={downloadingReport === 'system-backup'}
            style={{ background: '#ef4444' }}
          >
            {downloadingReport === 'system-backup' ? <><Loader2 size={18} className="spin" /> PACKAGING...</> : <><DatabaseBackup size={18} /> DOWNLOAD SNAPSHOT</>}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default Reports;
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';

const Reports = () => {
  const [downloadingReport, setDownloadingReport] = useState(null);

  const handleDownload = async (endpoint, filename) => {
    setDownloadingReport(endpoint);
    try {
      const token = sessionStorage.getItem("token");

      const response = await fetch(`https://visionbridge-backend.onrender.com/api/reports/${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Please log in again.');
        }
        throw new Error('Network response was not ok');
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
    } catch (error) {
      console.error("Download failed:", error);
      alert(error.message || "Failed to download the report.");
    } finally {
      setDownloadingReport(null);
    }
  };

  const handleBackup = async () => {
    setDownloadingReport('system-backup');
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`https://visionbridge-backend.onrender.com/api/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Backup failed. Ensure you are logged in.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `visionbridge_system_backup_${timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    } finally {
      setDownloadingReport(null);
    }
  };

  return (
    <div className="container fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* 🎨 Page Styles: Handling the Mobile Squeeze */}
      <style>{`
        .report-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding: 24px;
          background: var(--bg-card);
          border-radius: 16px;
          border: 2.5px solid var(--border);
          box-shadow: 4px 4px 0px rgba(0,0,0,0.05);
          transition: transform 0.2s ease;
        }

        .report-card:hover {
          transform: translateY(-2px);
        }

        .report-btn {
          color: white;
          border: 2.5px solid var(--border);
          padding: 14px 24px;
          borderRadius: 12px;
          font-weight: 900;
          font-size: 13px;
          cursor: pointer;
          letter-spacing: 0.5px;
          box-shadow: 4px 4px 0px rgba(0,0,0,0.08);
          transition: all 0.2s ease;
          min-width: 180px;
          text-align: center;
          outline: none;
        }

        .report-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px rgba(0,0,0,0.08);
        }

        /* 📱 Mobile Overrides: Row to Column */
        @media (max-width: 768px) {
          .report-card {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px;
            gap: 20px;
          }
          
          .report-info {
            width: 100%;
          }

          .report-btn {
            width: 100%;
            min-width: unset;
            padding: 16px;
            font-size: 14px;
          }

          .report-title {
            font-size: 20px !important;
          }
        }
      `}</style>
      
      {/* Page Title */}
      <h1 className="title" style={{ color: 'var(--text-main)', fontWeight: '900', fontSize: '32px', marginBottom: '36px', letterSpacing: '-0.8px' }}>
        Report Export Center
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* CARD 1: CLIENT-WISE INVESTED AUM */}
        <div className="report-card">
          <div className="report-info">
            <h3 className="report-title" style={{ margin: 0, fontWeight: '900', color: 'var(--text-main)', fontSize: '18px', letterSpacing: '-0.5px' }}>Client-wise Invested AUM</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', lineHeight: '1.5' }}>Detailed client metrics including SIP ratios and Risk Profiles.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('client-aum', 'Client_AUM_Report.xlsx')}
            disabled={downloadingReport === 'client-aum'}
            style={{ background: '#1e293b' }}
          >
            {downloadingReport === 'client-aum' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* CARD 2: SCHEME-WISE AUM */}
        <div className="report-card">
          <div className="report-info">
            <h3 className="report-title" style={{ margin: 0, fontWeight: '900', color: 'var(--text-main)', fontSize: '18px', letterSpacing: '-0.5px' }}>Scheme-wise AUM</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', lineHeight: '1.5' }}>Fund allocations, SIP books, and commission metrics per scheme.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('scheme-aum', 'Scheme_AUM_Report.xlsx')}
            disabled={downloadingReport === 'scheme-aum'}
            style={{ background: '#10b981' }}
          >
            {downloadingReport === 'scheme-aum' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* CARD 3: MONTHLY SIP BOOK */}
        <div className="report-card">
          <div className="report-info">
            <h3 className="report-title" style={{ margin: 0, fontWeight: '900', color: 'var(--text-main)', fontSize: '18px', letterSpacing: '-0.5px' }}>Monthly SIP Book</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', lineHeight: '1.5' }}>Active SIP counts and amounts aggregated by scheme.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('sip-book', 'Monthly_SIP_Book_Report.xlsx')}
            disabled={downloadingReport === 'sip-book'}
            style={{ background: '#f59e0b' }}
          >
            {downloadingReport === 'sip-book' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* CARD 4: MONTHLY COMMISSION REPORT */}
        <div className="report-card">
          <div className="report-info">
            <h3 className="report-title" style={{ margin: 0, fontWeight: '900', color: 'var(--text-main)', fontSize: '18px', letterSpacing: '-0.5px' }}>Monthly Commission Report</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', lineHeight: '1.5' }}>Revenue projections based on Invested and Market AUM.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('commission-report', 'Monthly_Commission_Report.xlsx')}
            disabled={downloadingReport === 'commission-report'}
            style={{ background: '#6366f1' }}
          >
            {downloadingReport === 'commission-report' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* CARD 5: CLIENTS DATABASE (FULL) */}
        <div className="report-card">
          <div className="report-info">
            <h3 className="report-title" style={{ margin: 0, fontWeight: '900', color: 'var(--text-main)', fontSize: '18px', letterSpacing: '-0.5px' }}>Clients Database (Full)</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', lineHeight: '1.5' }}>Export all client records with complete KYC and contact details.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('clients-database', 'Full_Clients_Database.xlsx')}
            disabled={downloadingReport === 'clients-database'}
            style={{ background: '#0284c7' }}
          >
            {downloadingReport === 'clients-database' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* CARD 6: MF SCHEMES DATABASE (FULL) */}
        <div className="report-card">
          <div className="report-info">
            <h3 className="report-title" style={{ margin: 0, fontWeight: '900', color: 'var(--text-main)', fontSize: '18px', letterSpacing: '-0.5px' }}>MF Schemes Database (Full)</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', lineHeight: '1.5' }}>Master export of all mutual fund schemes and their allocations.</p>
          </div>
          <button 
            className="report-btn"
            onClick={() => handleDownload('schemes-database', 'Full_MF_Schemes_Database.xlsx')}
            disabled={downloadingReport === 'schemes-database'}
            style={{ background: '#8b5cf6' }}
          >
            {downloadingReport === 'schemes-database' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* 🛡️ SYSTEM MAINTENANCE: DISASTER RECOVERY */}
        <div className="report-card" style={{ 
          background: 'rgba(239, 68, 68, 0.05)', 
          marginTop: '32px',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        }}>
          <div className="report-info">
            <h3 className="report-title" style={{ margin: 0, fontWeight: '900', color: '#ef4444', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Disaster Recovery</h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-main)', fontSize: '14px', fontWeight: '600', opacity: 0.8 }}>
              Internal database JSON backup for off-site system restoration.
            </p>
          </div>
          <button 
            className="report-btn"
            onClick={handleBackup}
            disabled={downloadingReport === 'system-backup'}
            style={{
              background: '#ef4444',
              boxShadow: '4px 4px 0px rgba(239, 68, 68, 0.2)'
            }}
          >
            {downloadingReport === 'system-backup' ? 'BACKING UP...' : '💾 SYSTEM BACKUP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
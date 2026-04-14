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

  /* 🪄 Stripped out explicit borders, background, and padding. Added to className="card" instead */
  const cardLayout = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px'
  };

  const btnStyle = (color) => ({
    background: color,
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: `0 4px 12px ${color}33`,
    transition: 'all 0.2s ease',
    minWidth: '160px'
  });

  return (
    <div className="container fade-in" style={{ paddingBottom: '60px' }}>
      <h2 style={{ 
        fontWeight: '800', 
        color: 'var(--text-main)', 
        marginBottom: '32px', 
        borderLeft: '6px solid #6366f1', 
        paddingLeft: '16px',
        textTransform: 'uppercase',
        fontSize: '16px',
        letterSpacing: '1px'
      }}>
        Report Export Center
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* CARD 1: CLIENT-WISE INVESTED AUM */}
        <div className="card" style={cardLayout}>
          <div style={{ flex: '1' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' }}>Client-wise Invested AUM</h3>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>Detailed client metrics including SIP ratios and Risk Profiles.</p>
          </div>
          <button 
            onClick={() => handleDownload('client-aum', 'Client_AUM_Report.xlsx')}
            disabled={downloadingReport === 'client-aum'}
            style={btnStyle('#1e293b')}
          >
            {downloadingReport === 'client-aum' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* CARD 2: SCHEME-WISE AUM */}
        <div className="card" style={cardLayout}>
          <div style={{ flex: '1' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' }}>Scheme-wise AUM</h3>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>Fund allocations, SIP books, and commission metrics per scheme.</p>
          </div>
          <button 
            onClick={() => handleDownload('scheme-aum', 'Scheme_AUM_Report.xlsx')}
            disabled={downloadingReport === 'scheme-aum'}
            style={btnStyle('#10b981')}
          >
            {downloadingReport === 'scheme-aum' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* CARD 3: MONTHLY SIP BOOK */}
        <div className="card" style={cardLayout}>
          <div style={{ flex: '1' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' }}>Monthly SIP Book</h3>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>Active SIP counts and amounts aggregated by scheme.</p>
          </div>
          <button 
            onClick={() => handleDownload('sip-book', 'Monthly_SIP_Book_Report.xlsx')}
            disabled={downloadingReport === 'sip-book'}
            style={btnStyle('#f59e0b')}
          >
            {downloadingReport === 'sip-book' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* CARD 4: MONTHLY COMMISSION REPORT */}
        <div className="card" style={cardLayout}>
          <div style={{ flex: '1' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' }}>Monthly Commission Report</h3>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>Revenue projections based on Invested and Market AUM.</p>
          </div>
          <button 
            onClick={() => handleDownload('commission-report', 'Monthly_Commission_Report.xlsx')}
            disabled={downloadingReport === 'commission-report'}
            style={btnStyle('#6366f1')}
          >
            {downloadingReport === 'commission-report' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* CARD 5: CLIENTS DATABASE (FULL) */}
        <div className="card" style={cardLayout}>
          <div style={{ flex: '1' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' }}>Clients Database (Full)</h3>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>Export all client records with complete KYC and contact details.</p>
          </div>
          <button 
            onClick={() => handleDownload('clients-database', 'Full_Clients_Database.xlsx')}
            disabled={downloadingReport === 'clients-database'}
            style={btnStyle('#0ea5e9')}
          >
            {downloadingReport === 'clients-database' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* CARD 6: MF SCHEMES DATABASE (FULL) */}
        <div className="card" style={cardLayout}>
          <div style={{ flex: '1' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' }}>MF Schemes Database (Full)</h3>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>Master export of all mutual fund schemes and their allocations.</p>
          </div>
          <button 
            onClick={() => handleDownload('schemes-database', 'Full_MF_Schemes_Database.xlsx')}
            disabled={downloadingReport === 'schemes-database'}
            style={btnStyle('#8b5cf6')}
          >
            {downloadingReport === 'schemes-database' ? 'GENERATING...' : '📥 EXPORT EXCEL'}
          </button>
        </div>

        {/* 🛡️ SYSTEM MAINTENANCE: DISASTER RECOVERY */}
        <div className="card" style={{ 
          ...cardLayout, 
          background: 'rgba(239, 68, 68, 0.03)', 
          marginTop: '32px' 
        }}>
          <div style={{ flex: '1' }}>
            <h3 style={{ margin: 0, fontWeight: '800', color: '#ef4444', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Disaster Recovery</h3>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-main)', fontSize: '13px', opacity: 0.8 }}>
              Internal database JSON backup for off-site system restoration.
            </p>
          </div>
          <button 
            onClick={handleBackup}
            disabled={downloadingReport === 'system-backup'}
            style={{
              ...btnStyle('#ef4444'),
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
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
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

  // 🛡️ NEW: SYSTEM BACKUP LOGIC
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

  const cardStyle = {
    background: '#ffffff',
    border: '2px solid #cbd5e1',
    borderRadius: '16px',
    padding: '25px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
  };

  return (
    <div className="fade-in" style={{ padding: '20px', paddingBottom: '50px' }}>
      <h2 style={{ fontWeight: '900', color: '#0f172a', marginBottom: '30px', borderLeft: '8px solid #3b82f6', paddingLeft: '15px' }}>
        DOWNLOAD REPORTS
      </h2>

      {/* CARD 1: CLIENT-WISE INVESTED AUM */}
      <div style={cardStyle}>
        <div>
          <h3 style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>Client-wise Invested AUM</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Client metrics including SIP ratios and Risk Profiles.</p>
        </div>
        <button 
          onClick={() => handleDownload('client-aum', 'Client_AUM_Report.xlsx')}
          disabled={downloadingReport === 'client-aum'}
          style={{
            background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', 
            borderRadius: '8px', fontWeight: 'bold', cursor: downloadingReport === 'client-aum' ? 'wait' : 'pointer'
          }}
        >
          {downloadingReport === 'client-aum' ? 'GENERATING...' : '📥 DOWNLOAD EXCEL'}
        </button>
      </div>

      {/* CARD 2: SCHEME-WISE AUM */}
      <div style={cardStyle}>
        <div>
          <h3 style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>Scheme-wise AUM</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Fund allocations, SIP books, and commission metrics per scheme.</p>
        </div>
        <button 
          onClick={() => handleDownload('scheme-aum', 'Scheme_AUM_Report.xlsx')}
          disabled={downloadingReport === 'scheme-aum'}
          style={{
            background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', 
            borderRadius: '8px', fontWeight: 'bold', cursor: downloadingReport === 'scheme-aum' ? 'wait' : 'pointer'
          }}
        >
          {downloadingReport === 'scheme-aum' ? 'GENERATING...' : '📥 DOWNLOAD EXCEL'}
        </button>
      </div>

      {/* CARD 3: MONTHLY SIP BOOK */}
      <div style={cardStyle}>
        <div>
          <h3 style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>Monthly SIP Book</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Active SIP counts and amounts aggregated by scheme.</p>
        </div>
        <button 
          onClick={() => handleDownload('sip-book', 'Monthly_SIP_Book_Report.xlsx')}
          disabled={downloadingReport === 'sip-book'}
          style={{
            background: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', 
            borderRadius: '8px', fontWeight: 'bold', cursor: downloadingReport === 'sip-book' ? 'wait' : 'pointer'
          }}
        >
          {downloadingReport === 'sip-book' ? 'GENERATING...' : '📥 DOWNLOAD EXCEL'}
        </button>
      </div>

      {/* CARD 4: MONTHLY COMMISSION REPORT */}
      <div style={cardStyle}>
        <div>
          <h3 style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>Monthly Commission Report</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Revenue projections based on Invested and Market AUM.</p>
        </div>
        <button 
          onClick={() => handleDownload('commission-report', 'Monthly_Commission_Report.xlsx')}
          disabled={downloadingReport === 'commission-report'}
          style={{
            background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', 
            borderRadius: '8px', fontWeight: 'bold', cursor: downloadingReport === 'commission-report' ? 'wait' : 'pointer'
          }}
        >
          {downloadingReport === 'commission-report' ? 'GENERATING...' : '📥 DOWNLOAD EXCEL'}
        </button>
      </div>

      {/* CARD 5: CLIENTS DATABASE (FULL) */}
      <div style={cardStyle}>
        <div>
          <h3 style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>Clients Database (Full)</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Export all client records with complete KYC and contact details.</p>
        </div>
        <button 
          onClick={() => handleDownload('clients-database', 'Full_Clients_Database.xlsx')}
          disabled={downloadingReport === 'clients-database'}
          style={{
            background: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', 
            borderRadius: '8px', fontWeight: 'bold', cursor: downloadingReport === 'clients-database' ? 'wait' : 'pointer'
          }}
        >
          {downloadingReport === 'clients-database' ? 'GENERATING...' : '📥 DOWNLOAD EXCEL'}
        </button>
      </div>

      {/* CARD 6: MF SCHEMES DATABASE (FULL) */}
      <div style={cardStyle}>
        <div>
          <h3 style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>MF Schemes Database (Full)</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Master export of all mutual fund schemes and their allocations.</p>
        </div>
        <button 
          onClick={() => handleDownload('schemes-database', 'Full_MF_Schemes_Database.xlsx')}
          disabled={downloadingReport === 'schemes-database'}
          style={{
            background: '#8b5cf6', color: 'white', border: 'none', padding: '10px 20px', 
            borderRadius: '8px', fontWeight: 'bold', cursor: downloadingReport === 'schemes-database' ? 'wait' : 'pointer'
          }}
        >
          {downloadingReport === 'schemes-database' ? 'GENERATING...' : '📥 DOWNLOAD EXCEL'}
        </button>
      </div>

      {/* 🛡️ NEW SECTION: SYSTEM MAINTENANCE */}
      <div style={{ ...cardStyle, border: '2px solid #fecaca', background: '#fff1f2', marginTop: '40px' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: '800', color: '#991b1b' }}>System Maintenance</h3>
          <p style={{ margin: '5px 0 0 0', color: '#b91c1c', fontSize: '13px' }}>
            <strong>Admin Only:</strong> Full database JSON backup for disaster recovery.
          </p>
        </div>
        <button 
          onClick={handleBackup}
          disabled={downloadingReport === 'system-backup'}
          style={{
            background: '#ef4444', color: 'white', border: 'none', padding: '12px 25px', 
            borderRadius: '8px', fontWeight: 'bold', cursor: downloadingReport === 'system-backup' ? 'wait' : 'pointer',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
          }}
        >
          {downloadingReport === 'system-backup' ? 'PREPARING...' : '💾 DOWNLOAD JSON'}
        </button>
      </div>
      
    </div>
  );
};

export default Reports;
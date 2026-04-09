import React from 'react';

const Loader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px',
    gap: '15px'
  }}>
    <div className="spinner"></div>
    <p style={{ fontWeight: '800', color: '#64748b', fontSize: '14px', letterSpacing: '1px' }}>
      SYNCING DATA...
    </p>
    <style>{`
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default Loader;
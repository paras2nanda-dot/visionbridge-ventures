import React, { useState, useEffect } from 'react';

const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [theme, setTheme] = useState(localStorage.getItem('vb-theme') || 'light');

  // --- Theme Logic ---
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('vb-theme', theme);

    const themes = {
      light: { main: '#f8fafc', card: '#ffffff', text: '#0f172a', textMuted: '#64748b', border: '#e2e8f0', sidebar: '#1e293b' },
      slate: { main: '#0f172a', card: '#1e293b', text: '#f8fafc', textMuted: '#94a3b8', border: '#334155', sidebar: '#020617' },
      midnight: { main: '#000000', card: '#0d0d0d', text: '#ffffff', textMuted: '#a1a1aa', border: '#3f3f46', sidebar: '#000000' },
      forest: { main: '#022c22', card: '#064e3b', text: '#ecfdf5', textMuted: '#a7f3d0', border: '#065f46', sidebar: '#022c22' }
    };

    const active = themes[theme] || themes.light; 
    root.style.setProperty('--bg-main', active.main);
    root.style.setProperty('--bg-card', active.card);
    root.style.setProperty('--text-main', active.text);
    root.style.setProperty('--text-muted', active.textMuted);
    root.style.setProperty('--border', active.border);
    root.style.setProperty('--sidebar', active.sidebar);

    document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
    document.body.style.backgroundColor = active.main;
    document.body.style.color = active.text;
  }, [theme]);

  const themeOptions = [
    { id: 'light', icon: '☀️', label: 'Light' },
    { id: 'slate', icon: '🌙', label: 'Slate' },
    { id: 'midnight', icon: '🌌', label: 'Obsidian' },
    { id: 'forest', icon: '🌲', label: 'Forest' }
  ];

  return (
    <>
      <style>{`
        /* 🌑 Overlay with Blur */
        .settings-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          z-index: 9999999; display: flex; justify-content: center; align-items: center;
          animation: fadeIn 0.2s ease-out;
        }

        /* 🎛️ Settings Card (Desktop & Mobile Base) */
        .settings-card {
          background: var(--bg-main); width: 100%; max-width: 480px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* 📱 Mobile Specific: Bottom Sheet */
        @media (max-width: 768px) {
          .settings-overlay { align-items: flex-end; padding: 0; }
          .settings-card {
            border-radius: 28px 28px 0 0;
            max-height: 85vh; border: 1px solid var(--border); border-bottom: none;
            padding-bottom: env(safe-area-inset-bottom);
          }
          .mobile-drag-handle {
            width: 40px; height: 5px; background: var(--border); border-radius: 10px;
            margin: 12px auto; opacity: 0.6; display: block !important;
          }
        }

        /* 💻 Desktop Specific */
        @media (min-width: 769px) {
          .settings-overlay { padding: 20px; }
          .settings-card { border-radius: 20px; border: 1.5px solid var(--border); max-height: 90vh; }
          .mobile-drag-handle { display: none; }
        }

        /* 🗂️ Tabs */
        .settings-tab {
          flex: 1; padding: 16px 8px; background: transparent; border: none;
          color: var(--text-muted); font-size: 14px; font-weight: 700; cursor: pointer;
          border-bottom: 3px solid transparent; transition: all 0.2s;
        }
        .settings-tab.active {
          color: #0284c7; border-bottom: 3px solid #0284c7; font-weight: 900;
        }

        /* 🔲 2x2 Grid Buttons */
        .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
        .theme-btn {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          padding: 24px 12px; border-radius: 16px; border: 2px solid var(--border);
          background: var(--bg-card); color: var(--text-muted);
          font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s ease;
          outline: none;
        }
        .theme-btn:hover { background: var(--bg-main); border-color: #94a3b8; }
        .theme-btn.active {
          border-color: #0284c7; background: rgba(2, 132, 199, 0.08); color: #0284c7;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
        }
        .theme-icon { font-size: 28px; transition: transform 0.2s; }
        .theme-btn.active .theme-icon { transform: scale(1.1); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* Overlay: Closes modal when clicking outside */}
      <div className="settings-overlay" onClick={onClose}>
        
        {/* Modal Card: Stops click from bubbling to overlay */}
        <div className="settings-card" onClick={e => e.stopPropagation()}>
          
          <div className="mobile-drag-handle"></div>

          {/* Header */}
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>Settings</h2>
            <button 
              onClick={onClose} 
              style={{ background: 'var(--bg-card)', border: 'none', color: 'var(--text-muted)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <button className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>✨ Appearance</button>
            <button className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>👤 Profile</button>
            <button className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>🛡️ Security</button>
          </div>

          {/* Content Area */}
          <div style={{ padding: '24px', overflowY: 'auto', background: 'var(--bg-main)', flex: 1 }}>
            
            {activeTab === 'appearance' && (
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)', fontSize: '16px', fontWeight: '800' }}>Platform Theme</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', lineHeight: 1.4 }}>Choose your preferred visual style. Changes apply instantly.</p>
                
                {/* 2x2 Segmented Grid */}
                <div className="theme-grid">
                  {themeOptions.map((opt) => (
                    <button 
                      key={opt.id} 
                      onClick={() => setTheme(opt.id)}
                      className={`theme-btn ${theme === opt.id ? 'active' : ''}`}
                    >
                      <span className="theme-icon">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🚧</span>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '16px', fontWeight: '800' }}>Profile Settings Coming Soon</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>Account details and notifications will live here.</p>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🔒</span>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '16px', fontWeight: '800' }}>Security Settings Coming Soon</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>Biometrics and 2FA management will live here.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;
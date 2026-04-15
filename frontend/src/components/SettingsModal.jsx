import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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

  // 🚪 REACT PORTAL: Renders outside the Sidebar so it doesn't get dragged away!
  return createPortal(
    <>
      <style>{`
        /* 🌑 Overlay with Blur */
        .settings-backdrop {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          z-index: 9999999; display: flex; justify-content: center; align-items: center;
          animation: fadeIn 0.2s ease-out;
        }

        /* 🎛️ Settings Card (Desktop & Mobile Base) */
        .settings-sheet {
          background: var(--bg-card); width: 100%; max-width: 480px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          animation: slideUpSpring 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        }

        /* 📱 Mobile Specific: Bottom Sheet */
        @media (max-width: 768px) {
          .settings-backdrop { align-items: flex-end; padding: 0; }
          .settings-sheet {
            border-radius: 28px 28px 0 0;
            max-height: 85vh; border: 1px solid var(--border); border-bottom: none;
            padding-bottom: env(safe-area-inset-bottom);
          }
          .drag-indicator {
            width: 40px; height: 5px; background: var(--text-muted); border-radius: 10px;
            margin: 12px auto; opacity: 0.3; display: block;
          }
        }

        /* 💻 Desktop Specific */
        @media (min-width: 769px) {
          .settings-backdrop { padding: 20px; }
          .settings-sheet { border-radius: 20px; border: 1.5px solid var(--border); max-height: 90vh; }
          .drag-indicator { display: none; }
        }

        /* 🗂️ iOS Segmented Control */
        .segmented-control {
          display: flex; background: var(--bg-main); padding: 5px; border-radius: 14px;
          margin: 0 24px 24px 24px; border: 1px solid var(--border);
        }
        .segment-btn {
          flex: 1; padding: 10px 0; border-radius: 10px !important; border: none !important;
          background: transparent; color: var(--text-muted); font-weight: 700; cursor: pointer;
          transition: all 0.2s; font-size: 13px; outline: none;
        }
        .segment-btn.active {
          background: var(--bg-card) !important; color: var(--text-main); font-weight: 900;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1.5px solid var(--border) !important;
        }

        /* 🔲 Native Radio Cards */
        .theme-card {
          background: var(--bg-main) !important; border: 1.5px solid var(--border) !important;
          border-radius: 16px !important; padding: 20px !important; cursor: pointer;
          display: flex; flex-direction: column; gap: 16px; transition: all 0.2s;
          text-align: left; outline: none; box-shadow: none !important;
        }
        .theme-card:hover { border-color: var(--text-muted) !important; }
        .theme-card.active {
          border-color: #0284c7 !important; background: rgba(2, 132, 199, 0.05) !important;
          box-shadow: 0 8px 16px rgba(2, 132, 199, 0.1) !important;
        }

        /* Radio Checkmark */
        .radio-circle {
          width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border);
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .theme-card.active .radio-circle { border-color: #0284c7; background: #0284c7; }
        .radio-dot {
          width: 8px; height: 8px; background: #fff; border-radius: 50%;
          transform: scale(0); transition: transform 0.2s;
        }
        .theme-card.active .radio-dot { transform: scale(1); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpSpring { 
          0% { transform: translateY(100px); opacity: 0; } 
          100% { transform: translateY(0); opacity: 1; } 
        }
      `}</style>

      <div className="settings-backdrop" onClick={onClose}>
        <div className="settings-sheet" onClick={e => e.stopPropagation()}>
          <div className="drag-indicator"></div>

          {/* Header */}
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>Settings</h2>
            <button 
              onClick={onClose} 
              style={{ background: 'var(--bg-main) !important', border: '1.5px solid var(--border) !important', color: 'var(--text-main)', width: '32px', height: '32px', borderRadius: '50% !important', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>

          {/* Segmented Control */}
          <div className="segmented-control">
            <button className={`segment-btn ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>✨ Appearance</button>
            <button className={`segment-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>👤 Profile</button>
            <button className={`segment-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>🛡️ Security</button>
          </div>

          {/* Content Area */}
          <div style={{ padding: '0 24px 32px 24px', overflowY: 'auto', flex: 1 }}>
            
            {activeTab === 'appearance' && (
              <div className="fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {themeOptions.map((opt) => (
                    <button 
                      key={opt.id} 
                      onClick={() => setTheme(opt.id)}
                      className={`theme-card ${theme === opt.id ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '24px' }}>{opt.icon}</span>
                        <div className="radio-circle">
                          <div className="radio-dot"></div>
                        </div>
                      </div>
                      <div style={{ fontWeight: '800', color: theme === opt.id ? '#0284c7' : 'var(--text-main)', fontSize: '14px', marginTop: '4px' }}>
                        {opt.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }} className="fade-in">
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🚧</span>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '16px', fontWeight: '800' }}>Profile Details</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>Account details will live here.</p>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }} className="fade-in">
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🔒</span>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '16px', fontWeight: '800' }}>Security</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>Biometrics settings will live here.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default SettingsModal;
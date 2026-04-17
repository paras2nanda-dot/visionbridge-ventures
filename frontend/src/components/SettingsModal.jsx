import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ActivityFeed from './ActivityFeed';
import api from '../services/api';
import { Palette, ShieldCheck, History, X, Smartphone, Trash2, Fingerprint } from 'lucide-react';

// --- Internal Security Component for Settings ---
const SettingsSecurity = () => {
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPasskeys = async () => {
    try {
      const res = await api.get('/auth/webauthn/passkeys');
      setPasskeys(res.data);
    } catch (err) {
      console.error("Failed to fetch passkeys", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this biometric login?")) return;
    try {
      await api.delete(`/auth/webauthn/passkeys/${id}`);
      setPasskeys(passkeys.filter(k => k.id !== id));
    } catch (err) {
      alert("Failed to remove device.");
    }
  };

  useEffect(() => { fetchPasskeys(); }, []);

  return (
    <div className="fade-in">
      <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '18px', fontWeight: '800' }}>Biometric Security</h3>
      <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', lineHeight: 1.4 }}>Manage devices authorized for fingerprint or face recognition.</p>
      
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Syncing secure devices...</p>
      ) : passkeys.length === 0 ? (
        <div style={{ padding: '40px 20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px dashed var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Fingerprint size={32} color="var(--text-muted)" style={{ opacity: 0.3 }} />
            <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px' }}>No biometric devices registered.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {passkeys.map(key => (
            <div key={key.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Smartphone size={18} color="#0284c7" />
                <div>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)' }}>Authorized Device</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Added {new Date(key.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <button onClick={() => handleDelete(key.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [theme, setTheme] = useState(localStorage.getItem('vb-theme') || 'light');

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
    document.body.style.backgroundColor = active.main;
    document.body.style.color = active.text;
  }, [theme]);

  const themeOptions = [
    { id: 'light', icon: '☀️', label: 'Light' },
    { id: 'slate', icon: '🌙', label: 'Slate' },
    { id: 'midnight', icon: '🌌', label: 'Obsidian' },
    { id: 'forest', icon: '🌲', label: 'Forest' }
  ];

  const tabButtonStyle = (id) => ({
    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '10px',
    background: activeTab === id ? 'rgba(2, 132, 199, 0.1)' : 'transparent',
    color: activeTab === id ? '#0284c7' : 'var(--text-muted)',
    border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '13px', transition: 'all 0.2s', textAlign: 'left'
  });

  return createPortal(
    <>
      <style>{`
        .settings-backdrop {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); z-index: 9999999;
          display: flex; justify-content: center; align-items: center;
        }
        .settings-sheet {
          background: var(--bg-card); width: 95%; max-width: 900px; height: 600px;
          display: flex; border-radius: 20px; overflow: hidden; border: 1px solid var(--border);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); animation: slideUpSpring 0.4s ease-out;
          position: relative;
        }
        .settings-sidebar {
          width: 240px; background: var(--bg-main); border-right: 1px solid var(--border);
          padding: 24px 16px; display: flex; flex-direction: column; gap: 8px;
        }
        .settings-content { flex: 1; padding: 32px; overflow-y: auto; background: var(--bg-card); position: relative; }
        .theme-card {
          background: var(--bg-main); border: 1px solid var(--border); border-radius: 12px;
          padding: 16px; cursor: pointer; display: flex; flex-direction: column; gap: 12px; transition: all 0.2s;
        }
        .theme-card.active { border-color: #0284c7; background: rgba(2, 132, 199, 0.05); }
        @keyframes slideUpSpring { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (max-width: 768px) {
          .settings-sheet { flex-direction: column; height: 90vh; }
          .settings-sidebar { width: 100%; height: auto; display: flex; flex-direction: row; overflow-x: auto; padding: 12px; }
        }
      `}</style>

      <div className="settings-backdrop" onClick={onClose}>
        <div className="settings-sheet" onClick={e => e.stopPropagation()}>
          
          <div className="settings-sidebar">
            <h2 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-main)', padding: '0 16px 16px 16px', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Settings</h2>
            <button style={tabButtonStyle('appearance')} onClick={() => setActiveTab('appearance')}><Palette size={18}/> Appearance</button>
            <button style={tabButtonStyle('security')} onClick={() => setActiveTab('security')}><ShieldCheck size={18}/> Security</button>
            <button style={tabButtonStyle('activity')} onClick={() => setActiveTab('activity')}><History size={18}/> Audit Trail</button>
          </div>

          <div className="settings-content">
            <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: '20px', right: '24px', zIndex: 10 }}>
                <button onClick={onClose} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16}/></button>
            </div>

            {activeTab === 'appearance' && (
              <div className="fade-in">
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '18px', fontWeight: '800' }}>Platform Theme</h3>
                <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', lineHeight: 1.4 }}>Select your preferred visual style for the dashboard.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                  {themeOptions.map((opt) => (
                    <div key={opt.id} onClick={() => setTheme(opt.id)} className={`theme-card ${theme === opt.id ? 'active' : ''}`}>
                      <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                      <span style={{ fontWeight: '800', fontSize: '13px', color: theme === opt.id ? '#0284c7' : 'var(--text-main)' }}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && <SettingsSecurity />}
            
            {activeTab === 'activity' && (
                <div className="fade-in">
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '18px', fontWeight: '800' }}>Audit Trail</h3>
                    <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>Review recent system changes and user actions.</p>
                    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-main)' }}>
                        <ActivityFeed />
                    </div>
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
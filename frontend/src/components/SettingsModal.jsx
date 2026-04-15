import React, { useState, useEffect } from 'react';

const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [theme, setTheme] = useState(localStorage.getItem('vb-theme') || 'light');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    { id: 'light', icon: '☀️', label: 'Light Theme' },
    { id: 'slate', icon: '🌙', label: 'Slate Dark' },
    { id: 'midnight', icon: '🌌', label: 'Obsidian Black' },
    { id: 'forest', icon: '🌲', label: 'Forest Green' }
  ];

  const currentTheme = themeOptions.find(t => t.id === theme);

  // --- Styles ---
  const tabStyle = (tabId) => ({
    padding: '12px 20px',
    background: activeTab === tabId ? 'rgba(2, 132, 199, 0.1)' : 'transparent',
    color: activeTab === tabId ? '#0284c7' : 'var(--text-muted)',
    border: 'none',
    borderBottom: activeTab === tabId ? '3px solid #0284c7' : '3px solid transparent',
    fontWeight: activeTab === tabId ? '900' : '700',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none',
    whiteSpace: 'nowrap'
  });

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999999, backdropFilter: 'blur(8px)', padding: '20px' }}>
      <div style={{ background: "var(--bg-main)", borderRadius: "16px", width: "100%", maxWidth: "600px", boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '2.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '2.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'var(--bg-main)', border: '2.5px solid var(--border)', color: 'var(--text-main)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✕</button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '2.5px solid var(--border)', background: 'var(--bg-card)', overflowX: 'auto', padding: '0 12px' }}>
          <button style={tabStyle('appearance')} onClick={() => setActiveTab('appearance')}>✨ Appearance</button>
          <button style={tabStyle('profile')} onClick={() => setActiveTab('profile')}>👤 Profile</button>
          <button style={tabStyle('security')} onClick={() => setActiveTab('security')}>🛡️ Security</button>
        </div>

        {/* Content Area */}
        <div style={{ padding: '32px', overflowY: 'auto' }}>
          
          {activeTab === 'appearance' && (
            <div className="fade-in">
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '18px', fontWeight: '900' }}>Platform Theme</h3>
              <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Customize the visual appearance of your dashboard.</p>
              
              {/* Premium Custom Dropdown */}
              <div style={{ position: 'relative', maxWidth: '300px' }}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '2.5px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)', outline: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{currentTheme?.icon}</span> {currentTheme?.label}
                  </span>
                  <span style={{ fontSize: '12px', opacity: 0.6, transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                </button>

                {isDropdownOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'var(--bg-card)', border: '2.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10 }}>
                    {themeOptions.map((opt) => (
                      <div 
                        key={opt.id}
                        onClick={() => { setTheme(opt.id); setIsDropdownOpen(false); }}
                        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', color: theme === opt.id ? '#0284c7' : 'var(--text-main)', background: theme === opt.id ? 'rgba(2, 132, 199, 0.05)' : 'transparent', fontWeight: theme === opt.id ? '900' : '700', fontSize: '15px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      >
                        <span style={{ fontSize: '18px' }}>{opt.icon}</span> {opt.label}
                        {theme === opt.id && <span style={{ marginLeft: 'auto' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="fade-in">
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '18px', fontWeight: '900' }}>Account Details</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Future home for your profile and notification settings.</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="fade-in">
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '18px', fontWeight: '900' }}>Security Preferences</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Future home for password resets and 2FA settings.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
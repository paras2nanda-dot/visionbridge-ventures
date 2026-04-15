import React, { useState, useEffect } from 'react';

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState(localStorage.getItem('vb-theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('vb-theme', theme);

    const themes = {
      light: { 
        main: '#f8fafc', 
        card: '#ffffff', 
        text: '#0f172a', 
        textMuted: '#64748b', 
        border: '#e2e8f0', 
        sidebar: '#1e293b' 
      },
      slate: { 
        main: '#0f172a', 
        card: '#1e293b', 
        text: '#f8fafc', 
        textMuted: '#94a3b8', 
        border: '#334155', 
        sidebar: '#020617' 
      },
      midnight: { 
        main: '#000000',      // 🌌 True Black
        card: '#0d0d0d',      // 🌑 Slightly elevated card surface
        text: '#ffffff',      // ⚪ Pure White
        textMuted: '#a1a1aa', // 🩶 Brighter Muted Text
        border: '#3f3f46',    // 🔲 High-visibility Zinc Border
        sidebar: '#000000' 
      },
      forest: { 
        main: '#022c22', 
        card: '#064e3b', 
        text: '#ecfdf5', 
        textMuted: '#a7f3d0', 
        border: '#065f46', 
        sidebar: '#022c22' 
      }
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
      {themeOptions.map((opt) => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px 8px',
              background: isActive ? 'rgba(2, 132, 199, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: isActive ? '#38bdf8' : '#94a3b8',
              border: `2px solid ${isActive ? '#0284c7' : 'rgba(255, 255, 255, 0.05)'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: isActive ? '900' : '700',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              outline: 'none'
            }}
            title={`Switch to ${opt.label} theme`}
          >
            <span style={{ fontSize: '14px' }}>{opt.icon}</span> {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
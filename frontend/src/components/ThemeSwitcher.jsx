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
        main: '#020617', // Deep Navy/Black
        card: '#0f172a', // Slightly lighter card surface
        text: '#f8fafc', // Crisp white text
        textMuted: '#94a3b8', 
        border: '#1e293b', // Visible border
        sidebar: '#000000' 
      },
      forest: { 
        main: '#052e16', 
        card: '#14532d', 
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

  return (
    <div style={{ position: 'relative' }}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        style={{
          padding: '10px 30px 10px 14px',
          borderRadius: '10px',
          background: 'var(--bg-card, #fff)',
          color: 'var(--text-main, #0f172a)',
          border: '1px solid var(--border, #cbd5e1)',
          cursor: 'pointer',
          fontWeight: '700',
          fontSize: '13px',
          outline: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          transition: 'all 0.2s',
          appearance: 'none',
        }}
      >
        <option value="light">☀️ Light Mode</option>
        <option value="slate">🌙 Slate</option>
        <option value="midnight">🌌 Midnight</option>
        <option value="forest">🌲 Forest</option>
      </select>
      <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px', color: 'var(--text-muted)' }}>▼</div>
    </div>
  );
};

export default ThemeSwitcher;
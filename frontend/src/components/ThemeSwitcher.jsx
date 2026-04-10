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

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          border: '2px solid var(--border)', // Thicker border for dropdown
          cursor: 'pointer',
          fontWeight: '700',
          fontSize: '12px',
          outline: 'none',
          appearance: 'none',
          transition: 'all 0.2s'
        }}
      >
        <option value="light">☀️ Light</option>
        <option value="slate">🌙 Slate</option>
        <option value="midnight">🌌 Obsidian</option>
        <option value="forest">🌲 Forest</option>
      </select>
      <div style={{ 
        position: 'absolute', 
        right: '12px', 
        top: '50%', 
        transform: 'translateY(-50%)', 
        pointerEvents: 'none', 
        fontSize: '10px', 
        color: 'var(--text-muted)' 
      }}>▼</div>
    </div>
  );
};

export default ThemeSwitcher;
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css"; 

// 📂 Core Components
import Layout from "./components/Layout";

// 📂 Page Components
import Dashboard from "./pages/Dashboard/Dashboard"; 
import Charts from "./pages/Charts/Charts"; 
import ClientsDatabase from "./pages/Clients";
import MFSchemes from "./pages/MFSchemes";
import Transactions from "./pages/Transactions";
import Sips from "./pages/Sips";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem("username");
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem("username");
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const location = useLocation();

  // 🔊 THE BUILT-IN "POP" SYNTHESIZER
  useEffect(() => {
    const playPop = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        const osc = context.createOscillator();
        const gain = context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(context.destination);

        osc.start();
        osc.stop(context.currentTime + 0.1);
      } catch (e) {}
    };

    const handleInteraction = (e) => {
      const target = e.target.closest('button, a, select, .sidebar-link, [role="button"], input[type="submit"]');
      if (target) playPop();
    };

    window.addEventListener('pointerdown', handleInteraction);
    return () => window.removeEventListener('pointerdown', handleInteraction);
  }, []);

  // 🌌 THEME ENGINE
  useEffect(() => {
    const isLoginPage = location.pathname === '/login';
    const savedTheme = isLoginPage ? 'light' : (localStorage.getItem('vb-theme') || 'midnight');
    
    const root = document.documentElement;
    const themes = {
      midnight: { main: '#000000', card: '#0d0d0d', text: '#ffffff', muted: '#a1a1aa', border: '#3f3f46', icon: 'invert(1)' },
      light: { main: '#f8fafc', card: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', icon: 'none' }
    };

    const active = themes[savedTheme] || themes.midnight;

    root.style.setProperty('--bg-main', active.main);
    root.style.setProperty('--bg-card', active.card);
    root.style.setProperty('--text-main', active.text);
    root.style.setProperty('--text-muted', active.muted);
    root.style.setProperty('--border', active.border);
    root.style.setProperty('--icon-filter', active.icon);
    
    document.body.style.backgroundColor = active.main;
    document.body.style.color = active.text;
  }, [location.pathname]);

  return (
    /* 📱 MOBILE FIX: Added overflow-x: hidden to prevent sideways wobble on phones */
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', transition: 'background 0.3s ease', overflowX: 'hidden' }}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" style={{ zIndex: 99999 }} />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/clients" element={<ClientsDatabase />} />
          <Route path="/schemes" element={<MFSchemes />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/sips" element={<Sips />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
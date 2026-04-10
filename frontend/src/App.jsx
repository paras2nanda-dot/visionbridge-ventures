import React, { useEffect, useMemo } from "react";
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

  // 🔊 AUDIO ENGINE logic
  useEffect(() => {
    // Using a subtle, high-quality UI "pop" sound
    const clickSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
    clickSound.volume = 0.15; // Keep it professional and low

    const handleGlobalClick = (e) => {
      // Find if the click was on a button, link, or tab item
      const isInteractable = e.target.closest('button, a, [role="button"], .sidebar-item');
      
      if (isInteractable) {
        clickSound.currentTime = 0; // Reset to start if clicked rapidly
        clickSound.play().catch(() => {
          // Browsers block audio until first interaction; 
          // this catch prevents console errors on the very first click
        });
      }
    };

    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  // 🌌 THEME ENGINE logic
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
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', transition: 'background 0.3s ease' }}>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        theme="colored"
        style={{ zIndex: 99999 }} 
      />

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
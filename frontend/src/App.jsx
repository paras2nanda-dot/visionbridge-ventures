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

/**
 * 🛡️ 1. PROTECTED ROUTE
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem("username");
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/**
 * 🛡️ 2. PUBLIC ROUTE
 */
const PublicRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem("username");
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const location = useLocation();

  // 🌌 THE GLOBAL FIX: Initialize Theme Variables on Load
  useEffect(() => {
    const savedTheme = localStorage.getItem('vb-theme') || 'midnight';
    const root = document.documentElement;

    // We force these "Obsidian" values immediately so the Login page isn't white
    const themes = {
      midnight: { main: '#000000', card: '#0a0a0a', text: '#ffffff', muted: '#a1a1aa', border: '#262626' },
      light: { main: '#f8fafc', card: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0' }
    };

    const active = savedTheme === 'light' ? themes.light : themes.midnight;

    root.style.setProperty('--bg-main', active.main);
    root.style.setProperty('--bg-card', active.card);
    root.style.setProperty('--text-main', active.text);
    root.style.setProperty('--text-muted', active.muted);
    root.style.setProperty('--border', active.border);
    
    // Specifically force body background for Android/Mobile browsers
    document.body.style.backgroundColor = active.main;
  }, []);

  // Fix for Android viewport height and scroll behavior
  useEffect(() => {
    if (location.pathname === '/login') {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    }
  }, [location]);

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh' }}>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{ zIndex: 99999 }} 
      />

      <Routes>
        {/* 🔐 LOGIN ROUTE */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />

        {/* 🏠 MAIN APP */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
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
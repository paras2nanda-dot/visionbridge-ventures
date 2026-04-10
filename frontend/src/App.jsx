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

  // 🌌 THE THEME ENGINE: Conditional logic for Login vs Dashboard
  useEffect(() => {
    const isLoginPage = location.pathname === '/login';
    // If it's the login page, we ALWAYS want light/professional. 
    // Otherwise, we use the user's saved preference (defaulting to midnight).
    const savedTheme = isLoginPage ? 'light' : (localStorage.getItem('vb-theme') || 'midnight');
    
    const root = document.documentElement;
    const themes = {
      midnight: { main: '#000000', card: '#0d0d0d', text: '#ffffff', muted: '#a1a1aa', border: '#3f3f46' },
      light: { main: '#f8fafc', card: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0' }
    };

    const active = themes[savedTheme] || themes.midnight;

    root.style.setProperty('--bg-main', active.main);
    root.style.setProperty('--bg-card', active.card);
    root.style.setProperty('--text-main', active.text);
    root.style.setProperty('--text-muted', active.muted);
    root.style.setProperty('--border', active.border);
    
    document.body.style.backgroundColor = active.main;
    document.body.style.color = active.text;
  }, [location.pathname]); // Re-run whenever the page changes

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', transition: 'background 0.3s ease' }}>
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
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />

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
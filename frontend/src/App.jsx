import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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
 * Purpose: Blocks guests from entering the app.
 * If no token exists, redirects to /login.
 */
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/**
 * 🛡️ 2. PUBLIC ROUTE
 * Purpose: Prevents logged-in users from going back to the Login page.
 * If a token exists, redirects them straight to /dashboard.
 */
const PublicRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      {/* 🔐 LOGIN ROUTE - Now wrapped in PublicRoute to prevent reverse-navigation */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />

      {/* 🏠 MAIN APP - Wrapped in ProtectedRoute */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Redirect base URL to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Legacy redirects for sub-dashboards */}
        <Route path="/dashboard/business" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard/client" element={<Navigate to="/dashboard" replace />} />
        
        {/* Actual Pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/charts" element={<Charts />} />
        <Route path="/clients" element={<ClientsDatabase />} />
        <Route path="/schemes" element={<MFSchemes />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/sips" element={<Sips />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      {/* 🚫 404 PAGE */}
      <Route path="*" element={
        <div style={{ padding: '100px', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>
          404 - PAGE NOT FOUND
        </div>
      } />
    </Routes>
  );
}

export default App;
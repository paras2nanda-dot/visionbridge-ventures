import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify"; // 💡 Added this
import "react-toastify/dist/ReactToastify.css"; // 💡 Added the styles

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
  return (
    <>
      {/* 💡 The ToastContainer lives here so it can show messages over any page */}
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

        <Route path="*" element={
          <div style={{ padding: '100px', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>
            404 - PAGE NOT FOUND
          </div>
        } />
      </Routes>
    </>
  );
}

export default App;
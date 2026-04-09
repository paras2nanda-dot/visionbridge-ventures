import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [showReset, setShowReset] = useState(false);
  const [resetUser, setResetUser] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState(""); 
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    // 🛠️ Normalization: Trim spaces and make lowercase
    const cleanUsername = username.trim().toLowerCase();
    console.log("🚀 Attempting login for normalized user:", cleanUsername);

    try {
      const res = await api.post("/auth/login", { 
        username: cleanUsername, 
        password 
      });

      const data = res.data; 
      sessionStorage.setItem("token", data.token); 
      sessionStorage.setItem("username", data.user?.full_name || cleanUsername); 
      
      navigate("/dashboard");
    } catch (err) {
      console.error("🔥 Login Error:", err);
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      setError(err.code === "ERR_NETWORK" ? "Network Error: Backend unreachable." : (serverMessage || "Invalid credentials"));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage("⌛ Processing reset...");
    
    // 🛠️ Normalization: Trim and lowercase reset username
    const cleanResetUser = resetUser.trim().toLowerCase();

    try {
      await api.post("/auth/reset-password", { 
        username: cleanResetUser, 
        securityAnswer, 
        newPassword 
      });

      setResetMessage("✅ Password updated successfully!");
      setTimeout(() => {
        setShowReset(false);
        setResetMessage("");
      }, 2500);
    } catch (err) {
      const msg = err.response?.data?.error || "Reset failed";
      setResetMessage(`❌ ${msg}`);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.leftPanel}>
        <div style={styles.overlay}></div>
        <div style={styles.leftContent}>
          <div style={styles.tagline}>VISIONBRIDGE VENTURES</div>
          <h1 style={styles.mainHeading}>Smart Investing, <br />Brighter Future.</h1>
          <p style={styles.description}>
            Manage portfolios and visualize wealth growth with India's most intuitive platform.
          </p>
          <div style={styles.features}>
            <div style={styles.featureItem}>✔ Automated SIP Tracking</div>
            <div style={styles.featureItem}>✔ Real-time Portfolio Analytics</div>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.loginFormContainer}>
          <div style={styles.logoContainer}>
             <img src="/logo.jpeg" alt="Logo" style={styles.logoImage} onError={(e) => { e.target.src = "https://via.placeholder.com/241?text=VBV"; }} />
          </div>

          <h2 style={styles.formTitle}>Welcome Back</h2>
          <p style={styles.formSubtitle}>Enter your details to manage your practice.</p>

          <form onSubmit={handleLogin} style={{width: '100%'}}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              placeholder="e.g. admin_user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                style={styles.passwordInput}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>

            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" style={styles.loginBtn}>Sign In</button>
          </form>

          <p style={styles.forgot} onClick={() => setShowReset(true)}>
            Forgot password? <span style={styles.resetLink}>Recover Access</span>
          </p>
        </div>
      </div>

      {showReset && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{marginTop: 0}}>Reset Password</h3>
            <p style={{fontSize: '12px', color: '#64748b'}}><strong>Security:</strong> What is your birth city?</p>
            <form onSubmit={handleResetPassword}>
              <input style={styles.input} placeholder="Username" value={resetUser} onChange={(e) => setResetUser(e.target.value)} required />
              <input style={styles.input} placeholder="Security Answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required />
              <input style={styles.input} type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              {resetMessage && <p style={{ fontSize: '13px', color: resetMessage.includes('❌') ? '#ef4444' : '#10b981' }}>{resetMessage}</p>}
              <button type="submit" style={styles.loginBtn}>Reset</button>
              <button type="button" style={styles.cancelBtn} onClick={() => setShowReset(false)}>Back</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageWrapper: { height: "100vh", display: "flex", overflow: "hidden", fontFamily: "'Inter', sans-serif" },
  leftPanel: { flex: 1.2, position: 'relative', backgroundImage: `url('https://pixabay.com/images/download/nattanan23-money-2724241_1920.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', padding: '60px' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.7) 100%)' },
  leftContent: { position: 'relative', zIndex: 2, color: '#fff', maxWidth: '520px' },
  tagline: { fontSize: '13px', fontWeight: '800', letterSpacing: '2px', color: '#10b981', marginBottom: '20px' },
  mainHeading: { fontSize: '48px', fontWeight: '900', lineHeight: '1.2', marginBottom: '20px' },
  description: { fontSize: '18px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '40px' },
  features: { display: 'flex', flexDirection: 'column', gap: '15px' },
  featureItem: { background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' },
  rightPanel: { flex: 1, background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', overflowY: 'auto' },
  loginFormContainer: { width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }, 
  logoContainer: { display: 'flex', alignItems: 'center', marginBottom: '50px', width: '100%', justifyContent: 'center' },
  logoImage: { width: '241.5px', height: 'auto', borderRadius: '18px', objectFit: 'contain', border: '1px solid #e2e8f0', boxShadow: '0 8px 15px -3px rgba(0, 0, 0, 0.1)' },
  formTitle: { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' },
  formSubtitle: { color: '#64748b', marginBottom: '35px', textAlign: 'center', fontSize: '15px', lineHeight: '1.5' },
  label: { width: '100%', textAlign: 'left', display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' },
  input: { width: "100%", padding: "14px", marginBottom: "20px", borderRadius: "10px", border: "1.5px solid #e2e8f0", outline: "none", fontSize: '15px', transition: 'border 0.3s' },
  passwordContainer: { position: "relative", width: "100%", marginBottom: "35px" },
  passwordInput: { width: "100%", padding: "14px", borderRadius: "10px", border: "1.5px solid #e2e8f0", outline: "none", fontSize: '15px' },
  eyeIcon: { position: "absolute", right: "15px", top: "15px", cursor: "pointer", fontSize: "18px" },
  loginBtn: { width: "100%", padding: "16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "800", fontSize: '16px', boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)', transition: 'all 0.2s' },
  cancelBtn: { width: "100%", padding: "14px", background: "none", color: "#64748b", border: "none", cursor: "pointer", fontWeight: "700", marginTop: "10px", textDecoration: 'underline' },
  forgot: { marginTop: "30px", fontSize: "14px", color: "#64748b", cursor: "pointer" },
  resetLink: { color: "#2563eb", fontWeight: '800' },
  error: { color: "#ef4444", fontSize: "13px", marginBottom: "15px", textAlign: "center", fontWeight: '600' },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: 'blur(5px)' },
  modalCard: { background: "#fff", padding: "40px", borderRadius: "24px", width: "380px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }
};
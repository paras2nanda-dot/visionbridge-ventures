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
    const cleanUsername = username.trim().toLowerCase();

    try {
      const res = await api.post("/auth/login", { username: cleanUsername, password });
      sessionStorage.setItem("username", res.data.user?.full_name || cleanUsername); 
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid username or password");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage("⌛ Processing reset...");
    const cleanResetUser = resetUser.trim().toLowerCase();

    try {
      await api.post("/auth/reset-password", { username: cleanResetUser, securityAnswer, newPassword });
      setResetMessage("✅ Password updated!");
      setTimeout(() => setShowReset(false), 2000);
    } catch (err) {
      setResetMessage(`❌ ${err.response?.data?.error || "Reset failed"}`);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.leftPanel}>
        <div style={styles.overlay}></div>
        <div style={styles.leftContent}>
          <div style={styles.tagline}>VISIONBRIDGE VENTURES</div>
          <h1 style={styles.mainHeading}>Smart Investing, <br />Brighter Future.</h1>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.loginFormContainer}>
          <div style={styles.logoContainer}>
             <img src="/logo.jpeg" alt="Logo" style={styles.logoImage} onError={(e) => { e.target.src = "https://via.placeholder.com/241?text=VBV"; }} />
          </div>
          <h2 style={styles.formTitle}>Welcome Back</h2>
          <form onSubmit={handleLogin} style={{width: '100%'}}>
            <label style={styles.label}>Username</label>
            <input style={styles.input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input type={showPassword ? "text" : "password"} style={styles.passwordInput} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <span style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</span>
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" style={styles.loginBtn}>Sign In</button>
          </form>
          <p style={styles.forgot} onClick={() => setShowReset(true)}>Forgot password? <span style={styles.resetLink}>Recover</span></p>
        </div>
      </div>

      {showReset && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3>Reset Password</h3>
            <form onSubmit={handleResetPassword}>
              <input style={styles.input} placeholder="Username" value={resetUser} onChange={(e) => setResetUser(e.target.value)} required />
              <input style={styles.input} placeholder="Security Answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required />
              <input style={styles.input} type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              {resetMessage && <p style={{ color: resetMessage.includes('❌') ? '#ef4444' : '#10b981' }}>{resetMessage}</p>}
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
  rightPanel: { flex: 1, background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' },
  loginFormContainer: { width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoImage: { width: '241.5px', height: 'auto', borderRadius: '18px', objectFit: 'contain' },
  formTitle: { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '20px 0' },
  label: { width: '100%', textAlign: 'left', display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' },
  input: { width: "100%", padding: "14px", marginBottom: "20px", borderRadius: "10px", border: "1.5px solid #e2e8f0" },
  passwordContainer: { position: "relative", width: "100%", marginBottom: "35px" },
  passwordInput: { width: "100%", padding: "14px", borderRadius: "10px", border: "1.5px solid #e2e8f0" },
  eyeIcon: { position: "absolute", right: "15px", top: "15px", cursor: "pointer" },
  loginBtn: { width: "100%", padding: "16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "800" },
  cancelBtn: { width: "100%", padding: "14px", background: "none", color: "#64748b", border: "none", cursor: "pointer", marginTop: "10px" },
  forgot: { marginTop: "30px", fontSize: "14px", color: "#64748b", cursor: "pointer" },
  resetLink: { color: "#2563eb", fontWeight: '800' },
  error: { color: "#ef4444", fontSize: "13px", marginBottom: "15px", textAlign: "center" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: 'blur(5px)' },
  modalCard: { background: "#fff", padding: "40px", borderRadius: "24px", width: "380px" }
};
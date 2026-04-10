import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); 

  const [showReset, setShowReset] = useState(false);
  const [resetUser, setResetUser] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState(""); 
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true); 
    const cleanUsername = username.trim().toLowerCase();

    try {
      const res = await api.post("/auth/login", { username: cleanUsername, password });
      
      sessionStorage.setItem("username", res.data.user?.full_name || cleanUsername); 
      sessionStorage.setItem("token", res.data.token); 
      
      toast.success(`Welcome back, ${res.data.user?.full_name || 'Advisor'}!`);
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Invalid username or password";
      toast.error(errorMsg);
    } finally {
      setIsLoggingIn(false); 
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsResetting(true);
    const cleanResetUser = resetUser.trim().toLowerCase();

    try {
      await api.post("/auth/reset-password", { username: cleanResetUser, securityAnswer, newPassword });
      toast.success("✅ Password updated successfully!");
      setTimeout(() => setShowReset(false), 2000);
    } catch (err) {
      toast.error(`❌ ${err.response?.data?.error || "Reset failed"}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={styles.pageWrapper} className="login-page-container">
      {/* 🖼️ LEFT PANEL (Visible on Desktop) */}
      <div style={styles.leftPanel} className="login-left-panel">
        <div style={styles.overlay}></div>
        <div style={styles.leftContent}>
          <div style={styles.tagline}>VISIONBRIDGE VENTURES</div>
          <h1 style={styles.mainHeading}>Smart Investing, <br />Brighter Future.</h1>
        </div>
      </div>

      {/* 📝 RIGHT PANEL (White on Desktop, Black on Mobile) */}
      <div style={styles.rightPanel} className="login-right-panel">
        <div style={styles.loginFormContainer} className="login-form-container">
          <div style={styles.logoContainer}>
             <img src="/logo.jpeg" alt="Logo" style={styles.logoImage} />
          </div>
          <h2 style={styles.formTitle} className="login-form-title">Welcome Back</h2>
          <form onSubmit={handleLogin} style={{width: '100%'}}>
            <label style={styles.label} className="login-label">Username</label>
            <input 
              style={styles.input} 
              className="login-input" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
            <label style={styles.label} className="login-label">Password</label>
            <div style={styles.passwordContainer}>
              <input 
                type={showPassword ? "text" : "password"} 
                style={styles.passwordInput} 
                className="login-input" 
                placeholder="Password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <span style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</span>
            </div>
            
            <button type="submit" style={styles.loginBtn} disabled={isLoggingIn}>
              {isLoggingIn ? (
                <div style={styles.loaderContainer}>
                   <div className="login-spinner"></div> SYNCING...
                </div>
              ) : "Sign In"}
            </button>
          </form>
          <p style={styles.forgot} className="login-forgot-text" onClick={() => setShowReset(true)}>Forgot password? <span style={styles.resetLink}>Recover</span></p>
        </div>
      </div>

      {showReset && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="modal-card">
            <h3 className="modal-title">Reset Password</h3>
            <form onSubmit={handleResetPassword}>
              <input style={styles.input} className="login-input" placeholder="Username" value={resetUser} onChange={(e) => setResetUser(e.target.value)} required />
              <input style={styles.input} className="login-input" placeholder="Security Answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required />
              <input style={styles.input} className="login-input" type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <button type="submit" style={styles.loginBtn} disabled={isResetting}>
                {isResetting ? "UPDATING..." : "Reset"}
              </button>
              <button type="button" style={styles.cancelBtn} className="modal-cancel-btn" onClick={() => setShowReset(false)}>Back</button>
            </form>
          </div>
        </div>
      )}

      {/* 📱 MOBILE OVERRIDES: Re-applying the dark compact look ONLY for mobile */}
      <style>{`
        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid #fff;
          border-radius: 50%;
          animation: spin-login 0.8s linear infinite;
        }
        @keyframes spin-login { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        @media (max-width: 850px) {
          .login-page-container { background: #000 !important; }
          .login-left-panel { display: none !important; }
          .login-right-panel { 
            background: #000 !important; 
            width: 100% !important; 
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 20px !important;
          }
          .login-form-container { max-width: 100% !important; padding: 0 !important; }
          .login-form-title { color: #ffffff !important; }
          .login-label { color: #a1a1aa !important; }
          .login-input { 
            background: #0a0a0a !important; 
            color: #ffffff !important; 
            border: 1px solid #262626 !important; 
          }
          .login-forgot-text { color: #a1a1aa !important; }
          .modal-card { background: #0a0a0a !important; border: 1px solid #262626 !important; width: 90% !important; }
          .modal-title { color: #fff !important; }
          .modal-cancel-btn { color: #a1a1aa !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: { height: "100vh", display: "flex", overflow: "hidden", fontFamily: "'Inter', sans-serif", background: "#fff" },
  leftPanel: { flex: 1.2, position: 'relative', backgroundImage: `url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', padding: '60px' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.7) 100%)' },
  leftContent: { position: 'relative', zIndex: 2, color: '#fff', maxWidth: '520px' },
  tagline: { fontSize: '13px', fontWeight: '800', letterSpacing: '2px', color: '#10b981', marginBottom: '20px' },
  mainHeading: { fontSize: '48px', fontWeight: '900', lineHeight: '1.2', marginBottom: '20px' },
  rightPanel: { flex: 1, background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' },
  loginFormContainer: { width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoContainer: { marginBottom: '15px' },
  logoImage: { width: '220px', height: 'auto', borderRadius: '15px', objectFit: 'contain' },
  formTitle: { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '15px 0 25px 0' },
  label: { width: '100%', textAlign: 'left', display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' },
  input: { width: "100%", padding: "14px", marginBottom: "20px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: '16px' },
  passwordContainer: { position: "relative", width: "100%", marginBottom: "30px" },
  passwordInput: { width: "100%", padding: "14px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: '16px' },
  eyeIcon: { position: "absolute", right: "15px", top: "15px", cursor: "pointer", fontSize: '18px' },
  loginBtn: { width: "100%", padding: "16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "800", display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', fontSize: '16px' },
  loaderContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
  cancelBtn: { width: "100%", padding: "14px", background: "none", color: "#64748b", border: "none", cursor: "pointer", marginTop: "10px", fontWeight: '700' },
  forgot: { marginTop: "20px", fontSize: "14px", color: "#64748b", cursor: "pointer" },
  resetLink: { color: "#2563eb", fontWeight: '800' },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: 'blur(5px)' },
  modalCard: { background: "#fff", padding: "40px", borderRadius: "24px", width: "400px" }
};
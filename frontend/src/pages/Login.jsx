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
      {/* 🖼️ LEFT PANEL: HERO */}
      <div style={styles.leftPanel} className="login-left-panel">
        <div style={styles.overlay}></div>
        <div style={styles.leftContent}>
          <div style={styles.tagline} className="login-hero-tagline">VISIONBRIDGE VENTURES</div>
          <h1 style={styles.mainHeading} className="login-hero-heading">Smart Investing, <br />Brighter Future.</h1>
        </div>
      </div>

      {/* 📝 RIGHT PANEL: LOGIN FORM */}
      <div style={styles.rightPanel} className="login-right-panel">
        <div style={styles.loginFormContainer} className="login-form-container">
          <div style={styles.logoContainer}>
             <img src="/logo.jpeg" alt="Logo" style={styles.logoImage} />
          </div>
          <h2 style={styles.formTitle}>Welcome Back</h2>
          <form onSubmit={handleLogin} style={{width: '100%'}}>
            <label style={styles.label}>Username</label>
            <input 
              style={styles.input} 
              className="login-field" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input 
                type={showPassword ? "text" : "password"} 
                style={styles.passwordInput} 
                className="login-field" 
                placeholder="Password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <span style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</span>
            </div>
            
            <button type="submit" style={styles.loginBtn} disabled={isLoggingIn}>
              {isLoggingIn ? "Authenticating..." : "Sign In"}
            </button>
          </form>
          <p style={styles.forgot} onClick={() => setShowReset(true)}>Forgot password? <span style={styles.resetLink}>Recover</span></p>
        </div>
      </div>

      {showReset && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{color: 'var(--text-main)', marginBottom: '20px', fontWeight: '800'}}>Reset Password</h3>
            <form onSubmit={handleResetPassword}>
              <input style={styles.input} placeholder="Username" value={resetUser} onChange={(e) => setResetUser(e.target.value)} required />
              <input style={styles.input} placeholder="Security Answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required />
              <input style={styles.input} type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <button type="submit" style={styles.loginBtn} disabled={isResetting}>
                {isResetting ? "UPDATING..." : "Reset"}
              </button>
              <button type="button" style={styles.cancelBtn} onClick={() => setShowReset(false)}>Back</button>
            </form>
          </div>
        </div>
      )}

      {/* 📱 CSS Overrides for Hero Text Visibility and Mobile Layout */}
      <style>{`
        /* Force hero text to be high-contrast white */
        .login-hero-heading {
          color: #ffffff !important;
          text-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .login-hero-tagline {
          color: #10b981 !important;
          font-weight: 900 !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        @media (max-width: 850px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { 
            width: 100% !important; 
            flex: none !important; 
            padding: 40px 24px !important; 
            background: var(--bg-card) !important; 
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .login-page-container { background: var(--bg-main) !important; }
          .login-form-container { max-width: 100% !important; padding: 0 !important; }
          .login-field { background: var(--bg-card) !important; color: var(--text-main) !important; border: 1.5px solid var(--border) !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: { height: "100vh", display: "flex", overflow: "hidden", fontFamily: "'Inter', sans-serif", background: "var(--bg-main)" },
  leftPanel: { flex: 1.2, position: 'relative', backgroundImage: `url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', padding: '60px' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 100%)' },
  leftContent: { position: 'relative', zIndex: 2, maxWidth: '520px' },
  tagline: { fontSize: '13px', fontWeight: '800', letterSpacing: '2px', marginBottom: '20px' },
  mainHeading: { fontSize: '54px', fontWeight: '900', lineHeight: '1.1', marginBottom: '20px' },
  rightPanel: { flex: 1, background: 'var(--bg-card)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' },
  loginFormContainer: { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoImage: { width: '220px', height: 'auto', borderRadius: '15px', objectFit: 'contain' },
  formTitle: { fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', margin: '15px 0 30px 0' },
  label: { width: '100%', textAlign: 'left', display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' },
  input: { width: "100%", padding: "14px 16px", marginBottom: "20px", borderRadius: "10px", border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: '16px', outline: 'none' },
  passwordContainer: { position: "relative", width: "100%", marginBottom: "30px" },
  passwordInput: { width: "100%", padding: "14px 16px", borderRadius: "10px", border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: '16px', outline: 'none' },
  eyeIcon: { position: "absolute", right: "15px", top: "50%", transform: 'translateY(-50%)', cursor: "pointer", fontSize: '18px', opacity: 0.6 },
  loginBtn: { width: "100%", padding: "16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "900", transition: 'all 0.2s', fontSize: '16px' },
  cancelBtn: { width: "100%", padding: "14px", background: "none", color: "var(--text-muted)", border: "none", cursor: "pointer", marginTop: "10px", fontWeight: '700' },
  forgot: { marginTop: "30px", fontSize: "14px", color: "var(--text-muted)", cursor: "pointer" },
  resetLink: { color: "#2563eb", fontWeight: '900' },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: 'blur(5px)' },
  modalCard: { background: "var(--bg-card)", padding: "40px", borderRadius: "24px", width: "400px", boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', border: '1px solid var(--border)' }
};
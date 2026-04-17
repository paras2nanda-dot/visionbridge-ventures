import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { Eye, EyeOff, Fingerprint, Loader2 } from 'lucide-react';

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

  // 🔊 Manual Internal Synth Trigger
  const triggerPop = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.1);
    } catch (e) {}
  };

  // ==============================================
  // 🛡️ PASSKEY: REGISTER FINGERPRINT (After Login)
  // ==============================================
  const promptFingerprintRegistration = async (authUsername) => {
    if (!['paras', 'himanshu'].includes(authUsername.toLowerCase())) return;

    const wantsToRegister = window.confirm("Would you like to register this device for Fingerprint/FaceID login?");
    if (!wantsToRegister) return;

    try {
      // 1. Fetch options from backend
      const { data: options } = await api.post('/auth/webauthn/register/generate', { username: authUsername });
      
      // 2. Start browser registration flow
      // startRegistration handles the base64 conversions automatically
      const registrationResponse = await startRegistration(options);
      
      // 3. Send the response back to verify and save
      await api.post('/auth/webauthn/register/verify', {
        username: authUsername,
        data: registrationResponse,
      });

      toast.success("Device registered successfully!");
    } catch (err) {
      console.error("Biometric Registration Error:", err);
      if (err.name !== 'NotAllowedError') {
         toast.error(err.response?.data?.error || "Registration failed. Check console for details.");
      }
    }
  };

  // ==============================================
  // 🛡️ PASSKEY: LOGIN WITH FINGERPRINT
  // ==============================================
  const handleBiometricLogin = async () => {
    const cleanUsername = username.trim().toLowerCase();
    
    if (!cleanUsername) {
      return toast.error("Please enter your username first to use fingerprint login.");
    }

    triggerPop();
    setIsLoggingIn(true);

    try {
      const { data: options } = await api.post('/auth/webauthn/login/generate', { username: cleanUsername });
      const authenticationResponse = await startAuthentication(options);
      const res = await api.post('/auth/webauthn/login/verify', {
        username: cleanUsername,
        data: authenticationResponse
      });

      sessionStorage.setItem("username", res.data.user?.username || cleanUsername); 
      sessionStorage.setItem("token", res.data.token); 
      toast.success(`Welcome back via Biometrics!`);
      navigate("/dashboard");

    } catch (err) {
      console.error("Biometric Login Error:", err);
      toast.error(err.response?.data?.error || "Biometric login failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ==============================================
  // STANDARD LOGIN
  // ==============================================
  const handleLogin = async (e) => {
    e.preventDefault();
    triggerPop(); 
    setIsLoggingIn(true); 

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    try {
      const res = await api.post("/auth/login", { 
        username: cleanUsername, 
        password: cleanPassword 
      });
      
      sessionStorage.setItem("username", res.data.user?.full_name || cleanUsername); 
      sessionStorage.setItem("token", res.data.token); 
      toast.success(`Welcome back, ${res.data.user?.full_name || 'Advisor'}!`);
      
      await promptFingerprintRegistration(cleanUsername);

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
    triggerPop();
    setIsResetting(true);
    const cleanResetUser = resetUser.trim();
    try {
      await api.post("/auth/reset-password", { 
        username: cleanResetUser, 
        securityAnswer: securityAnswer.trim(), 
        newPassword: newPassword.trim() 
      });
      toast.success("Password updated successfully!");
      setTimeout(() => setShowReset(false), 2000);
    } catch (err) {
      toast.error(`${err.response?.data?.error || "Reset failed"}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={styles.pageWrapper} className="login-page-container">
      {/* LEFT PANEL */}
      <div style={styles.leftPanel} className="login-left-panel">
        <div style={styles.overlay}></div>
        <div style={styles.leftContent}>
          <div style={styles.tagline} className="login-hero-tagline">VISIONBRIDGE VENTURES</div>
          <h1 style={styles.mainHeading} className="login-hero-heading">Smart Investing.<br />Brighter Future.</h1>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={styles.rightPanel} className="login-right-panel">
        <div style={styles.loginFormContainer} className="login-form-container">
          
          <div style={styles.logoContainer}>
              <img src="/logo.jpeg" alt="Logo" style={styles.logoImage} />
          </div>
          
          <div style={styles.headerText}>
            <h2 style={styles.formTitle}>Welcome Back</h2>
            <p style={styles.formSubtitle}>Please enter your details to sign in.</p>
          </div>
          
          <form onSubmit={handleLogin} style={{width: '100%'}}>
            <label style={styles.label}>Username</label>
            <input 
                style={styles.input} 
                className="login-field" 
                placeholder="e.g. paras" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                autoCapitalize="none"
                required 
            />
            
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input 
                type={showPassword ? "text" : "password"} 
                style={styles.passwordInput} 
                className="login-field" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <span style={styles.eyeIcon} onClick={() => { triggerPop(); setShowPassword(!showPassword); }}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px', marginBottom: '24px' }}>
              <span style={styles.resetLink} onClick={() => { triggerPop(); setShowReset(true); }}>
                Forgot password?
              </span>
            </div>
            
            <button type="submit" style={styles.loginBtn} disabled={isLoggingIn}>
              {isLoggingIn ? <><Loader2 size={18} className="spin" style={{marginRight: '8px'}} /> AUTHENTICATING...</> : "SIGN IN"}
            </button>
          </form>

          {/* ➖ Sleek Divider */}
          <div style={{ position: 'relative', textAlign: 'center', width: '100%', margin: '24px 0' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid var(--border)', zIndex: 1 }}></div>
            <span style={{ position: 'relative', zIndex: 2, background: 'var(--bg-main)', padding: '0 16px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>OR</span>
          </div>

          {/* 🛡️ BIOMETRIC LOGIN BUTTON */}
          <div style={{ width: '100%' }}>
             <button 
                type="button" 
                onClick={handleBiometricLogin} 
                style={styles.biometricBtn} 
                disabled={isLoggingIn || !username.trim()}
                title="Enter your username first, then click here to login with your fingerprint."
              >
                <Fingerprint size={18} /> Login with Biometrics
             </button>
          </div>
        </div>
      </div>

      {/* RESET PASSWORD MODAL */}
      {showReset && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{color: 'var(--text-main)', marginBottom: '8px', fontWeight: '800', fontSize: '24px', letterSpacing: '-0.3px'}}>Reset Password</h3>
            <p style={{color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px', fontWeight: '500'}}>Enter your details to recover your account.</p>
            
            <form onSubmit={handleResetPassword}>
              <label style={styles.label}>Username</label>
              <input style={styles.input} className="login-field" value={resetUser} onChange={(e) => setResetUser(e.target.value)} required autoCapitalize="none" />
              
              <label style={styles.label}>Security Answer</label>
              <input style={styles.input} className="login-field" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required />
              
              <label style={styles.label}>New Password</label>
              <input style={styles.input} className="login-field" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button type="submit" style={{...styles.loginBtn, flex: 2, marginBottom: 0}} disabled={isResetting}>{isResetting ? "UPDATING..." : "RESET PASSWORD"}</button>
                <button type="button" style={{...styles.biometricBtn, flex: 1, marginTop: 0}} onClick={() => { triggerPop(); setShowReset(false); }}>BACK</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .login-field:focus {
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1) !important;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
        
        @media (max-width: 850px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { width: 100% !important; flex: none !important; padding: 40px 24px !important; background: var(--bg-main) !important; display: flex !important; align-items: center !important; justify-content: center !important; }
          .login-page-container { background: var(--bg-main) !important; }
          .login-form-container { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: { height: "100vh", display: "flex", overflow: "hidden", fontFamily: "'Inter', sans-serif", background: "var(--bg-main)" },
  leftPanel: { flex: 1.2, position: 'relative', backgroundImage: `url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', padding: '60px' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 100%)' },
  leftContent: { position: 'relative', zIndex: 2, maxWidth: '520px' },
  tagline: { color: '#38bdf8', fontSize: '12px', fontWeight: '800', letterSpacing: '4px', marginBottom: '20px', textTransform: 'uppercase' },
  mainHeading: { color: '#ffffff', fontSize: '48px', fontWeight: '900', lineHeight: '1.15', marginBottom: '20px', letterSpacing: '-1px' },
  rightPanel: { flex: 1, background: 'var(--bg-main)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' },
  loginFormContainer: { width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoContainer: { marginBottom: '32px' },
  logoImage: { width: '180px', height: 'auto', borderRadius: '16px', objectFit: 'contain', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  headerText: { width: '100%', textAlign: 'left', marginBottom: '32px' },
  formTitle: { fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  formSubtitle: { fontSize: '15px', color: 'var(--text-muted)', margin: 0, fontWeight: '500' },
  label: { width: '100%', textAlign: 'left', display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: "100%", padding: "14px 16px", marginBottom: "24px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: '15px', fontWeight: '600', outline: 'none', transition: 'all 0.2s ease', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.02)' },
  passwordContainer: { position: "relative", width: "100%", marginBottom: "16px" },
  passwordInput: { width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontSize: '15px', fontWeight: '600', outline: 'none', transition: 'all 0.2s ease', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.02)' },
  eyeIcon: { position: "absolute", right: "16px", top: "50%", transform: 'translateY(-50%)', cursor: "pointer", color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' },
  loginBtn: { width: "100%", padding: "14px", background: "#0284c7", color: "#fff", border: "1px solid transparent", borderRadius: "12px", cursor: "pointer", fontWeight: "800", transition: 'all 0.2s ease', fontSize: '14px', letterSpacing: '0.5px', boxShadow: '0 4px 6px -1px rgba(2,132,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  biometricBtn: { width: "100%", padding: "14px", background: "var(--bg-card)", color: "var(--text-main)", border: "1px solid var(--border)", borderRadius: "12px", cursor: "pointer", fontWeight: "800", transition: 'all 0.2s ease', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', letterSpacing: '0.5px', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.02)', marginTop: '0' },
  resetLink: { color: "#0284c7", fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'opacity 0.2s' },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalCard: { background: "var(--bg-main)", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "420px", boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border)' }
};
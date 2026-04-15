import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

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
    // Only Paras and Himanshu are allowed to register devices
    if (!['paras', 'himanshu'].includes(authUsername.toLowerCase())) return;

    // Ask user if they want to register this device
    const wantsToRegister = window.confirm("Would you like to register this device for Fingerprint/FaceID login?");
    if (!wantsToRegister) return;

    try {
      // 1. Get registration options from our backend
      const { data: options } = await api.post('/auth/webauthn/register/generate', { username: authUsername });

      // 2. Trigger the browser's native biometric prompt
      const registrationResponse = await startRegistration(options);

      // 3. Send the generated public key back to our backend to save it
      await api.post('/auth/webauthn/register/verify', {
        username: authUsername,
        data: registrationResponse,
      });

      toast.success("✅ Device registered! You can now use Fingerprint login.");
    } catch (err) {
      console.error(err);
      if (err.name !== 'NotAllowedError') {
         toast.error("Fingerprint registration failed or was cancelled.");
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
      // 1. Get the authentication challenge from the backend
      const { data: options } = await api.post('/auth/webauthn/login/generate', { username: cleanUsername });

      // 2. Trigger the browser's native biometric prompt
      const authenticationResponse = await startAuthentication(options);

      // 3. Send the signed challenge back to the backend to verify and log in
      const res = await api.post('/auth/webauthn/login/verify', {
        username: cleanUsername,
        data: authenticationResponse
      });

      // 4. Success! Set the session exactly like a normal password login
      sessionStorage.setItem("username", res.data.user?.username || cleanUsername); 
      sessionStorage.setItem("token", res.data.token); 
      toast.success(`Welcome back via Biometrics!`);
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Biometric login failed or was cancelled.");
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
      
      // ✅ Trigger Biometric Registration prompt if they just logged in successfully with a password
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
      {/* LEFT PANEL */}
      <div style={styles.leftPanel} className="login-left-panel">
        <div style={styles.overlay}></div>
        <div style={styles.leftContent}>
          <div style={styles.tagline} className="login-hero-tagline">VISIONBRIDGE VENTURES</div>
          <h1 style={styles.mainHeading} className="login-hero-heading">Smart Investing, <br />Brighter Future.</h1>
        </div>
      </div>

      {/* RIGHT PANEL */}
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
                placeholder="Enter username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                autoCapitalize="none"
                required 
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px', width: '100%' }}>
              <label style={{...styles.label, marginBottom: '0'}}>Password</label>
              <span style={styles.resetLink} onClick={() => { triggerPop(); setShowReset(true); }}>Recover Password</span>
            </div>
            
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
              <span style={styles.eyeIcon} onClick={() => { triggerPop(); setShowPassword(!showPassword); }}>{showPassword ? "🙈" : "👁️"}</span>
            </div>
            
            <button type="submit" style={styles.loginBtn} disabled={isLoggingIn}>
              {isLoggingIn ? "AUTHENTICATING..." : "SIGN IN WITH PASSWORD"}
            </button>
          </form>

          {/* 🛡️ BIOMETRIC LOGIN BUTTON */}
          <div style={{ width: '100%', marginTop: '16px' }}>
             <button 
                type="button" 
                onClick={handleBiometricLogin} 
                style={styles.biometricBtn} 
                disabled={isLoggingIn || !username.trim()}
                title="Enter your username first, then click here to login with your fingerprint."
              >
                <span style={{ fontSize: '18px' }}>👆</span> LOGIN WITH FINGERPRINT
             </button>
          </div>
        </div>
      </div>

      {/* RESET PASSWORD MODAL */}
      {showReset && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{color: 'var(--text-main)', marginBottom: '24px', fontWeight: '900', fontSize: '24px'}}>Reset Password</h3>
            <form onSubmit={handleResetPassword}>
              <label style={styles.label}>Username</label>
              <input style={styles.input} placeholder="Enter username" value={resetUser} onChange={(e) => setResetUser(e.target.value)} required autoCapitalize="none" />
              
              <label style={styles.label}>Security Answer</label>
              <input style={styles.input} placeholder="Enter your answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required />
              
              <label style={styles.label}>New Password</label>
              <input style={styles.input} type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" style={{...styles.loginBtn, flex: 2}} disabled={isResetting}>{isResetting ? "UPDATING..." : "RESET PASSWORD"}</button>
                <button type="button" style={{...styles.biometricBtn, flex: 1, marginTop: 0}} onClick={() => { triggerPop(); setShowReset(false); }}>BACK</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .login-hero-heading { color: #ffffff !important; text-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        .login-hero-tagline { color: #10b981 !important; font-weight: 900 !important; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
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
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%)' },
  leftContent: { position: 'relative', zIndex: 2, maxWidth: '520px' },
  tagline: { fontSize: '14px', fontWeight: '900', letterSpacing: '3px', marginBottom: '20px', color: '#10b981' },
  mainHeading: { fontSize: '54px', fontWeight: '900', lineHeight: '1.1', marginBottom: '20px', color: '#fff' },
  rightPanel: { flex: 1, background: 'var(--bg-card)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' },
  loginFormContainer: { width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoImage: { width: '220px', height: 'auto', borderRadius: '15px', objectFit: 'contain', marginBottom: '10px' },
  formTitle: { fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 30px 0', letterSpacing: '-0.5px' },
  label: { width: '100%', textAlign: 'left', display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: "100%", padding: "14px 16px", marginBottom: "20px", borderRadius: "8px", border: "2.5px solid var(--border)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: '15px', fontWeight: '600', outline: 'none', transition: 'all 0.2s ease' },
  passwordContainer: { position: "relative", width: "100%", marginBottom: "24px" },
  passwordInput: { width: "100%", padding: "14px 16px", borderRadius: "8px", border: "2.5px solid var(--border)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: '15px', fontWeight: '600', outline: 'none', transition: 'all 0.2s ease' },
  eyeIcon: { position: "absolute", right: "15px", top: "50%", transform: 'translateY(-50%)', cursor: "pointer", fontSize: '18px', opacity: 0.6 },
  
  /* 💎 Executive Buttons */
  loginBtn: { width: "100%", padding: "16px", background: "#0284c7", color: "#fff", border: "2.5px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "900", transition: 'all 0.2s', fontSize: '14px', letterSpacing: '0.5px', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' },
  biometricBtn: { width: "100%", padding: "16px", background: "var(--bg-card)", color: "var(--text-main)", border: "2.5px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "900", transition: 'all 0.2s', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', letterSpacing: '0.5px', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)', marginTop: '0' },
  
  resetLink: { color: "#0284c7", fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer' },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: 'blur(5px)' },
  modalCard: { background: "var(--bg-card)", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "420px", boxShadow: '8px 8px 0px rgba(0,0,0,0.15)', border: '2.5px solid var(--border)' }
};
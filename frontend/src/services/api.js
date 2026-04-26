import axios from "axios";

/**
 * 🟢 CRIT-05 FIX: EXPORT BASE URL
 * Exporting this allows Reports.jsx and Charts.jsx to reference the same URL
 * without hardcoding "onrender.com" in multiple files.
 */
export const BASE_URL = "https://visionbridge-backend.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // 🛡️ Essential for sending/receiving httpOnly cookies
  timeout: 10000, 
});

/**
 * 🛡️ HIGH-05 FIX: REDUNDANT TOKEN HANDLING
 * The audit recommends relying on httpOnly cookies. 
 * We keep this interceptor for backward compatibility during the transition,
 * but it will eventually be removed once the backend is cookie-exclusive.
 */
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * 🛡️ RESPONSE INTERCEPTOR: Watches for expired sessions
 */
api.interceptors.response.use(
  (response) => response, 
  (error) => {
    const isAuthRoute = 
      error.config?.url?.includes('/auth/login') || 
      error.config?.url?.includes('/auth/webauthn');

    // 🟢 401 Unauthorized means the cookie or token is invalid/expired
    if (error.response && error.response.status === 401 && !isAuthRoute) {
      console.warn("Session expired. Redirecting to login...");
      sessionStorage.clear();
      
      // Prevent redirect loops if already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
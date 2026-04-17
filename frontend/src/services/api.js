import axios from "axios";

const api = axios.create({
  // 🟢 LIVE SERVER (Restored for Production/Deployment)
  baseURL: "https://visionbridge-backend.onrender.com/api",
  
  withCredentials: true, 
  timeout: 10000, 
});

// 💡 REQUEST INTERCEPTOR: Attaches token to outgoing mail
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 🛡️ RESPONSE INTERCEPTOR: Watches for expired sessions
api.interceptors.response.use(
  (response) => response, 
  (error) => {
    // 🟢 IMPROVED: Check both /auth path and status to prevent redirect loops during login
    const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/webauthn');

    if (error.response && error.response.status === 401 && !isAuthRoute) {
      console.warn("Session expired. Redirecting to login...");
      sessionStorage.clear();
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;
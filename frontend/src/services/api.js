import axios from "axios";

const api = axios.create({
  // Ensure there is no trailing slash here
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

// 🛡️ RESPONSE INTERCEPTOR: Watches for expired sessions (401 errors)
api.interceptors.response.use(
  (response) => response, // If the request is successful, do nothing
  (error) => {
    // If the server says 401 (Unauthorized), it means the token is dead
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or unauthorized. Logging out...");
      
      // 1. Clear local storage so ProtectedRoute kicks in
      sessionStorage.clear();
      
      // 2. Force the browser to the login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
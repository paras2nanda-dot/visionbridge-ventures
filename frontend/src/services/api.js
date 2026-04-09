import axios from "axios";

const api = axios.create({
  // 📡 Your live Render backend URL
  baseURL: "https://visionbridge-backend.onrender.com/api",
  
  // 🛡️ CRITICAL: This allows the browser to automatically send the 
  // secure HttpOnly cookie with every request.
  withCredentials: true,
  
  // ⏳ 10 seconds timeout
  timeout: 10000, 
});

/**
 * 💡 NOTE: We removed the Request Interceptor. 
 * Because the token is now an 'HttpOnly' cookie, JavaScript cannot 
 * see it or touch it (which is why it's safer!). 
 * Axios will now include it automatically because of 'withCredentials: true'.
 */

export default api;
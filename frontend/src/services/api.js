import axios from "axios";

const api = axios.create({
  // 🔗 Ensure /api is at the end so it matches your backend routes
  baseURL: "https://visionbridge-backend.onrender.com/api",
  withCredentials: true,
});

// 🛡️ AUTH INTERCEPTOR
// This automatically grabs your token from storage and sends it to the backend
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
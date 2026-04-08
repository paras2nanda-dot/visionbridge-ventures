import axios from "axios";

const api = axios.create({
  baseURL: "https://visionbridge-backend.onrender.com/api",
  withCredentials: true,
  timeout: 10000, // ⏳ 10 seconds before it gives up
});

// 🛡️ AUTH INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
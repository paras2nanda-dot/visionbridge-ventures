import axios from "axios";

const api = axios.create({
  // Ensure there is no trailing slash here
  baseURL: "https://visionbridge-backend.onrender.com/api",
  withCredentials: true, 
  timeout: 10000, 
});

// 💡 THE FIX: Interceptor auto-attaches the token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
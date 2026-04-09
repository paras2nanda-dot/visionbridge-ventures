import axios from "axios";

const api = axios.create({
  baseURL: "https://visionbridge-backend.onrender.com/api",
  withCredentials: true, // Allows HttpOnly cookies
  timeout: 10000, 
});

export default api;
import axios from "axios";

const api = axios.create({
  // Ensure there is no trailing slash here
  baseURL: "https://visionbridge-backend.onrender.com/api",
  withCredentials: true, 
  timeout: 10000, 
});

export default api;
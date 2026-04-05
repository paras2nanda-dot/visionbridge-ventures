import axios from "axios";

const api = axios.create({
  baseURL: "https://visionbridge-backend.onrender.com",
  withCredentials: true,
});

export default api;
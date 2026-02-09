import axios from "axios";

// Use environment variable if available (e.g. for production)
const BASE_URL = //import.meta.env.VITE_API_URL || 
"http://localhost:8000";

// Create an Axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // 🔑 This allows cookies (JWT) to be sent automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — optional, for logging/debugging
api.interceptors.request.use(
  (config) => {
    console.log(`➡️ [${config.method?.toUpperCase()}] ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling auth issues globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized — possible expired token or not logged in.");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

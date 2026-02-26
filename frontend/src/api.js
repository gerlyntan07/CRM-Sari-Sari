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
      const requestUrl = String(error.config?.url || "");

      // 401 on these endpoints is expected during normal flows (e.g., logged out).
      const ignore401For = [
        "/auth/me",
        "/auth/login",
        "/auth/google/login",
        "/auth/logout",
      ];
      const shouldIgnore = ignore401For.some((p) => requestUrl.includes(p));

      const path = window.location?.pathname || "";
      const isAlreadyOnAuthPage =
        path.startsWith("/login") ||
        path.startsWith("/signup") ||
        path.startsWith("/forgot-password");

      console.warn(
        "⚠️ Unauthorized — possible expired token or not logged in.",
        requestUrl
      );

      if (!shouldIgnore && !isAlreadyOnAuthPage) {
        // Clear only auth-related keys (avoid nuking unrelated app state).
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userRole");
        localStorage.removeItem("user_id");

        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;

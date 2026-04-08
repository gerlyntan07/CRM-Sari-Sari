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
    const status = error.response?.status;
    const requestUrl = String(error.config?.url || "");
    const isAuthMeRequest = requestUrl.includes("/auth/me");
    const path = window.location?.pathname || "";
    const isAlreadyOnAuthPage =
      path.startsWith("/login") ||
      path.startsWith("/signup") ||
      path.startsWith("/forgot-password");

    // 401 on these endpoints is expected during normal flows (e.g., logged out).
    const ignore401For = [
      "/auth/me",
      "/auth/login",
      "/auth/google/login",
      "/auth/logout",
    ];
    const shouldIgnore = ignore401For.some((p) => requestUrl.includes(p));

    // Force-logout only for auth failures, not for feature-level 403 responses.
    const shouldForceLogout =
      (status === 401 && !shouldIgnore && !isAlreadyOnAuthPage) ||
      (status === 403 && isAuthMeRequest && !isAlreadyOnAuthPage);

    if (shouldForceLogout) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userRole");
      localStorage.removeItem("user_id");
      // Trigger logout event for app state update
      window.dispatchEvent(new CustomEvent("forceLogout"));
    }
    return Promise.reject(error);
  }
);

export default api;

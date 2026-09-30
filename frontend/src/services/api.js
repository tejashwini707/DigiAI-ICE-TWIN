import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  let token = localStorage.getItem("twin_token");
  if (!token) {
    token = "demo-session-token-hq";
    localStorage.setItem("twin_token", token);
  }
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, clean stale token and allow graceful re-auth
    if (error.response && error.response.status === 401) {
      console.warn("API 401: resetting stale token to demo session token");
      const fallbackToken = "demo-session-token-" + Date.now();
      localStorage.setItem("twin_token", fallbackToken);
    }
    return Promise.reject(error);
  }
);

export default api;


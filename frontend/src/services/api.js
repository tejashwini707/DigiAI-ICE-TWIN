import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  let token = sessionStorage.getItem("twin_token") || localStorage.getItem("twin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 unauthorized, log warning and reject
    if (error.response && error.response.status === 401) {
      console.warn("API 401: Unauthorized access or token expired");
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";
import { useAuthStore, useUIStore } from "../store";

const API_BASE_URL = import.meta.env.PROD ? "/api" : `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_API_PORT}/api`;
console.log("API_BASE_URL: ", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  const { startLoading } = useUIStore.getState();

  if (config.showLoader !== false) startLoading()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const { stopLoading } = useUIStore.getState();
    stopLoading();
    return response;
  },
  (error) => {
    const { stopLoading, showSnackbar } = useUIStore.getState();
    const { logout } = useAuthStore.getState();

    stopLoading();

    if (!error.response) {
      showSnackbar(
        "Network error. Please check the connectivity.",
        "error"
      );
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 400) {
      showSnackbar(error.response.data?.message || "Bad request.", "warning");
      return Promise.reject(error);
    }

    if (status === 401) {
      showSnackbar("Session expired. Please login again.", "warning");
      logout();
      return Promise.reject(error);
    }

    if (status >= 500) {
      showSnackbar("Server error. Please try again later.", "error");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
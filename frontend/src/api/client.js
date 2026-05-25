import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("habitBreakerToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const csrf = getCookie("csrf_token");
  if (csrf) {
    config.headers["X-CSRF-Token"] = decodeURIComponent(csrf);
  }
  return config;
});

export async function safeGet(path, fallback) {
  try {
    const { data } = await api.get(path);
    return data;
  } catch {
    return fallback;
  }
}


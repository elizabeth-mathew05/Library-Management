import axios from 'axios';

const resolveApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }

  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://library-management-1-ifcc.onrender.com/api';
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 60000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('library_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

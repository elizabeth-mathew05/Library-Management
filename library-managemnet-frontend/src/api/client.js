import axios from 'axios';

const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }

  return 'https://library-management-13.onrender.com/api';
};

const api = axios.create({
  baseURL: resolveApiBaseUrl()
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('library_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

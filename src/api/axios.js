import axios from 'axios';

const backendBaseUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001')
  .trim()
  .replace(/\/+$/, '');

// Create axios instance
const api = axios.create({
  baseURL: backendBaseUrl, // FastAPI backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const currentPath = window.location.pathname || '';
      const isAdminRoute = currentPath.startsWith('/admin');
      window.location.href = isAdminRoute ? '/admin-login' : '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

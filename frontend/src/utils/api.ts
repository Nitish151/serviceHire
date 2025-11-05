import axios from 'axios';

// Force the environment variable to be inlined at build time
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

console.log('🔧 API Base URL (build time):', API_BASE_URL);
console.log('🔧 All env vars:', { 
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV 
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token AND log the full URL
api.interceptors.request.use(
  (config) => {
    // CRITICAL: Ensure baseURL is always set
    if (!config.baseURL) {
      config.baseURL = API_BASE_URL;
    }
    
    if (typeof window !== 'undefined') {
      console.log('🌐 Making request to:', config.baseURL + (config.url || ''));
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      console.log('✅ Response from:', response.config.url);
    }
    return response;
  },
  (error) => {
    if (typeof window !== 'undefined') {
      console.log('❌ Error from:', error.config?.url, 'Full URL:', error.config?.baseURL + error.config?.url);
    }
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';

// TEMPORARY HARDCODE: Force the backend URL
const API_BASE_URL = 'https://slotswapper-backend-sx7f.onrender.com/api';

// AGGRESSIVE LOGGING
console.log('========================================');
console.log('🔧🔧🔧 API.TS FILE LOADED 🔧🔧🔧');
console.log('🔧 API Base URL:', API_BASE_URL);
console.log('🔧 process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 typeof window:', typeof window);
console.log('========================================');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('✅ Axios instance created with baseURL:', api.defaults.baseURL);

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

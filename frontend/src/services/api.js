// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios instance létrehozása
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - token hozzáadása
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
// Response interceptor - error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

// AUTH API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  validateToken: () => api.get('/auth/validate'),
};
// APARTMENTS API
export const apartmentsAPI = {
  getAll: (params = {}) => api.get('/apartments', { params }),
  getById: (id) => api.get(`/apartments/${id}`),
  checkAvailability: (id, dates) => api.post(`/apartments/${id}/check-availability`, dates),
  getBookedDates: (id) => api.get(`/apartments/${id}/booked-dates`),
  // Admin endpoints
  create: (apartmentData) => api.post('/apartments', apartmentData),
  update: (id, apartmentData) => api.put(`/apartments/${id}`, apartmentData),
  delete: (id) => api.delete(`/apartments/${id}`),
  getAllAdmin: (params = {}) => api.get('/apartments/admin/all', { params }),
};

// BOOKINGS API
export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  processPayment: (id, paymentData) => api.post(`/bookings/${id}/payment`, paymentData),
  
  // Admin endpoints
  getAllAdmin: (params = {}) => api.get('/bookings/admin/all', { params }),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  getStats: () => api.get('/bookings/admin/stats'),
};
// NEWS API
export const newsAPI = {
  getAll: (params = {}) => api.get('/news', { params }),
  getById: (id) => api.get(`/news/${id}`),
  getLatest: (count = 5) => api.get(`/news/latest/${count}`),
  
  // Admin endpoints
  create: (newsData) => api.post('/news', newsData),
  update: (id, newsData) => api.put(`/news/${id}`, newsData),
  delete: (id) => api.delete(`/news/${id}`),
  getAllAdmin: (params = {}) => api.get('/news/admin/all', { params }),
  togglePublish: (id) => api.put(`/news/${id}/toggle-publish`),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data.message || 'Hiba történt a szerveren';
  } else if (error.request) {
    // Request was made but no response received
    return 'Nem sikerült kapcsolódni a szerverhez';
  } else {
    // Something else happened
    return 'Váratlan hiba történt';
  }
};

export default api;
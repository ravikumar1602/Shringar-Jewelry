import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/admin/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard'),
  getSalesAnalytics: (period) => api.get(`/admin/analytics/sales?period=${period}`),
  getInventoryReport: () => api.get('/admin/analytics/inventory'),
};

// ─── Products ────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/products/admin/all', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/products/${id}`),
  updateInventory: (id, data) => api.patch(`/products/${id}/inventory`, data),
  deleteImage: (id, imageId) => api.delete(`/products/${id}/images/${imageId}`),
  getLowStock: () => api.get('/products/low-stock'),
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: () => api.get('/categories?includeInactive=true'),
  create: (data) => api.post('/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersAPI = {
  getAll: (params) => api.get('/orders/admin/all', { params }),
  update: (id, data) => api.patch(`/orders/admin/${id}`, data),
  processRefund: (id, data) => api.post(`/payments/refund/${id}`, data),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/admin/users', { params }),
  update: (id, data) => api.patch(`/admin/users/${id}`, data),
};

// ─── Coupons ─────────────────────────────────────────────────────────────────
export const couponsAPI = {
  getAll: () => api.get('/admin/coupons'),
  create: (data) => api.post('/admin/coupons', data),
  update: (id, data) => api.put(`/admin/coupons/${id}`, data),
  delete: (id) => api.delete(`/admin/coupons/${id}`),
};

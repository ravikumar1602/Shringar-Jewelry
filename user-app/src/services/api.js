import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.API_URL || 'http://10.0.2.2:5000/api/v1'; // 10.0.2.2 = Android emulator localhost

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// Auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data.data;
        await AsyncStorage.multiSet([['accessToken', accessToken], ['refreshToken', newRefresh]]);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // Navigation reset handled by redux auth listener
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  changePassword: (data) => api.patch('/auth/change-password', data),
  updateProfile: (data) => api.patch('/auth/update-profile', data),
  addAddress: (data) => api.post('/auth/addresses', data),
  updateAddress: (id, data) => api.put(`/auth/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`),
  toggleWishlist: (productId) => api.post(`/auth/wishlist/${productId}`),
};

// ─── Products ────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  getRelated: (id) => api.get(`/products/${id}/related`),
  getCategories: () => api.get('/categories'),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart/clear'),
  applyCoupon: (code) => api.post('/cart/coupon', { code }),
  removeCoupon: () => api.delete('/cart/coupon'),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  cancel: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }),
  requestReturn: (id, reason) => api.post(`/orders/${id}/return`, { reason }),
};

// ─── Payments ────────────────────────────────────────────────────────────────
export const paymentAPI = {
  createRazorpayOrder: (orderId) => api.post('/payments/create-order', { orderId }),
  verify: (data) => api.post('/payments/verify', data),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsAPI = {
  getProductReviews: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
  create: (productId, data) => api.post(`/products/${productId}/reviews`, data),
};

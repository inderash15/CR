import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  getAllUsers: () => api.get('/auth/users'),
};

export const productsAPI = {
  getAll: () => api.get('/products/'),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard-stats'),
};

export const salesAPI = {
  create: (data) => api.post('/sales/', data),
};

export const customersAPI = {
  getAll: () => api.get('/customers/'),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const suppliersAPI = {
  getAll: () => api.get('/suppliers/'),
  create: (data) => api.post('/suppliers/', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories/'),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const purchasesAPI = {
  getAll: () => api.get('/purchases/'),
  create: (data) => api.post('/purchases/', data),
  delete: (id) => api.delete(`/purchases/${id}`),
};

export const attendanceAPI = {
  tapIn: () => api.post('/attendance/tap-in'),
  tapOut: () => api.post('/attendance/tap-out'),
  check: () => api.get('/attendance/check')
};

export const ordersAPI = {
  getAll: () => api.get('/orders/'),
  updateStatus: (id, status) => api.put(`/orders/${id}`, { status })
};

export const tasksAPI = {
  getAll: () => api.get('/tasks/'),
  create: (data) => api.post('/tasks/', data),
  updateProgress: (id, data) => api.put(`/tasks/${id}/progress`, data)
};

export default api;

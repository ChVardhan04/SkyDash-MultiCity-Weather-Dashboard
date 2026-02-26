import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ONLY redirect to login on 401 for non-auth routes
// Never redirect for AI/weather errors — show them in the UI instead
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Only force logout on 401 if it's NOT the login/register endpoint
    // and NOT an AI or weather endpoint (those have their own error handling)
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    const isSensitiveEndpoint = url.includes('/ai/') || url.includes('/weather/');

    if (status === 401 && !isAuthEndpoint && !isSensitiveEndpoint && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (data: any) => api.patch('/auth/preferences', data),
};

// ─── Cities ──────────────────────────────────────────────────────────────────
export const citiesAPI = {
  getAll: () => api.get('/cities'),
  add: (data: any) => api.post('/cities', data),
  remove: (id: string) => api.delete(`/cities/${id}`),
  toggleFavorite: (id: string) => api.patch(`/cities/${id}/favorite`),
  updateNotes: (id: string, notes: string) => api.patch(`/cities/${id}/notes`, { notes }),
};

// ─── Weather ─────────────────────────────────────────────────────────────────
export const weatherAPI = {
  search: (q: string) => api.get('/weather/search', { params: { q } }),
  getCurrent: (lat: number, lon: number, units = 'metric') =>
    api.get('/weather/current', { params: { lat, lon, units } }),
  getForecast: (lat: number, lon: number, units = 'metric') =>
    api.get('/weather/forecast', { params: { lat, lon, units } }),
  getBulk: (units = 'metric') => api.get('/weather/bulk', { params: { units } }),
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const aiAPI = {
  chat: (message: string, units = 'metric') =>
    api.post('/ai/chat', { message }, { params: { units } }),
  getCityInsight: (cityId: string) => api.post(`/ai/insight/${cityId}`),
};

export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 - clear token and redirect to login if not already on auth pages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      const pathname = window.location.pathname;
      const isAuthPage = ['/login', '/register', '/oauth2/redirect', '/admin/login'].includes(pathname);
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data.message && typeof data.message === 'string') return data.message;
    if (typeof data === 'object') {
      const values = Object.values(data).filter((v) => typeof v === 'string' && v.trim());
      if (values.length > 0) return values.join('; ');
    }
  }
  return error.message || 'An unexpected error occurred';
};

export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  const apiBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

  if (url.includes('/uploads/')) {
    const uploadPath = url.substring(url.indexOf('/uploads/'));
    return `${apiBaseUrl}${uploadPath}`;
  }

  return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const getFormattedContent = (content) => {
  if (!content) return '';
  const apiBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
  return content.replace(/src=["'](?:https?:\/\/[^/]+)?(\/uploads\/[^"']+)["']/g, `src="${apiBaseUrl}$1"`);
};

const CATEGORY_IMAGES = {
  Technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  Travel:     'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
  Food:       'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  Lifestyle:  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
  Health:     'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
  Business:   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  Art:        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  Science:    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
  Other:      'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=800&q=80',
};

const GENERIC_IMAGES = [
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
];

export const getPlaceholderImage = (category, title = '') => {
  if (category && CATEGORY_IMAGES[category]) {
    return CATEGORY_IMAGES[category];
  }
  // Use title to pick a consistent but varied image
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash |= 0;
  }
  return GENERIC_IMAGES[Math.abs(hash) % GENERIC_IMAGES.length];
};

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  adminLogin: (data) => api.post('/api/auth/admin/login', data),
  me: () => api.get('/api/auth/me'),
};

// ── Posts ─────────────────────────────────────────────────────────────────────
export const postsApi = {
  getAll: (params) => api.get('/api/posts', { params }),
  getById: (id) => api.get(`/api/posts/${id}`),
  create: (data) => api.post('/api/posts', data),
  update: (id, data) => api.put(`/api/posts/${id}`, data),
  delete: (id) => api.delete(`/api/posts/${id}`),
  toggleLike: (id) => api.post(`/api/posts/${id}/like`),
  uploadImage: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/api/posts/${id}/images`, fd);
  },
  uploadStandaloneImage: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/api/posts/upload-image', fd);
  },
  getComments: (id) => api.get(`/api/posts/${id}/comments`),
  addComment: (id, data) => api.post(`/api/posts/${id}/comments`, data),
  deleteComment: (commentId) => api.delete(`/api/posts/comments/${commentId}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: (id) => api.get(`/api/users/${id}/profile`),
  getMyProfile: () => api.get('/api/users/me'),
  updateProfile: (data) => api.put('/api/users/me', data),
  uploadProfilePicture: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/api/users/me/profile-picture', fd);
  },
  getUserPosts: (id, params) => api.get(`/api/users/${id}/posts`, { params }),
};

// ── Shares ────────────────────────────────────────────────────────────────────
export const sharesApi = {
  share: (data) => api.post('/api/shares', data),
  getInbox: (params) => api.get('/api/shares/inbox', { params }),
  getUnreadCount: () => api.get('/api/shares/unread-count'),
  markAsRead: (id) => api.patch(`/api/shares/${id}/read`),
  searchUsers: (q) => api.get('/api/shares/search-users', { params: { q } }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/api/admin/stats'),
  getUsers: (params) => api.get('/api/admin/users', { params }),
  updateUserRole: (id, role) => api.patch(`/api/admin/users/${id}/role`, null, { params: { role } }),
  updateUserStatus: (id, banned) => api.patch(`/api/admin/users/${id}/status`, null, { params: { banned } }),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  getPosts: () => api.get('/api/admin/posts'),
  deletePost: (id) => api.delete(`/api/admin/posts/${id}`),
  getModerationLogs: () => api.get('/api/admin/moderation-logs'),
};

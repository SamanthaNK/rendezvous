import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const state = store.getState();
        const token = state?.auth?.token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';

        if (error.response?.status === 401) {
            store.dispatch(logout());
        }

        return Promise.reject(new Error(message));
    },
);

// Auth API
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    verifyEmail: (token) => api.post('/auth/verify-email', { token }),
    resendVerification: () => api.post('/auth/resend-verification'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
    getCurrentUser: () => api.get('/auth/me'),
};

// Events API
export const eventsAPI = {
    getAll: (params) => api.get('/events', { params }),
    getById: (id) => api.get(`/events/${id}`),
    getNearby: (params) => api.get('/events/nearby', { params }),
    create: (eventData) => api.post('/events', eventData),
    update: (id, eventData) => api.put(`/events/${id}`, eventData),
    delete: (id) => api.delete(`/events/${id}`),

    save: (id) => api.post(`/events/${id}/save`),
    unsave: (id) => api.delete(`/events/${id}/save`),
    markInterested: (id) => api.post(`/events/${id}/interest`),
    unmarkInterested: (id) => api.delete(`/events/${id}/interest`),

    getSaved: () => api.get('/events/user/saved'),
    getInterested: () => api.get('/events/user/interested'),

    getMyEvents: (params) => api.get('/events/organizer/my-events', { params }),
};

// Search API
export const searchAPI = {
    search: (query, params) => api.get('/search', { params: { q: query, ...params } }),
    getSuggestions: () => api.get('/search/suggestions'),
};

// Upload API
export const uploadAPI = {
    uploadImages: (formData) =>
        api.post('/upload/images', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteImages: (publicIds) => api.delete('/upload/images', { data: { publicIds } }),
};

export default api;

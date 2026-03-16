import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
const UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000/api/upload/avatar';

const toCamelCase = (key) => {
  if (!key) return key;
  return key.charAt(0).toLowerCase() + key.slice(1);
};

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
};

const keysToCamelCaseDeep = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => keysToCamelCaseDeep(item));
  }

  if (isPlainObject(data)) {
    const result = {};
    Object.keys(data).forEach((k) => {
      result[toCamelCase(k)] = keysToCamelCaseDeep(data[k]);
    });
    return result;
  }

  return data;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    response.data = keysToCamelCaseDeep(response.data);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const originalRequest = error.config || {};
    const url = originalRequest.url || '';

    const isLoginRequest = url.includes('/auth/login');

    if (status === 401 && !isLoginRequest) {
      // Token expired or invalid for protected APIs
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Students API
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getEnrollments: (id) => api.get(`/students/${id}/enrollments`),
  getPayments: (id) => api.get(`/students/${id}/payments`),
  getTestScores: (id) => api.get(`/students/${id}/testscores`),
  getSchedule: (id) => api.get(`/students/${id}/schedule`),
};

// Teachers API
export const teachersAPI = {
  getAll: (params) => api.get('/teacher', { params }),
  getById: (id) => api.get(`/teacher/${id}`),
  create: (data) => api.post('/teacher', data),
  getSchedule: (id) => api.get(`/teacher/${id}/schedule`),
};

// Courses API
export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
};

// Classes API
export const classesAPI = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  getStudents: (id) => api.get(`/classes/${id}/students`),
};

// Enrollments API
export const enrollmentsAPI = {
  getAll: () => api.get('/enrollments'),
  create: (data) => api.post('/enrollments', data),
  delete: (id) => api.delete(`/enrollments/${id}`),
};

// Payments API
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
};

// Schedules API
export const schedulesAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  create: (data) => api.post('/schedules', data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getTeacherDashboardStatistics: (teacherId) => api.get(`/statistics/teacher-dashboard/${teacherId}`),
};

// Curriculum API
export const curriculumAPI = {
  getAll: (params) => api.get('/curriculum', { params }),
  getById: (id) => api.get(`/curriculum/${id}`),
  getByClass: (classId) => api.get(`/curriculum/class/${classId}`),
  create: (data) => api.post('/curriculum', data),
  update: (id, data) => api.put(`/curriculum/${id}`, data),
  delete: (id) => api.delete(`/curriculum/${id}`),
  createDay: (data) => api.post('/curriculum/day', data),
  updateDay: (id, data) => api.put(`/curriculum/day/${id}`, data),
  deleteDay: (id) => api.delete(`/curriculum/day/${id}`),
  createSession: (data) => api.post('/curriculum/session', data),
  updateSession: (id, data) => api.put(`/curriculum/session/${id}`, data),
  deleteSession: (id) => api.delete(`/curriculum/session/${id}`),
  createLesson: (data) => api.post('/curriculum/lesson', data),
  updateLesson: (id, data) => api.put(`/curriculum/lesson/${id}`, data),
  deleteLesson: (id) => api.delete(`/curriculum/lesson/${id}`),
};

// Rooms API
export const roomsAPI = {
  getAll: (params) => api.get('/room', { params }),
  getById: (id) => api.get(`/room/${id}`),
  create: (data) => api.post('/room', data),
  update: (id, data) => api.put(`/room/${id}`, data),
  delete: (id) => api.delete(`/room/${id}`),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  getById: (id) => api.get(`/attendance/${id}`),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  getByLesson: (lessonId) => api.get(`/attendance/lesson/${lessonId}`),
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh-token'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
};

// Test Scores API
export const testScoresAPI = {
  getAll: (params) => api.get('/testscores', { params }),
  getById: (id) => api.get(`/testscores/${id}`),
  create: (data) => api.post('/testscores', data),
  update: (id, data) => api.put(`/testscores/${id}`, data),
  delete: (id) => api.delete(`/testscores/${id}`),
};

export default api;
export { UPLOAD_URL, BASE_URL };

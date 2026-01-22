import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
};

// Teachers API
export const teachersAPI = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  getSchedule: (id) => api.get(`/teachers/${id}/schedule`),
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
  getAll: () => api.get('/schedules'),
  create: (data) => api.post('/schedules', data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

// Test Scores API
export const testScoresAPI = {
  getAll: () => api.get('/testscores'),
  create: (data) => api.post('/testscores', data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;

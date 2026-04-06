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
  getSchedule: (id, params) => api.get(`/students/${id}/schedule`, { params }),
};

// Teachers API
export const teachersAPI = {
  getAll: (params) => api.get('/teacher', { params }),
  getById: (id) => api.get(`/teacher/${id}`),
  create: (data) => api.post('/teacher', data),
  update: (id, data) => api.put(`/teacher/${id}`, data),
  delete: (id) => api.delete(`/teacher/${id}`),
  getSchedule: (id, params) => api.get(`/teacher/${id}/schedule`, { params }),
};

// Courses API
export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// Classes API
export const classesAPI = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  delete: (id) => api.delete(`/classes/${id}`),
  getStudents: (id) => api.get(`/classes/${id}/students`),
  getStudentClasses: (studentId) => api.get(`/students/${studentId}/classes`),
};

// Skills API (NEW - Dynamic Skill System)
export const skillsAPI = {
  getAll: (params) => api.get('/skill', { params }),
  getById: (id) => api.get(`/skill/${id}`),
  create: (data) => api.post('/skill', data),
  update: (id, data) => api.put(`/skill/${id}`, data),
  delete: (id) => api.delete(`/skill/${id}`)
};

// Assignment Skills API (NEW)
export const assignmentSkillsAPI = {
  getByAssignment: (assignmentId) => api.get(`/assignment/${assignmentId}/skills`),
  create: (assignmentId, data) => api.post(`/assignment/${assignmentId}/skills`, data),
  update: (assignmentId, skillId, data) => api.put(`/assignment/${assignmentId}/skills/${skillId}`, data),
  delete: (assignmentId, skillId) => api.delete(`/assignment/${assignmentId}/skills/${skillId}`)
};

// Grades API (NEW - Dynamic Skill System)
export const gradesAPI = {
  getByAssignment: (assignmentId) => api.get(`/grade/assignment/${assignmentId}`),
  getByStudent: (studentId) => api.get(`/grade/student/${studentId}`),
  getByClass: (classId) => api.get(`/grade/class/${classId}`),
  create: (data) => api.post('/grade', data),
  update: (id, data) => api.put(`/grade/${id}`, data),
  delete: (id) => api.delete(`/grade/${id}`)
};

// Assignments API
export const assignmentsAPI = {
  getAll: (params = {}) => api.get('/assignment', { params }),
  getById: (id) => api.get(`/assignment/${id}`),
  create: (data) => api.post('/assignment', data),
  update: (id, data) => api.put(`/assignment/${id}`, data),
  delete: (id) => api.delete(`/assignment/${id}`),
  getSubmissions: (assignmentId, params = {}) => api.get(`/assignment/${assignmentId}/submissions`, { params }),
  createSubmission: (assignmentId, data) => api.post(`/assignment/${assignmentId}/submissions`, data),
  submitQuiz: (assignmentId, data) => api.post(`/assignment/${assignmentId}/submit-quiz`, data),
  getQuizResult: (assignmentId, params) => api.get(`/assignment/${assignmentId}/quiz-result`, { params }),
  gradeSubmission: (submissionId, data) => api.put(`/assignment/submissions/${submissionId}/grade`, data),
  getAllResults: (assignmentId) => api.get(`/assignment/${assignmentId}/all-results`),
  resetSubmission: (assignmentId, studentId) => api.delete(`/assignment/${assignmentId}/students/${studentId}/reset-submission`),
  // Quiz endpoints
  getQuizQuestions: (assignmentId) => api.get(`/assignment/${assignmentId}/questions`),
  createQuizQuestion: (assignmentId, data) => api.post(`/assignment/${assignmentId}/questions`, data),
  updateQuizQuestion: (questionId, data) => api.put(`/assignment/questions/${questionId}`, data),
  deleteQuizQuestion: (questionId) => api.delete(`/assignment/questions/${questionId}`),
  deleteQuizAnswer: (answerId) => api.delete(`/assignment/answers/${answerId}`),
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

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getTeacherDashboardStatistics: (teacherId) => api.get(`/statistics/teacher-dashboard/${teacherId}`),
};

// Curriculum API
export const curriculumAPI = {
  getAll: (params) => api.get('/curriculum', { params }),
  getById: (id) => api.get(`/curriculum/${id}`),
  getByCourse: (courseId) => api.get(`/curriculum/course/${courseId}`),
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
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Documents API
export const documentsAPI = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  getTeacherDocuments: (teacherId, params) => api.get(`/documents/teacher/${teacherId}`, { params }),
  getStudentDocuments: (studentId, params) => api.get(`/documents/student/${studentId}`, { params }),
};

// Test Scores API
export const testScoresAPI = {
  getAll: (params) => api.get('/testscores', { params }),
  getById: (id) => api.get(`/testscores/${id}`),
  create: (data) => api.post('/testscores', data),
  update: (id, data) => api.put(`/testscores/${id}`, data),
  delete: (id) => api.delete(`/testscores/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params = {}) => api.get('/notification', { params }),
  getUnreadCount: () => api.get('/notification/unread-count'),
  create: (data) => api.post('/notification', data),
  markAsRead: (id) => api.put(`/notification/${id}/read`),
  markAsUnread: (id) => api.put(`/notification/${id}/unread`),
  markMultipleAsRead: (ids) => api.put('/notification/mark-read', { notificationIds: ids }),
  markAllAsRead: () => api.put('/notification/mark-all-read'),
  delete: (id) => api.delete(`/notification/${id}`),
};

// Activity Logs API - Hoạt động gần đây (Timeline)
export const activityLogsAPI = {
  getMyActivities: (params = {}) => api.get('/activitylogs/my-activities', { params }),
  getTeacherActivities: (teacherId, params = {}) => api.get(`/activitylogs/teacher/${teacherId}`, { params }),
  getStudentActivities: (studentId, params = {}) => api.get(`/activitylogs/student/${studentId}`, { params }),
  create: (data) => api.post('/activitylogs', data),
  delete: (id) => api.delete(`/activitylogs/${id}`),
};

export default api;
export { UPLOAD_URL, BASE_URL };

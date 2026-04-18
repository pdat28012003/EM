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

    // Skip transforming blob data (file downloads)

    if (response.config.responseType === 'blob') {

      return response;

    }

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

  getCurriculums: (id) => api.get(`/students/${id}/curriculums`),

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

  // Teacher Availability - NEW API with isBusy flag

  getTeachersWithAvailability: (params) => api.get('/teacher/availability', { params }),

  // Old availability APIs (deprecated)

  getAvailabilities: (teacherId) => api.get(`/teacheravailability/teacher/${teacherId}`),

  createAvailability: (data) => api.post('/teacheravailability', data),

  updateAvailability: (id, data) => api.put(`/teacheravailability/${id}`, data),

  deleteAvailability: (id) => api.delete(`/teacheravailability/${id}`),

  batchCreateAvailabilities: (data) => api.post('/teacheravailability/batch', data),

  getAvailableTeachers: (params) => api.get('/teacheravailability/available', { params }),

};



// Courses API

export const coursesAPI = {

  getAll: (params) => api.get('/courses', { params }),

  getById: (id) => api.get(`/courses/${id}`),

  create: (data) => api.post('/courses', data),

  update: (id, data) => api.put(`/courses/${id}`, data),

  delete: (id) => api.delete(`/courses/${id}`),

  // Course Enrollment (NEW - Add student to course)

  getStudents: (courseId) => api.get(`/courses/${courseId}/students`),

  addStudent: (courseId, studentId, curriculumId) => api.post(`/courses/${courseId}/students`, { studentId, curriculumId }),

  removeStudent: (courseId, studentId) => api.delete(`/courses/${courseId}/students/${studentId}`),

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

  getByCurriculum: (curriculumId) => api.get(`/grade/curriculum/${curriculumId}`),

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

  closeAssignment: (id) => api.put(`/assignment/${id}/close`),

  reopenAssignment: (id) => api.put(`/assignment/${id}/reopen`),

  getSubmissions: (assignmentId, params = {}) => api.get(`/assignment/${assignmentId}/submissions`, { params }),

  createSubmission: (assignmentId, data) => api.post(`/assignment/${assignmentId}/submissions`, data),

  submitQuiz: (assignmentId, data) => api.post(`/assignment/${assignmentId}/submit-quiz`, data),

  getQuizResult: (assignmentId, params) => api.get(`/assignment/${assignmentId}/quiz-result`, { params }),

  gradeSubmission: (submissionId, data) => api.put(`/assignment/submissions/${submissionId}/grade`, data),

  getAllResults: (assignmentId) => api.get(`/assignment/${assignmentId}/all-results`),

  resetSubmission: (assignmentId, studentId) => api.delete(`/assignment/${assignmentId}/students/${studentId}/reset-submission`),

  getMySubmission: (assignmentId, studentId) => api.get(`/assignment/${assignmentId}/my-submission`, { params: { studentId } }),

  // Quiz endpoints

  getQuizQuestions: (assignmentId) => api.get(`/assignment/${assignmentId}/questions`),

  createQuizQuestion: (assignmentId, data) => api.post(`/assignment/${assignmentId}/questions`, data),

  updateQuizQuestion: (questionId, data) => api.put(`/assignment/questions/${questionId}`, data),

  deleteQuizQuestion: (questionId) => api.delete(`/assignment/questions/${questionId}`),

  deleteQuizAnswer: (answerId) => api.delete(`/assignment/answers/${answerId}`),

  downloadSubmission: (submissionId) => api.get(`/assignment/submissions/${submissionId}/download`, { responseType: 'blob' }),

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

  getRevenueTrend: () => api.get('/dashboard/revenue-trend'),

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

  // Curriculum Students

  getStudents: (curriculumId) => api.get(`/curriculum/${curriculumId}/students`),

  addStudent: (curriculumId, studentId) => api.post(`/curriculum/${curriculumId}/students`, { studentId }),

  removeStudent: (curriculumId, studentId) => api.delete(`/curriculum/${curriculumId}/students/${studentId}`),

  syncStudentsFromCourses: (curriculumId) => api.post(`/curriculum/${curriculumId}/sync-students-from-courses`),

  // Session Students

  getSessionStudents: (sessionId) => api.get(`/curriculum/session/${sessionId}/students`),

  addStudentToSession: (sessionId, studentId, notes) => api.post(`/curriculum/session/${sessionId}/students`, { studentId, notes }),

  removeStudentFromSession: (sessionId, studentId) => api.delete(`/curriculum/session/${sessionId}/students/${studentId}`),

  getAvailableStudentsForSession: (sessionId) => api.get(`/curriculum/session/${sessionId}/available-students`),

  getCurriculumsByTeacher: (teacherId) => api.get(`/curriculum/teacher/${teacherId}`),

  getStudentsByTeacherSessions: (teacherId) => api.get(`/curriculum/teacher/${teacherId}/students`),

};



// Alias for Documents component

export const curriculumsAPI = curriculumAPI;



// Session Attendance API

export const sessionAttendanceAPI = {

  getAll: (params) => api.get('/sessionattendance', { params }),

  create: (data) => api.post('/sessionattendance', data),

  update: (id, data) => api.put(`/sessionattendance/${id}`, data),

  delete: (id) => api.delete(`/sessionattendance/${id}`),

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

  changePassword: (data) => api.post('/auth/change-password', data),

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

  getPendingDocuments: (params) => api.get('/documents/pending', { params }),

};



// Upload API

export const uploadAPI = {

  uploadAvatar: (formData) => api.post('/upload/avatar', formData, {

    headers: { 'Content-Type': 'multipart/form-data' }

  }),

  uploadSubmission: (formData) => api.post('/upload/submission', formData, {

    headers: { 'Content-Type': 'multipart/form-data' }

  }),

};



// Notifications API

export const notificationsAPI = {

  getAll: (params = {}) => api.get('/notifications', { params }),

  getUnreadCount: () => api.get('/notifications/unread-count'),

  create: (data) => api.post('/notifications', data),

  markAsRead: (id) => api.put(`/notifications/${id}/read`),

  markAsUnread: (id) => api.put(`/notifications/${id}/unread`),

  markMultipleAsRead: (ids) => api.put('/notifications/mark-read', { notificationIds: ids }),

  markAllAsRead: () => api.put('/notifications/mark-all-read'),

  delete: (id) => api.delete(`/notifications/${id}`),

};



// Activity Logs API - Hoạt động gần đây (Timeline) - Refactored v2.0

export const activityLogsAPI = {

  // Enhanced get my activities with pagination and filtering (v2.0)
  getMyActivities: (params = {}) => api.get('/activitylogs/my-activities', { params }),

  // Get activity statistics for dashboard (NEW v2.0)
  getMyStats: (params = {}) => api.get('/activitylogs/my-stats', { params }),

  // Enhanced teacher activities with pagination (v2.0)
  getTeacherActivities: (teacherId, params = {}) => api.get(`/activitylogs/teacher/${teacherId}`, { params }),

  // Enhanced student activities with pagination (v2.0)
  getStudentActivities: (studentId, params = {}) => api.get(`/activitylogs/student/${studentId}`, { params }),

  // Create activity log
  create: (data) => api.post('/activitylogs', data),

  // Delete single activity log
  delete: (id) => api.delete(`/activitylogs/${id}`),

  // Auto-cleanup old activity logs (NEW v2.0)
  cleanup: (data) => api.post('/activitylogs/cleanup', data),


};



// Payments API

export const paymentAPI = {

  // Get enrolled courses for a student

  getStudentEnrolledCourses: (studentId) => api.get(`/payments/student/${studentId}/enrolled-courses`),



  // Create a new payment

  createPayment: (data) => api.post('/payments/create-payment', data),



  // Get payment by ID

  getPaymentById: (id) => api.get(`/payments/${id}`),



  // Get payment history for a student

  getStudentPaymentHistory: (studentId) => api.get(`/payments/student/${studentId}/history`),



  // Legacy endpoints (for admin)

  getAll: (params) => api.get('/payments', { params }),

  getById: (id) => api.get(`/payments/${id}`),

  create: (data) => api.post('/payments', data),

  update: (id, data) => api.put(`/payments/${id}`, data),

  delete: (id) => api.delete(`/payments/${id}`),



  // Poll payment status (fallback for SignalR)

  getPaymentStatus: (id) => api.get(`/payments/${id}/status`),

};



export default api;
export { api as axiosInstance };
export { UPLOAD_URL, BASE_URL };


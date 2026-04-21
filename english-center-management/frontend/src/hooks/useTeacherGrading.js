import { useState, useEffect, useCallback } from 'react';
import { assignmentsAPI, curriculumAPI } from '../services/api';

export const GRADING_STEPS = ['Chọn lớp', 'Chọn bài tập', 'Chấm điểm'];

export const useTeacherGrading = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionStats, setSubmissionStats] = useState({
    gradedCount: 0,
    pendingCount: 0,
    lateCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teacher, setTeacher] = useState(null);

  // Load teacher from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setTeacher(parsedUser);
    }
  }, []);

  const loadTeacherClasses = useCallback(async (teacherId, options = {}) => {
    if (!teacherId) return;

    const { onSuccess, onError } = options;
    setLoading(true);
    setError(null);

    try {
      const classesRes = await curriculumAPI.getCurriculumsByTeacher(teacherId);
      const classesData = Array.isArray(classesRes.data)
        ? classesRes.data
        : [];

      const mappedClasses = classesData.map((cls) => ({
        classId: cls.curriculumId,
        className: cls.curriculumName || 'Lớp không tên',
        courseName: cls.courseName || '',
        students: cls.currentStudents || 0,
      }));

      setClasses(mappedClasses);
      onSuccess?.(mappedClasses);
    } catch (err) {
      const errorMsg = 'Lỗi khi tải danh sách lớp học';
      setError(errorMsg);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAssignments = useCallback(async (classId, options = {}) => {
    if (!classId) return;

    const { 
      onSuccess, 
      onError,
      search = null,
      status = null,
      skillId = null,
      sortBy = null,
      sortOrder = null,
      page = 1,
      pageSize = 100
    } = options;
    
    setLoading(true);
    setError(null);

    try {
      const params = {
        curriculumId: classId,
        page,
        pageSize
      };
      
      if (search) params.search = search;
      if (status) params.status = status;
      if (skillId !== null && skillId !== undefined) params.skillId = skillId;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;
      
      const response = await assignmentsAPI.getAll(params);
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setAssignments(data);
      onSuccess?.(data);
    } catch (err) {
      const errorMsg = 'Lỗi khi tải danh sách bài tập';
      setError(errorMsg);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubmissions = useCallback(async (assignmentId, options = {}) => {
    if (!assignmentId) return;

    const { 
      onSuccess, 
      onError, 
      status = null,
      search = null,
      sortBy = null,
      sortOrder = null,
      page = 1,
      pageSize = 100
    } = options;
    
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        pageSize
      };
      
      if (status) params.status = status;
      if (search) params.search = search;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;
      
      const response = await assignmentsAPI.getSubmissions(assignmentId, params);
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      const metadata = response.data?.metadata || {};
      setSubmissions(data);
      setSubmissionStats({
          gradedCount: metadata.gradedCount || 0,
          pendingCount: metadata.pendingCount || 0,
          lateCount: metadata.lateCount || 0,
          total: metadata.total || 0,
          averageScore: metadata.averageScore || "0"
      });
      onSuccess?.(data);
    } catch (err) {
      const errorMsg = 'Lỗi khi tải danh sách bài nộp';
      setError(errorMsg);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectClass = useCallback((cls) => {
    setSelectedClass(cls);
    setActiveStep(1);
  }, []);

  const handleSelectAssignment = useCallback((assignment) => {
    setSelectedAssignment(assignment);
    setActiveStep(2);
  }, []);

  const handleBack = useCallback(() => {
    if (activeStep === 2) {
      setSelectedAssignment(null);
      setSubmissions([]);
      setSubmissionStats({ gradedCount: 0, pendingCount: 0, lateCount: 0 });
      setActiveStep(1);
    } else if (activeStep === 1) {
      setSelectedClass(null);
      setAssignments([]);
      setActiveStep(0);
    }
  }, [activeStep]);

  const refreshSubmissions = useCallback((filters = {}) => {
    if (selectedAssignment?.assignmentId) {
      loadSubmissions(selectedAssignment.assignmentId, filters);
    }
  }, [selectedAssignment, loadSubmissions]);

  const reset = useCallback(() => {
    setActiveStep(0);
    setSelectedClass(null);
    setSelectedAssignment(null);
    setAssignments([]);
    setSubmissions([]);
    setSubmissionStats({ gradedCount: 0, pendingCount: 0, lateCount: 0 });
    setError(null);
  }, []);

  return {
    // State
    activeStep,
    classes,
    selectedClass,
    assignments,
    selectedAssignment,
    submissions,
    submissionStats,
    loading,
    error,
    teacher,

    // Actions
    setActiveStep,
    loadTeacherClasses,
    loadAssignments,
    loadSubmissions,
    handleSelectClass,
    handleSelectAssignment,
    handleBack,
    refreshSubmissions,
    reset,
    setError,
  };
};

export default useTeacherGrading;

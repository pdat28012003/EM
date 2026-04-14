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
      const classesData = Array.isArray(classesRes.data?.data?.data)
        ? classesRes.data.data.data
        : Array.isArray(classesRes.data?.data)
        ? classesRes.data.data
        : [];

      const mappedClasses = classesData.map((cls) => ({
        classId: cls.classId,
        className: cls.className || 'Lớp không tên',
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
    
    const { onSuccess, onError } = options;
    setLoading(true);
    setError(null);
    
    try {
      const response = await assignmentsAPI.getAll({ classId });
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
    
    const { onSuccess, onError } = options;
    setLoading(true);
    setError(null);
    
    try {
      const response = await assignmentsAPI.getSubmissions(assignmentId);
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setSubmissions(data);
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
      setActiveStep(1);
    } else if (activeStep === 1) {
      setSelectedClass(null);
      setAssignments([]);
      setActiveStep(0);
    }
  }, [activeStep]);

  const refreshSubmissions = useCallback(() => {
    if (selectedAssignment?.assignmentId) {
      loadSubmissions(selectedAssignment.assignmentId);
    }
  }, [selectedAssignment, loadSubmissions]);

  const reset = useCallback(() => {
    setActiveStep(0);
    setSelectedClass(null);
    setSelectedAssignment(null);
    setAssignments([]);
    setSubmissions([]);
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

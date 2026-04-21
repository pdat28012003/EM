import React, { useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
} from '@mui/material';
import { assignmentsAPI } from '../../../services/api';
import { useTeacherGrading, GRADING_STEPS } from '../../../hooks/useTeacherGrading';
import { useToast } from '../../../hooks/useToast';
import { downloadFile } from './gradingUtils';

// Components
import ClassSelection from './ClassSelection';
import AssignmentSelection from './AssignmentSelection';
import SubmissionGrading from './SubmissionGrading';
import GradeDialog from './GradeDialog';

const TeacherGrading = () => {
  // Custom hooks
  const {
    activeStep,
    classes,
    selectedClass,
    assignments,
    assignmentsPagination,
    selectedAssignment,
    submissions,
    submissionsPagination,
    submissionStats,
    loading,
    error,
    teacher,
    loadTeacherClasses,
    loadAssignments,
    loadSubmissions,
    handleSelectClass,
    handleSelectAssignment,
    handleBack,
    refreshSubmissions,
    setError,
  } = useTeacherGrading();

  const { toast, showSuccess, showError, closeToast } = useToast();

  // Dialog state
  const [gradeDialogOpen, setGradeDialogOpen] = React.useState(false);
  const [currentSubmission, setCurrentSubmission] = React.useState(null);

  // Load teacher classes on mount
  useEffect(() => {
    if (teacher?.teacherId || teacher?.userId) {
      loadTeacherClasses(teacher.teacherId || teacher.userId, {
        onError: () => showError('Không thể tải danh sách lớp học'),
      });
    }
  }, [teacher, loadTeacherClasses, showError]);

  // Handle class selection
  const onSelectClass = useCallback((cls) => {
    handleSelectClass(cls);
    // AssignmentSelection sẽ tự động load qua useEffect khi mount
  }, [handleSelectClass]);

  // Handle assignment selection
  const onSelectAssignment = useCallback((assignment) => {
    handleSelectAssignment(assignment);
    // SubmissionGrading sẽ tự động load qua useEffect khi mount
  }, [handleSelectAssignment]);

  // Open grade dialog
  const handleOpenGradeDialog = useCallback((submission) => {
    setCurrentSubmission(submission);
    setGradeDialogOpen(true);
  }, []);

  // Close grade dialog
  const handleCloseGradeDialog = useCallback(() => {
    setGradeDialogOpen(false);
    setCurrentSubmission(null);
  }, []);

  // Handle grade submission
  const handleGradeSubmit = useCallback(async (gradeData) => {
    if (!currentSubmission) return;

    try {
      await assignmentsAPI.gradeSubmission(currentSubmission.submissionId, gradeData);
      showSuccess('Đã lưu điểm thành công');
      refreshSubmissions();
    } catch (err) {
      console.error('Error grading submission:', err);
      showError('Có lỗi xảy ra khi lưu điểm');
      throw err;
    }
  }, [currentSubmission, refreshSubmissions, showSuccess, showError]);

  // Handle filter changes from SubmissionGrading
  const handleFilterChange = useCallback((filters) => {
    if (selectedAssignment?.assignmentId) {
      loadSubmissions(selectedAssignment.assignmentId, {
        ...filters,
        onError: () => showError('Không thể tải danh sách bài nộp'),
      });
    }
  }, [selectedAssignment, loadSubmissions, showError]);

  // Handle filter changes from AssignmentSelection
  const handleAssignmentFilterChange = useCallback((filters) => {
    if (selectedClass?.classId) {
      loadAssignments(selectedClass.classId, {
        ...filters,
        onError: () => showError('Không thể tải danh sách bài tập'),
      });
    }
  }, [selectedClass, loadAssignments, showError]);

  // Handle file download
  const handleDownloadFile = useCallback(async (submissionId, originalFileName) => {
    const result = await downloadFile(assignmentsAPI.downloadSubmission, submissionId, originalFileName);
    if (!result.success) {
      showError('Có lỗi xảy ra khi tải file');
    }
  }, [showError]);

  // Show error toast when error state changes
  React.useEffect(() => {
    if (error) {
      showError(error);
      setError(null);
    }
  }, [error, showError, setError]);

  // Empty state - no classes assigned
  if (classes.length === 0 && !loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">
          Bạn chưa được phân công lớp học nào. Vui lòng liên hệ quản trị viên.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Chấm Điểm Bài Tập
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Chọn lớp học và bài tập để bắt đầu chấm điểm cho học viên
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 3 }}>
        {GRADING_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && (
          <ClassSelection
            classes={classes}
            onSelectClass={onSelectClass}
            loading={loading}
          />
        )}
        {activeStep === 1 && (
          <AssignmentSelection
            selectedClass={selectedClass}
            assignments={assignments}
            totalPages={assignmentsPagination?.totalPages || 1}
            onBack={handleBack}
            onSelectAssignment={onSelectAssignment}
            onFilterChange={handleAssignmentFilterChange}
            loading={loading}
          />
        )}
        {activeStep === 2 && (
          <SubmissionGrading
            selectedAssignment={selectedAssignment}
            submissions={submissions}
            stats={submissionStats}
            totalPages={submissionsPagination?.totalPages || 1}
            onBack={handleBack}
            onOpenGradeDialog={handleOpenGradeDialog}
            onDownloadFile={handleDownloadFile}
            onFilterChange={handleFilterChange}
            loading={loading}
          />
        )}
      </Paper>

      {/* Grade Dialog */}
      <GradeDialog
        open={gradeDialogOpen}
        onClose={handleCloseGradeDialog}
        onSubmit={handleGradeSubmit}
        submission={currentSubmission}
        assignment={selectedAssignment}
        onDownloadFile={handleDownloadFile}
      />

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} onClose={closeToast}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TeacherGrading;

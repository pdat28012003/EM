import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Alert,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Badge,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add,
  Edit,
  School,
  Assignment,
  CheckCircle,
  Pending,
  ChevronRight,
  ChevronLeft,
  Grade,
  Person,
  FilterList,
  Download,
} from '@mui/icons-material';
import { assignmentsAPI, classesAPI } from '../../../services/api';

const TeacherGrading = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacher, setTeacher] = useState(null);

  // Grading dialog
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    score: '',
    feedback: '',
  });

  const steps = ['Chọn lớp', 'Chọn bài tập', 'Chấm điểm'];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setTeacher(parsedUser);
      if (parsedUser.teacherId || parsedUser.userId) {
        loadTeacherClasses(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, []);

  const loadTeacherClasses = async (teacherId) => {
    try {
      setLoading(true);
      const classesRes = await classesAPI.getAll({ teacherId, status: 'Active' });
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
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (classId) => {
    try {
      setLoading(true);
      const response = await assignmentsAPI.getAll({ classId });
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assignmentId) => {
    try {
      setLoading(true);
      const response = await assignmentsAPI.getSubmissions(assignmentId);
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    loadAssignments(cls.classId);
    setActiveStep(1);
  };

  const handleSelectAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    loadSubmissions(assignment.assignmentId);
    setActiveStep(2);
  };

  const handleBack = () => {
    if (activeStep === 2) {
      setSelectedAssignment(null);
      setSubmissions([]);
      setActiveStep(1);
    } else if (activeStep === 1) {
      setSelectedClass(null);
      setAssignments([]);
      setActiveStep(0);
    }
  };

  const handleOpenGradeDialog = (submission) => {
    setCurrentSubmission(submission);
    setGradeForm({
      score: submission.score || '',
      feedback: submission.feedback || '',
    });
    setOpenGradeDialog(true);
  };

  const handleCloseGradeDialog = () => {
    setOpenGradeDialog(false);
    setCurrentSubmission(null);
    setGradeForm({ score: '', feedback: '' });
  };

  const handleGradeSubmit = async () => {
    try {
      await assignmentsAPI.gradeSubmission(currentSubmission.submissionId, {
        score: parseFloat(gradeForm.score),
        feedback: gradeForm.feedback,
      });
      handleCloseGradeDialog();
      loadSubmissions(selectedAssignment.assignmentId);
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('Có lỗi xảy ra khi chấm điểm');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'graded':
        return 'success';
      case 'submitted':
        return 'warning';
      case 'late':
        return 'error';
      default:
        return 'default';
    }
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 85) return 'success';
    if (percentage >= 70) return 'primary';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  // Step 1: Select Class
  const renderClassSelection = () => (
    <Box>
      <Typography variant="h6" fontWeight="600" gutterBottom>
        Chọn lớp học để chấm điểm
      </Typography>
      <Grid container spacing={2}>
        {classes.map((cls) => (
          <Grid item xs={12} sm={6} md={4} key={cls.classId}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
              }}
              onClick={() => handleSelectClass(cls)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#4F46E5' }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600">
                      {cls.className}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cls.courseName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cls.students} học viên
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // Step 2: Select Assignment
  const renderAssignmentSelection = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ChevronLeft />} onClick={handleBack} sx={{ mr: 2 }}>
          Quay lại
        </Button>
        <Typography variant="h6" fontWeight="600">
          {selectedClass?.className} - Chọn bài tập
        </Typography>
      </Box>

      {assignments.length === 0 ? (
        <Alert severity="info">Lớp này chưa có bài tập nào.</Alert>
      ) : (
        <Grid container spacing={2}>
          {assignments.map((assignment) => (
            <Grid item xs={12} sm={6} key={assignment.assignmentId}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
                }}
                onClick={() => handleSelectAssignment(assignment)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#F59E0B' }}>
                        <Assignment />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {assignment.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Điểm tối đa: {assignment.maxScore || 100}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`${assignment.submissionsCount || 0} nộp`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {assignment.description}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Chip
                      label={`${assignment.gradedCount || 0} đã chấm`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      label={`${(assignment.submissionsCount || 0) - (assignment.gradedCount || 0)} chờ chấm`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  // Step 3: Grade Submissions
  const renderGrading = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ChevronLeft />} onClick={handleBack} sx={{ mr: 2 }}>
          Quay lại
        </Button>
        <Typography variant="h6" fontWeight="600">
          {selectedAssignment?.title} - Chấm điểm
        </Typography>
      </Box>

      <Paper>
        <List>
          {submissions.map((submission, index) => (
            <React.Fragment key={submission.submissionId}>
              <ListItem
                sx={{
                  bgcolor: submission.status === 'Graded' ? 'success.50' : 'background.paper',
                }}
                secondaryAction={
                  <Button
                    variant={submission.status === 'Graded' ? 'outlined' : 'contained'}
                    color={submission.status === 'Graded' ? 'success' : 'primary'}
                    startIcon={submission.status === 'Graded' ? <Edit /> : <Grade />}
                    onClick={() => handleOpenGradeDialog(submission)}
                  >
                    {submission.status === 'Graded' ? 'Sửa điểm' : 'Chấm điểm'}
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="600">
                        {submission.studentName}
                      </Typography>
                      <Chip
                        label={submission.status}
                        size="small"
                        color={getStatusColor(submission.status)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Nộp lúc: {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                      </Typography>
                      {submission.status === 'Graded' && (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          Điểm:{' '}
                          <Chip
                            label={`${submission.score}/${selectedAssignment?.maxScore || 100}`}
                            color={getScoreColor(
                              submission.score,
                              selectedAssignment?.maxScore || 100
                            )}
                            size="small"
                          />
                        </Typography>
                      )}
                      {submission.feedback && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Nhận xét: {submission.feedback}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < submissions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );

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
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && renderClassSelection()}
        {activeStep === 1 && renderAssignmentSelection()}
        {activeStep === 2 && renderGrading()}
      </Paper>

      {/* Grade Dialog */}
      <Dialog open={openGradeDialog} onClose={handleCloseGradeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentSubmission?.status === 'Graded' ? 'Sửa điểm' : 'Chấm điểm'} -{' '}
          {currentSubmission?.studentName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Bài nộp:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              {currentSubmission?.content ? (
                <div dangerouslySetInnerHTML={{ __html: currentSubmission.content }} />
              ) : (
                <Typography variant="body2">(Không có nội dung)</Typography>
              )}
            </Paper>

            {currentSubmission?.attachmentUrl && (
              <Button
                variant="outlined"
                startIcon={<Download />}
                href={`http://localhost:5000${currentSubmission.attachmentUrl}`}
                target="_blank"
                download
                sx={{ mb: 3 }}
              >
                Tải file đính kèm
              </Button>
            )}
            {!currentSubmission?.attachmentUrl && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                (Không có file đính kèm - attachmentUrl: {currentSubmission?.attachmentUrl || 'undefined'})
              </Typography>
            )}

            <TextField
              label="Điểm số"
              type="number"
              value={gradeForm.score}
              onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
              fullWidth
              required
              inputProps={{
                min: 0,
                max: selectedAssignment?.maxScore || 100,
                step: 0.5,
              }}
              helperText={`Tối đa: ${selectedAssignment?.maxScore || 100} điểm`}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Nhận xét"
              value={gradeForm.feedback}
              onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
              fullWidth
              multiline
              rows={4}
              placeholder="Nhận xét về bài làm của học viên..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGradeDialog}>Hủy</Button>
          <Button onClick={handleGradeSubmit} variant="contained">
            Lưu điểm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherGrading;

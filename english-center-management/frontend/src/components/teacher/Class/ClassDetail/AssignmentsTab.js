import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Pagination,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Radio,
  Divider,
  Tabs,
  Tab,
  List,
  ListItemText,
  Menu,
  ListItemIcon,
  InputAdornment,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Quiz as QuizIcon,
  AddCircle,
  RemoveCircle,
  HelpOutline,
  Replay,
  Lock,
  LockOpen,
  MoreVert,
  Search
} from '@mui/icons-material';
import { assignmentsAPI, skillsAPI } from '../../../../services/api';

export default function AssignmentsTab({ curriculumId, curriculumInfo }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    type: 'Homework',
    maxScore: 10,
    skillId: '',
    allowLateSubmission: false
  });
  const [skills, setSkills] = useState([]);
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'MultipleChoice',
    points: 1,
    explanation: '',
    answers: [
      { answerText: '', isCorrect: false, orderIndex: 0 },
      { answerText: '', isCorrect: false, orderIndex: 1 }
    ]
  });
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [assignmentResults, setAssignmentResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuAssignment, setMenuAssignment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assignmentsAPI.getAll({
        curriculumId,
        page: page,
        pageSize: rowsPerPage
      });
      setAssignments(response.data?.data || []);
      setTotalCount(response.data?.totalCount || 0);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [curriculumId, page, rowsPerPage]);

  useEffect(() => {
    if (curriculumId) {
      loadAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculumId, page, rowsPerPage]);

  const loadSkills = useCallback(async () => {
    try {
      const response = await skillsAPI.getAll();
      setSkills(response.data?.data || []);
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
    loadSkills();
  }, [loadAssignments, loadSkills]);

  const loadQuizQuestions = async (assignmentId) => {
    try {
      setQuizLoading(true);
      const response = await assignmentsAPI.getQuizQuestions(assignmentId);
      setQuizQuestions(response.data || []);
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      setQuizQuestions([]);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'closed': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'Đã phát hành';
      case 'draft': return 'Nháp';
      case 'closed': return 'Đã đóng';
      default: return status || '-';
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const query = searchQuery.trim().toLowerCase();
    const title = String(assignment.title || assignment.Title || '').toLowerCase();
    const description = String(assignment.description || assignment.Description || '').toLowerCase();
    const skill = String(assignment.skillName || assignment.SkillName || '').toLowerCase();
    const matchesSearch = !query || title.includes(query) || description.includes(query) || skill.includes(query);
    const status = String(assignment.status || assignment.Status || '').toLowerCase();
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && status === 'published') ||
      (statusFilter === 'draft' && status === 'draft') ||
      (statusFilter === 'closed' && status === 'closed');
    return matchesSearch && matchesStatus;
  });

  const assignmentCounts = assignments.reduce((counts, assignment) => {
    const status = String(assignment.status || assignment.Status || '').toLowerCase();
    if (status === 'published') counts.published += 1;
    if (status === 'draft') counts.draft += 1;
    if (status === 'closed') counts.closed += 1;
    counts.all += 1;
    return counts;
  }, { all: 0, published: 0, draft: 0, closed: 0 });

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const handleSaveAssignment = async () => {
    // Validation
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề bài tập');
      return;
    }
    if (formData.title.trim().length < 5) {
      alert('Tiêu đề phải có ít nhất 5 ký tự');
      return;
    }
    if (formData.title.trim().length > 100) {
      alert('Tiêu đề không được quá 100 ký tự');
      return;
    }
    if (!formData.description.trim()) {
      alert('Vui lòng nhập mô tả bài tập');
      return;
    }
    if (formData.description.trim().length < 10) {
      alert('Mô tả phải có ít nhất 10 ký tự');
      return;
    }
    if (formData.description.trim().length > 2000) {
      alert('Mô tả không được quá 2000 ký tự');
      return;
    }
    if (!formData.dueDate) {
      alert('Vui lòng chọn hạn nộp');
      return;
    }
    if (formData.type !== 'Quiz' && (!formData.maxScore || formData.maxScore <= 0 || formData.maxScore > 10)) {
      alert('Vui lòng nhập điểm tối đa từ 0 đến 10');
      return;
    }

    try {
      const assignmentData = {
        ...formData,
        curriculumId,
        dueDate: new Date(formData.dueDate).toISOString()
      };

      if (selectedAssignment) {
        await assignmentsAPI.update(selectedAssignment.assignmentId, assignmentData);
      } else {
        await assignmentsAPI.create(assignmentData);
      }

      setCreateDialogOpen(false);
      setSelectedAssignment(null);
      resetFormData();
      loadAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Lỗi khi lưu bài tập: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      type: 'Homework',
      maxScore: 100,
      skillId: '',
      allowLateSubmission: false
    });
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      type: assignment.type,
      maxScore: assignment.maxScore,
      skillId: assignment.skillId || '',
      allowLateSubmission: assignment.allowLateSubmission || false
    });
    setCreateDialogOpen(true);
  };

  const handleDeleteAssignment = (assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      await assignmentsAPI.delete(assignmentToDelete.assignmentId);
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
      loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Lỗi khi xóa bài tập: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCloseAssignment = async (assignmentId, event) => {
    if (event) event.stopPropagation();
    
    // Close menu first
    setMenuAnchorEl(null);
    
    // Wait for menu to close then show confirm
    setTimeout(async () => {
      if (window.confirm('Bạn có chắc chắn muốn đóng bài tập này? Học viên sẽ không thể nộp bài nữa.')) {
        try {
          await assignmentsAPI.closeAssignment(assignmentId);
          loadAssignments();
        } catch (error) {
          console.error('Error closing assignment:', error);
          alert('Lỗi khi đóng bài tập: ' + (error.response?.data?.message || error.message));
        }
      }
    }, 150);
  };

  const handleReopenAssignment = async (assignmentId, event) => {
    if (event) event.stopPropagation();
    
    setMenuAnchorEl(null);
    
    setTimeout(async () => {
      if (window.confirm('Bạn có chắc chắn muốn mở lại bài tập này? Học viên sẽ có thể nộp bài lại.')) {
        try {
          await assignmentsAPI.reopenAssignment(assignmentId);
          loadAssignments();
        } catch (error) {
          console.error('Error reopening assignment:', error);
          alert('Lỗi khi mở lại bài tập: ' + (error.response?.data?.message || error.message));
        }
      }
    }, 150);
  };

  const handleMenuOpen = (event, assignment) => {
    if (menuAnchorEl === event.currentTarget) return;
    setMenuAnchorEl(event.currentTarget);
    setMenuAssignment(assignment);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuAssignment(null);
  };

  const handleMenuAction = (action) => {
    if (!menuAssignment) return;
    
    switch (action) {
      case 'quiz':
        handleOpenQuizEditor(menuAssignment);
        break;
      case 'results':
        handleOpenResults(menuAssignment);
        break;
      case 'edit':
        handleEditAssignment(menuAssignment);
        break;
      case 'close':
        handleCloseAssignment(menuAssignment.assignmentId);
        break;
      case 'reopen':
        handleReopenAssignment(menuAssignment.assignmentId);
        break;
      case 'delete':
        handleDeleteAssignment(menuAssignment);
        break;
      default:
        break;
    }
    handleMenuClose();
  };

  const handleOpenQuizEditor = (assignment) => {
    setSelectedAssignment(assignment);
    loadQuizQuestions(assignment.assignmentId);
    setQuizDialogOpen(true);
    setActiveTab(0);
    resetQuestionForm();
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionForm({
      questionText: '',
      questionType: 'MultipleChoice',
      points: 1,
      explanation: '',
      answers: [
        { answerText: '', isCorrect: false, orderIndex: 0 },
        { answerText: '', isCorrect: false, orderIndex: 1 }
      ]
    });
  };

  const handleAddAnswer = () => {
    setQuestionForm({
      ...questionForm,
      answers: [
        ...questionForm.answers,
        { answerText: '', isCorrect: false, orderIndex: questionForm.answers.length }
      ]
    });
  };

  const handleRemoveAnswer = (index) => {
    if (questionForm.answers.length <= 2) {
      alert('Câu hỏi phải có ít nhất 2 đáp án');
      return;
    }
    const newAnswers = questionForm.answers.filter((_, i) => i !== index);
    setQuestionForm({
      ...questionForm,
      answers: newAnswers.map((a, i) => ({ ...a, orderIndex: i }))
    });
  };

  const handleAnswerChange = (index, field, value) => {
    const newAnswers = questionForm.answers.map((a, i) => {
      if (i === index) {
        return { ...a, [field]: value };
      }
      if (field === 'isCorrect' && value && questionForm.questionType === 'MultipleChoice') {
        return { ...a, isCorrect: false };
      }
      return a;
    });
    setQuestionForm({ ...questionForm, answers: newAnswers });
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.questionText.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi');
      return;
    }
    if (questionForm.points < 0 || questionForm.points > 10) {
      alert('Điểm phải từ 0 đến 10');
      return;
    }
    if (questionForm.answers.some(a => !a.answerText.trim())) {
      alert('Vui lòng nhập đầy đủ nội dung các đáp án');
      return;
    }
    if (!questionForm.answers.some(a => a.isCorrect)) {
      alert('Vui lòng chọn ít nhất một đáp án đúng');
      return;
    }

    try {
      const questionData = {
        ...questionForm,
        orderIndex: editingQuestion ? editingQuestion.orderIndex : quizQuestions.length
      };

      if (editingQuestion) {
        await assignmentsAPI.updateQuizQuestion(editingQuestion.questionId, questionData);
      } else {
        await assignmentsAPI.createQuizQuestion(selectedAssignment.assignmentId, questionData);
      }

      loadQuizQuestions(selectedAssignment.assignmentId);
      resetQuestionForm();
      setActiveTab(0);
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Lỗi khi lưu câu hỏi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      questionText: question.questionText,
      questionType: question.questionType,
      points: question.points,
      explanation: question.explanation || '',
      answers: question.answers.map(a => ({
        answerId: a.answerId,
        answerText: a.answerText,
        isCorrect: a.isCorrect,
        orderIndex: a.orderIndex
      }))
    });
    setActiveTab(1);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      try {
        await assignmentsAPI.deleteQuizQuestion(questionId);
        loadQuizQuestions(selectedAssignment.assignmentId);
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Lỗi khi xóa câu hỏi: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleOpenResults = async (assignment) => {
    setSelectedAssignment(assignment);
    setResultsDialogOpen(true);
    setResultsLoading(true);
    try {
      const response = await assignmentsAPI.getAllResults(assignment.assignmentId);
      setAssignmentResults(response.data || []);
    } catch (error) {
      console.error('Error loading assignment results:', error);
      alert('Lỗi khi tải kết quả bài tập');
    } finally {
      setResultsLoading(false);
    }
  };

  const handleResetSubmission = async (studentId) => {
    if (window.confirm('Bạn có chắc chắn muốn reset bài làm của học viên này? Học viên sẽ được phép làm lại từ đầu.')) {
      try {
        setResultsLoading(true);
        await assignmentsAPI.resetSubmission(selectedAssignment.assignmentId, studentId);
        // Reload results
        const response = await assignmentsAPI.getAllResults(selectedAssignment.assignmentId);
        setAssignmentResults(response.data || []);
      } catch (error) {
        console.error('Error resetting submission:', error);
        alert('Lỗi khi reset bài làm');
      } finally {
        setResultsLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Bài tập - {curriculumInfo?.curriculumName || `Khóa học`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Tạo bài tập
        </Button>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))" gap={2} mb={3}>
        <Card sx={{ borderRadius: 3, p: 2, minHeight: 96 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Tổng bài tập
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {assignmentCounts.all}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3, p: 2, minHeight: 96 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Đã phát hành
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {assignmentCounts.published}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3, p: 2, minHeight: 96 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Nháp
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {assignmentCounts.draft}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3, p: 2, minHeight: 96 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Đã đóng
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {assignmentCounts.closed}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box mb={3}>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm tiêu đề, mô tả hoặc kỹ năng"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="outlined"
            startIcon={<Replay />}
            onClick={handleClearFilters}
            sx={{ minWidth: 120 }}
          >
            Xóa bộ lọc
          </Button>
        </Box>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'published', label: 'Đã phát hành' },
            { value: 'draft', label: 'Nháp' },
            { value: 'closed', label: 'Đã đóng' }
          ].map((filter) => (
            <Chip
              key={filter.value}
              label={filter.label}
              clickable
              color={statusFilter === filter.value ? 'primary' : 'default'}
              variant={statusFilter === filter.value ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter(filter.value)}
            />
          ))}
        </Box>
      </Box>

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <Alert severity="info">
          Chưa có bài tập nào trong lớp này
        </Alert>
      ) : filteredAssignments.length === 0 ? (
        <Alert severity="info">
          Không tìm thấy bài tập phù hợp với bộ lọc hiện tại.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Tiêu đề</strong></TableCell>
                <TableCell><strong>Loại</strong></TableCell>
                <TableCell align="center"><strong>Kỹ năng</strong></TableCell>
                <TableCell align="center"><strong>Hạn nộp</strong></TableCell>
                <TableCell align="center"><strong>Nộp trễ</strong></TableCell>
                <TableCell align="center"><strong>Điểm tối đa</strong></TableCell>
                <TableCell align="center"><strong>Trạng thái</strong></TableCell>
                <TableCell align="center"><strong>Thao tác</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow
                  key={assignment.assignmentId}
                  hover
                  sx={{
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#f4f7ff'
                    }
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {assignment.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {String(assignment.description || assignment.Description || '').substring(0, 120)}
                        {(assignment.description || assignment.Description || '').length > 120 ? '...' : ''}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={assignment.type || assignment.Type}
                      size="small" 
                      variant="outlined"
                      color={(assignment.type || assignment.Type) === 'Quiz' ? 'primary' : 'default'}
                      icon={(assignment.type || assignment.Type) === 'Quiz' ? <QuizIcon fontSize="small" /> : null}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {assignment.skillName ? (
                      <Chip
                        label={assignment.skillName}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDate(assignment.dueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {assignment.allowLateSubmission ? (
                      <Chip label="Cho phép" size="small" color="success" variant="outlined" />
                    ) : (
                      <Chip label="Không" size="small" color="error" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {assignment.maxScore}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(assignment.status)}
                      color={getStatusColor(assignment.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Thao tác">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, assignment)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, totalCount)} của {totalCount} bài tập
          </Typography>
          <Pagination
            count={Math.ceil(totalCount / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAssignment ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tiêu đề"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                helperText="Tối thiểu 5 ký tự, tối đa 100 ký tự"
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Mô tả"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                helperText="Tối thiểu 10 ký tự, tối đa 2000 ký tự"
                inputProps={{ maxLength: 2000 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Loại bài tập"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="Homework">Bài tập về nhà</MenuItem>
                <MenuItem value="Quiz">Bài kiểm tra (Quiz)</MenuItem>
                <MenuItem value="Project">Dự án</MenuItem>
                <MenuItem value="Exam">Kỳ thi</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Kỹ năng (Skill)</InputLabel>
                <Select
                  value={formData.skillId}
                  label="Kỹ năng (Skill)"
                  onChange={(e) => setFormData({ ...formData, skillId: e.target.value })}
                >
                  <MenuItem value="">
                    <em>-- Chọn kỹ năng --</em>
                  </MenuItem>
                  {skills.map((skill) => (
                    <MenuItem key={skill.skillId} value={skill.skillId}>
                      {skill.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Điểm tối đa"
                value={formData.maxScore}
                disabled={formData.type === 'Quiz'}
                helperText={formData.type === 'Quiz' ? 'Tự động tính từ tổng điểm các câu hỏi' : 'Từ 0 đến 10'}
                onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Hạn nộp"
                InputLabelProps={{ shrink: true }}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.allowLateSubmission}
                    onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                  />
                }
                label="Cho phép nộp trễ (sau hạn nộp)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSaveAssignment} variant="contained">
            {selectedAssignment ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quiz Editor Dialog */}
      <Dialog 
        open={quizDialogOpen} 
        onClose={() => setQuizDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <QuizIcon />
            Soạn câu hỏi Quiz - {selectedAssignment?.title}
            {selectedAssignment?.type === 'Quiz' && (
              <Chip 
                label={`Tổng điểm ${quizQuestions.reduce((sum, q) => sum + q.points, 0)} điểm`}
                color="primary"
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Danh sách câu hỏi (${quizQuestions.length})`} />
            <Tab label={editingQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'} />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Tổng điểm <strong>{quizQuestions.reduce((sum, q) => sum + q.points, 0)}</strong> điểm
                </Typography>
              </Box>
              {quizLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : quizQuestions.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Chưa có câu hỏi nào. Chuyển sang tab "Thêm câu hỏi mới" để tạo câu hỏi.
                </Alert>
              ) : (
                <List>
                  {quizQuestions.map((question, index) => (
                    <Card key={question.questionId} sx={{ mb: 2, p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Câu {index + 1}. ({question.points} điểm)
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            {question.questionText}
                          </Typography>
                          <Box sx={{ mt: 1, ml: 2 }}>
                            {question.answers.map((answer) => (
                              <Typography 
                                key={answer.answerId}
                                variant="body2"
                                color={answer.isCorrect ? 'success.main' : 'text.secondary'}
                                sx={{ 
                                  py: 0.5,
                                  fontWeight: answer.isCorrect ? 'bold' : 'normal'
                                }}
                              >
                                {answer.isCorrect ? '✓ ' : '○ '}{answer.answerText}
                              </Typography>
                            ))}
                          </Box>
                          {question.explanation && (
                            <Typography variant="caption" color="info.main" sx={{ mt: 1, display: 'block' }}>
                              <HelpOutline fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }}/>
                              Giải thích: {question.explanation}
                            </Typography>
                          )}
                        </Box>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => handleEditQuestion(question)}
                          >
                            Sửa
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleDeleteQuestion(question.questionId)}
                          >
                            Xóa
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </List>
              )}
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  resetQuestionForm();
                  setActiveTab(1);
                }}
                sx={{ mt: 2 }}
              >
                Thêm câu hỏi mới
              </Button>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Nội dung câu hỏi"
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                </Grid>
                <Grid container item xs={12} spacing={3} alignItems="stretch">
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Điểm"
                      value={questionForm.points}
                      onChange={(e) => setQuestionForm({ ...questionForm, points: parseFloat(e.target.value) || 0 })}
                      inputProps={{ step: 0.5, min: 0, max: 10 }}
                      helperText="Điểm từ 0 đến 10"
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Giải thích đáp án đúng (tùy chọn)"
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                      placeholder="Giải thích tại sao đáp án đúng..."
                    />
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                    Các đáp án:
                  </Typography>
                  {questionForm.answers.map((answer, index) => (
                    <Card key={index} sx={{ mb: 2, p: 2, bgcolor: answer.isCorrect ? 'success.50' : 'background.paper' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={1}>
                          <Radio
                            checked={answer.isCorrect}
                            onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                          />
                        </Grid>
                        <Grid item xs={9}>
                          <TextField
                            fullWidth
                            label={`Đáp án ${String.fromCharCode(65 + index)}`}
                            value={answer.answerText}
                            onChange={(e) => handleAnswerChange(index, 'answerText', e.target.value)}
                            placeholder="Nhập nội dung đáp án..."
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <Button
                            color="error"
                            size="small"
                            startIcon={<RemoveCircle />}
                            onClick={() => handleRemoveAnswer(index)}
                          >
                            Xóa
                          </Button>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                  <Button
                    variant="outlined"
                    startIcon={<AddCircle />}
                    onClick={handleAddAnswer}
                    sx={{ mt: 1 }}
                  >
                    Thêm đáp án
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuizDialogOpen(false)}>Đóng</Button>
          {activeTab === 1 && (
            <>
              <Button onClick={() => {
                resetQuestionForm();
                setActiveTab(0);
              }}>
                Hủy
              </Button>
              <Button 
                onClick={handleSaveQuestion} 
                variant="contained"
                startIcon={<Add />}
              >
                {editingQuestion ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Results Dialog */}
      <Dialog 
        open={resultsDialogOpen} 
        onClose={() => setResultsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Kết quả bài tập: {selectedAssignment?.title}
        </DialogTitle>
        <DialogContent dividers>
          {resultsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : assignmentResults.length === 0 ? (
            <Alert severity="info">Không có dữ liệu học viên</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Học viên</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell align="center"><strong>Trạng thái</strong></TableCell>
                    <TableCell align="center"><strong>Điểm số</strong></TableCell>
                    <TableCell align="center"><strong>Ngày nộp</strong></TableCell>
                    <TableCell><strong>Ghi chú</strong></TableCell>
                    <TableCell align="center"><strong>Thao tác</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignmentResults.map((result) => (
                    <TableRow key={result.studentId} hover>
                      <TableCell>{result.studentName}</TableCell>
                      <TableCell>{result.email}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={
                            result.status === 'Overdue' ? 'Quá hạn' : 
                            result.status === 'Pending' ? 'Chưa nộp' : 
                            result.status === 'Submitted' ? 'Đã nộp' :
                            result.status === 'Graded' ? 'Đã chấm' : result.status
                          }
                          size="small"
                          color={
                            result.status === 'Overdue' ? 'error' : 
                            result.status === 'Pending' ? 'warning' : 
                            'success'
                          }
                          variant={result.status === 'Pending' || result.status === 'Overdue' ? 'outlined' : 'filled'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold">
                          {result.score !== null ? result.score : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption">
                          {result.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {result.note || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Cho làm lại">
                          <IconButton 
                            size="small" 
                            color="warning"
                            onClick={() => handleResetSubmission(result.studentId)}
                            disabled={result.status === 'Pending'}
                          >
                            <Replay fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultsDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete color="error" />
          Xác nhận xóa bài tập
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              Bạn có chắc chắn muốn xóa bài tập này?
            </Typography>
          </Alert>
          
          {assignmentToDelete && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {assignmentToDelete.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Loại: {assignmentToDelete.type} | Điểm tối đa: {assignmentToDelete.maxScore}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hạn nộp: {formatDate(assignmentToDelete.dueDate)}
              </Typography>
            </Box>
          )}

          <Alert severity="error" variant="outlined">
            <Typography variant="body2">
              <strong>Lưu ý:</strong> Việc xóa bài tập sẽ xóa vĩnh viễn tất cả dữ liệu liên quan:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0, mt: 1 }}>
              <li>Tất cả bài nộp của học viên</li>
              <li>Tất cả câu hỏi và đáp án (nếu là Quiz)</li>
              <li>Tất cả kết quả và điểm số</li>
              <li>Tất cả file đính kèm</li>
            </Box>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">
            Hủy
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error" startIcon={<Delete />}>
            Xóa vĩnh viễn
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {menuAssignment?.type === 'Quiz' && (
          <MenuItem onClick={() => handleMenuAction('quiz')}>
            <ListItemIcon>
              <QuizIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Soạn câu hỏi" />
          </MenuItem>
        )}
        <MenuItem onClick={() => handleMenuAction('results')}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Xem kết quả" />
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Chỉnh sửa" />
        </MenuItem>
        <Divider />
        {menuAssignment?.status === 'Closed' ? (
          <MenuItem onClick={() => handleMenuAction('reopen')}>
            <ListItemIcon>
              <LockOpen fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Mở lại bài tập" />
          </MenuItem>
        ) : (
          <MenuItem 
            onClick={() => handleMenuAction('close')}
            disabled={menuAssignment?.status === 'Draft'}
          >
            <ListItemIcon>
              <Lock fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText primary="Đóng bài tập" />
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Xóa" />
        </MenuItem>
      </Menu>
    </Box>
  );
}

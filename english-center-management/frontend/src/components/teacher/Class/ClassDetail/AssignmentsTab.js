import React, { useState, useEffect } from 'react';
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
  Checkbox,
  FormControlLabel,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Assignment,
  Quiz as QuizIcon,
  AddCircle,
  RemoveCircle,
  HelpOutline,
  Replay
} from '@mui/icons-material';
import { assignmentsAPI } from '../../../../services/api';

export default function AssignmentsTab({ classId, classInfo }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
    maxScore: 100
  });
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

  useEffect(() => {
    loadAssignments();
  }, [classId, page, rowsPerPage]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentsAPI.getAll({
        classId: classId,
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
  };

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

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
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
        classId: classId,
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
      maxScore: 100
    });
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      type: assignment.type,
      maxScore: assignment.maxScore
    });
    setCreateDialogOpen(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
      try {
        await assignmentsAPI.delete(assignmentId);
        loadAssignments();
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Lỗi khi xóa bài tập: ' + (error.response?.data?.message || error.message));
      }
    }
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
          Bài tập - {classInfo?.className || `Lớp ${classId}`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Tạo bài tập
        </Button>
      </Box>

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <Alert severity="info">
          Chưa có bài tập nào trong lớp này
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Tiêu đề</strong></TableCell>
                <TableCell><strong>Loại</strong></TableCell>
                <TableCell align="center"><strong>Hạn nộp</strong></TableCell>
                <TableCell align="center"><strong>Điểm tối đa</strong></TableCell>
                <TableCell align="center"><strong>Trạng thái</strong></TableCell>
                <TableCell align="center"><strong>Thao tác</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.assignmentId} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {assignment.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignment.description?.substring(0, 100)}
                        {assignment.description?.length > 100 ? '...' : ''}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={assignment.type} 
                      size="small" 
                      variant="outlined"
                      color={assignment.type === 'Quiz' ? 'primary' : 'default'}
                      icon={assignment.type === 'Quiz' ? <QuizIcon fontSize="small" /> : null}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDate(assignment.dueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {assignment.maxScore}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={assignment.status}
                      color={getStatusColor(assignment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      {assignment.type === 'Quiz' && (
                        <Tooltip title="Soạn câu hỏi">
                          <IconButton 
                            size="small"
                            color="primary"
                            onClick={() => handleOpenQuizEditor(assignment)}
                          >
                            <QuizIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Xem chi tiết">
                        <IconButton 
                          size="small"
                          onClick={() => handleOpenResults(assignment)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton 
                          size="small"
                          onClick={() => handleEditAssignment(assignment)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAssignment(assignment.assignmentId)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
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
    </Box>
  );
}

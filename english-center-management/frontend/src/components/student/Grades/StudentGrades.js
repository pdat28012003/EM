import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { gradesAPI, studentsAPI } from '../../../services/api';
import { useParams } from 'react-router-dom';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { curriculumId } = useParams();

  const loadStudentData = useCallback(async (studentId) => {
    try {
      setLoading(true);
      setError(null);

      // Load student's curriculums
      const curriculumsRes = await studentsAPI.getCurriculums(studentId);
      const curriculumsData = curriculumsRes.data || [];
      setCurriculums(curriculumsData);

      // Set selected curriculum if provided in URL
      if (curriculumId) {
        setSelectedCurriculum(curriculumId);
      } else if (curriculumsData.length > 0) {
        setSelectedCurriculum(curriculumsData[0].curriculumId);
      }

      // Load grades
      const gradesRes = await gradesAPI.getByStudent(studentId);
      const gradesData = gradesRes.data || [];
      setGrades(gradesData);

    } catch (err) {
      console.error('Error loading student grades:', err);
      setError('Không tìm thấy dữ liệu điểm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [curriculumId]);

  useEffect(() => {
    const studentData = JSON.parse(localStorage.getItem('user') || '{}');
    const studentId = studentData.studentId || studentData.StudentId;

    if (studentId) {
      loadStudentData(studentId);
    } else {
      setError('Không tìm thông tin sinh viên');
      setLoading(false);
    }
  }, [loadStudentData]);

  const handleCurriculumChange = (event) => {
    setSelectedCurriculum(event.target.value);
  };

  const filteredGrades = selectedCurriculum
    ? grades.filter(grade => {
      // Filter grades by curriculum through enrollment
      return true; // For now, show all grades since we don't have curriculum info in grade response
    })
    : grades;

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#ff9800';
    return '#f44336';
  };

  const getGradeLabel = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'Xuất sắc';
    if (percentage >= 80) return 'Giỏi';
    if (percentage >= 70) return 'Khá';
    if (percentage >= 60) return 'Trung bình';
    if (percentage >= 50) return 'Yếu';
    return 'Kém';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1e293b' }}>
        Kết quả học tập
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Curriculum Selector */}
      {curriculums.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Chương trình:
            </Typography>
            <FormControl sx={{ minWidth: 250 }}>
              <Select
                value={selectedCurriculum}
                onChange={handleCurriculumChange}
                size="small"
                sx={{ borderRadius: 1.5 }}
              >
                {curriculums.map((curriculum) => (
                  <MenuItem key={curriculum.curriculumId} value={curriculum.curriculumId}>
                    {curriculum.curriculumName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

      {/* Grades Table */}
      <Paper sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ fontWeight: 600, color: 'white' }}>Bài tập</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'white' }}>Kỹ năng</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'white' }} align="center">Điểm</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'white' }} align="center">Xếp loại</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'white' }}>Nhận xét</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'white' }}>Ngày chấm</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((grade) => (
                  <TableRow key={grade.gradeId} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {grade.assignmentTitle || 'Bài tập chung'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={grade.skillName || 'Chưa xác định'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 22 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          color: getScoreColor(grade.score, grade.maxScore),
                          fontSize: '1.1rem'
                        }}
                      >
                        {grade.score}/{grade.maxScore}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getGradeLabel(grade.score, grade.maxScore)}
                        size="small"
                        sx={{
                          bgcolor: getScoreColor(grade.score, grade.maxScore) + '20',
                          color: getScoreColor(grade.score, grade.maxScore),
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 22
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                        {grade.comments || <em style={{ color: '#999' }}>Không có</em>}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                        {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString('vi-VN') : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Chưa có điểm
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Kết quả học tập sẽ được cập nhật sau khi hoàn thành bài tập
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary Statistics */}
      {filteredGrades.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4F46E5', mb: 0.5 }}>
                {((filteredGrades.reduce((acc, g) => acc + (g.score / g.maxScore) * 10, 0) / filteredGrades.length).toFixed(1))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Điểm trung bình
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981', mb: 0.5 }}>
                {filteredGrades.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng số bài tập
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5 }}>
                {filteredGrades.filter(g => (g.score / g.maxScore) >= 0.8).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bài tập điểm cao
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default StudentGrades;

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { gradesAPI, curriculumAPI } from '../../../services/api';

const AdminGrades = () => {
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCurriculums();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedCurriculum) {
      loadGrades();
    }
  }, [selectedCurriculum]);

  const loadCurriculums = async () => {
    try {
      const response = await curriculumAPI.getAll({ pageSize: 100 });
      setCurriculums(response.data?.data || []);
    } catch (err) {
      console.error('Error loading curriculums:', err);
      setError('Không thể tải danh sách chương trình học');
    }
  };

  const loadGrades = async () => {
    setLoading(true);
    try {
      const response = await gradesAPI.getByCurriculum(selectedCurriculum);
      setGrades(response.data || []);
    } catch (err) {
      console.error('Error loading grades:', err);
      setError('Không thể tải điểm số');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Quản lý điểm số
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Chọn chương trình</InputLabel>
            <Select
              value={selectedCurriculum}
              onChange={(e) => setSelectedCurriculum(e.target.value)}
              label="Chọn chương trình"
            >
              <MenuItem value="">
                <em>-- Chọn chương trình --</em>
              </MenuItem>
              {curriculums.map((curr, index) => (
                <MenuItem key={curr.curriculumId || `curriculum-${index}`} value={curr.curriculumId}>
                  {curr.curriculumName || curr.courseName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Học sinh</strong></TableCell>
                <TableCell><strong>Bài tập</strong></TableCell>
                <TableCell><strong>Kỹ năng</strong></TableCell>
                <TableCell align="center"><strong>Điểm</strong></TableCell>
                <TableCell align="center"><strong>Tối đa</strong></TableCell>
                <TableCell align="center"><strong>%</strong></TableCell>
                <TableCell><strong>Ngày chấm</strong></TableCell>
                <TableCell><strong>Nhận xét</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {selectedCurriculum ? 'Không có dữ liệu điểm số' : 'Vui lòng chọn chương trình'}
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((grade, index) => (
                  <TableRow key={grade.gradeId || `grade-${index}`}>
                    <TableCell>{grade.studentName}</TableCell>
                    <TableCell>{grade.assignmentTitle}</TableCell>
                    <TableCell>{grade.skillName}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={grade.score}
                        color={getGradeColor(grade.score, grade.maxScore)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{grade.maxScore}</TableCell>
                    <TableCell align="center">
                      {((grade.score / grade.maxScore) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell>{grade.comments || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminGrades;

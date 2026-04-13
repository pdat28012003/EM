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
import { gradesAPI, classesAPI } from '../../../services/api';

const AdminGrades = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedClass) {
      loadGrades();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const response = await classesAPI.getAll({ pageSize: 100 });
      setClasses(response.data?.data || []);
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Không thể tải danh sách lớp học');
    }
  };

  const loadGrades = async () => {
    setLoading(true);
    try {
      const response = await gradesAPI.getByClass(selectedClass);
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
            <InputLabel>Chọn lớp học</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              label="Chọn lớp học"
            >
              <MenuItem value="">
                <em>-- Chọn lớp --</em>
              </MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls.classId} value={cls.classId}>
                  {cls.className}
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
                    {selectedClass ? 'Không có dữ liệu điểm số' : 'Vui lòng chọn lớp học'}
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((grade) => (
                  <TableRow key={grade.gradeId}>
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

/* eslint-disable react-hooks/exhaustive-deps */
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
  Alert,
  Chip,
  Pagination,
  TextField,
  Skeleton
} from '@mui/material';
import { curriculumAPI } from '../../../../services/api';

export default function StudentsTab({ curriculumId, curriculumInfo }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(null);
  const [availableSlots, setAvailableSlots] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const hasLoaded = React.useRef(false);

  useEffect(() => {
    if (hasLoaded.current && page === 1) return;
    hasLoaded.current = true;
    loadStudents();
  }, [curriculumId, page, rowsPerPage]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      // Get teacherId from localStorage or props
      const userData = localStorage.getItem('user');
      const teacherId = userData ? JSON.parse(userData).teacherId : null;
      
      if (teacherId) {
        // Get students from teacher's sessions
        const response = await curriculumAPI.getStudentsByTeacherSessions(teacherId);
        const data = response.data || {};
        setStudents(data.students || []);        
        setTotalCount(data.totalCount || 0);
        setSessions(data.sessions || []);
      } else {
        // Fallback: get all students in curriculum
        const response = await curriculumAPI.getStudents(curriculumId);
        const data = response.data || {};
        setStudents(data.students || []);        
        setTotalCount(data.totalCount || 0);
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };



  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 3 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={50} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  // Filter students by search keyword
  const filteredStudents = students.filter(s => 
    s.fullName?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    s.phoneNumber?.includes(searchKeyword)
  );

  return (
    <Box>
      {/* IMPROVED HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Học viên
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {curriculumInfo?.curriculumName}
          </Typography>
        </Box>
        <Chip 
          label={`${totalCount} học viên`} 
          size="small"
          sx={{ fontWeight: 600, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
        />
      </Box>

      {/* SEARCH */}
      <TextField
        fullWidth
        size="small"
        placeholder="Tìm học viên..."
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        sx={{ 
          mb: 2, 
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#10b981',
            }
          }
        }}
      />

      {filteredStudents.length === 0 ? (
        <Alert severity="info">
          {searchKeyword ? 'Không tìm thấy học viên' : 'Không có học viên trong khóa học'}
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={60}><strong>STT</strong></TableCell>
                <TableCell><strong>Họ tên</strong></TableCell>
                <TableCell><strong>Liên hệ</strong></TableCell>
                <TableCell align="center"><strong>Ngày sinh</strong></TableCell>
                <TableCell><strong>Địa chỉ</strong></TableCell>
                <TableCell align="center"><strong>Nhập học</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student, index) => (
                <TableRow 
                  key={student.StudentId || student.studentId} 
                  hover
                  sx={{
                    transition: 'all 0.2s',
                    '& td': { py: 1.75 },
                    '&:hover': {
                      backgroundColor: 'rgba(16, 185, 129, 0.04) !important'
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {(page - 1) * rowsPerPage + index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="medium">
                      {student.fullName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{student.email}</Typography>
                      <Typography variant="body2" color="text.secondary">{student.phoneNumber}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDate(student.dateOfBirth)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap maxWidth={120} title={student.address}>
                      {student.address}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDate(student.enrollmentDate)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* PAGINATION */}
      {totalCount > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, totalCount)} của {totalCount} học viên
          </Typography>
          <Pagination
            count={Math.ceil(totalCount / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root.Mui-selected': {
                bgcolor: '#10b981',
                color: 'white',
                '&:hover': { bgcolor: '#059669' }
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
}

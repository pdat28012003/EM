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
  Pagination,
  TextField,
  Skeleton,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Search, Clear, PeopleOutline } from '@mui/icons-material';
import { curriculumAPI } from '../../../../services/api';
import { useAsyncLoading } from '../../../../hooks/useDocuments';

export default function StudentsTab({ curriculumId, curriculumInfo }) {
  const [students, setStudents] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [totalCount, setTotalCount] = useState(0);
  
  // Sử dụng custom hook cho loading
  const { initialLoading, stopLoading } = useAsyncLoading();
  
  // eslint-disable-next-line no-unused-vars
  const [maxCapacity] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [availableSlots] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [sessions] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const hasLoaded = React.useRef(false);

  const loadStudents = useCallback(async () => {
    try {
      // initialLoading được quản lý bởi hook ở lần đầu
      // Get teacherId from localStorage or props
      const userData = localStorage.getItem('user');
      let teacherId = null;
      let user = null;
      try {
        user = JSON.parse(userData || '{}');
        teacherId = user?.teacherId || user?.TeacherId;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
      
      console.log('Loading students for curriculum:', curriculumId, 'teacherId:', teacherId, 'user:', user);
      
      if (teacherId) {
        // Get students from teacher's sessions
        console.log('Calling getStudentsByTeacherSessions with teacherId:', teacherId);
        const response = await curriculumAPI.getStudentsByTeacherSessions(teacherId);
        console.log('getStudentsByTeacherSessions response:', response);
        const data = response.data || {};
        setStudents(data.students || []);        
        setTotalCount(data.totalCount || 0);
      } else {
        // Fallback: get all students in curriculum
        console.log('No teacherId, calling getStudents with curriculumId:', curriculumId);
        const response = await curriculumAPI.getStudents(curriculumId);
        console.log('getStudents response:', response);
        const data = response.data || {};
        setStudents(data.students || []);        
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      setStudents([]);
      setTotalCount(0);
    } finally {
      stopLoading(true);
    }
  }, [curriculumId, stopLoading]);

  useEffect(() => {
    if (hasLoaded.current && page === 1) return;
    hasLoaded.current = true;
    loadStudents();
  }, [curriculumId, page, rowsPerPage, loadStudents]);


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

  // Highlight search keyword in text
  const highlightText = (text, keyword) => {
    if (!keyword || !text) return text;
    const lowerKeyword = keyword.toLowerCase();
    const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === lowerKeyword ? <mark key={i} style={{ backgroundColor: '#fef3c7', fontWeight: 600, padding: '0 2px', borderRadius: 2 }}>{part}</mark> : part
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Loading skeleton - chỉ hiện lần đầu
  if (initialLoading) {
    return (
      <Box sx={{ py: 4 }}>
        <Skeleton variant="text" width={250} height={36} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={180} height={20} sx={{ mb: 2 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 2 }} />
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

  // Paginate filtered results
  const paginatedStudents = filteredStudents.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Học viên
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {curriculumInfo?.curriculumName}
        </Typography>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Tìm học viên..."
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: searchKeyword && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchKeyword('')}>
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#fafafa',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            },
            '&.Mui-focused': {
              backgroundColor: '#fff'
            }
          }
        }}
      />

      {filteredStudents.length === 0 ? (
        <Box textAlign="center" py={6}>
          <PeopleOutline sx={{ fontSize: 64, color: '#e5e7eb', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Chưa có học viên nào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchKeyword ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có học viên đăng ký khóa học này'}
          </Typography>
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: '#fafafa',
                '& th': {
                  borderBottom: '2px solid #e5e7eb'
                }
              }}>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: 12, width: 60, borderBottom: '2px solid #e5e7eb' }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: 12, borderBottom: '2px solid #e5e7eb' }}>HỌ TÊN</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: 12, borderBottom: '2px solid #e5e7eb' }}>LIÊN HỆ</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: 12, borderBottom: '2px solid #e5e7eb' }} align="center">NGÀY SINH</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: 12, borderBottom: '2px solid #e5e7eb' }}>ĐỊA CHỈ</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: 12, borderBottom: '2px solid #e5e7eb' }} align="center">NHẬP HỌC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody
              sx={{
                '& tr:nth-of-type(odd)': {
                  backgroundColor: '#fcfcfc'
                },
                '& td': {
                  borderBottom: '1px solid #e5e7eb'
                }
              }}
            >
              {paginatedStudents.map((student, index) => (
                <TableRow 
                  key={student.StudentId || student.studentId} 
                  hover
                  onClick={() => console.log('View student:', student.studentId)}
                  sx={{
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    '& td': { py: 2 },
                    '&:hover': {
                      backgroundColor: 'rgba(16, 185, 129, 0.08) !important'
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {(page - 1) * rowsPerPage + index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="600" fontSize={14} title={student.fullName}>
                      {highlightText(student.fullName, searchKeyword)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" noWrap title={student.email}>{highlightText(student.email, searchKeyword)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {highlightText(student.phoneNumber, searchKeyword)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDate(student.dateOfBirth)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      noWrap 
                      title={student.address}
                    >
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
      {filteredStudents.length > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filteredStudents.length)} của {filteredStudents.length} học viên
          </Typography>
          <Pagination
            count={Math.ceil(filteredStudents.length / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 2
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
}

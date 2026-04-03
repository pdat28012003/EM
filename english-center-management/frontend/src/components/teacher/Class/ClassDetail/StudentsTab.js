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
  Avatar,
  Chip,
  Pagination
} from '@mui/material';
import {
  Email,
  Phone
} from '@mui/icons-material';
import { classesAPI } from '../../../../services/api';

export default function StudentsTab({ classId, classInfo }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const hasLoaded = React.useRef(false);

  useEffect(() => {
    if (hasLoaded.current && page === 1) return;
    hasLoaded.current = true;
    loadStudents();
  }, [classId, page, rowsPerPage]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      // Server-side pagination
      const response = await classesAPI.getStudents(classId, {
        page: page,
        pageSize: rowsPerPage
      });
      
    
      const pagedData = response.data;
      setStudents(pagedData?.data || []);        
      setTotalCount(pagedData?.totalCount || 0); 
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (attendance) => {
    if (attendance >= 90) return "success";
    if (attendance >= 75) return "warning";
    return "error";
  };

  const getStatusColor = (status) => {
    if (status === 'Active') return "success";
    if (status === 'Inactive') return "error";
    return "default";
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

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Đang tải danh sách học viên...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Danh sách học viên - {classInfo?.className}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tổng số: {students.length} học viên
        </Typography>
      </Box>

      {students.length === 0 ? (
        <Alert severity="info">
          Không có học viên trong lớp
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>STT</strong></TableCell>
                <TableCell><strong>Họ tên</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>SĐT</strong></TableCell>
                <TableCell align="center"><strong>Ngày sinh</strong></TableCell>
                <TableCell align="center"><strong>Địa chỉ</strong></TableCell>
                <TableCell align="center"><strong>Ngày nhập học</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student.StudentId || student.studentId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {(page - 1) * rowsPerPage + index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                     
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {student.fullName}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      
                      {student.email}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                    
                      {student.phoneNumber}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDate(student.dateOfBirth)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap maxWidth={150}>
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
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}

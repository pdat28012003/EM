import React, { useState, useEffect, useRef } from 'react';
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
  Grid,
  Card,
  CardContent,
  TextField,
  Pagination,
  Button,
  Skeleton,
  LinearProgress,
  Divider
} from '@mui/material';

import {
  CheckCircle,
  Cancel,
  CalendarToday,
  People,
  TrendingUp,
  PersonOff,
  Save,
  DeleteSweep
} from '@mui/icons-material';

import { attendanceAPI, classesAPI } from '../../../../services/api';

export default function AttendanceTab({ classId, classInfo }) {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const hasLoaded = useRef(false);

  // Check if selected date is today
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    rate: 0
  });

  useEffect(() => {
    loadData();
  }, [classId, selectedDate, page, rowsPerPage]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadStudents(), loadAttendanceStats()]);
    setLoading(false);
  };

  const loadStudents = async () => {
    try {
      const res = await classesAPI.getStudents(classId, {
        page: page,
        pageSize: rowsPerPage
      });
      const studentsData = res.data?.data || res.data || [];
      setStudents(studentsData);
      setTotalCount(res.data?.totalCount || res.data?.TotalCount || 0);
    } catch {
      setStudents([]);
      setTotalCount(0);
    }
  };

  const loadAttendanceStats = async () => {
    try {
      const res = await attendanceAPI.getAll({
        lessonId: classId,
        date: selectedDate
      });

      const attendance = res.data || [];
      const present = attendance.filter(a => a.status === 'Present').length;
      const absent = attendance.filter(a => a.status === 'Absent').length;
      
      // Fix: Use totalCount instead of students.length for accurate stats
      const rate = totalCount > 0 ? Math.round((present / totalCount) * 100) : 0;

      setStats({ total: totalCount, present, absent, rate });

      const map = {};
      attendance.forEach(a => {
        map[a.studentId] = a.status;
      });
      setAttendanceData(map);
    } catch {
      setStats({ total: totalCount, present: 0, absent: 0, rate: 0 });
    }
  };

  // Local state only - no API call
  const handleLocalChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Bulk actions
  const markAllPresent = () => {
    const allPresent = {};
    students.forEach(s => {
      const id = s.studentId || s.StudentId;
      allPresent[id] = 'Present';
    });
    setAttendanceData(prev => ({ ...prev, ...allPresent }));
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    students.forEach(s => {
      const id = s.studentId || s.StudentId;
      allAbsent[id] = 'Absent';
    });
    setAttendanceData(prev => ({ ...prev, ...allAbsent }));
  };

  const clearAll = () => {
    const cleared = {};
    students.forEach(s => {
      const id = s.studentId || s.StudentId;
      cleared[id] = '';
    });
    setAttendanceData(prev => ({ ...prev, ...cleared }));
  };

  // Save all attendance changes to API
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const today = selectedDate;
      
      // Get existing attendance records
      const existingRes = await attendanceAPI.getAll({
        lessonId: classId,
        date: today
      });
      const existingMap = new Map();
      existingRes.data?.forEach(a => {
        existingMap.set(a.studentId, a);
      });

      // Create promises for all changes
      const promises = Object.entries(attendanceData).map(([studentId, status]) => {
        if (!status) return Promise.resolve(); // Skip empty
        
        const existing = existingMap.get(parseInt(studentId));
        
        if (existing) {
          return attendanceAPI.update(existing.attendanceId, { status });
        } else {
          return attendanceAPI.create({
            studentId: parseInt(studentId),
            lessonId: classId,
            attendanceDate: today,
            status
          });
        }
      });

      await Promise.all(promises);
      await loadAttendanceStats();
      alert('Đã lưu điểm danh thành công!');
    } catch (err) {
      alert('Lỗi khi lưu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getRateColor = () => {
    if (stats.rate >= 90) return 'success';
    if (stats.rate >= 75) return 'warning';
    return 'error';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  // Calculate unsaved changes
  const unsavedCount = Object.values(attendanceData).filter(v => v).length;

  return (
    <Box>
      {/* IMPROVED HEADER */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Điểm danh
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {classInfo?.className} • Ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
        </Typography>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <TextField
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        
        {/* Save Button */}
        <Button
          variant="contained"
          color="success"
          startIcon={<Save />}
          onClick={handleSaveAll}
          disabled={saving || unsavedCount === 0 || !isToday}
          title={!isToday ? "Chỉ được sửa điểm danh trong ngày" : ""}
        >
          {saving ? 'Đang lưu...' : `Lưu điểm danh (${unsavedCount})`}
        </Button>
      </Box>

      {/* Warning if not today */}
      {!isToday && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Chỉ được sửa điểm danh trong ngày. Qua ngày khác chỉ có thể xem dữ liệu.
        </Alert>
      )}

      {/* IMPROVED STATS */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, display: 'flex', alignItems: 'center', p: 2 }}>
            <People sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tổng sĩ số
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.total}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, display: 'flex', alignItems: 'center', p: 2 }}>
            <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Có mặt
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.present}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, display: 'flex', alignItems: 'center', p: 2 }}>
            <PersonOff sx={{ fontSize: 40, color: '#f44336', mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Vắng
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.absent}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Tỷ lệ điểm danh
              </Typography>
              <Typography variant="h6" fontWeight="bold" color={`${getRateColor()}.main`}>
                {stats.rate}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={stats.rate} 
              color={getRateColor()}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Card>
        </Grid>
      </Grid>

      {/* BULK ACTIONS */}
      <Box mb={2} display="flex" gap={1} flexWrap="wrap">
        <Button
          variant="outlined"
          size="small"
          color="success"
          startIcon={<CheckCircle />}
          onClick={markAllPresent}
          disabled={!isToday}
        >
          Tất cả có mặt
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="error"
          startIcon={<Cancel />}
          onClick={markAllAbsent}
          disabled={!isToday}
        >
          Tất cả vắng
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DeleteSweep />}
          onClick={clearAll}
          disabled={!isToday}
        >
          Xóa chọn
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* TABLE */}
      {loading ? (
        <Box mt={3}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={50} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : students.length === 0 ? (
        <Alert severity="info">Không có học viên</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={60}><b>STT</b></TableCell>
                  <TableCell><b>Họ tên</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell align="center"><b>Trạng thái</b></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {students.map((student, index) => {
                  const studentId = student.studentId || student.StudentId;
                  const currentStatus = attendanceData[studentId];
                  
                  return (
                    <TableRow 
                      key={studentId} 
                      hover
                      sx={{
                        backgroundColor: currentStatus === 'Present' 
                          ? 'rgba(76, 175, 80, 0.08)' 
                          : currentStatus === 'Absent' 
                            ? 'rgba(244, 67, 54, 0.08)' 
                            : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {(page - 1) * rowsPerPage + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>{student.fullName || student.FullName}</TableCell>
                      <TableCell>{student.email || student.Email}</TableCell>

                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Chip
                            label="Có mặt"
                            color={currentStatus === 'Present' ? 'success' : 'default'}
                            onClick={() => isToday && handleLocalChange(studentId, 'Present')}
                            clickable={isToday}
                            size="small"
                            variant={currentStatus === 'Present' ? 'filled' : 'outlined'}
                          />
                          <Chip
                            label="Vắng"
                            color={currentStatus === 'Absent' ? 'error' : 'default'}
                            onClick={() => isToday && handleLocalChange(studentId, 'Absent')}
                            clickable={isToday}
                            size="small"
                            variant={currentStatus === 'Absent' ? 'filled' : 'outlined'}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

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
        </>
      )}
    </Box>
  );
}
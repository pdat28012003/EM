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
  TextField,
  Pagination,
  Button,
  Skeleton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

import {
  People,
  Save,
  CalendarToday,
  Class as ClassIcon,
  Edit
} from '@mui/icons-material';

import { curriculumAPI, sessionAttendanceAPI } from '../../../../services/api';
import { Snackbar, Alert as MuiAlert } from '@mui/material';
import { useAsyncLoading } from '../../../../hooks/useDocuments';

export default function AttendanceTab({ curriculumId, curriculumInfo }) {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);
  
  // Sử dụng custom hook cho loading
  const { initialLoading, startLoading, stopLoading } = useAsyncLoading();
  
  // Giữ riêng cho attendance reload (không trigger full skeleton)
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedSession, setSelectedSession] = useState(null);
  const [dirty, setDirty] = useState(new Set()); // Track changed students
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    pendingDate: null
  });

  // Check if selected date is today
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Load sessions
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      const teacherId = parsed.teacherId || parsed.userId;
      if (teacherId) {
        curriculumAPI.getStudentsByTeacherSessions(teacherId)
          .then(res => {
            const data = res.data || {};
            setSelectedSession(data.sessions[0] || null);
          })
          .catch(err => console.error('Error loading sessions:', err));
      }
    }
  }, []);

  // Auto select session based on selected date
  useEffect(() => {
    if (selectedSession && selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      
      // Find session for selected date
      const sessionForDate = selectedSession;
      
      setSelectedSession(sessionForDate || null);
    }
  }, [selectedSession, selectedDate]);

  // Load students when curriculum or pagination changes
  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculumId, page]);

  // Load attendance when session or date changes (avoid students dependency)
  useEffect(() => {
    if (selectedSession && students.length > 0) {
      loadAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession, selectedDate]);

  // Load students from curriculum
  const loadStudents = async () => {
    const isFirstLoad = initialLoading;
    startLoading(isFirstLoad);
    try {
      const stuRes = await curriculumAPI.getStudents(curriculumId);
      const studentsData = stuRes.data?.students || stuRes.data?.data?.students || [];
      const total = stuRes.data?.totalCount || stuRes.data?.data?.totalCount || studentsData.length;
      setStudents(studentsData);
      setTotalCount(total);
    } catch (e) {
      console.error('Error loading students:', e);
      setStudents([]);
      setTotalCount(0);
    } finally {
      stopLoading(isFirstLoad);
    }
  };

  // Load attendance by session
  const loadAttendance = async () => {
    if (!selectedSession) {
      setAttendanceData({});
      return;
    }
    
    setLoadingAttendance(true);
    try {
      const sessionId = selectedSession.curriculumSessionId || selectedSession;
      const attRes = await sessionAttendanceAPI.getAll({ 
        sessionId: sessionId, 
        date: selectedDate 
      });
      const attendance = attRes.data || [];
      
      const map = {};
      if (attendance.length > 0) {
        attendance.forEach(att => {
          map[att.studentId] = { status: att.status, notes: att.notes || '' };
        });
      } else if (isToday) {
        // Auto default to present
        students.forEach(s => {
          const id = s.studentId || s.StudentId;
          map[id] = { status: 'Present', notes: '' };
        });
      }

      setAttendanceData(map);
    } catch (e) {
      console.error('Error loading attendance:', e);
      setAttendanceData({});
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Local state only - no API call, track dirty with comparison
  const handleLocalChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
    
    // Only mark dirty if actually changed from initial
    setDirty(prev => {
      const newDirty = new Set(prev);
      newDirty.add(studentId);
      return newDirty;
    });
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes }
    }));
    
    // Only mark dirty if actually changed from initial
    setDirty(prev => {
      const newDirty = new Set(prev);
      newDirty.add(studentId);
      return newDirty;
    });
  };

  // Save all attendance changes to API (by session) - BULK API
  const handleSaveAll = async () => {
    if (!selectedSession) {
      setSnackbar({
        open: true,
        message: 'Vui lòng chọn buổi học trước khi lưu điểm danh!',
        severity: 'warning'
      });
      return;
    }
    
    setSaving(true);
    try {
      const today = selectedDate;
      const sessionId = selectedSession.curriculumSessionId || selectedSession;
      
      // Tạo array attendance records cho bulk API
      const attendanceRecords = Object.entries(attendanceData)
        .filter(([, data]) => data && data.status) // Skip empty
        .map(([studentId, data]) => ({
          sessionId: sessionId,
          studentId: parseInt(studentId),
          date: today,
          status: data.status,
          notes: data.notes || ''
        }));

      if (attendanceRecords.length === 0) {
        setSnackbar({
          open: true,
          message: 'Không có dữ liệu điểm danh để lưu!',
          severity: 'warning'
        });
        setSaving(false);
        return;
      }

      // Gọi 1 API bulk thay vì N API calls
      await sessionAttendanceAPI.createBulk(attendanceRecords);
      setDirty(new Set()); // Clear dirty after save
      await loadAttendance();
      setSnackbar({
        open: true,
        message: `Đã lưu ${attendanceRecords.length} bản ghi điểm danh thành công!`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Lỗi khi lưu: ' + err.message,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Calculate unsaved changes - only count dirty (changed) students
  const unsavedCount = dirty.size;

  return (
    <Box> 
      {/* IMPROVED HEADER - Responsive */}
      <Box mb={3} display="flex" flexWrap="wrap" alignItems="center" gap={2}>
        <Box 
          sx={{ 
            width: { xs: 40, sm: 48 }, 
            height: { xs: 40, sm: 48 }, 
            borderRadius: 2, 
            bgcolor: 'primary.main', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <People sx={{ color: 'white', fontSize: { xs: 24, sm: 28 } }} />
        </Box>
        <Box flex={1} minWidth={200}>
          <Box display="flex" flexWrap="wrap" alignItems="center" gap={1} mb={0.5}>
            <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Điểm danh
            </Typography>
            {selectedSession && (
              <Chip 
                label={selectedSession.sessionName} 
                color="primary" 
                size="small"
                icon={<ClassIcon />} 
                sx={{ maxWidth: { xs: 120, sm: 200 } }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
              <CalendarToday sx={{ fontSize: 14 }} />
              <span>{curriculumInfo?.curriculumName}</span>
              <span>•</span>
              <span>{new Date(selectedDate).toLocaleDateString('vi-VN')}</span>
            </Box>
          </Typography>
        </Box>
        {unsavedCount > 0 && (
          <Chip 
            label={`${unsavedCount} thay đổi`}
            color="warning"
            icon={<Edit />} 
            variant="outlined"
            sx={{ ml: { xs: 'auto', sm: 0 } }}
          />
        )}
      </Box>

      {/* Controls - Responsive */}
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2} mb={3}>
        <TextField
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => {
            if (dirty.size > 0) {
              setConfirmDialog({
                open: true,
                title: 'Xác nhận đổi ngày',
                message: `Bạn có ${dirty.size} thay đổi chưa lưu. Có chắc muốn đổi ngày?`,
                pendingDate: e.target.value,
                onConfirm: (date) => {
                  setSelectedDate(date);
                  setConfirmDialog(prev => ({ ...prev, open: false }));
                }
              });
            } else {
              setSelectedDate(e.target.value);
            }
          }}
          fullWidth={false}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        />
        
        <Button
          variant="contained"
          color="success"
          startIcon={<Save />} 
          onClick={handleSaveAll}
          disabled={saving || unsavedCount === 0 || !isToday || !selectedSession}
          title={!isToday ? "Chỉ được sửa điểm danh trong ngày" : !selectedSession ? "Vui lòng chọn buổi học" : ""}
          sx={{ width: '100%' }}
        >
          {saving ? 'Đang lưu...' : unsavedCount > 0 ? `Lưu điểm danh (${unsavedCount})` : 'Lưu điểm danh'}
        </Button>
      </Box>

      {/* Warning if not today */}
      {!isToday && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Chỉ được sửa điểm danh trong ngày. Qua ngày khác chỉ có thể xem dữ liệu.
        </Alert>
      )}

      {/* Warning if no session selected */}
      {!selectedSession && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Vui lòng chọn buổi học để điểm danh.
        </Alert>
      )}

      {/* Soft Loading - chỉ hiện khi reload attendance (không phải lần đầu) */}
      {loadingAttendance && !initialLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress sx={{ borderRadius: 1, height: 2 }} />
        </Box>
      )}

      {/* TABLE */}
      {/* Loading - dùng initialLoading cho skeleton, loading cho soft loading */}
      {initialLoading ? (
        <Box mt={3}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={50} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : students.length === 0 ? (
        <Alert severity="info">Không có học viên</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell width={60}><b>STT</b></TableCell>
                <TableCell><b>Họ tên</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell align="center"><b>Trạng thái</b></TableCell>
                <TableCell align="center"><b>Ghi chú</b></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {students.map((student, index) => {
                const studentId = student.studentId || student.StudentId;
                const currentStatus = attendanceData[studentId]?.status;
                const currentNotes = attendanceData[studentId]?.notes || '';
                
                return (
                  <TableRow 
                    key={studentId} 
                    hover
                    sx={{
                      transition: 'all 0.15s ease',
                      // Priority: Dirty > Status
                      backgroundColor: dirty.has(studentId)
                        ? 'rgba(25, 118, 210, 0.08) !important'
                        : 'inherit',
                      borderLeft: dirty.has(studentId)
                        ? '3px solid #1976d2'
                        : currentStatus === 'Present'
                          ? '3px solid #4caf50'
                          : currentStatus === 'Late'
                            ? '3px solid #ff9800'
                            : currentStatus === 'Absent'
                              ? '3px solid #f44336'
                              : '3px solid transparent',
                      '&:hover': {
                        backgroundColor: dirty.has(studentId)
                          ? 'rgba(25, 118, 210, 0.12) !important'
                          : 'action.hover'
                      }
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
                      <Box display="flex" gap={0.5} justifyContent="center" flexWrap="nowrap">
                        <Chip
                            label="Có mặt"
                          color={currentStatus === 'Present' ? 'success' : 'default'}
                          onClick={() => isToday && handleLocalChange(studentId, 'Present')}
                          clickable={isToday}
                          size="small"
                          variant={currentStatus === 'Present' ? 'filled' : 'outlined'}
                          sx={{ fontWeight: currentStatus === 'Present' ? 600 : 400, minWidth: 45 }}
                        />
                        <Chip
                            label="Muộn"
                          color={currentStatus === 'Late' ? 'warning' : 'default'}
                          onClick={() => isToday && handleLocalChange(studentId, 'Late')}
                          clickable={isToday}
                          size="small"
                          variant={currentStatus === 'Late' ? 'filled' : 'outlined'}
                          sx={{ fontWeight: currentStatus === 'Late' ? 600 : 400, minWidth: 36 }}
                        />
                        <Chip
                            label="Vắng"
                          color={currentStatus === 'Absent' ? 'error' : 'default'}
                          onClick={() => isToday && handleLocalChange(studentId, 'Absent')}
                          clickable={isToday}
                          size="small"
                          variant={currentStatus === 'Absent' ? 'filled' : 'outlined'}
                          sx={{ fontWeight: currentStatus === 'Absent' ? 600 : 400, minWidth: 36 }}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <TextField
                        size="small"
                        placeholder="Ghi chú..."
                        value={currentNotes}
                        onChange={(e) => handleNotesChange(studentId, e.target.value)}
                        disabled={!isToday}
                        sx={{ minWidth: 150, '& .MuiInputBase-root': { bgcolor: 'background.paper' } }}
                      />
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
    
    {/* Confirm Dialog */}
    <Dialog
      open={confirmDialog.open}
      onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
    >
      <DialogTitle>{confirmDialog.title}</DialogTitle>
      <DialogContent>{confirmDialog.message}</DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
          Hủy
        </Button>
        <Button 
          onClick={() => confirmDialog.onConfirm?.(confirmDialog.pendingDate)}
          color="primary"
          variant="contained"
        >
          Đổi ngày
        </Button>
      </DialogActions>
    </Dialog>

    {/* Snackbar for notifications */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={3000}
      onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <MuiAlert
        severity={snackbar.severity}  
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </MuiAlert>
    </Snackbar>
  </Box>
);
}
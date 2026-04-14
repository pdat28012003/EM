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
  Grid,
  Card,
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
  People,
  Save,
  DeleteSweep,
  Schedule
} from '@mui/icons-material';

import { curriculumAPI, sessionAttendanceAPI } from '../../../../services/api';

export default function AttendanceTab({ curriculumId, curriculumInfo }) {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  // Check if selected date is today
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    rate: 0
  });

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
            setSessions(data.sessions || []);
          })
          .catch(err => console.error('Error loading sessions:', err));
      }
    }
  }, []);

  // Auto select session based on selected date
  useEffect(() => {
    if (sessions.length > 0 && selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      
      // Find session for selected date
      const sessionForDate = sessions.find(s => {
        const sessionDate = new Date(s.scheduleDate);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === selectedDateObj.getTime();
      });
      
      setSelectedSession(sessionForDate || null);
    }
  }, [sessions, selectedDate]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculumId, selectedDate, page, rowsPerPage, selectedSession]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load students from curriculum
      const stuRes = await curriculumAPI.getStudents(curriculumId);
      const studentsData = stuRes.data?.students || stuRes.data?.data?.students || [];
      const total = stuRes.data?.totalCount || stuRes.data?.data?.totalCount || studentsData.length;
      setStudents(studentsData);
      setTotalCount(total);

      // Load attendance by session (if selected)
      let attendance = [];
      if (selectedSession) {
        const sessionId = selectedSession.curriculumSessionId || selectedSession;
        const attRes = await sessionAttendanceAPI.getAll({ 
          sessionId: sessionId, 
          date: selectedDate 
        });
        attendance = attRes.data || [];
      }

      const map = {};
      let p = 0, a = 0, l = 0;

      if (attendance.length > 0) {
        attendance.forEach(att => {
          map[att.studentId] = { status: att.status, notes: att.notes || '' };
          if (att.status === 'Present') p++;
          else if (att.status === 'Absent') a++;
          else if (att.status === 'Late') l++;
        });
      } else if (isToday) {
        // Auto default to present
        studentsData.forEach(s => {
          map[s.studentId || s.StudentId] = { status: 'Present', notes: '' };
          p++;
        });
      }

      setAttendanceData(map);
      const rate = total > 0 ? Math.round(((p + l) / total) * 100) : 0; // considering late as somewhat present
      setStats({ total, present: p, absent: a, late: l, rate });

    } catch (e) {
      console.error(e);
      setStudents([]);
      setTotalCount(0);
      setStats({ total: 0, present: 0, absent: 0, late: 0, rate: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Local state only - no API call
  const handleLocalChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes }
    }));
  };

  const markAll = (status) => {
    const all = {};
    students.forEach(s => {
      const id = s.studentId || s.StudentId;
      all[id] = { status, notes: '' };
    });
    setAttendanceData(prev => ({ ...prev, ...all }));
  };

  const clearAll = () => {
    const cleared = {};
    students.forEach(s => {
      const id = s.studentId || s.StudentId;
      cleared[id] = { status: '', notes: '' };
    });
    setAttendanceData(prev => ({ ...prev, ...cleared }));
  };

  // Save all attendance changes to API (by session)
  const handleSaveAll = async () => {
    if (!selectedSession) {
      alert('Vui lòng chọn buổi học trước khi lưu điểm danh!');
      return;
    }
    
    setSaving(true);
    try {
      const today = selectedDate;
      const sessionId = selectedSession.curriculumSessionId || selectedSession;
      
      // Tạo promises cho tất cả operations - lưu theo session
      const promises = Object.entries(attendanceData).map(([studentId, data]) => {
        if (!data || !data.status) return Promise.resolve(); // Skip empty
        
        return sessionAttendanceAPI.create({
          sessionId: sessionId,
          studentId: parseInt(studentId),
          date: today,
          status: data.status,
          notes: data.notes || ''
        });
      });

      await Promise.all(promises);
      await loadData();
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

  // Calculate unsaved changes
  const unsavedCount = Object.keys(attendanceData).length;

  return (
    <Box>
      {/* IMPROVED HEADER */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Điểm danh
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {curriculumInfo?.curriculumName} • Ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
          {selectedSession && ` • ${selectedSession.sessionName}`}
        </Typography>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <TextField
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        
        <Button
          variant="contained"
          color="success"
          startIcon={<Save />}
          onClick={handleSaveAll}
          disabled={saving || unsavedCount === 0 || !isToday || !selectedSession}
          title={!isToday ? "Chỉ được sửa điểm danh trong ngày" : !selectedSession ? "Vui lòng chọn buổi học" : ""}
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

      {/* Warning if no session selected */}
      {!selectedSession && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Vui lòng chọn buổi học để điểm danh.
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
            <Box>
              <Typography variant="body2" color="text.secondary">
                Vắng
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.absent}
              </Typography>
            </Box>
            <Box ml={3}>
              <Typography variant="body2" color="text.secondary">
                Muộn
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.late}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Có & Muộn
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
          onClick={() => markAll('Present')}
          disabled={!isToday}
        >
          Tất cả đi học
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="warning"
          startIcon={<Schedule />}
          onClick={() => markAll('Late')}
          disabled={!isToday}
        >
          Tất cả đi muộn
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="error"
          startIcon={<Cancel />}
          onClick={() => markAll('Absent')}
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
          Xóa
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
                        transition: 'background-color 0.2s',
                        backgroundColor: currentStatus === 'Present' 
                          ? 'rgba(76, 175, 80, 0.05)'
                          : currentStatus === 'Late' 
                            ? 'rgba(255, 152, 0, 0.08)' 
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
                        <Box display="flex" gap={1} justifyContent="center" height="100%">
                          <Chip
                            label="Có mặt"
                            color={currentStatus === 'Present' ? 'success' : 'default'}
                            onClick={() => isToday && handleLocalChange(studentId, 'Present')}
                            clickable={isToday}
                            size="small"
                            variant={currentStatus === 'Present' ? 'filled' : 'outlined'}
                            sx={{ fontWeight: currentStatus === 'Present' ? 600 : 400 }}
                          />
                          <Chip
                            label="Muộn"
                            color={currentStatus === 'Late' ? 'warning' : 'default'}
                            onClick={() => isToday && handleLocalChange(studentId, 'Late')}
                            clickable={isToday}
                            size="small"
                            variant={currentStatus === 'Late' ? 'filled' : 'outlined'}
                            sx={{ fontWeight: currentStatus === 'Late' ? 600 : 400 }}
                          />
                          <Chip
                            label="Vắng"
                            color={currentStatus === 'Absent' ? 'error' : 'default'}
                            onClick={() => isToday && handleLocalChange(studentId, 'Absent')}
                            clickable={isToday}
                            size="small"
                            variant={currentStatus === 'Absent' ? 'filled' : 'outlined'}
                            sx={{ fontWeight: currentStatus === 'Absent' ? 600 : 400 }}
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <TextField
                           size="small"
                           placeholder="Lý do..."
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
    </Box>
  );
}
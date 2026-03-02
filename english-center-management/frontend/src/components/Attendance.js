import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { CheckCircle, Cancel, Schedule, Person } from '@mui/icons-material';
import { curriculumAPI, attendanceAPI } from '../services/api';

const Attendance = () => {
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openNotesDialog, setOpenNotesDialog] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const statusOptions = [
    { value: 'Present', label: 'Có mặt', color: 'success' },
    { value: 'Absent', label: 'Vắng', color: 'error' },
    { value: 'Late', label: 'Muộn', color: 'warning' },
    { value: 'Excused', label: 'Có phép', color: 'info' },
  ];

  useEffect(() => {
    loadCurriculums();
  }, []);

  const loadCurriculums = async () => {
    try {
      const response = await curriculumAPI.getAll();
      setCurriculums(response.data);
    } catch (error) {
      console.error('Error loading curriculums:', error);
    }
  };

  const loadAttendance = async () => {
    if (!selectedLesson) return;

    try {
      setLoading(true);
      const response = await attendanceAPI.getByLesson(selectedLesson);
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error loading attendance:', error);
      setMessage('Lỗi khi tải dữ liệu điểm danh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLesson) {
      loadAttendance();
    }
  }, [selectedLesson]);

  const handleStatusChange = async (attendanceId, newStatus, studentId) => {
    try {
      if (attendanceId === 0) {
        // Create new attendance
        const lesson = getSelectedLesson();
        if (!lesson) return;

        const attendanceDate = new Date(lesson.curriculumSession?.curriculumDay?.scheduleDate || new Date());
        await attendanceAPI.create({
          studentId,
          lessonId: selectedLesson,
          attendanceDate: attendanceDate.toISOString().split('T')[0],
          status: newStatus,
          notes: '',
        });
      } else {
        // Update existing
        await attendanceAPI.update(attendanceId, {
          status: newStatus,
          notes: '',
        });
      }
      loadAttendance();
      setMessage('Cập nhật điểm danh thành công');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage('Lỗi khi cập nhật điểm danh');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleNotesClick = (attendance) => {
    setCurrentAttendance(attendance);
    setNotes(attendance.notes || '');
    setOpenNotesDialog(true);
  };

  const handleSaveNotes = async () => {
    if (!currentAttendance) return;

    try {
      await attendanceAPI.update(currentAttendance.attendanceId, {
        status: currentAttendance.status,
        notes,
      });
      setOpenNotesDialog(false);
      loadAttendance();
      setMessage('Cập nhật ghi chú thành công');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving notes:', error);
      setMessage('Lỗi khi lưu ghi chú');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getSelectedCurriculum = () => {
    return curriculums.find(c => c.curriculumId === parseInt(selectedCurriculum));
  };

  const getSelectedDay = () => {
    const curriculum = getSelectedCurriculum();
    return curriculum?.curriculumDays?.find(d => d.curriculumDayId === parseInt(selectedDay));
  };

  const getSelectedSession = () => {
    const day = getSelectedDay();
    return day?.curriculumSessions?.find(s => s.curriculumSessionId === parseInt(selectedSession));
  };

  const getSelectedLesson = () => {
    const session = getSelectedSession();
    return session?.lessons?.find(l => l.lessonId === parseInt(selectedLesson));
  };

  const resetSelections = (level) => {
    if (level === 'curriculum') {
      setSelectedDay('');
      setSelectedSession('');
      setSelectedLesson('');
    } else if (level === 'day') {
      setSelectedSession('');
      setSelectedLesson('');
    } else if (level === 'session') {
      setSelectedLesson('');
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Quản Lý Điểm Danh
      </Typography>

      {message && (
        <Alert severity={message.includes('thành công') ? 'success' : 'error'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Chọn Bài Học
        </Typography>
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Chương Trình Học</InputLabel>
            <Select
              value={selectedCurriculum}
              onChange={(e) => {
                setSelectedCurriculum(e.target.value);
                resetSelections('curriculum');
              }}
              label="Chương Trình Học"
            >
              {curriculums.map((curriculum) => (
                <MenuItem key={curriculum.curriculumId} value={curriculum.curriculumId}>
                  {curriculum.curriculumName} - {curriculum.className}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedCurriculum && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Ngày Học</InputLabel>
              <Select
                value={selectedDay}
                onChange={(e) => {
                  setSelectedDay(e.target.value);
                  resetSelections('day');
                }}
                label="Ngày Học"
              >
                {getSelectedCurriculum()?.curriculumDays?.map((day) => (
                  <MenuItem key={day.curriculumDayId} value={day.curriculumDayId}>
                    {new Date(day.scheduleDate).toLocaleDateString('vi-VN')} - {day.topic}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {selectedDay && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Buổi Học</InputLabel>
              <Select
                value={selectedSession}
                onChange={(e) => {
                  setSelectedSession(e.target.value);
                  resetSelections('session');
                }}
                label="Buổi Học"
              >
                {getSelectedDay()?.curriculumSessions?.map((session) => (
                  <MenuItem key={session.curriculumSessionId} value={session.curriculumSessionId}>
                    {session.sessionName} ({session.startTime} - {session.endTime})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {selectedSession && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Bài Học</InputLabel>
              <Select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                label="Bài Học"
              >
                {getSelectedSession()?.lessons?.map((lesson) => (
                  <MenuItem key={lesson.lessonId} value={lesson.lessonId}>
                    Bài {lesson.lessonNumber}: {lesson.lessonTitle}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Paper>

      {selectedLesson && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Điểm Danh - {getSelectedLesson()?.lessonTitle}
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Học Viên</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell>Ghi Chú</TableCell>
                  <TableCell>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceData.map((attendance) => (
                  <TableRow key={attendance.studentId}>
                    <TableCell>{attendance.studentName}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={attendance.status === 'Not Marked' ? 'Present' : attendance.status}
                          onChange={(e) => handleStatusChange(attendance.attendanceId, e.target.value, attendance.studentId)}
                        >
                          {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              <Chip
                                label={option.label}
                                color={option.color}
                                size="small"
                                variant={attendance.status === option.value ? 'filled' : 'outlined'}
                              />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>{attendance.notes || '-'}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleNotesClick(attendance)}
                      >
                        Ghi chú
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={openNotesDialog} onClose={() => setOpenNotesDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ghi Chú Điểm Danh</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ghi chú"
            fullWidth
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotesDialog(false)}>Hủy</Button>
          <Button onClick={handleSaveNotes} variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Attendance;
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
} from '@mui/material';
import {
  CalendarMonth,
  AccessTime,
  Room,
  Topic,
  Person,
  Refresh,
  ViewModule,
  ViewList,
} from '@mui/icons-material';
import { studentsAPI, authAPI } from '../../../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('week').add(1, 'day'));
  const [endDate, setEndDate] = useState(dayjs().endOf('week').add(1, 'day'));
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'table'

  useEffect(() => {
    loadSchedule();
  }, [startDate, endDate]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('Vui lòng đăng nhập để xem lịch học');
        return;
      }

      const user = JSON.parse(userData);
      let studentId = user.studentId;

      // Fallback: If studentId is missing, fetch profile from server
      if (!studentId) {
        try {
          const profileRes = await authAPI.getProfile();
          // The API response might be in PascalCase in backend but camelCase here due to interceptors
          const profileData = profileRes.data?.data || profileRes.data;
          if (profileData && profileData.studentId) {
            studentId = profileData.studentId;
            // Update localStorage for other pages
            localStorage.setItem('user', JSON.stringify({ ...user, studentId }));
          }
        } catch (profileErr) {
          console.error('Error fetching profile fallback:', profileErr);
          setError('Không thể tải thông tin học viên. Vui lòng làm mới trang.');
          return;
        }
      }

      if (!studentId) {
        setError('Tài khoản của bạn chưa được liên kết với hồ sơ học viên. Vui lòng liên hệ Admin để được hỗ trợ.');
        return;
      }

      // Lấy lịch học trong khoảng ngày đã chọn
      const params = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        pageSize: 100
      };

      const response = await studentsAPI.getSchedule(studentId, params);

      const scheduleData = response.data?.Data || response.data?.data?.Data || response.data?.data?.data || response.data?.data || response.data || [];
      setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
    } catch (err) {
      console.error('Error loading schedule:', err);
      if (err.response?.status === 404) {
        setError('Không tìm thấy thông tin học viên. Vui lòng liên hệ Admin để kiểm tra liên kết tài khoản.');
      } else if (err.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError('Không thể tải lịch học. Vui lòng thử lại sau.');
      }
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };


  const resetDates = () => {
    setStartDate(dayjs().startOf('week').add(1, 'day'));
    setEndDate(dayjs().endOf('week').add(1, 'day'));
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Helper to group schedule by day of week
  const getScheduleByDay = () => {
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const timeSlots = ['08:00', '10:00', '14:00', '16:00', '18:00', '20:00'];

    const scheduleMap = {};
    timeSlots.forEach(time => {
      scheduleMap[time] = {};
      days.forEach(day => {
        scheduleMap[time][day] = null;
      });
    });

    schedule.forEach(item => {
      if (item.date || item.Date) {
        const date = dayjs(item.date || item.Date);
        const dayOfWeek = days[date.day() === 0 ? 6 : date.day() - 1];
        const startTime = item.startTime || item.StartTime;

        // Find closest time slot
        const slot = timeSlots.find(t => startTime >= t) || timeSlots[timeSlots.length - 1];
        if (slot && dayOfWeek) {
          scheduleMap[slot][dayOfWeek] = item;
        }
      }
    });

    return { days, timeSlots, scheduleMap };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Lịch Học Của Tôi
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filter Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6">
              {selectedDate
                ? `Lịch học ngày ${selectedDate.format('DD/MM/YYYY')}`
                : 'Tất cả lịch học'
              }
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={2}>
              {selectedDate && (
                <Button variant="outlined" onClick={clearDateFilter}>
                  Xóa bộ lọc
                </Button>
              )}
              <Button variant="contained" startIcon={<Refresh />} onClick={loadSchedule}>
                Làm mới
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {schedule.length === 0 ? (
        <Paper sx={{ p: 10, textAlign: 'center', border: '2px dashed', borderColor: 'grey.300', bgcolor: 'transparent' }}>
          <CalendarMonth sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            {selectedDate
              ? 'Không có lịch học vào ngày này'
              : 'Không có lịch học nào'
            }
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {selectedDate
              ? 'Vui lòng chọn ngày khác để xem lịch học'
              : 'Liên hệ quản trị viên để được đăng ký lớp học'
            }
          </Typography>
        </Paper>
      ) : viewMode === 'table' ? (
        // Table View - Timetable
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 80 }}>Tiết</TableCell>
                  {getScheduleByDay().days.map(day => (
                    <TableCell key={day} align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {day}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {getScheduleByDay().timeSlots.map((time, index) => (
                  <TableRow key={time} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.light', color: 'white' }}>
                      {time}
                    </TableCell>
                    {getScheduleByDay().days.map(day => {
                      const item = getScheduleByDay().scheduleMap[time][day];
                      return (
                        <TableCell key={`${time}-${day}`} align="center" sx={{ minWidth: 120, height: 80 }}>
                          {item ? (
                            <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1, color: 'white' }}>
                              <Typography variant="caption" fontWeight="bold" display="block">
                                {item.courseName}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {item.startTime}-{item.endTime}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Phòng: {item.roomName}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {item.teacherName}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="textSecondary">-</Typography>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tổng kết
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Tổng số buổi học
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {schedule.length}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Số giáo viên
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {[...new Set(schedule.map(s => s.teacherName).filter(Boolean))].length}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Số phòng học
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {[...new Set(schedule.map(s => s.roomName).filter(Boolean))].length}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Số khóa học
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {[...new Set(schedule.map(s => s.courseName).filter(Boolean))].length}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </>
      ) : (
        // List View (original cards)
        <>
          <Grid container spacing={3}>
            {schedule
              .sort((a, b) => {
                // Sắp xếp theo ngày và giờ
                if (!a.Date || !b.Date) return 0;
                const dateA = new Date(a.Date);
                const dateB = new Date(b.Date);
                if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
                return (a.StartTime || '').localeCompare(b.StartTime || '');
              })
              .map((sessionItem) => (
                <Grid item xs={12} sm={6} md={4} key={sessionItem.sessionId}>
                  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {dayjs(sessionItem.Date).format('DD/MM/YYYY')}
                      </Typography>
                      <Typography variant="body2">
                        {sessionItem.CourseName}
                      </Typography>
                      {sessionItem.CurriculumName && (
                        <Typography variant="caption">
                          {sessionItem.CurriculumName}
                        </Typography>
                      )}
                    </Box>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body1" fontWeight="bold">
                          {sessionItem.startTime} - {sessionItem.endTime}
                        </Typography>
                      </Box>
                      {sessionItem.sessionName && (
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Topic fontSize="small" color="action" />
                          <Typography variant="body2">
                            Buổi {sessionItem.sessionNumber}: {sessionItem.sessionName}
                          </Typography>
                        </Box>
                      )}
                      {sessionItem.topic && (
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <CalendarMonth fontSize="small" color="action" />
                          <Typography variant="body2">
                            Chủ đề: {sessionItem.topic}
                          </Typography>
                        </Box>
                      )}
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Room fontSize="small" color="action" />
                        <Typography variant="body2">
                          Phòng: {sessionItem.roomName}
                        </Typography>
                      </Box>
                      {sessionItem.teacherName && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person fontSize="small" color="action" />
                          <Typography variant="body2">
                            Giáo viên: {sessionItem.teacherName}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ mt: 'auto', pt: 2 }}>
                        <Chip
                          label={sessionItem.status || 'Scheduled'}
                          size="small"
                          color={sessionItem.status === 'Scheduled' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {/* Summary */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tổng kết
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Tổng số buổi học
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {schedule.length}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Số giáo viên
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {[...new Set(schedule.map(s => s.teacherName).filter(Boolean))].length}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Số phòng học
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {[...new Set(schedule.map(s => s.roomName).filter(Boolean))].length}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Số khóa học
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {[...new Set(schedule.map(s => s.courseName).filter(Boolean))].length}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default StudentSchedule;

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
  Tooltip,
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
  ChevronLeft,
  ChevronRight,
  Today
} from '@mui/icons-material';
import { studentsAPI, authAPI } from '../../../services/api';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'list' | 'table'
  const [selectedDate, setSelectedDate] = useState(null);

  // Calculate start and end dates based on week offset
  const startDate = dayjs().startOf('week').add(1, 'day').add(weekOffset, 'week');
  const endDate = dayjs().endOf('week').add(1, 'day').add(weekOffset, 'week');

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  useEffect(() => {
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

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
      const scheduleArray = Array.isArray(scheduleData) ? scheduleData : [];
      setSchedule(scheduleArray);
      
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


  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handlePrevWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const handleCurrentWeek = () => {
    setWeekOffset(0);
  };

  const formatWeekRange = () => {
    const start = startDate.format('DD/MM');
    const end = endDate.format('DD/MM/YYYY');
    return `${start} - ${end}`;
  };


  // Helper to categorize time into periods
  const getTimePeriod = (time) => {
    if (!time) return 'Tối';
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'Sáng';
    if (hour >= 12 && hour < 18) return 'Chiều';
    return 'Tối';
  };

  // Helper to group schedule by day of week
  const getScheduleByDay = () => {
    const filteredSchedule = schedule;
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const timeSlots = ['Sáng', 'Chiều', 'Tối'];

    const scheduleMap = {};
    timeSlots.forEach(time => {
      scheduleMap[time] = {};
      days.forEach(day => {
        scheduleMap[time][day] = null;
      });
    });

    filteredSchedule.forEach(item => {
      if (item.date || item.Date) {
        const date = dayjs(item.date || item.Date);
        const dayOfWeek = days[date.day() === 0 ? 6 : date.day() - 1];
        const startTime = item.startTime || item.StartTime;
        const period = getTimePeriod(startTime);

        if (period && dayOfWeek) {
          scheduleMap[period][dayOfWeek] = item;
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
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <CalendarMonth sx={{ fontSize: { xs: 24, sm: 28, md: 32 }, color: '#4F46E5' }} />
        <Typography 
          variant="h4" 
          fontWeight="bold"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            lineHeight: 1.2
          }}
        >
          Thời Khóa Biểu
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Week Navigation */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 2
        }}>
          {/* Week Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ChevronLeft />}
              onClick={handlePrevWeek}
            >
              Tuần trước
            </Button>
            <Button
              variant={weekOffset === 0 ? "contained" : "outlined"}
              size="small"
              startIcon={<Today />}
              onClick={handleCurrentWeek}
            >
              Tuần này
            </Button>
            <Button
              variant="outlined"
              size="small"
              endIcon={<ChevronRight />}
              onClick={handleNextWeek}
            >
              Tuần sau
            </Button>
          </Box>

          {/* Week Display */}
          <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
            {formatWeekRange()}
          </Typography>

          {/* View Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <Tooltip title="Lịch tuần">
                <ToggleButton value="table">
                  <ViewModule />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Danh sách">
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>

            {selectedDate && (
              <Button variant="outlined" size="small" onClick={clearDateFilter}>
                Xóa lọc
              </Button>
            )}

            <Button
              variant="contained"
              size="small"
              startIcon={<Refresh />}
              onClick={loadSchedule}
              sx={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3730A3 0%, #4338CA 100%)',
                }
              }}
            >
              Làm mới
            </Button>
          </Box>
        </Box>
      </Paper>

      {viewMode === 'table' ? (
        // Table View - Timetable - Always show grid even when empty
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

          {/* Empty State Message - Inside the grid view */}
          {schedule.length === 0 && (
            <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'grey.300', bgcolor: 'grey.50' }}>
              <CalendarMonth sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Không có lịch học nào trong tuần này
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Liên hệ quản trị viên để được đăng ký lớp học
              </Typography>
            </Paper>
          )}

        </>
      ) : (
        // List View (original cards)
        <>
          {schedule.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'grey.300', bgcolor: 'grey.50' }}>
              <CalendarMonth sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Không có lịch học nào trong tuần này
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Liên hệ quản trị viên để được đăng ký lớp học
              </Typography>
            </Paper>
          ) : (
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
          )}

        </>
      )}
    </Container>
  );
};

export default StudentSchedule;

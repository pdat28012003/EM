import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  CalendarMonth,
  AccessTime,
  Room,
  Topic,
  Person,
  ViewModule,
  ViewList,
  Today,
  FiberManualRecord
} from '@mui/icons-material';
import { studentsAPI, authAPI } from '../../../services/api';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

// Get current week range (Monday to Sunday)
const getCurrentWeekRange = () => {
  const today = dayjs();
  const dayOfWeek = today.day(); // 0 = Sunday, 1 = Monday, ...
  const startOfWeek = today.add(dayOfWeek === 0 ? -6 : -(dayOfWeek - 1), 'day');
  const endOfWeek = startOfWeek.add(6, 'day');
  return { start: startOfWeek, end: endOfWeek };
};

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'list' | 'table'
  const [selectedDate, setSelectedDate] = useState(null);

  // Default to current week
  const currentWeek = getCurrentWeekRange();
  const [startDate, setStartDate] = useState(currentWeek.start);
  const [endDate, setEndDate] = useState(currentWeek.end);

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  useEffect(() => {
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        page: 1,
        pageSize: 100,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      };

      const response = await studentsAPI.getSchedule(studentId, params);

      const scheduleData = response.data?.Data || response.data?.data?.Data || response.data?.data?.data || response.data?.data || response.data || [];
      const scheduleArray = Array.isArray(scheduleData) ? scheduleData : [];

      // Debug logs
      console.log('Schedule API Response:', response.data);
      console.log('Schedule Data:', scheduleData);
      console.log('Schedule Array:', scheduleArray);
      console.log('Date Range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'));

      // Log each schedule item for debugging
      scheduleArray.forEach((item, index) => {
        console.log(`Schedule Item ${index}:`, {
          sessionId: item.SessionId || item.sessionId,
          date: item.Date || item.date,
          courseName: item.CourseName || item.courseName,
          roomName: item.RoomName || item.roomName,
          teacherName: item.TeacherName || item.teacherName,
          startTime: item.StartTime || item.startTime,
          endTime: item.EndTime || item.endTime
        });
      });

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

  const handleCurrentWeek = () => {
    const current = getCurrentWeekRange();
    setStartDate(current.start);
    setEndDate(current.end);
  };

  const formatDateRange = () => {
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
  const getScheduleByDay = useMemo(() => {
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

    console.log('Processing schedule items:', filteredSchedule);

    filteredSchedule.forEach(item => {
      if (item.date || item.Date) {
        const date = dayjs(item.date || item.Date);
        const dayOfWeek = days[date.day() === 0 ? 6 : date.day() - 1];
        const startTime = item.startTime || item.StartTime;
        const period = getTimePeriod(startTime);

        console.log('Processing item:', {
          date: item.date || item.Date,
          dayOfWeek,
          startTime,
          period,
          courseName: item.courseName || item.CourseName
        });

        if (period && dayOfWeek) {
          scheduleMap[period][dayOfWeek] = item;
        }
      }
    });

    console.log('Final schedule map:', scheduleMap);
    return { days, timeSlots, scheduleMap };
  }, [schedule]);

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
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
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

      {/* Date Range Navigation */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}>
          {/* Date Range Pickers & Display */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}>
            <DatePicker
              label="Từ ngày"
              value={startDate}
              onChange={(newValue) => newValue && setStartDate(newValue)}
              format="DD/MM/YYYY"
              slotProps={{ textField: { size: 'small', sx: { width: 125 } } }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary', pb: 1 }}>-</Typography>
            <DatePicker
              label="Đến ngày"
              value={endDate}
              onChange={(newValue) => newValue && setEndDate(newValue)}
              format="DD/MM/YYYY"
              slotProps={{ textField: { size: 'small', sx: { width: 125 } } }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<Today />}
              onClick={handleCurrentWeek}
              sx={{ mb: 0.5 }}
            >
              Tuần này
            </Button>
            <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1, mb: 1 }}>
              {formatDateRange()}
            </Typography>
          </Box>

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
              <Button variant="outlined" size="small" onClick={clearDateFilter} sx={{ ml: 1 }}>
                Xóa lọc
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {viewMode === 'table' ? (
        // Table View - Timetable - Enhanced with depth, sticky headers, TODAY highlight
        <>
          <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 600, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold', 
                      width: 60,
                      position: 'sticky',
                      left: 0,
                      top: 0,
                      zIndex: 3,
                      bgcolor: 'primary.main'
                    }}
                  >
                    Tiết
                  </TableCell>
                  {getScheduleByDay.days.map((day, index) => {
                    const todayIndex = dayjs().day() === 0 ? 6 : dayjs().day() - 1;
                    const isToday = index === todayIndex;
                    return (
                      <TableCell 
                        key={day} 
                        align="center" 
                        sx={{ 
                          color: 'white',
                          fontWeight: isToday ? 800 : 600,
                          top: 0,
                          zIndex: 2,
                          bgcolor: isToday ? '#6366F1' : 'primary.main',
                          borderBottom: isToday ? '3px solid #FCD34D' : 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                            {day}
                          </Typography>
                          {isToday && (
                            <Typography variant="caption" sx={{ fontSize: '10px', mt: 0.5, color: '#FCD34D', fontWeight: 700 }}>
                              HÔM NAY
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {getScheduleByDay.timeSlots.map((time) => (
                  <TableRow 
                    key={time} 
                    sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                    }}
                  >
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: 'primary.light', 
                        color: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 1
                      }}
                    >
                      {time}
                    </TableCell>
                    {getScheduleByDay.days.map((day, dayIndex) => {
                      const item = getScheduleByDay.scheduleMap[time][day];
                      const todayIndex = dayjs().day() === 0 ? 6 : dayjs().day() - 1;
                      const isTodayColumn = dayIndex === todayIndex;
                      
                      // NOW indicator
                      const now = dayjs().format('HH:mm');
                      const isNow = item && now >= item.startTime && now <= item.endTime;
                      
                      return (
                        <TableCell 
                          key={`${time}-${day}`} 
                          align="center" 
                          sx={{ 
                            minWidth: 120, 
                            height: 90,
                            p: 1,
                            bgcolor: isTodayColumn ? 'rgba(79,70,229,0.04)' : 'inherit',
                            border: isTodayColumn ? '1px dashed rgba(79,70,229,0.3)' : 'none'
                          }}
                        >
                          {item ? (
                            <Box 
                              sx={{ 
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: isNow ? '#F59E0B' : '#10B981',
                                color: 'white',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                                }
                              }}
                            >
                              {isNow && (
                                <Box sx={{ 
                                  position: 'absolute', 
                                  top: 2, 
                                  right: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.3,
                                  bgcolor: 'white',
                                  borderRadius: 1,
                                  px: 0.5,
                                  py: 0.2
                                }}>
                                  <FiberManualRecord sx={{ fontSize: 8, color: '#F59E0B', animation: 'pulse 1.5s infinite' }} />
                                  <Typography variant="caption" sx={{ fontSize: '9px', color: '#F59E0B', fontWeight: 700 }}>
                                    NOW
                                  </Typography>
                                </Box>
                              )}
                              <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '11px', lineHeight: 1.2 }}>
                                {item.courseName}
                              </Typography>
                              {item.curriculumName && (
                                <Typography variant="caption" display="block" sx={{ fontSize: '9px', opacity: 0.9, mt: 0.3 }}>
                                  {item.curriculumName}
                                </Typography>
                              )}
                              <Typography variant="caption" display="block" sx={{ fontSize: '10px', mt: 0.5 }}>
                                {item.startTime}-{item.endTime}
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ fontSize: '9px', opacity: 0.9 }}>
                                {item.roomName}
                              </Typography>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'grey.400',
                                fontSize: '0.75rem'
                              }}
                            >
                              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>Trống</Typography>
                            </Box>
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
        // List View - Grouped by Date (SaaS style)
        <>
          {schedule.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'grey.300', bgcolor: 'grey.50' }}>
              <CalendarMonth sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Không có lịch học nào trong khoảng thời gian này
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Liên hệ quản trị viên để được đăng ký lớp học
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {(() => {
                // Group by date
                const grouped = schedule.reduce((acc, item) => {
                  const dateKey = dayjs(item.Date || item.date).format('YYYY-MM-DD');
                  const displayDate = dayjs(item.Date || item.date).format('DD/MM/YYYY');
                  const dayOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][dayjs(item.Date || item.date).day()];
                  
                  if (!acc[dateKey]) {
                    acc[dateKey] = { displayDate, dayOfWeek, items: [] };
                  }
                  acc[dateKey].items.push(item);
                  return acc;
                }, {});

                return Object.entries(grouped)
                  .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                  .map(([dateKey, group]) => (
                    <Paper key={dateKey} elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                      <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, px: 2, py: 0.5 }}>
                          <Typography variant="h6" fontWeight="bold">{group.displayDate}</Typography>
                        </Box>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>{group.dayOfWeek}</Typography>
                        <Chip label={`${group.items.length} buổi`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 600, ml: 'auto' }} />
                      </Box>
                      <Box sx={{ p: 2 }}>
                        {group.items.sort((a, b) => (a.StartTime || a.startTime || '').localeCompare(b.StartTime || b.startTime || '')).map((sessionItem, index) => {
                          const isLast = index === group.items.length - 1;
                          const now = dayjs().format('HH:mm');
                          const isNow = now >= (sessionItem.StartTime || sessionItem.startTime) && now <= (sessionItem.EndTime || sessionItem.endTime);
                          return (
                            <Box key={sessionItem.sessionId || index} sx={{ display: 'flex', gap: 2, p: 2, borderRadius: 2, bgcolor: isNow ? 'rgba(245,158,11,0.08)' : 'white', border: isNow ? '1px solid #F59E0B' : '1px solid rgba(0,0,0,0.06)', transition: 'all 0.2s ease', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', transform: 'translateX(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }, mb: isLast ? 0 : 1.5 }}>
                              <Box sx={{ minWidth: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 1, bgcolor: isNow ? '#F59E0B' : 'primary.light', borderRadius: 2, color: 'white' }}>
                                <Typography variant="body2" fontWeight="bold">{sessionItem.StartTime || sessionItem.startTime}</Typography>
                                <Typography variant="caption">{sessionItem.EndTime || sessionItem.endTime}</Typography>
                                {isNow && <Chip label="NOW" size="small" sx={{ mt: 0.5, height: 16, fontSize: '9px', fontWeight: 700, bgcolor: 'white', color: '#F59E0B' }} />}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight="bold" color="primary.main">{sessionItem.CourseName || sessionItem.courseName}</Typography>
                                {(sessionItem.CurriculumName || sessionItem.curriculumName) && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{sessionItem.CurriculumName || sessionItem.curriculumName}</Typography>}
                                {(sessionItem.sessionName || sessionItem.sessionNumber) && <Chip label={`Buổi ${sessionItem.sessionNumber || ''}: ${sessionItem.sessionName || ''}`} size="small" sx={{ mb: 1, mr: 1 }} />}
                                {sessionItem.topic && <Chip label={sessionItem.topic} size="small" variant="outlined" sx={{ mb: 1 }} />}
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                                  <Box display="flex" alignItems="center" gap={0.5}><Room fontSize="small" color="action" /><Typography variant="body2">{sessionItem.roomName}</Typography></Box>
                                  {sessionItem.teacherName && <Box display="flex" alignItems="center" gap={0.5}><Person fontSize="small" color="action" /><Typography variant="body2">{sessionItem.teacherName}</Typography></Box>}
                                </Box>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </Paper>
                  ));
              })()}
            </Box>
          )}
        </>
      )}
    </Container>
    </LocalizationProvider>
  );
};

export default StudentSchedule;

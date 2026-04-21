import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Paper,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  DialogActions,
  Divider,
  Skeleton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  Schedule as ScheduleIcon,
  LocationOn,
  People,
  Event,
  Today,
  ViewWeek,
  CalendarMonth,
  ArrowBack,
  CheckCircle,
  VideoCameraFront
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { teachersAPI, curriculumAPI } from '../../../services/api';
import { useAsyncLoading } from '../../../hooks/useDocuments';

// Get current week range (Monday to Sunday)
const getCurrentWeekRange = () => {
  const today = dayjs();
  const dayOfWeek = today.day(); // 0 = Sunday, 1 = Monday, ...
  const startOfWeek = today.add(dayOfWeek === 0 ? -6 : -(dayOfWeek - 1), 'day');
  const endOfWeek = startOfWeek.add(6, 'day');
  return { start: startOfWeek, end: endOfWeek };
};

const TeacherSchedule = () => {
  const [teacher, setTeacher] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  
  // Sử dụng custom hook cho loading
  const { initialLoading, stopLoading } = useAsyncLoading();
  
  // Default to current week
  const currentWeek = getCurrentWeekRange();
  const [startDate, setStartDate] = useState(currentWeek.start);
  const [endDate, setEndDate] = useState(currentWeek.end);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  const loadScheduleData = useCallback(async (teacherId) => {
    try {
      // Load curriculum sessions by teacher ID with date range filter
      const params = {
        page: 1,
        pageSize: 100
      };
      
      if (startDate && endDate) {
        params.startDate = startDate.format('YYYY-MM-DD');
        params.endDate = endDate.format('YYYY-MM-DD');
      }
      
      const schedulesResponse = await teachersAPI.getSchedule(teacherId, params);
      
      // Handle different response structures
      let schedulesData = [];
      if (schedulesResponse.data?.Data) {
        schedulesData = schedulesResponse.data.Data;
      } else if (schedulesResponse.data?.data) {
        schedulesData = schedulesResponse.data.data;
      } else if (Array.isArray(schedulesResponse.data)) {
        schedulesData = schedulesResponse.data;
      }
      
      // Load classes for additional info
      const classesResponse = await curriculumAPI.getCurriculumsByTeacher(teacherId);
      const classesData = classesResponse.data?.data || classesResponse.data || [];
      
      // Map curriculum session data to match UI structure
      const mappedSchedules = Array.isArray(schedulesData) ? schedulesData.map(session => ({
        id: session.SessionId || session.sessionId,
        curriculumId: session.CurriculumId || session.curriculumId,
        classId: session.ClassId || session.classId,
        className: session.ClassName || session.className || session.CourseName || session.courseName,
        date: session.Date || session.date,
        startTime: session.StartTime || session.startTime,
        endTime: session.EndTime || session.endTime,
        room: session.RoomName || session.roomName || session.Room || session.room || 'Not assigned',
        status: (session.Status || session.status)?.toLowerCase() || 'scheduled',
        dayOfWeek: session.DayOfWeek || session.dayOfWeek,
        teacherId: session.TeacherId || session.teacherId,
        teacherName: session.TeacherName || session.teacherName,
        curriculumName: session.CurriculumName || session.curriculumName,
        sessionName: session.SessionName || session.sessionName,
        sessionNumber: session.SessionNumber || session.sessionNumber,
        topic: session.Topic || session.topic
      })) : [];
      
      setSchedules(mappedSchedules);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      setSchedules([]);
      setClasses([]);
    } finally {
      stopLoading(true);
    }
  }, [startDate, endDate, stopLoading]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setTeacher(parsedUser);
      if (parsedUser.teacherId || parsedUser.userId) {
        loadScheduleData(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, [loadScheduleData]);

  useEffect(() => {
    if (teacher) {
      loadScheduleData(teacher.teacherId || teacher.userId);
    }
  }, [startDate, endDate, teacher, loadScheduleData]); // Reload when date range changes

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'ongoing':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Đã hoàn thành';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'scheduled':
        return 'Đã lên lịch';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const formatTime = (time) => {
    return time ? time.substring(0, 5) : '';
  };



  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  const isUpcoming = (dateString, startTime) => {
    const now = new Date();
    const scheduleDateTime = new Date(`${dateString}T${startTime}`);
    return scheduleDateTime > now;
  };


  // Helper functions for table format
  const getTimeSlot = (time) => {
    if (!time) return '';
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'Sáng';
    if (hour >= 12 && hour < 18) return 'Chiều';
    if (hour >= 18 && hour < 22) return 'Tối';
    return '';
  };

  const getDayOfWeek = (dateString) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  const organizeScheduleForTable = (scheduleList) => {
    // Filter schedules by date range if selected
    let filteredSchedules = scheduleList;
    
    if (startDate && endDate) {
      filteredSchedules = scheduleList.filter(schedule => {
        const scheduleDate = dayjs(schedule.date);
        return scheduleDate.isAfter(startDate.subtract(1, 'day')) && scheduleDate.isBefore(endDate.add(1, 'day'));
      });
    }
    
    const tableData = {};
    const timeSlots = ['Sáng', 'Chiều', 'Tối'];
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    
    // Initialize table structure
    days.forEach(day => {
      tableData[day] = {};
      timeSlots.forEach(slot => {
        tableData[day][slot] = [];
      });
    });

    // Fill with schedule data
    filteredSchedules.forEach(schedule => {
      const day = getDayOfWeek(schedule.date);
      const slot = getTimeSlot(schedule.startTime);
      
      if (tableData[day] && tableData[day][slot]) {
        tableData[day][slot].push(schedule);
      }
    });

    return tableData;
  };

  const handleDateRangeFilter = () => {
    if (startDate && endDate && teacher) {
      loadScheduleData(teacher.teacherId || teacher.userId);
    }
  };

  if (initialLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Schedule Skeleton */}
        <Skeleton variant="rounded" height={80} sx={{ mb: 3, borderRadius: 3 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Grid item xs={12} md key={i}>
              <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  const tableSchedules = organizeScheduleForTable(schedules);
  const timeSlots = ['Sáng', 'Chiều', 'Tối'];
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  const ScheduleCell = ({ schedules }) => {
    if (!schedules || schedules.length === 0) {
      return (
        <TableCell sx={{ border: '1px solid #e0e0e0', minHeight: 80, textAlign: 'center', verticalAlign: 'middle', p: 1 }}>
          {/* Subtle empty slot */}
          <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', opacity: 0.5 }}>
            Trống
          </Typography>
        </TableCell>
      );
    }

    return (
      <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, verticalAlign: 'top', position: 'relative' }}>
        {schedules.map((schedule, index) => (
          <Box
            key={schedule.id || `schedule-${index}`}
            sx={{
              mb: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: schedule.status === 'completed' ? '#f0fdf4' : 
                       schedule.status === 'ongoing' ? '#fff7ed' : 
                       schedule.status === 'cancelled' ? '#fef2f2' : '#f0f9ff',
              border: `1px solid ${
                schedule.status === 'completed' ? '#86efac' : 
                schedule.status === 'ongoing' ? '#fdba74' : 
                schedule.status === 'cancelled' ? '#fca5a5' : '#7dd3fc'
              }`,
              opacity: schedule.status === 'completed' ? 0.7 : 1,
              boxShadow: schedule.status === 'ongoing' ? '0 0 12px rgba(251, 146, 60, 0.4)' : 'none',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}
            onClick={() => setSelectedEvent(schedule)}
          >
            {schedule.status === 'ongoing' && (
              <Box sx={{ position: 'absolute', top: -4, right: -4 }}>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              </Box>
            )}
            
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#1e293b' }}>
                {schedule.curriculumName || schedule.className || `Lớp ${schedule.classId}`}
              </Typography>
              {schedule.status === 'completed' && <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />}
            </Box>
            
            <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 0.5, fontWeight: 600 }}>
              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', mt: 0.5 }}>
              <LocationOn sx={{ fontSize: 12 }} />
              {schedule.room || 'Chưa phân công'}
            </Typography>
          </Box>
        ))}
      </TableCell>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <IconButton 
                color="inherit" 
                onClick={() => navigate('/teacher/dashboard')}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
              >
                <ArrowBack />
              </IconButton>
              <Avatar
                sx={{ 
                  width: 60, 
                  height: 60, 
                  border: '3px solid rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }}
                src={teacher?.avatar}
              >
                {teacher?.fullName?.charAt(0) || 'T'}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Lịch dạy
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {teacher?.fullName || 'Giáo viên'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ViewWeek />}
                onClick={() => setViewMode('week')}
                sx={{ 
                  bgcolor: viewMode === 'week' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white'
                }}
              >
                Tuần
              </Button>
              <Button
                variant="outlined"
                startIcon={<CalendarMonth />}
                onClick={() => setViewMode('month')}
                sx={{ 
                  bgcolor: viewMode === 'month' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white'
                }}
              >
                Tháng
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: '#1976d2', p: 1, borderRadius: 1, bgcolor: 'rgba(25,118,210,0.1)' }}>
                  <Today sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {schedules.filter(s => isToday(s.date)).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Hôm nay
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: '#388e3c', p: 1, borderRadius: 1, bgcolor: 'rgba(56,142,60,0.1)' }}>
                  <ScheduleIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {schedules.filter(s => isUpcoming(s.date, s.startTime)).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sắp tới
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: '#f57c00', p: 1, borderRadius: 1, bgcolor: 'rgba(245,124,0,0.1)' }}>
                  <People sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {classes.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Lớp đang dạy
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: '#7c4dff', p: 1, borderRadius: 1, bgcolor: 'rgba(124,77,255,0.1)' }}>
                  <Event sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {schedules.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tổng buổi học
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Schedule Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Lịch dạy tuần
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <DatePicker
                  label="Từ ngày"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { size: 'small' } }}
                />
                <Typography variant="body2">-</Typography>
                <DatePicker
                  label="Đến ngày"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { size: 'small' } }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleDateRangeFilter}
                  disabled={!startDate || !endDate}
                  size="small"
                >
                  Lọc
                </Button>
              </Box>
            </Box>
            
            {schedules.length === 0 ? (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <Typography variant="h5" color="text.secondary" gutterBottom fontWeight={600}>
                  Bạn không có lịch dạy vào thời gian này!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Hãy tận dụng thời gian để nghỉ ngơi hoặc chuẩn bị tài liệu thật tốt nhé ☕
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', bgcolor: '#f1f5f9', color: '#475569' }}>
                        Buổi
                      </TableCell>
                      {days.map(day => (
                        <TableCell 
                          key={day} 
                          sx={{ 
                            border: '1px solid #e0e0e0', 
                            fontWeight: 'bold', 
                            bgcolor: '#f8fafc',
                            color: '#334155',
                            textAlign: 'center'
                          }}
                        >
                          {day}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timeSlots.map(slot => (
                      <TableRow key={slot}>
                        <TableCell 
                          sx={{ 
                            border: '1px solid #e0e0e0', 
                            fontWeight: 'bold', 
                            bgcolor: '#f8fafc',
                            color: '#475569',
                            width: 80
                          }}
                        >
                          {slot}
                        </TableCell>
                        {days.map(day => (
                          <ScheduleCell 
                            key={`${day}-${slot}`} 
                            schedules={tableSchedules[day]?.[slot] || []} 
                          />
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Legend */}
            <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#475569' }}>
                Chú thích:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#f0f9ff', border: '1px solid #7dd3fc', borderRadius: 0.5 }}></Box>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>Đã lên lịch</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#fff7ed', border: '1px solid #fdba74', borderRadius: 0.5, boxShadow: '0 0 8px rgba(251,146,60,0.5)' }}></Box>
                <Typography variant="caption" sx={{ color: '#ea580c', fontWeight: 600 }}>Đang diễn ra</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 0.5 }}></Box>
                <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 500 }}>Đã hoàn thành</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 0.5 }}></Box>
                <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 500 }}>Đã hủy</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Quick View Event Dialog */}
      <Dialog 
        open={Boolean(selectedEvent)} 
        onClose={() => setSelectedEvent(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        {selectedEvent && (
          <>
            <Box sx={{ 
              p: 3, 
              bgcolor: selectedEvent.status === 'ongoing' ? '#fff7ed' : 
                       selectedEvent.status === 'completed' ? '#f0fdf4' : '#f0f9ff',
              borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Chip 
                  label={getStatusText(selectedEvent.status)} 
                  size="small" 
                  color={getStatusColor(selectedEvent.status)}
                  sx={{ fontWeight: 'bold' }}
                />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {selectedEvent.date}
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e293b' }}>
                {selectedEvent.curriculumName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
              </Typography>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                    <LocationOn sx={{ color: '#10b981' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Phòng học</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedEvent.room}</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <ScheduleIcon sx={{ color: '#3b82f6' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Chủ đề bài giảng</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedEvent.topic || 'Chưa cập nhật'}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
              <Button onClick={() => setSelectedEvent(null)} color="inherit">
                Đóng
              </Button>
              <Box display="flex" gap={1}>
                {selectedEvent.status === 'ongoing' && (
                  <Button 
                    variant="contained" 
                    color="warning" 
                    startIcon={<VideoCameraFront />}
                    sx={{ borderRadius: 2 }}
                  >
                    Vào dạy Online
                  </Button>
                )}
                <Button 
                  variant="contained" 
                  sx={{ 
                    bgcolor: '#10b981', 
                    '&:hover': { bgcolor: '#059669' },
                    borderRadius: 2
                  }}
                  onClick={() => {
                    console.log('Selected event:', selectedEvent);
                    console.log('CurriculumId:', selectedEvent.curriculumId, 'ClassId:', selectedEvent.classId);
                    const id = selectedEvent.curriculumId || selectedEvent.classId || selectedEvent.CurriculumId || selectedEvent.ClassId;
                    console.log('Navigate to:', `/teacher/curriculums/${id}`);
                    navigate(`/teacher/curriculums/${id}`);
                  }}
                >
                  Chi tiết lớp
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
    </LocalizationProvider>
  );
};

export default TeacherSchedule;

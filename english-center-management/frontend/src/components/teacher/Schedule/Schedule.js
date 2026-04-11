import React, { useState, useEffect } from 'react';
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
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  Schedule as ScheduleIcon,
  LocationOn,
  People,
  AccessTime,
  Event,
  Today,
  ViewWeek,
  CalendarMonth,
  ArrowBack,
  Add
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { teachersAPI, classesAPI } from '../../../services/api';

const TeacherSchedule = () => {
  const [teacher, setTeacher] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setTeacher(parsedUser);
      if (parsedUser.teacherId || parsedUser.userId) {
        loadScheduleData(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, []);

  useEffect(() => {
    if (teacher) {
      loadScheduleData(teacher.teacherId || teacher.userId);
    }
  }, [startDate, endDate]); // Reload when date range changes

  const loadScheduleData = async (teacherId) => {
    try {
      // Load curriculum sessions by teacher ID with date range filter
      const params = {};
      
      if (startDate && endDate) {
        params.startDate = startDate.format('YYYY-MM-DD');
        params.endDate = endDate.format('YYYY-MM-DD');
      }
      
      const schedulesResponse = await teachersAPI.getSchedule(teacherId, params);
      console.log('Teacher schedule API response:', schedulesResponse.data);
      const schedulesData = schedulesResponse.data?.data || [];
      console.log('Schedule data:', schedulesData);
      
      // Load classes for additional info
      const classesResponse = await classesAPI.getAll({ teacherId });
      const classesData = classesResponse.data?.data || classesResponse.data || [];
      
      // Map curriculum session data to match UI structure
      const mappedSchedules = Array.isArray(schedulesData) ? schedulesData.map(session => ({
        id: session.sessionId,
        classId: session.classId,
        className: session.courseName, // Use courseName from curriculum
        date: session.date, // Already has actual date
        startTime: session.startTime,
        endTime: session.endTime,
        room: session.roomName || 'Not assigned',
        status: session.status?.toLowerCase() || 'scheduled',
        dayOfWeek: session.dayOfWeek,
        teacherId: session.teacherId,
        teacherName: session.teacherName,
        curriculumName: session.curriculumName,
        sessionName: session.sessionName,
        sessionNumber: session.sessionNumber,
        topic: session.topic
      })) : [];
      
      setSchedules(mappedSchedules);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      setSchedules([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get next date for a given day of week
  const getNextDateForDay = (dayOfWeek) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const todayDay = today.getDay();
    const targetDay = days.indexOf(dayOfWeek);
    
    let daysUntilTarget = targetDay - todayDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Get next week's day if today or already passed
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilTarget);
    return nextDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  const groupSchedulesByDate = (scheduleList) => {
    const grouped = {};
    scheduleList.forEach(schedule => {
      if (!grouped[schedule.date]) {
        grouped[schedule.date] = [];
      }
      grouped[schedule.date].push(schedule);
    });
    return grouped;
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
        const scheduleDate = new Date(schedule.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return scheduleDate >= start && scheduleDate <= end;
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

  const handleClearFilter = () => {
    setStartDate(null);
    setEndDate(null);
    if (teacher) {
      loadScheduleData(teacher.teacherId || teacher.userId);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography>Đang tải lịch dạy...</Typography>
      </Container>
    );
  }

  const tableSchedules = organizeScheduleForTable(schedules);
  const timeSlots = ['Sáng', 'Chiều', 'Tối'];
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  // Component for schedule cell
  const ScheduleCell = ({ schedules }) => {
    if (!schedules || schedules.length === 0) {
      return <TableCell sx={{ border: '1px solid #e0e0e0', minHeight: 80 }}></TableCell>;
    }

    return (
      <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, verticalAlign: 'top' }}>
        {schedules.map((schedule, index) => (
          <Box
            key={schedule.id}
            sx={{
              mb: 1,
              p: 1,
              borderRadius: 1,
              bgcolor: schedule.status === 'completed' ? '#e8f5e8' : 
                       schedule.status === 'ongoing' ? '#fff3e0' : 
                       schedule.status === 'cancelled' ? '#ffebee' : '#e3f2fd',
              border: `1px solid ${
                schedule.status === 'completed' ? '#4caf50' : 
                schedule.status === 'ongoing' ? '#ff9800' : 
                schedule.status === 'cancelled' ? '#f44336' : '#2196f3'
              }`,
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 1,
                transform: 'scale(1.02)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={() => navigate(`/teacher/classes/${schedule.classId}`)}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
              {schedule.className || `Lớp ${schedule.classId}`}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              Phòng: {schedule.room || 'Chưa phân công'}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              {schedule.teacherName || teacher?.fullName}
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
                <Button 
                  variant="outlined" 
                  onClick={handleClearFilter}
                  size="small"
                >
                  Xóa bộ lọc
                </Button>
              </Box>
            </Box>
            
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                      Buổi
                    </TableCell>
                    {days.map(day => (
                      <TableCell 
                        key={day} 
                        sx={{ 
                          border: '1px solid #e0e0e0', 
                          fontWeight: 'bold', 
                          bgcolor: '#f5f5f5',
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
                          bgcolor: '#f9f9f9',
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

            {/* Legend */}
            <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Chú thích:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: 1 }}></Box>
                <Typography variant="caption">Đã lên lịch</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#fff3e0', border: '1px solid #ff9800', borderRadius: 1 }}></Box>
                <Typography variant="caption">Đang diễn ra</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#e8f5e8', border: '1px solid #4caf50', borderRadius: 1 }}></Box>
                <Typography variant="caption">Đã hoàn thành</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#ffebee', border: '1px solid #f44336', borderRadius: 1 }}></Box>
                <Typography variant="caption">Đã hủy</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
    </LocalizationProvider>
  );
};

export default TeacherSchedule;

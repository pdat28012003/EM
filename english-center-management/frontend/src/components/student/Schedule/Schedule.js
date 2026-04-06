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
} from '@mui/material';
import {
  CalendarMonth,
  AccessTime,
  Room,
  Topic,
  Person,
  Refresh,
} from '@mui/icons-material';
import { studentsAPI, authAPI } from '../../../services/api';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

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
        }
      }

      if (!studentId) {
        setError('Không tìm thấy thông tin học viên. Vui lòng liên hệ Admin để kiểm tra liên kết tài khoản.');
        return;
      }

      // Add date parameter if selected
      const params = selectedDate ? { date: selectedDate.format('YYYY-MM-DD') } : {};
      const response = await studentsAPI.getSchedule(studentId, params);
      
      const scheduleData = response.data?.Data || response.data?.data?.Data || response.data?.data?.data || response.data?.data || response.data || [];
      setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
    } catch (err) {
      console.error('Error loading schedule:', err);
      setError('Không thể tải lịch học. Vui lòng thử lại sau.');
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };


  const clearDateFilter = () => {
    setSelectedDate(null);
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
      ) : (
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

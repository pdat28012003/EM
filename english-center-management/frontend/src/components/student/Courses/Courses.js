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
  Avatar,
  Divider,
} from '@mui/material';
import {
  School,
  CalendarMonth,
  Person,
  ArrowForward,
  Schedule,
  LocationOn,
} from '@mui/icons-material';
import { classesAPI, authAPI } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const StudentClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('Vui lòng đăng nhập để xem lớp học');
        return;
      }

      const user = JSON.parse(userData);
      let studentId = user.studentId;
      console.log('User from localStorage:', user);
      console.log('StudentId:', studentId);

      // Fallback: If studentId is missing, fetch profile from server
      if (!studentId) {
        try {
          const profileRes = await authAPI.getProfile();
          const profileData = profileRes.data?.data || profileRes.data;
          console.log('Profile from API:', profileData);
          if (profileData && profileData.studentId) {
            studentId = profileData.studentId;
            localStorage.setItem('user', JSON.stringify({ ...user, studentId }));
          }
        } catch (profileErr) {
          console.error('Error fetching profile fallback:', profileErr);
        }
      }

      if (!studentId) {
        setError('Không tìm thấy thông tin học viên. Vui lòng liên hệ Admin.');
        return;
      }

      console.log('Fetching classes for studentId:', studentId);
      const response = await classesAPI.getStudentClasses(studentId);
      console.log('API Response:', response.data);
      const classesData = response.data?.Data || response.data?.data?.Data || response.data?.data?.data || response.data?.data || response.data || [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'Đang học';
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Chờ duyệt';
      default: return status || 'N/A';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Banner */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4, 
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Lớp học của tôi
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Quản lý các lớp học bạn đang tham gia tại trung tâm
          </Typography>
        </Box>
        <School 
          sx={{ 
            position: 'absolute', 
            right: -20, 
            bottom: -20, 
            fontSize: 200, 
            opacity: 0.1, 
            transform: 'rotate(-15deg)' 
          }} 
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {classes.length === 0 ? (
        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(0,0,0,0.02)', border: '2px dashed #e0e0e0' }}>
          <School sx={{ fontSize: 80, color: '#bdbdbd', mb: 2 }} />
          <Typography variant="h5" color="textSecondary" gutterBottom>
            Bạn chưa đăng ký lớp học nào
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Hãy liên hệ với trung tâm để được tư vấn và đăng ký lớp học phù hợp.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/student/dashboard')}>
            Về bảng điều khiển
          </Button>
        </Paper>
        ) : (
        <Grid container spacing={3}>
          {classes.map((classItem) => (
            <Grid item xs={12} md={6} lg={4} key={classItem.classId}>
              <Card 
                sx={{ 
                  borderRadius: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Chip 
                      label={getStatusLabel(classItem.status)} 
                      color={getStatusColor(classItem.status)} 
                      size="small" 
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      ID: {classItem.classId}
                    </Typography>
                  </Box>

                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {classItem.className}
                  </Typography>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {classItem.courseName}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                        <CalendarMonth sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Ngày bắt đầu
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {dayjs(classItem.startDate).format('DD/MM/YYYY')}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ bgcolor: 'info.light', width: 32, height: 32 }}>
                        <CalendarMonth sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Ngày kết thúc
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {dayjs(classItem.endDate).format('DD/MM/YYYY')}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ bgcolor: 'secondary.light', width: 32, height: 32 }}>
                        <LocationOn sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Phòng học
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {classItem.roomName || 'Chưa cập nhật'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ bgcolor: 'warning.light', width: 32, height: 32 }}>
                        <Person sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Giáo viên phụ trách
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {classItem.teacherName || 'Chưa cập nhật'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
                <Box p={2} pt={0}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    endIcon={<ArrowForward />}
                    sx={{ borderRadius: 2, py: 1 }}
                    onClick={() => navigate('/student/schedule')}
                  >
                    Xem chi tiết lịch học
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default StudentClasses;

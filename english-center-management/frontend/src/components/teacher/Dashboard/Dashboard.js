import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Group,
  Schedule,
  Assignment,
  Assessment,
  Book,
  Event,
  Notifications,
  Add,
  TrendingUp,
  People,
  Class,
  AccessTime,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../../services/api';

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: { currentValue: 0, changeFromLastWeek: 0, changeType: 'increase' },
    totalStudents: { currentValue: 0, changeFromLastWeek: 0, changeType: 'increase' },
    pendingAssignments: { currentValue: 0, changeFromLastWeek: 0, changeType: 'increase' },
    weeklySchedule: { currentValue: 0, changeFromLastWeek: 0, changeType: 'increase' },
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setTeacher(parsedUser);
      if (parsedUser.teacherId || parsedUser.userId) {
        loadTeacherStats(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, []);

  const loadTeacherStats = async (teacherId) => {
    try {
      const response = await dashboardAPI.getTeacherDashboardStatistics(teacherId);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading teacher dashboard stats:', error);
      // Fallback to mock data if API fails
      setStats({
        totalClasses: { currentValue: 5, changeFromLastWeek: 2, changeType: 'increase' },
        totalStudents: { currentValue: 48, changeFromLastWeek: 12, changeType: 'increase' },
        pendingAssignments: { currentValue: 12, changeFromLastWeek: -3, changeType: 'decrease' },
        weeklySchedule: { currentValue: 8, changeFromLastWeek: 2, changeType: 'increase' },
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
icon,
    color 
  }) => {
    const isPositive = changeType === 'increase';
    const isNeutral = change === 0;
    
    return (
     <Card
      sx={{
        height: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          
          <Box>
            <Typography variant="h6" color="textSecondary">
              {title}
            </Typography>

            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>

            <Typography
              variant="body2"
              color={isPositive ? 'success.main' : 'error.main'}
            >
              {isPositive ? '+' : ''}{change} so với tuần trước
            </Typography>
          </Box>

          <Box sx={{ color }}>
            {icon}
          </Box>

        </Box>
      </CardContent>
    </Card>
  );
};

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

  const menuItems = [
    { 
      icon: <Class />,
      title: 'Lớp học', 
      subtitle: 'Quản lý lớp học',
      path: '/teacher/classes',
      color: '#1976d2',
      count: stats.totalClasses.currentValue
    },
    { 
      icon: <Assignment />, 
      title: 'Bài tập', 
      subtitle: 'Giao và chấm bài tập',
      path: '/teacher/assignments',
      color: '#388e3c',
      count: stats.pendingAssignments.currentValue
    },
    { 
      icon: <Assessment />, 
      title: 'Điểm số', 
      subtitle: 'Xem kết quả học tập',
      path: '/teacher/grades',
      color: '#f57c00',
      count: stats.totalStudents.currentValue
    },
    { 
      icon: <Schedule />, 
      title: 'Lịch dạy', 
      subtitle: 'Quản lý lịch giảng dạy',
      path: '/teacher/schedule',
      color: '#7c4dff',
      count: stats.weeklySchedule.currentValue
    },
    { 
      icon: <Book />, 
      title: 'Tài liệu', 
      subtitle: 'Quản lý tài liệu giảng dạy',
      path: '/teacher/materials',
      color: '#4caf50',
      count: 23
    },
  ];

  const statsCards = [
    { 
      title: 'Tổng lớp học', 
      value: stats.totalClasses.currentValue, 
      change: stats.totalClasses.changeFromLastWeek,
      changeType: stats.totalClasses.changeType,
      icon: <Class />, 
      color: '#1976d2'
    },
    { 
      title: 'Tổng học viên', 
      value: stats.totalStudents.currentValue, 
      change: stats.totalStudents.changeFromLastWeek,
      changeType: stats.totalStudents.changeType,
      icon: <People />, 
      color: '#388e3c'
    },
    { 
      title: 'Bài tập chờ chấm', 
      value: stats.pendingAssignments.currentValue, 
      change: stats.pendingAssignments.changeFromLastWeek,
      changeType: stats.pendingAssignments.changeType,
      icon: <Assignment />, 
      color: '#f57c00'
    },
    { 
      title: 'Lịch dạy tuần này', 
      value: stats.weeklySchedule.currentValue, 
      change: stats.weeklySchedule.changeFromLastWeek,
      changeType: stats.weeklySchedule.changeType,
      icon: <Schedule />, 
      color: '#7c4dff'
    }
  ];

  const recentActivities = [
    { 
      type: 'assignment', 
      title: 'Bài tập mới', 
      description: 'Lập trình cơ bản - Lớp Python 101',
      time: '2 giờ trước',
      icon: <Assignment />
    },
    { 
      type: 'grade', 
      title: 'Chấm điểm xong', 
      description: 'Tiếng Anh giao tiếp - Lớp IELTS 201',
      time: '5 giờ trước',
      icon: <Assessment />
    },
    { 
      type: 'class', 
      title: 'Học viên mới', 
      description: 'Nguyễn Văn A đã tham gia lớp Python 101',
      time: '1 ngày trước',
      icon: <Group />
    },
    { 
      type: 'schedule', 
      title: 'Lịch dạy mới', 
      description: 'Thêm lịch dạy Tiếng Anh giao tiếp thứ 3',
      time: '2 ngày trước',
      icon: <Schedule />
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{ 
                width: 80, 
                height: 80, 
                border: '3px solid rgba(255,255,255,0.3)',
                bgcolor: 'rgba(255,255,255,0.1)'
              }}
              src={teacher?.avatar}
            >
              {teacher?.fullName?.charAt(0) || 'T'}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Chào mừng quay trở lại!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {teacher?.fullName || 'Giáo viên'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                Hôm nay là một ngày tuyệt vời để bắt đầu buổi học
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
              icon={stat.icon}
              color={stat.color}
            />
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Truy cập nhanh
            </Typography>
            <Grid container spacing={2}>
              {menuItems.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      },
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Box sx={{ color: item.color, mb: 1 }}>
                        {React.cloneElement(item.icon, { sx: { fontSize: 40 } })}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.subtitle}
                      </Typography>
                     
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Hoạt động gần đây
              </Typography>
              <Button 
                size="small" 
                variant="outlined"
                startIcon={<Notifications />}
              >
                Xem tất cả
              </Button>
            </Box>
            
            <Box>
              {recentActivities.map((activity, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    py: 2,
                    borderBottom: index < recentActivities.length - 1 ? '1px solid #eee' : 'none'
                  }}
                >
                  <Box sx={{ 
                    color: activity.type === 'assignment' ? '#388e3c' :
                           activity.type === 'grade' ? '#f57c00' :
                           activity.type === 'class' ? '#1976d2' : '#7c4dff',
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'rgba(0,0,0,0.04)'
                  }}>
                    {React.cloneElement(activity.icon, { sx: { fontSize: 20 } })}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {activity.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {activity.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <AccessTime sx={{ fontSize: 16, color: 'textSecondary' }} />
                      <Typography variant="caption" color="textSecondary">
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Thông báo
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Notifications color="warning" />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    3 bài tập chờ chấm
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Hạn trong 2 ngày
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{ color: '#f57c00', p: 1, borderRadius: 1, bgcolor: 'rgba(245,124,0,0.04)' }}>
                <Assessment sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  5 điểm số cần nhập
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Lớp IELTS 201
                </Typography>
              </Box>
            </Box>
            
            <Button 
              variant="contained" 
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate('/teacher/notifications')}
            >
              Xem tất cả thông báo
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeacherDashboard;

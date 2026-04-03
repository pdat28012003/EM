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
  Badge,
  Divider,
  Stack
} from '@mui/material';
import {
  Group,
  Schedule,
  Assignment,
  Assessment,
  Book,
  Notifications,
  People,
  Class,
  AccessTime,
  ArrowUpward,
  ArrowDownward,
  TrendingUp,
  School,
  Folder,
  CheckCircle,
  Warning,
  CalendarToday,
  ChevronRight,
  PlayArrow
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, classesAPI, activityLogsAPI } from '../../../services/api';

// Safe text render - no highlighting
const HighlightText = ({ text }) => {
  return text || null;
};

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState(null);
  const [recentClasses, setRecentClasses] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: { currentValue: 0, changeFromLastWeek: 0, changeType: 'increase' },
    totalStudents: { currentValue: 0, changeFromLastWeek: 0, changeType: 'increase' },
    pendingAssignments: { currentValue: 0, changeFromLastWeek: 0, changeType: 'increase' },
    weeklySchedule: { currentValue: 0, changeFromLastWeek: 0, changeType: 'increase' },
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [menuBadges, setMenuBadges] = useState({
    classes: 0,
    documents: 0
  });
  const navigate = useNavigate();
  const hasLoaded = React.useRef(false);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getActivityIcon = (iconType) => {
    switch (iconType?.toLowerCase()) {
      case 'assignment': return <Assignment />;
      case 'assignment_turned_in': return <CheckCircle />;
      case 'grading': return <Assessment />;
      case 'group_add': return <Group />;
      case 'menu_book': return <Book />;
      case 'quiz': return <Assessment />;
      case 'check_circle': return <CheckCircle />;
      case 'payment': return <TrendingUp />;
      case 'warning': return <Warning />;
      case 'schedule': return <CalendarToday />;
      default: return <Notifications />;
    }
  };

  const getActivityColor = (iconType) => {
    switch (iconType?.toLowerCase()) {
      case 'assignment':
      case 'assignment_turned_in': return { bg: '#e3f2fd', icon: '#1976d2' };
      case 'grading': return { bg: '#f3e5f5', icon: '#7c4dff' };
      case 'check_circle': return { bg: '#e8f5e9', icon: '#388e3c' };
      case 'warning': return { bg: '#fff3e0', icon: '#f57c00' };
      case 'group_add': return { bg: '#fce4ec', icon: '#e91e63' };
      default: return { bg: '#f5f5f5', icon: '#757575' };
    }
  };

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setTeacher(parsedUser);
      if (parsedUser.teacherId || parsedUser.userId) {
        loadTeacherData(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, []);

  const loadTeacherData = async (teacherId) => {
    try {
      const statsResponse = await dashboardAPI.getTeacherDashboardStatistics(teacherId);
      setStats(statsResponse.data);
      
      const classesResponse = await classesAPI.getAll({ teacherId, limit: 3 });
      const classesData = classesResponse.data?.data || classesResponse.data?.Data || [];
      const mappedClasses = Array.isArray(classesData) ? classesData.map(cls => ({
        id: cls.classId,
        name: cls.className || 'Lớp không tên',
        students: cls.currentStudents || 0,
        nextClass: cls.schedule || 'Chưa có lịch',
        progress: cls.progress || 0
      })) : [];
      setRecentClasses(mappedClasses);
      
      const activitiesResponse = await activityLogsAPI.getMyActivities({ limit: 10 });
      const activitiesData = activitiesResponse.data || [];
      const mappedActivities = Array.isArray(activitiesData) ? activitiesData.map(a => ({
        type: a.iconType || 'default',
        title: a.title,
        description: a.description,
        time: formatTimeAgo(a.createdAt),
        icon: getActivityIcon(a.iconType),
        color: getActivityColor(a.iconType)
      })) : [];
      setActivities(mappedActivities);
      
      // Load menu badges (mock for now - replace with real API)
      setMenuBadges({
        classes: 3,
        documents: 2
      });
    } catch (error) {
      console.error('Error loading teacher dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced StatCard with icon background and sparkline
  const StatCard = ({ title, value, change, changeType, icon, color }) => {
    const isPositive = changeType === 'increase';
    
    return (
      <Card
        sx={{
          height: '100%',
          background: '#fff',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                {title}
              </Typography>
              
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                {value}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: isPositive ? 'rgba(56, 142, 60, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                    color: isPositive ? '#388e3c' : '#d32f2f',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {isPositive ? <ArrowUpward sx={{ fontSize: 14, mr: 0.3 }} /> : <ArrowDownward sx={{ fontSize: 14, mr: 0.3 }} />}
                  {isPositive ? '+' : ''}{change}%
                </Box>
                <Typography variant="caption" color="text.secondary">
                  vs tuần trước
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: `${color}12`,
                  color: color,
                }}
              >
                {React.cloneElement(icon, { sx: { fontSize: 22 } })}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Quick Action Card with badge
  const QuickActionCard = ({ item, badge }) => (
    <Card
      sx={{
        cursor: 'pointer',
        height: '100%',
        background: '#fff',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-6px) scale(1.01)',
          boxShadow: '0 16px 32px rgba(0,0,0,0.1)',
          '& .action-icon': {
            transform: 'scale(1.1) rotate(5deg)',
          },
          '& .action-arrow': {
            transform: 'translateX(4px)',
            opacity: 1,
          },
        },
        transition: 'all 0.3s ease',
      }}
      onClick={() => navigate(item.path)}
    >
      <CardContent sx={{ p: 3, position: 'relative' }}>
        {badge && (
          <Chip
            label={badge}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: item.color,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22,
            }}
          />
        )}
        
        <Box
          className="action-icon"
          sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${item.color}15`,
            color: item.color,
            mb: 2,
            transition: 'transform 0.3s ease',
          }}
        >
          {React.cloneElement(item.icon, { sx: { fontSize: 28 } })}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>
            {item.title}
          </Typography>
          <ChevronRight 
            className="action-arrow" 
            sx={{ 
              fontSize: 20, 
              color: item.color,
              opacity: 0,
              transition: 'all 0.3s ease',
            }} 
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {item.subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

  const menuItems = [
    { 
      icon: <Class />,
      title: 'Lớp học', 
      subtitle: 'Quản lý và theo dõi lớp',
      path: '/teacher/classes',
      color: '#4F46E5',
      badgeKey: 'classes'
    },
    { 
      icon: <Schedule />, 
      title: 'Lịch dạy', 
      subtitle: 'Xem lịch giảng dạy',
      path: '/teacher/schedule',
      color: '#4F46E5'
    },
    { 
      icon: <Folder />, 
      title: 'Tài liệu', 
      subtitle: 'Tài liệu giảng dạy',
      path: '/teacher/documents',
      color: '#4F46E5',
      badgeKey: 'documents'
    },
  ];

  const statsCards = [
    { 
      title: 'Tổng lớp học', 
      value: stats.totalClasses.currentValue, 
      change: stats.totalClasses.changeFromLastWeek,
      changeType: stats.totalClasses.changeType,
      icon: <School />, 
      color: '#4F46E5'
    },
    { 
      title: 'Tổng học viên', 
      value: stats.totalStudents.currentValue, 
      change: stats.totalStudents.changeFromLastWeek,
      changeType: stats.totalStudents.changeType,
      icon: <People />, 
      color: '#4F46E5'
    },
    { 
      title: 'Bài tập chờ chấm', 
      value: stats.pendingAssignments.currentValue, 
      change: stats.pendingAssignments.changeFromLastWeek,
      changeType: stats.pendingAssignments.changeType,
      icon: <Assignment />, 
      color: '#4F46E5'
    },
    { 
      title: 'Lịch dạy tuần này', 
      value: stats.weeklySchedule.currentValue, 
      change: stats.weeklySchedule.changeFromLastWeek,
      changeType: stats.weeklySchedule.changeType,
      icon: <CalendarToday />, 
      color: '#4F46E5'
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Priority Focus: Today's Tasks */}
      <Box sx={{ mb: 4 }}>
        <Paper
          sx={{
            p: 0,
            borderRadius: 3,
            background: '#4F46E5',
            color: 'white',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
          }}
        >
          {/* Decorative background elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              right: 100,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }}
          />
          
          <Box sx={{ p: 4, position: 'relative', zIndex: 1 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                  <Avatar
                    sx={{ 
                      width: 72, 
                      height: 72, 
                      border: '3px solid rgba(255,255,255,0.3)',
                      bgcolor: 'rgba(255,255,255,0.15)',
                      fontSize: '1.75rem',
                      fontWeight: 600,
                    }}
                    src={teacher?.avatar}
                  >
                    {teacher?.fullName?.charAt(0) || 'T'}
                  </Avatar>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1 }}>
                      GIẢNG VIÊN
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {teacher?.fullName || 'Giáo viên'}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.85 }}>
                      {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Priority Alert */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    px: 3,
                    py: 2,
                  }}
                >
                  <Badge badgeContent={stats.pendingAssignments.currentValue} color="error">
                    <Assignment sx={{ fontSize: 28 }} />
                  </Badge>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {stats.pendingAssignments.currentValue > 0 
                        ? `Bạn có ${stats.pendingAssignments.currentValue} bài cần chấm hôm nay` 
                        : 'Không có bài tập cần chấm'}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      {stats.pendingAssignments.currentValue > 0 
                        ? 'Hạn chót: 23:59 tối nay' 
                        : 'Thời gian rảnh để chuẩn bị bài giảng mới!'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={() => navigate('/teacher/assignments')}
                  sx={{
                    bgcolor: 'white',
                    color: '#4F46E5',
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.95)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {stats.pendingAssignments.currentValue > 0 ? 'Chấm bài ngay' : 'Xem lịch dạy'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, ml: 0.5 }}>
          Truy cập nhanh
        </Typography>
        <Grid container spacing={2}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <QuickActionCard item={item} badge={item.badgeKey ? (menuBadges[item.badgeKey] > 0 ? `${menuBadges[item.badgeKey]} ${item.badgeKey === 'classes' ? 'lớp mới' : 'chưa duyệt'}` : null) : null} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Recent Classes & Activities */}
      <Grid container spacing={3}>
        {/* Recent Classes - Redesigned with less text */}
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              borderRadius: 3,
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School sx={{ color: '#4F46E5' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  Lớp học gần đây
                </Typography>
              </Box>
              <Button 
                size="small"
                endIcon={<ChevronRight />}
                onClick={() => navigate('/teacher/classes')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Xem tất cả
              </Button>
            </Box>
            
            <Stack spacing={2}>
              {recentClasses.map((classItem, index) => (
                <Card
                  key={classItem.id}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    '&:hover': {
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      borderColor: '#4F46E5',
                    },
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        {classItem.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {classItem.students} học viên
                          </Typography>
                        </Box>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 16, color: '#f57c00' }} />
                          <Typography variant="body2" color="text.secondary">
                            {classItem.nextClass}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Large Progress Bar */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Tiến độ khóa học
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#4F46E5' }}>
                          {classItem.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={classItem.progress}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: 'rgba(79, 70, 229, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            bgcolor: classItem.progress >= 80 ? '#4F46E5' : classItem.progress >= 50 ? '#6366F1' : '#9CA3AF',
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Grid>
        
        {/* Activity Log - Timeline Style */}
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              borderRadius: 3,
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Notifications sx={{ color: '#4F46E5' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Hoạt động gần đây
              </Typography>
            </Box>
            
            <Box sx={{ position: 'relative' }}>
              {/* Timeline line */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 20,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  bgcolor: 'rgba(0,0,0,0.06)',
                  borderRadius: 1,
                }}
              />
              
              <Stack spacing={0}>
                {activities.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      py: 2,
                      position: 'relative',
                      borderBottom: index < activities.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                    }}
                  >
                    {/* Timeline dot */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: activity.color.bg,
                        color: activity.color.icon,
                        zIndex: 1,
                        flexShrink: 0,
                      }}
                    >
                      {React.cloneElement(activity.icon, { sx: { fontSize: 20 } })}
                    </Box>
                    
                    <Box sx={{ flex: 1, pt: 0.5 }}>
                    <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#1e293b',
                          lineHeight: 1.5,
                        }}
                      >
                        <HighlightText text={activity.title} />
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                        {activity.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <AccessTime sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>
                          {activity.time}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeacherDashboard;

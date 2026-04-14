import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  LinearProgress,
  Paper,
  Button,
  Stack
} from '@mui/material';
import {
  Schedule,
  Assignment,
  Assessment,
  Book,
  Notifications,
  AccessTime,
  School,
  Folder,
  CheckCircle,
  Warning,
  CalendarToday,
  ChevronRight,
  PlayArrow,
  Star,
  Payment,
  TrendingUp,
  NewReleases,
  Announcement,
  Grade
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { gradesAPI, activityLogsAPI, studentsAPI, authAPI, assignmentsAPI } from '../../services/api';

// Safe text render - no highlighting
const HighlightText = ({ text }) => {
  return text || null;
};

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [recentClasses, setRecentClasses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: { currentValue: 0, change: 0, changeType: 'increase' },
    sessionsThisWeek: { currentValue: 0, change: 0, changeType: 'increase' },
    averageGrade: { currentValue: 0, change: 0, changeType: 'increase' },
    completedAssignments: { currentValue: 0, change: 0, changeType: 'increase' },
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [gradeHistory, setGradeHistory] = useState([]);
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
      case 'assignment': return <Assignment sx={{ color: '#ff9800' }} />;
      case 'assignment_turned_in': return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'grading': return <Assessment sx={{ color: '#9c27b0' }} />;
      case 'menu_book': return <Book sx={{ color: '#2196f3' }} />;
      case 'quiz': return <Assessment sx={{ color: '#ff5722' }} />;
      case 'check_circle': return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'payment': return <Star sx={{ color: '#ffc107' }} />;
      case 'warning': return <Warning sx={{ color: '#ff5722' }} />;
      case 'schedule': return <CalendarToday sx={{ color: '#3f51b5' }} />;
      case 'announcement': return <Announcement sx={{ color: '#00bcd4' }} />;
      case 'new_releases': return <NewReleases sx={{ color: '#ff9800' }} />;
      default: return <Notifications sx={{ color: '#757575' }} />;
    }
  };

  const getActivityColor = (iconType) => {
    switch (iconType?.toLowerCase()) {
      case 'assignment':
      case 'assignment_turned_in': return { bg: '#e3f2fd', icon: '#1976d2' };
      case 'grading': return { bg: '#f3e5f5', icon: '#7c4dff' };
      case 'check_circle': return { bg: '#e8f5e9', icon: '#388e3c' };
      case 'warning': return { bg: '#fff3e0', icon: '#f57c00' };
      case 'payment': return { bg: '#fffde7', icon: '#fbc02d' };
      default: return { bg: '#f5f5f5', icon: '#757575' };
    }
  };

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const initDashboard = async () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        // Handle both PascalCase (from API) and camelCase (from localStorage)
        let studentId = parsedUser.studentId || parsedUser.StudentId;

        // Fallback if studentId is missing
        if (!studentId) {
          try {
            const profileRes = await authAPI.getProfile();
            // Handle PascalCase response: Data.UserId or Data.StudentId
            const responseData = profileRes.data;
            const profileData = responseData?.Data || responseData?.data || responseData;
            
            // Try to get studentId from various possible property names
            const fetchedStudentId = profileData?.studentId || profileData?.StudentId || 
                                    profileData?.userId || profileData?.UserId;
            
            if (fetchedStudentId) {
              studentId = fetchedStudentId;
              // Normalize to camelCase for localStorage
              const updatedUser = { 
                ...parsedUser, 
                studentId: fetchedStudentId,
                fullName: profileData?.fullName || profileData?.FullName || parsedUser.fullName,
                name: profileData?.fullName || profileData?.FullName || parsedUser.name
              };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setStudent(updatedUser);
            } else {
              setStudent(parsedUser);
            }
          } catch (err) {
            console.error('Error fetching fallback profile in dashboard:', err);
            setStudent(parsedUser);
          }
        } else {
          setStudent(parsedUser);
        }

        if (studentId) {
          loadStudentDashboardData(studentId);
        } else {
          console.warn('No studentId found, cannot load dashboard data');
          setLoading(false);
        }
      } else {
        console.warn('No user data in localStorage');
        setLoading(false);
      }
    };

    initDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStudentDashboardData = async (studentId) => {
    try {
      // 1. Load Enrollments (Classes)
      const enrollmentsRes = await studentsAPI.getEnrollments(studentId);
      const enrollmentsData = enrollmentsRes.data || [];
      setRecentClasses(enrollmentsData.slice(0, 3).map(e => ({
        id: e.classId,
        name: e.className,
        courseName: 'Khóa học tiếng Anh', // EnrollmentDto doesn't have courseName
        progress: Math.floor(Math.random() * 100), // Random progress for now as it's not in DTO
        nextSession: 'Thứ 2, 08:00'
      })));

      // 2. Load Grades for Stats
      const gradesRes = await gradesAPI.getByStudent(studentId);
      const gradesData = gradesRes.data || [];
      const avgGrade = gradesData.length > 0
        ? (gradesData.reduce((acc, curr) => acc + curr.score, 0) / gradesData.length).toFixed(1)
        : 0;

      // 3. Load Schedule (Stats)
      const scheduleRes = await studentsAPI.getSchedule(studentId);
      const scheduleData = scheduleRes.data?.data || scheduleRes.data?.Data || scheduleRes.data || [];
      
      // Calculate sessions for this week vs last week
      const now = dayjs();
      const startOfThisWeek = now.startOf('week').add(1, 'day'); // Monday
      const endOfThisWeek = now.endOf('week').add(1, 'day'); // Sunday
      const startOfLastWeek = startOfThisWeek.subtract(7, 'day');
      const endOfLastWeek = endOfThisWeek.subtract(7, 'day');
      
      
      const thisWeekSessions = scheduleData.filter(s => {
        const date = dayjs(s.date || s.Date);
        const isThisWeek = date.isAfter(startOfThisWeek.subtract(1, 'day')) && date.isBefore(endOfThisWeek.add(1, 'day'));
        return isThisWeek;
      }).length;
      
      const lastWeekSessions = scheduleData.filter(s => {
        const date = dayjs(s.date || s.Date);
        return date.isAfter(startOfLastWeek.subtract(1, 'day')) && date.isBefore(endOfLastWeek.add(1, 'day'));
      }).length;
      
      
      // 4. Load Activities (limit to 4)
      const activitiesRes = await activityLogsAPI.getMyActivities({ limit: 4 });
      const activitiesData = activitiesRes.data || [];
      setActivities(activitiesData.map(a => ({
        type: a.iconType || 'default',
        title: a.title,
        description: a.description,
        time: formatTimeAgo(a.createdAt),
        icon: getActivityIcon(a.iconType),
        color: getActivityColor(a.iconType)
      })));

      // 5. Removed unused next class logic

      // 6. Load grade history for chart
      const gradeHistoryData = gradesData
        .sort((a, b) => new Date(a.createdAt || a.CreatedAt) - new Date(b.createdAt || b.CreatedAt))
        .slice(-10)
        .map(g => ({
          date: dayjs(g.createdAt || g.CreatedAt).format('DD/MM'),
          score: g.score,
          subject: g.assignmentName || g.AssignmentName || 'Bài tập'
        }));
      setGradeHistory(gradeHistoryData);

      let completedCount = 0;
      try {
        for (const cls of enrollmentsData.slice(0, 5)) { // Limit to 5 classes for performance
          const classId = cls.classId;
          if (!classId) continue;
          const res = await assignmentsAPI.getAll({ classId, studentId, pageSize: 100 });
          const assignmentsData = res.data?.data || res.data || [];
          const classAssignments = Array.isArray(assignmentsData) ? assignmentsData : [];
          completedCount += classAssignments.filter(a => 
            a.studentStatus === 'Graded' || a.studentStatus === 'Submitted'
          ).length;
        }
      } catch (e) {
        console.error('Error loading assignments for stats:', e);
      }

      // Calculate change percentage for sessions
      const sessionChange = lastWeekSessions === 0 
        ? (thisWeekSessions > 0 ? 100 : 0)
        : Math.round(((thisWeekSessions - lastWeekSessions) / lastWeekSessions) * 100);

      // Update Stats
      setStats({
        totalCourses: { currentValue: enrollmentsData.length, change: 0, changeType: 'increase' },
        sessionsThisWeek: { 
          currentValue: thisWeekSessions, 
          change: Math.abs(sessionChange), 
          changeType: sessionChange >= 0 ? 'increase' : 'decrease' 
        },
        averageGrade: { currentValue: `${avgGrade}/10`, change: 0.5, changeType: 'increase' },
        completedAssignments: { currentValue: completedCount, change: 0, changeType: 'increase' },
      });

    } catch (error) {
      console.error('Error loading student dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Grade Progress Chart Component
  const GradeProgressChart = () => {
    if (gradeHistory.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Grade sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Chưa có dữ liệu điểm số để hiển thị biểu đồ
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Assignment />}
            onClick={() => navigate('/student/assignments')}
            sx={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)'
              },
              transition: 'all 0.3s ease',
              px: 3,
              py: 1
            }}
          >
            Làm bài tập ngay
          </Button>
        </Box>
      );
    }

    const maxScore = Math.max(...gradeHistory.map(g => g.score), 10);
    const minScore = Math.min(...gradeHistory.map(g => g.score), 0);
    const range = maxScore - minScore || 1;

    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUp sx={{ color: '#4F46E5' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Tiến bộ điểm s
          </Typography>
        </Box>
        
        {/* Simple Line Chart */}
        <Box sx={{ height: 200, position: 'relative', bgcolor: 'rgba(79, 70, 229, 0.02)', borderRadius: 2, p: 2 }}>
          <svg width="100%" height="100%" viewBox="0 0 400 160">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="40"
                y1={20 + i * 30}
                x2="380"
                y2={20 + i * 30}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
            ))}
            
            {/* Progress line */}
            <polyline
              fill="none"
              stroke="#4F46E5"
              strokeWidth="3"
              points={gradeHistory.map((grade, index) => {
                const x = 40 + (index * (340 / Math.max(gradeHistory.length - 1, 1)));
                const y = 140 - ((grade.score - minScore) / range) * 120;
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Data points */}
            {gradeHistory.map((grade, index) => {
              const x = 40 + (index * (340 / Math.max(gradeHistory.length - 1, 1)));
              const y = 140 - ((grade.score - minScore) / range) * 120;
              return (
                <g key={index}>
                  <circle cx={x} cy={y} r="5" fill="#4F46E5" />
                  <text x={x} y={y - 10} textAnchor="middle" fontSize="12" fill="#4F46E5" fontWeight="bold">
                    {grade.score}
                  </text>
                  <text x={x} y={155} textAnchor="middle" fontSize="10" fill="#666">
                    {grade.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Điểm trung bình: {(gradeHistory.reduce((acc, g) => acc + g.score, 0) / gradeHistory.length).toFixed(1)}/10
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Xu hướng: {gradeHistory.length > 1 && gradeHistory[gradeHistory.length - 1].score > gradeHistory[0].score ? '📈 Tăng' : '📉 Giảm'}
          </Typography>
        </Box>
      </Box>
    );
  };

  const StatCard = ({ title, value, icon, color }) => {
    return (
      <Card
        sx={{
          height: '100%',
          background: '#fff',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.08)' },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>{title}</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>{value}</Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${color}12`, color: color }}>
              {React.cloneElement(icon, { sx: { fontSize: 22 } })}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const QuickActionCard = ({ item }) => (
    <Card
      sx={{
        cursor: 'pointer', height: '100%', background: '#fff', border: '1px solid rgba(226, 232, 240, 0.8)', position: 'relative', overflow: 'hidden',
        '&:hover': { transform: 'translateY(-6px) scale(1.01)', boxShadow: '0 16px 32px rgba(0,0,0,0.1)', '& .action-icon': { transform: 'scale(1.1) rotate(5deg)' }, '& .action-arrow': { transform: 'translateX(4px)', opacity: 1 } },
        transition: 'all 0.3s ease',
      }}
      onClick={() => navigate(item.path)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box className="action-icon" sx={{ width: 56, height: 56, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${item.color}15`, color: item.color, mb: 2, transition: 'transform 0.3s ease' }}>
          {React.cloneElement(item.icon, { sx: { fontSize: 28 } })}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>{item.title}</Typography>
          <ChevronRight className="action-arrow" sx={{ fontSize: 20, color: item.color, opacity: 0, transition: 'all 0.3s ease' }} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.subtitle}</Typography>
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
    { icon: <Book />, title: 'Khóa học', subtitle: 'Học tập & Tài liệu', path: '/student/courses', color: '#4F46E5' },
    { icon: <Schedule />, title: 'Thời khóa biểu', subtitle: 'Lịch học cá nhân', path: '/student/schedule', color: '#4F46E5' },
    { icon: <Assessment />, title: 'Kết quả', subtitle: 'Bảng điểm & Nhận xét', path: '/student/grades', color: '#4F46E5' },
    { icon: <Folder />, title: 'Tài liệu', subtitle: 'Kho tài liệu bài tập', path: '/student/documents', color: '#4F46E5' },
    { icon: <Payment />, title: 'Thanh toán', subtitle: 'Học phí & Lịch sử', path: '/student/payments', color: '#4F46E5' },
  ];

  const statsCards = [
    { title: 'Khóa học', value: stats.totalCourses.currentValue, change: stats.totalCourses.change, changeType: stats.totalCourses.changeType, icon: <School />, color: '#4F46E5' },
    { title: 'Tiết học tuần này', value: stats.sessionsThisWeek.currentValue, change: stats.sessionsThisWeek.change, changeType: stats.sessionsThisWeek.changeType, icon: <CalendarToday />, color: '#4F46E5' },
    { title: 'Điểm trung bình', value: stats.averageGrade.currentValue, change: stats.averageGrade.change * 10, changeType: stats.averageGrade.changeType, icon: <Star />, color: '#4F46E5' },
    { title: 'Bài tập đã nộp', value: stats.completedAssignments.currentValue, change: stats.completedAssignments.change, changeType: stats.completedAssignments.changeType, icon: <Assignment />, color: '#4F46E5' }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Student Banner Header */}
      <Box sx={{ mb: 4 }}>
        <Paper
          sx={{
            p: 0, borderRadius: 3, background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #8B5CF6 100%)', color: 'white', overflow: 'hidden', position: 'relative',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
          }}
        >
          {/* Decorative background elements */}
          <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <Box sx={{ position: 'absolute', bottom: -30, right: 100, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <Box sx={{ p: 4, position: 'relative', zIndex: 1 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                  <Avatar
                    sx={{ width: 72, height: 72, border: '3px solid rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.15)', fontSize: '1.75rem', fontWeight: 600 }}
                    src={student?.avatar}
                  >
                    {student?.fullName?.charAt(0) || student?.name?.charAt(0) || 'S'}
                  </Avatar>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1 }}>HỌC VIÊN</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{student?.fullName || student?.name || 'Học viên'}</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 600 }}>
                      Cấp độ: {student?.level || 'Beginner'} • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 2, px: 3, py: 2 }}>
                  <CalendarToday sx={{ fontSize: 24 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Tiến độ học tập tốt!</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>Bạn đã hoàn thành 85% mục tiêu tuần này. Cố gắng lên nhé!</Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button
                  variant="contained" size="large" startIcon={<PlayArrow />}
                  onClick={() => navigate('/student/schedule')}
                  sx={{
                    bgcolor: 'white', color: '#4F46E5', fontWeight: 700, px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)', transition: 'all 0.3s ease',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.95)', transform: 'translateY(-2px)', boxShadow: '0 12px 30px rgba(0,0,0,0.25)' },
                  }}
                >
                  Vào học ngay
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>


      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, ml: 0.5 }}>Truy cập nhanh</Typography>
        <Grid container spacing={2}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <QuickActionCard item={item} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Bottom Grid: Recent Classes, Activity & Grade Progress */}
      <Grid container spacing={3}>
        {/* Recent Classes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School sx={{ color: '#4F46E5' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Chương trình học</Typography>
              </Box>
              <Button size="small" endIcon={<ChevronRight />} onClick={() => navigate('/student/courses')} sx={{ textTransform: 'none', fontWeight: 600 }}>Xem tất cả</Button>
            </Box>

            <Stack spacing={2}>
              {recentClasses.length > 0 ? recentClasses.map((classItem) => (
                <Card
                  key={classItem.id}
                  sx={{
                    cursor: 'pointer', borderRadius: 2, border: '1px solid rgba(226, 232, 240, 0.8)', transition: 'all 0.3s ease',
                    '&:hover': { boxShadow: '0 8px 25px rgba(0,0,0,0.1)', borderColor: '#4F46E5' },
                  }}
                  onClick={() => navigate(`/student/courses/${classItem.id}`)}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>{classItem.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">{classItem.courseName}</Typography>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 16, color: '#f57c00' }} />
                          <Typography variant="body2" color="text.secondary">{classItem.nextSession}</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Tiến trình học tập</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#4F46E5' }}>{classItem.progress}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate" value={classItem.progress}
                        sx={{
                          height: 8, borderRadius: 4, bgcolor: 'rgba(79, 70, 229, 0.1)',
                          '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#4F46E5' },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              )) : (
                <Typography variant="body2" color="text.secondary">Bạn chưa đăng ký chương trình học nào.</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Learning Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications sx={{ color: '#4F46E5' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Hoạt động học tập</Typography>
              </Box>
            </Box>
            
            <Box sx={{ maxHeight: 280, overflowY: 'auto', pr: 1 }}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 1 }} />
                <Stack spacing={0}>
                  {activities.slice(0, 4).map((activity, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 2, py: 1.5, position: 'relative', borderBottom: index < 3 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: activity.color.bg, color: activity.color.icon, zIndex: 1, flexShrink: 0 }}>
                        {React.cloneElement(activity.icon, { sx: { fontSize: 20 } })}
                      </Box>
                      <Box sx={{ flex: 1, pt: 0.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.4, fontSize: '0.9rem' }}>
                          <HighlightText text={activity.title} />
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, lineHeight: 1.4, fontSize: '0.8rem' }}>{activity.description}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <AccessTime sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>{activity.time}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  {activities.length === 0 && <Typography variant="body2" color="text.secondary">Chưa có hoạt động nào.</Typography>}
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Grade Progress Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <GradeProgressChart />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentDashboard;


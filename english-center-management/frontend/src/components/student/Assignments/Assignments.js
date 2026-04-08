import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Assignment,
  AssignmentTurnedIn,
  ErrorOutline,
  AccessTime,
  Launch,
} from '@mui/icons-material';
import { studentsAPI, assignmentsAPI, authAPI } from '../../../services/api';
import dayjs from 'dayjs';

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('Vui lòng đăng nhập để xem bài tập');
        return;
      }

      const user = JSON.parse(userData);
      let studentId = user.studentId;

      // Fallback: If studentId is missing, fetch profile from server
      if (!studentId) {
        try {
          const profileRes = await authAPI.getProfile();
          const profileData = profileRes.data?.data || profileRes.data;
          if (profileData && profileData.studentId) {
            studentId = profileData.studentId;
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

      // Step 1: Get student's classes
      const enrollmentsRes = await studentsAPI.getEnrollments(studentId);
      const classes = enrollmentsRes.data?.Data || enrollmentsRes.data?.data?.Data || enrollmentsRes.data?.data?.data || enrollmentsRes.data?.data || enrollmentsRes.data || [];

      if (classes.length === 0) {
        setAssignments([]);
        return;
      }

      // Step 2: Get assignments for each class
      // Note: This could be optimized if backend had a student-specific assignment endpoint
      const allAssignments = [];
      for (const cls of classes) {
        try {
          const res = await assignmentsAPI.getAll({ classId: cls.classId, pageSize: 1000 });
          const assignmentsData = res.data?.Data || res.data?.data?.Data || res.data?.data?.data || res.data?.data || res.data || [];
          allAssignments.push(...(Array.isArray(assignmentsData) ? assignmentsData : []));
        } catch (e) {
          console.error(`Error loading assignments for class ${cls.classId}:`, e);
        }
      }

      // Sort by due date (closest first)
      const sorted = allAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setAssignments(sorted);
    } catch (err) {
      console.error('Error loading assignments:', err);
      if (err.response?.status === 404) {
        setError('Không tìm thấy thông tin học viên. Vui lòng liên hệ Admin để kiểm tra liên kết tài khoản.');
      } else if (err.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError('Không thể tải bài tập. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (assignment) => {
    const now = dayjs();
    const dueDate = dayjs(assignment.dueDate);
    const isOverdue = now.isAfter(dueDate);

    // This is a simplification as we don't have submission status per student in the main list yet
    if (isOverdue) return { label: 'Quá hạn', color: 'error', icon: <ErrorOutline fontSize="small" /> };
    return { label: 'Đang mở', color: 'primary', icon: <AccessTime fontSize="small" /> };
  };

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true;
    const now = dayjs();
    const dueDate = dayjs(a.dueDate);
    if (filter === 'pending') return now.isBefore(dueDate);
    if (filter === 'overdue') return now.isAfter(dueDate);
    return true;
  });

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
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Bài tập & Nhiệm vụ
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Hoàn thành các bài tập để cải thiện kết quả học tập của bạn
          </Typography>
        </Box>
        <AssignmentTurnedIn
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

      {/* Stats and Filters */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Box display="flex" gap={1}>
            <Button
              variant={filter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilter('all')}
              sx={{ borderRadius: 10 }}
            >
              Tất cả ({assignments.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setFilter('pending')}
              sx={{ borderRadius: 10 }}
            >
              Chờ nộp
            </Button>
            <Button
              variant={filter === 'overdue' ? 'contained' : 'outlined'}
              color="error"
              onClick={() => setFilter('overdue')}
              sx={{ borderRadius: 10 }}
            >
              Quá hạn
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, display: 'flex', justifyContent: 'space-around', boxShadow: 1 }}>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight="bold" color="primary">{assignments.length}</Typography>
              <Typography variant="caption" color="textSecondary">Tổng bài</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight="bold" color="error">{assignments.filter(a => dayjs().isAfter(dayjs(a.dueDate))).length}</Typography>
              <Typography variant="caption" color="textSecondary">Quá hạn</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight="bold" color="success">12</Typography>
              <Typography variant="caption" color="textSecondary">Hoàn thành</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {filteredAssignments.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '2px dashed #e0e0e0' }}>
          <Assignment sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Không tìm thấy bài tập nào trong mục này
          </Typography>
        </Paper>
      ) : (
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredAssignments.map((assignment) => {
            const statusInfo = getStatusInfo(assignment);
            return (
              <ListItem
                key={assignment.assignmentId}
                component={Paper}
                elevation={1}
                sx={{
                  borderRadius: 3,
                  p: 3,
                  transition: '0.2s',
                  '&:hover': {
                    transform: 'scale(1.01)',
                    boxShadow: 3
                  }
                }}
              >
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: assignment.type === 'Quiz' ? 'primary.light' : 'secondary.light', width: 50, height: 50 }}>
                    <Assignment />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={2} mb={0.5}>
                      <Typography variant="h6" fontWeight="bold">{assignment.title}</Typography>
                      <Chip label={assignment.type} size="small" variant="outlined" />
                    </Box>
                  }
                  secondary={
                    <Box mt={1}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Lớp: <Typography component="span" variant="body2" fontWeight="bold" color="textPrimary">{assignment.className}</Typography>
                      </Typography>
                      <Box display="flex" alignItems="center" gap={3}>
                        <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                          <AccessTime fontSize="small" />
                          <Typography variant="caption">Hạn nộp: {dayjs(assignment.dueDate).format('DD/MM/YYYY HH:mm')}</Typography>
                        </Box>
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                        />
                      </Box>
                    </Box>
                  }
                />
                <Box>
                  <Tooltip title="Vào làm bài">
                    <Button
                      variant="contained"
                      endIcon={<Launch />}
                      sx={{ borderRadius: 2 }}
                    >
                      Làm bài
                    </Button>
                  </Tooltip>
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}
    </Container>
  );
};

export default StudentAssignments;

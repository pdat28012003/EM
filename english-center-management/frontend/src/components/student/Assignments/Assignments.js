import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
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
  Divider,
} from '@mui/material';
import {
  Assignment,
  AssignmentTurnedIn,
  ErrorOutline,
  AccessTime,
  Launch,
  Schedule,
  CheckCircle,
  Block,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import { studentsAPI, assignmentsAPI, authAPI } from '../../../services/api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const StudentAssignments = () => {
  const navigate = useNavigate();
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

      // Step 1: Get student's curriculums (not classes)
      const curriculumsRes = await studentsAPI.getCurriculums(studentId);
      const curriculums = curriculumsRes.data || [];
      console.log('Curriculums for student:', curriculums);

      if (curriculums.length === 0) {
        setAssignments([]);
        return;
      }

      // Step 2: Get assignments for each curriculum
      const allAssignments = [];
      for (const curr of curriculums) {
        try {
          const curriculumId = curr.curriculumId;
          if (!curriculumId) {
            console.log('Skipping - no curriculumId:', curr);
            continue;
          }
          console.log('Loading assignments for curriculumId:', curriculumId);
          const res = await assignmentsAPI.getAll({ curriculumId, studentId, pageSize: 1000 });
          console.log('Assignments response for', curriculumId, ':', res.data);
          const assignmentsData = res.data?.data || res.data || [];
          allAssignments.push(...(Array.isArray(assignmentsData) ? assignmentsData : []));
        } catch (e) {
          console.error(`Error loading assignments for curriculum ${curr.curriculumId}:`, e);
        }
      }
      console.log('Total assignments loaded:', allAssignments.length);

      // Remove duplicates by assignmentId
      const uniqueAssignments = [];
      const seenIds = new Set();
      for (const assignment of allAssignments) {
        const id = assignment.assignmentId || assignment.AssignmentId;
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          uniqueAssignments.push(assignment);
        }
      }
      console.log('Unique assignments count:', uniqueAssignments.length);

      // Sort by due date (closest first)
      const sorted = uniqueAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
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

  const getDeadlineInfo = (dueDate) => {
    const now = dayjs();
    const deadline = dayjs(dueDate);
    const diffDays = deadline.diff(now, 'day');
    const diffHours = deadline.diff(now, 'hour');
    const diffMinutes = deadline.diff(now, 'minute');
    
    if (deadline.isBefore(now)) {
      return { text: 'Đã hết hạn', color: 'error', urgent: true };
    } else if (diffDays === 0) {
      if (diffHours <= 2) {
        return { text: `Còn ${diffMinutes} phút`, color: 'error', urgent: true };
      } else {
        return { text: `Còn ${diffHours} giờ`, color: 'warning', urgent: true };
      }
    } else if (diffDays === 1) {
      return { text: 'Còn 1 ngày', color: 'warning', urgent: false };
    } else if (diffDays <= 3) {
      return { text: `Còn ${diffDays} ngày`, color: 'info', urgent: false };
    } else {
      return { text: `Còn ${diffDays} ngày`, color: 'success', urgent: false };
    }
  };

  const getStatusInfo = (assignment) => {
    if (assignment.studentStatus === 'Graded' || assignment.studentStatus === 'Submitted') {
      return { label: 'Đã hoàn thành', color: 'success', icon: <AssignmentTurnedIn fontSize="small" /> };
    }

    const now = dayjs();
    const dueDate = dayjs(assignment.dueDate);
    const isOverdue = now.isAfter(dueDate);

    if (isOverdue) return { label: 'Quá hạn', color: 'error', icon: <ErrorOutline fontSize="small" /> };
    return { label: 'Đang mở', color: 'primary', icon: <AccessTime fontSize="small" /> };
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'Essay': return 'Bài tập về nhà';
      case 'Quiz': return 'Trắc nghiệm';
      default: return type || 'Bài tập';
    }
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

      {/* Stats and Filters - Improved Layout */}
      <Paper sx={{ p: 4, mb: 4, bgcolor: 'background.paper', boxShadow: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={3}>
          {/* Left: Filter Buttons */}
          <Box display="flex" gap={2} alignItems="center" sx={{ pl: 1 }}>
            <Typography variant="body1" fontWeight={600} sx={{ mr: 1, color: 'text.secondary' }}>
              Lọc theo:
            </Typography>
            <Button
              variant={filter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilter('all')}
              sx={{ 
                borderRadius: 10,
                background: filter === 'all' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'transparent',
                borderColor: filter === 'all' ? 'transparent' : 'rgba(16, 185, 129, 0.3)',
                color: filter === 'all' ? 'white' : 'text.secondary',
                boxShadow: filter === 'all' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                '&:hover': {
                  background: filter === 'all' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'rgba(16, 185, 129, 0.1)',
                  borderColor: filter === 'all' ? 'transparent' : 'rgba(16, 185, 129, 0.5)',
                  boxShadow: filter === 'all' ? '0 6px 16px rgba(16, 185, 129, 0.4)' : 'none',
                }
              }}
            >
              Tất cả ({assignments.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'contained' : 'outlined'}
              onClick={() => setFilter('pending')}
              sx={{ 
                borderRadius: 10,
                background: filter === 'pending' ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : 'transparent',
                borderColor: filter === 'pending' ? 'transparent' : 'rgba(59, 130, 246, 0.3)',
                color: filter === 'pending' ? 'white' : 'text.secondary',
                boxShadow: filter === 'pending' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                '&:hover': {
                  background: filter === 'pending' ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'rgba(59, 130, 246, 0.1)',
                  borderColor: filter === 'pending' ? 'transparent' : 'rgba(59, 130, 246, 0.5)',
                  boxShadow: filter === 'pending' ? '0 6px 16px rgba(59, 130, 246, 0.4)' : 'none',
                }
              }}
            >
              Chờ nộp
            </Button>
            <Button
              variant={filter === 'overdue' ? 'contained' : 'outlined'}
              onClick={() => setFilter('overdue')}
              sx={{ 
                borderRadius: 10,
                background: filter === 'overdue' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'transparent',
                borderColor: filter === 'overdue' ? 'transparent' : 'rgba(239, 68, 68, 0.3)',
                color: filter === 'overdue' ? 'white' : 'text.secondary',
                boxShadow: filter === 'overdue' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
                '&:hover': {
                  background: filter === 'overdue' ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : 'rgba(239, 68, 68, 0.1)',
                  borderColor: filter === 'overdue' ? 'transparent' : 'rgba(239, 68, 68, 0.5)',
                  boxShadow: filter === 'overdue' ? '0 6px 16px rgba(239, 68, 68, 0.4)' : 'none',
                }
              }}
            >
              Quá hạn
            </Button>
          </Box>
          
          {/* Right: Stats */}
          <Box display="flex" gap={3} alignItems="center">
            <Box textAlign="center" sx={{ px: 2 }}>
              <Typography variant="h5" fontWeight="bold" color="#10B981">{assignments.length}</Typography>
              <Typography variant="caption" color="textSecondary">Tổng bài</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box textAlign="center" sx={{ px: 2 }}>
              <Typography variant="h5" fontWeight="bold" color="#EF4444">{assignments.filter(a => dayjs().isAfter(dayjs(a.dueDate))).length}</Typography>
              <Typography variant="caption" color="textSecondary">Quá hạn</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box textAlign="center" sx={{ px: 2 }}>
              <Typography variant="h5" fontWeight="bold" color="#10B981">
                {assignments.filter(a => a.studentStatus === 'Graded' || a.studentStatus === 'Submitted').length || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">Hoàn thành</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

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
            const deadlineInfo = getDeadlineInfo(assignment.dueDate);
            const isCompleted = assignment.studentStatus === 'Graded' || assignment.studentStatus === 'Submitted';
            
            return (
              <ListItem
                key={assignment.assignmentId}
                component={Paper}
                elevation={1}
                sx={{
                  borderRadius: 3,
                  p: 3,
                  transition: 'all 0.3s ease',
                  border: deadlineInfo.urgent ? `2px solid rgba(239, 68, 68, 0.2)` : '1px solid rgba(0,0,0,0.08)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                    borderColor: deadlineInfo.urgent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0,0,0,0.12)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 72, mr: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: isCompleted ? '#10B981' : (assignment.type === 'Quiz' ? '#3B82F6' : '#8B5CF6'), 
                    width: 56, 
                    height: 56,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isCompleted ? <CheckCircle sx={{ fontSize: 28 }} /> : <Assignment sx={{ fontSize: 28 }} />}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  disableTypography
                  primary={
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                        {assignment.title}
                      </Typography>
                      <Chip 
                        label={getTypeLabel(assignment.type)}
                        size="small"
                        variant="outlined"
                        color={assignment.type === 'Quiz' ? 'primary' : 'default'}
                        icon={assignment.type === 'Quiz' ? <QuizIcon fontSize="small" /> : null}
                        sx={{ 
                          fontWeight: 500,
                          '& .MuiChip-icon': {
                            color: 'inherit'
                          }
                        }} 
                      />
                      {isCompleted && assignment.studentScore !== null && (
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: 16, color: 'white !important' }} />}
                          label={`${assignment.studentScore}/${assignment.maxScore}`}
                          color="success"
                          variant="filled"
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            '& .MuiChip-icon': {
                              ml: '6px',
                              mr: '-4px'
                            }
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box mt={1}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Lớp:{' '}
                        <Typography component="span" variant="body2" fontWeight="600" color="text.primary">
                          {assignment.className}
                        </Typography>
                      </Typography>
                      
                      {/* Deadline and Status Row */}
                      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" sx={{ mb: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Schedule fontSize="small" sx={{ color: deadlineInfo.color }} />
                          <Typography variant="body2" fontWeight={500} color={deadlineInfo.color}>
                            {deadlineInfo.text}
                          </Typography>
                        </Box>
                        <Chip
                          icon={<Box component="span" sx={{ display: 'flex', alignItems: 'center', ml: '4px', mr: '-2px' }}>{statusInfo.icon}</Box>}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                          variant={statusInfo.color === 'success' ? 'filled' : 'outlined'}
                          sx={{ 
                            fontWeight: 500,
                            '& .MuiChip-icon': {
                              color: 'inherit'
                            }
                          }}
                        />
                        {assignment.timeSpentSeconds && (
                          <Chip
                            icon={<AccessTime sx={{ fontSize: 14, ml: '4px', mr: '-2px' }} />}
                            label={`${Math.floor(assignment.timeSpentSeconds / 60)}:${String(assignment.timeSpentSeconds % 60).padStart(2, '0')}`}
                            variant="outlined"
                            size="small"
                            sx={{ 
                              borderColor: 'rgba(0,0,0,0.1)',
                              '& .MuiChip-icon': {
                                color: 'text.secondary'
                              }
                            }}
                          />
                        )}
                      </Box>
                      
                      {/* Additional Info */}
                      <Typography variant="caption" color="text.secondary">
                        Hạn nộp: {dayjs(assignment.dueDate).format('DD/MM/YYYY [lúc] HH:mm')}
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ ml: 2 }}>
                  <Tooltip title={
                    isCompleted ? "Xem chi tiết" : 
                    (dayjs().isAfter(dayjs(assignment.dueDate)) && !assignment.allowLateSubmission) ? "Đã hết hạn nộp bài" : 
                    "Vào làm bài"
                  }>
                    <Button
                      variant="contained"
                      endIcon={
                        isCompleted ? <Launch /> : 
                        (dayjs().isAfter(dayjs(assignment.dueDate)) && !assignment.allowLateSubmission) ? <Block /> : 
                        <Launch />
                      }
                      onClick={() => {
                        // Allow viewing if completed, block only if not completed AND overdue AND no late submission
                        const isOverdueBlocked = !isCompleted && dayjs().isAfter(dayjs(assignment.dueDate)) && !assignment.allowLateSubmission;
                        if (isOverdueBlocked) {
                          return; // Do nothing if overdue and no late submission allowed
                        }
                        navigate(`/student/assignments/${assignment.assignmentId}`);
                      }}
                      sx={{ 
                        borderRadius: 2,
                        background: isCompleted ? 'transparent' : (dayjs().isAfter(dayjs(assignment.dueDate)) && !assignment.allowLateSubmission) ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        border: isCompleted ? '2px solid #10B981' : 'none',
                        color: isCompleted ? '#10B981' : 'white !important',
                        fontWeight: 600,
                        opacity: (!isCompleted && dayjs().isAfter(dayjs(assignment.dueDate)) && !assignment.allowLateSubmission) ? 0.7 : 1,
                        cursor: (!isCompleted && dayjs().isAfter(dayjs(assignment.dueDate)) && !assignment.allowLateSubmission) ? 'not-allowed' : 'pointer',
                        '&:hover': {
                          background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : (dayjs().isAfter(dayjs(assignment.dueDate)) && !assignment.allowLateSubmission) ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          borderColor: isCompleted ? '#059669' : 'transparent',
                          transform: (!isCompleted && dayjs().isAfter(dayjs(assignment.dueDate)) && !assignment.allowLateSubmission) ? 'none' : 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isCompleted ? "Xem lại" : (dayjs().isAfter(dayjs(assignment.dueDate)) && !assignment.allowLateSubmission) ? "Hết hạn" : "Làm bài"}
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

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Alert,
  Chip,
  Button,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Group,
  CalendarMonth,
  LocationOn,
  Person,
  School,
  Assignment,
  AssignmentTurnedIn,
  ErrorOutline,
  AccessTime,
  Launch,
} from '@mui/icons-material';
import { classesAPI, gradesAPI, skillsAPI, assignmentsAPI } from '../../../services/api';
import dayjs from 'dayjs';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`class-tabpanel-${index}`}
      aria-labelledby={`class-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}</div>
  );
}

const StudentClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [skills, setSkills] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // all, pending, overdue
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    loadClassData();
  }, [classId]);

  useEffect(() => {
    loadSkillsData();
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      loadGradesData();
    } else if (activeTab === 1) {
      loadAssignmentsData();
    }
  }, [activeTab]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const [classRes, studentsRes] = await Promise.all([
        classesAPI.getById(classId),
        classesAPI.getStudents(classId),
      ]);

      const classData = classRes.data?.Data || classRes.data?.data?.Data || classRes.data?.data?.data || classRes.data?.data || classRes.data;
      const studentsData = studentsRes.data?.Data || studentsRes.data?.data?.Data || studentsRes.data?.data?.data || studentsRes.data?.data || studentsRes.data || [];

      setClassInfo(classData);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (err) {
      console.error('Error loading class data:', err);
      setError('Không thể tải thông tin lớp học. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const loadGradesData = async () => {
    try {
      const response = await gradesAPI.getByClass(classId);
      const gradesData = response.data?.Data || response.data?.data?.Data || response.data?.data?.data || response.data?.data || response.data || [];
      setGrades(Array.isArray(gradesData) ? gradesData : []);
    } catch (err) {
      console.error('Error loading grades:', err);
      setGrades([]);
    }
  };

  const loadSkillsData = async () => {
    try {
      const response = await skillsAPI.getAll();
      const skillsData = response.data?.Data || response.data?.data?.Data || response.data?.data?.data || response.data?.data || response.data || [];
      const activeSkills = Array.isArray(skillsData) ? skillsData.filter(s => s.isActive !== false) : [];
      setSkills(activeSkills);
    } catch (err) {
      console.error('Error loading skills:', err);
      setSkills([]);
    }
  };

  const loadAssignmentsData = async () => {
    try {
      setAssignmentsLoading(true);
      // Lấy studentId từ user data
      const userData = localStorage.getItem('user');
      let studentId = null;
      if (userData) {
        const user = JSON.parse(userData);
        studentId = user.studentId;
      }
      const response = await assignmentsAPI.getAll({ classId, studentId });
      const assignmentsData = response.data?.Data || response.data?.data?.Data || response.data?.data?.data || response.data?.data || response.data || [];
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // Get grade for a student by skill name
  const getStudentGradeBySkill = (studentId, skillName) => {
    const studentGrades = grades.filter(g =>
      (g.studentId === studentId || g.StudentId === studentId) &&
      (g.skillName?.toLowerCase() === skillName.toLowerCase() ||
       g.SkillName?.toLowerCase() === skillName.toLowerCase())
    );
    if (studentGrades.length === 0) return null;
    // Get latest grade
    const latest = studentGrades.sort((a, b) =>
      new Date(b.createdAt || b.CreatedAt || 0) - new Date(a.createdAt || a.CreatedAt || 0)
    )[0];
    return latest?.score || latest?.Score || null;
  };

  // Get skills for grade columns (from skills API, not from grades data)
  const getUniqueSkills = () => {
    return skills.map(s => s.name || s.Name).filter(Boolean);
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress color="primary" />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box mt={2}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/student/courses')}>
            Quay lại danh sách lớp học
          </Button>
        </Box>
      </Container>
    );
  }

  if (!classInfo) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Không tìm thấy thông tin lớp học</Alert>
        <Box mt={2}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/student/courses')}>
            Quay lại danh sách lớp học
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/student/courses')}
        sx={{ mb: 2 }}
      >
        Quay lại
      </Button>

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
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {classInfo.className}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {classInfo.courseName}
              </Typography>
            </Box>
            <Chip
              label={getStatusLabel(classInfo.status)}
              color={getStatusColor(classInfo.status)}
              sx={{ fontWeight: 'bold', bgcolor: 'rgba(255,255,255,0.9)' }}
            />
          </Box>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarMonth sx={{ opacity: 0.8 }} />
                <Typography variant="body2">
                  Bắt đầu: {dayjs(classInfo.startDate).format('DD/MM/YYYY')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarMonth sx={{ opacity: 0.8 }} />
                <Typography variant="body2">
                  Kết thúc: {dayjs(classInfo.endDate).format('DD/MM/YYYY')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn sx={{ opacity: 0.8 }} />
                <Typography variant="body2">
                  Phòng: {classInfo.roomName || classInfo.room || 'Chưa cập nhật'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Person sx={{ opacity: 0.8 }} />
                <Typography variant="body2">
                  GV: {classInfo.teacherName || 'Chưa cập nhật'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
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

      {/* Tabs */}
      <Paper sx={{ borderRadius: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<Group />}
            label={`Danh sách học viên (${students.length})`}
            id="class-tab-0"
            aria-controls="class-tabpanel-0"
          />
          <Tab
            icon={<Assignment />}
            label={`Bài tập (${assignments.length})`}
            id="class-tab-1"
            aria-controls="class-tabpanel-1"
          />
        </Tabs>

        {/* Students Tab - Bảng điểm theo kỹ năng */}
        <TabPanel value={activeTab} index={0}>
          {students.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Group sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                Chưa có học viên
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Học viên</TableCell>
                    {getUniqueSkills().map(skill => (
                      <TableCell key={skill} sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                        {skill}
                      </TableCell>
                    ))}
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Tổng điểm</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student, index) => {
                    const studentId = student.studentId || student.StudentId;
                    const uniqueSkills = getUniqueSkills();

                    // Get all skill scores dynamically
                    const skillScores = uniqueSkills.map(skill =>
                      getStudentGradeBySkill(studentId, skill)
                    );

                    // Calculate average
                    const scores = skillScores.filter(s => s !== null);
                    const avgScore = scores.length > 0
                      ? scores.reduce((a, b) => a + b, 0) / scores.length
                      : null;

                    return (
                      <TableRow key={studentId || index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {student.fullName || student.FullName || 'Học viên'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {student.email || student.Email || ''}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        {uniqueSkills.map(skill => {
                          const score = getStudentGradeBySkill(studentId, skill);
                          return (
                            <TableCell key={skill} align="center">
                              {score !== null ? (
                                <Chip label={score.toFixed(1)} size="small" color="primary" />
                              ) : '-'}
                            </TableCell>
                          );
                        })}
                        <TableCell align="center">
                          {avgScore !== null ? (
                            <Chip
                              label={avgScore.toFixed(1)}
                              size="small"
                              color={avgScore >= 8 ? 'success' : avgScore >= 6 ? 'primary' : avgScore >= 4 ? 'warning' : 'error'}
                            />
                          ) : (
                            <Typography variant="caption" color="textSecondary">-</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Assignments Tab - Danh sách bài tập */}
        <TabPanel value={activeTab} index={1}>
          {assignmentsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : assignments.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Assignment sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                Chưa có bài tập
              </Typography>
            </Box>
          ) : (
            <>
              {/* Filters */}
              <Box display="flex" gap={1} sx={{ mb: 3 }}>
                <Button 
                  variant={assignmentFilter === 'all' ? 'contained' : 'outlined'} 
                  onClick={() => setAssignmentFilter('all')}
                  sx={{ borderRadius: 10 }}
                  size="small"
                >
                  Tất cả ({assignments.length})
                </Button>
                <Button 
                  variant={assignmentFilter === 'pending' ? 'contained' : 'outlined'} 
                  color="primary"
                  onClick={() => setAssignmentFilter('pending')}
                  sx={{ borderRadius: 10 }}
                  size="small"
                >
                  Chờ nộp
                </Button>
                <Button 
                  variant={assignmentFilter === 'overdue' ? 'contained' : 'outlined'} 
                  color="error"
                  onClick={() => setAssignmentFilter('overdue')}
                  sx={{ borderRadius: 10 }}
                  size="small"
                >
                  Quá hạn
                </Button>
              </Box>

              {(() => {
                const filteredAssignments = assignments.filter(a => {
                  if (assignmentFilter === 'all') return true;
                  const now = dayjs();
                  const dueDate = dayjs(a.dueDate || a.DueDate);
                  const isSubmitted = a.studentStatus === 'Graded' || a.studentStatus === 'Submitted';
                  if (assignmentFilter === 'pending') return now.isBefore(dueDate) && !isSubmitted;
                  if (assignmentFilter === 'overdue') return now.isAfter(dueDate) && !isSubmitted;
                  return true;
                });

                const getStatusInfo = (assignment) => {
                  if (assignment.studentStatus === 'Graded' || assignment.studentStatus === 'Submitted') {
                    return { label: 'Đã hoàn thành', color: 'success', icon: <AssignmentTurnedIn fontSize="small" /> };
                  }
                  const now = dayjs();
                  const dueDate = dayjs(assignment.dueDate || assignment.DueDate);
                  const isOverdue = now.isAfter(dueDate);
                  if (isOverdue) return { label: 'Quá hạn', color: 'error', icon: <ErrorOutline fontSize="small" /> };
                  return { label: 'Đang mở', color: 'primary', icon: <AccessTime fontSize="small" /> };
                };

                if (filteredAssignments.length === 0) {
                  return (
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '2px dashed #e0e0e0' }}>
                      <Assignment sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary">
                        Không tìm thấy bài tập nào trong mục này
                      </Typography>
                    </Paper>
                  );
                }

                return (
                  <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredAssignments.map((assignment) => {
                      const statusInfo = getStatusInfo(assignment);
                      const isOverdue = dayjs().isAfter(dayjs(assignment.dueDate || assignment.DueDate));
                      const isSubmitted = assignment.studentStatus === 'Graded' || assignment.studentStatus === 'Submitted';
                      
                      return (
                        <ListItem 
                          key={assignment.assignmentId || assignment.AssignmentId}
                          component={Paper}
                          elevation={1}
                          sx={{ 
                            borderRadius: 3, 
                            p: 2, 
                            transition: '0.2s',
                            '&:hover': {
                              transform: 'scale(1.01)',
                              boxShadow: 3
                            }
                          }}
                        >
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: (assignment.type || assignment.Type) === 'Quiz' ? 'primary.light' : 'secondary.light', width: 45, height: 45 }}>
                              <Assignment />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            disableTypography
                            primary={
                              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <Typography variant="subtitle1" fontWeight="bold">{assignment.title || assignment.Title}</Typography>
                                <Chip label={assignment.type || assignment.Type || 'Bài tập'} size="small" variant="outlined" />
                              </Box>
                            }
                            secondary={
                              <Box mt={0.5}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  {assignment.description || assignment.Description || 'Không có mô tả'}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                  <Box display="flex" alignItems="center" gap={0.5} sx={{ color: 'text.secondary' }}>
                                    <AccessTime fontSize="small" />
                                    <Typography variant="caption">
                                      Hạn: {dayjs(assignment.dueDate || assignment.DueDate).format('DD/MM/YYYY HH:mm')}
                                    </Typography>
                                  </Box>
                                  {assignment.skillName && (
                                    <Chip label={assignment.skillName} size="small" color="info" variant="outlined" />
                                  )}
                                  <Chip icon={statusInfo.icon} label={statusInfo.label} color={statusInfo.color} size="small" />
                                  {assignment.studentScore !== null && (
                                    <Chip label={`Điểm: ${assignment.studentScore}/${assignment.maxScore || assignment.MaxScore}`} color="success" variant="outlined" size="small" />
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                          <Box>
                            {!isSubmitted && !isOverdue ? (
                              <Tooltip title="Vào làm bài">
                                <Button 
                                  variant="contained" 
                                  endIcon={<Launch />} 
                                  sx={{ borderRadius: 2 }}
                                  size="small"
                                  onClick={async () => {
                                    try {
                                      if (String(assignment.type || assignment.Type || '').toLowerCase() === 'quiz' && !document.fullscreenElement && document.documentElement.requestFullscreen) {
                                        await document.documentElement.requestFullscreen();
                                      }
                                    } catch (e) {}
                                    navigate(`/student/assignments/${assignment.assignmentId || assignment.AssignmentId}`);
                                  }}
                                >
                                  Làm bài
                                </Button>
                              </Tooltip>
                            ) : !isSubmitted && isOverdue ? (
                              <Button variant="outlined" color="error" disabled sx={{ borderRadius: 2 }} size="small">
                                Đã quá hạn
                              </Button>
                            ) : (
                              <Button variant="outlined" color="success" sx={{ borderRadius: 2 }} size="small"
                                onClick={() => navigate(`/student/assignments/${assignment.assignmentId || assignment.AssignmentId}`)}>
                                Xem kết quả
                              </Button>
                            )}
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                );
              })()}
            </>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default StudentClassDetail;

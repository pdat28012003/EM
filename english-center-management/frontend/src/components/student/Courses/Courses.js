import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Button,
  Avatar,
  Divider,
  LinearProgress as MuiLinearProgress,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  School,
  CalendarMonth,
  Person,
  LocationOn,
  PlayArrow,
  CheckCircle,
  SchoolOutlined,
  Search,
  Clear,
  Visibility,
  GridView,
  TableRows,
} from '@mui/icons-material';
import { studentsAPI, authAPI } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const StudentClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const isClassCompleted = (classItem) => {
    const endDate = dayjs(classItem.endDate);
    const currentDate = dayjs();
    return endDate.isValid() && currentDate.isAfter(endDate, 'day');
  };

  // Filter by tab + search
  const filteredClasses = classes.filter(c => {
    const completed = isClassCompleted(c);
    const matchesTab = activeTab === 0 ? !completed : completed;
    const matchesSearch = !searchTerm || 
      c.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacherName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const ongoingCount = classes.filter(c => !isClassCompleted(c)).length;
  const completedCount = classes.filter(c => isClassCompleted(c)).length;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('Vui lòng đăng nhập để xem khóa học');
        return;
      }

      const user = JSON.parse(userData);
      let studentId = user.studentId;

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
        }
      }

      if (!studentId) {
        setError('Không tìm thấy thông tin học viên. Vui lòng liên hệ Admin.');
        return;
      }

      const response = await studentsAPI.getCurriculums(studentId);
      const curriculumsData = response.data || [];
      const mappedClasses = Array.isArray(curriculumsData) ? curriculumsData.map(c => {
        const firstDay = c.curriculumDays?.[0];
        const firstSession = firstDay?.curriculumSessions?.[0];
        const teacherName = firstSession?.teacherName || 'Chưa phân công';
        const roomName = firstSession?.roomName || 'Chưa phân phòng';

        const startDate = dayjs(c.startDate);
        const endDate = dayjs(c.endDate);
        const currentDate = dayjs();
        let progress = 0;

        if (startDate.isValid() && endDate.isValid()) {
          if (currentDate.isBefore(startDate)) {
            progress = 0;
          } else if (currentDate.isAfter(endDate)) {
            progress = 100;
          } else {
            const totalDays = endDate.diff(startDate, 'day');
            const daysElapsed = currentDate.diff(startDate, 'day');
            progress = totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0;
          }
        }

        return {
          curriculumId: c.curriculumId,
          className: c.className || c.curriculumName,
          courseName: c.courseName || (c.courses?.map(course => course.courseName).join(', ') || 'Khóa học tiếng Anh'),
          startDate: c.startDate,
          endDate: c.endDate,
          status: c.status,
          roomName,
          teacherName,
          progress
        };
      }) : [];

      setClasses(mappedClasses);
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
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
      <Paper sx={{ p: 4, mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>Chương trình học</Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>Quản lý các chương trình học bạn đang tham gia tại trung tâm</Typography>
        </Box>
        <School sx={{ position: 'absolute', right: -20, bottom: -20, fontSize: 200, opacity: 0.05, transform: 'rotate(-15deg)' }} />
      </Paper>

      {classes.length > 0 && (
        <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-flexContainer': { borderBottom: 'none' },
              '& .MuiTab-root': { textTransform: 'none', fontSize: '1rem', fontWeight: 600, py: 2 },
              '& .Mui-selected': { background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', color: 'white !important' },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            <Tab
              icon={<SchoolOutlined sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Đang học
                  <Chip label={ongoingCount} size="small" sx={{ bgcolor: activeTab === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(79, 70, 229, 0.1)', color: activeTab === 0 ? 'white' : '#4F46E5', fontWeight: 700, fontSize: '0.75rem' }} />
                </Box>
              }
            />
            <Tab
              icon={<CheckCircle sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Đã hoàn thành
                  <Chip label={completedCount} size="small" sx={{ bgcolor: activeTab === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(34, 197, 94, 0.1)', color: activeTab === 1 ? 'white' : '#16A34A', fontWeight: 700, fontSize: '0.75rem' }} />
                </Box>
              }
            />
          </Tabs>
        </Paper>
      )}

      {/* Control Bar */}
      {classes.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Tìm kiếm khóa học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Search color="action" /></InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}><Clear fontSize="small" /></IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 250, flex: 1 }}
              size="small"
            />
            <ToggleButtonGroup value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)} size="small">
              <ToggleButton value="table"><TableRows fontSize="small" /></ToggleButton>
              <ToggleButton value="grid"><GridView fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {classes.length === 0 ? (
        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(0,0,0,0.02)', border: '2px dashed #e0e0e0' }}>
          <School sx={{ fontSize: 80, color: '#bdbdbd', mb: 2 }} />
          <Typography variant="h5" color="textSecondary" gutterBottom>Bạn chưa đăng ký khóa học nào</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>Hãy liên hệ với trung tâm để được tư vấn và đăng ký khóa học phù hợp.</Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/student/dashboard')}>Về bảng điều khiển</Button>
        </Paper>
      ) : filteredClasses.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(0,0,0,0.02)', border: '2px dashed #e0e0e0' }}>
          {activeTab === 0 ? (
            <>
              <SchoolOutlined sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>Không có khóa học đang diễn ra</Typography>
              <Typography variant="body2" color="textSecondary">Tất cả khóa học của bạn đã kết thúc. Xem tab "Đã hoàn thành" để xem lại.</Typography>
            </>
          ) : (
            <>
              <CheckCircle sx={{ fontSize: 60, color: '#16A34A', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>Chưa có khóa học hoàn thành</Typography>
              <Typography variant="body2" color="textSecondary">Các khóa học đang học sẽ tự động chuyển sang đây khi kết thúc.</Typography>
            </>
          )}
        </Paper>
      ) : viewMode === 'table' ? (
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell>Khóa học</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Tiến độ</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Giáo viên</TableCell>
                <TableCell>Phòng</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClasses.map((classItem) => (
                <TableRow
                  key={classItem.curriculumId}
                  hover
                  onClick={() => navigate(`/student/courses/${classItem.curriculumId}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="medium">{classItem.className}</Typography>
                      <Typography variant="caption" color="text.secondary">{classItem.courseName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={isClassCompleted(classItem) ? 'Đã hoàn thành' : 'Đang học'}
                      size="small"
                      icon={isClassCompleted(classItem) ? <CheckCircle sx={{ fontSize: 14 }} /> : <SchoolOutlined sx={{ fontSize: 14 }} />}
                      sx={{ bgcolor: isClassCompleted(classItem) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(79, 70, 229, 0.1)', color: isClassCompleted(classItem) ? '#16A34A' : '#4F46E5', fontWeight: 600, borderRadius: 1.5, '& .MuiChip-icon': { color: 'inherit' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ minWidth: 80 }}>
                      <Typography variant="body2">{classItem.progress}%</Typography>
                      <MuiLinearProgress variant="determinate" value={classItem.progress} sx={{ height: 4, borderRadius: 2, mt: 0.5 }} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(classItem.startDate)}</Typography>
                    <Typography variant="caption" color="text.secondary">đến {formatDate(classItem.endDate)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{classItem.teacherName || 'Chưa cập nhật'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{classItem.roomName || 'Chưa cập nhật'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/student/courses/${classItem.curriculumId}`); }}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={3}>
          {filteredClasses.map((classItem) => (
            <Grid item xs={12} md={6} lg={4} key={classItem.curriculumId}>
              <Card onClick={() => navigate(`/student/courses/${classItem.curriculumId}`)} sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' } }}>
                <CardContent sx={{ p: 4, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={isClassCompleted(classItem) ? 'Đã hoàn thành' : 'Đang học'}
                      size="small"
                      icon={isClassCompleted(classItem) ? <CheckCircle sx={{ fontSize: 16 }} /> : <SchoolOutlined sx={{ fontSize: 16 }} />}
                      sx={{ bgcolor: isClassCompleted(classItem) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(79, 70, 229, 0.1)', color: isClassCompleted(classItem) ? '#16A34A' : '#4F46E5', fontWeight: 600, borderRadius: 1.5, '& .MuiChip-icon': { color: 'inherit' } }}
                    />
                    {isClassCompleted(classItem) && <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>Hoàn thành</Typography>}
                  </Box>

                  <Typography variant="h5" fontWeight="700" gutterBottom>{classItem.className}</Typography>
                  <Typography variant="body1" color="textSecondary" sx={{ mb: 2, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '3em' }}>
                    {classItem.courseName}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Tiến độ học tập</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>{classItem.progress}%</Typography>
                    </Box>
                    <MuiLinearProgress variant="determinate" value={classItem.progress} sx={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(79, 70, 229, 0.1)', '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)' } }} />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}><CalendarMonth sx={{ fontSize: 18 }} /></Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary" display="block">Ngày bắt đầu</Typography>
                        <Typography variant="body2" fontWeight="medium">{dayjs(classItem.startDate).format('DD/MM/YYYY')}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ bgcolor: 'info.light', width: 32, height: 32 }}><CalendarMonth sx={{ fontSize: 18 }} /></Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary" display="block">Ngày kết thúc</Typography>
                        <Typography variant="body2" fontWeight="medium">{dayjs(classItem.endDate).format('DD/MM/YYYY')}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ bgcolor: 'secondary.light', width: 32, height: 32 }}><LocationOn sx={{ fontSize: 18 }} /></Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary" display="block">Phòng học</Typography>
                        <Typography variant="body2" fontWeight="medium">{classItem.roomName || 'Chưa cập nhật'}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ bgcolor: 'warning.light', width: 32, height: 32 }}><Person sx={{ fontSize: 18 }} /></Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary" display="block">Giáo viên phụ trách</Typography>
                        <Typography variant="body2" fontWeight="medium">{classItem.teacherName || 'Chưa cập nhật'}</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Button variant="contained" fullWidth startIcon={<PlayArrow />} onClick={(e) => { e.stopPropagation(); navigate(`/student/courses/${classItem.curriculumId}`); }} sx={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', py: 1.5, fontWeight: 600, '&:hover': { background: 'linear-gradient(135deg, #3730A3 0%, #4338CA 100%)', transform: 'translateY(-2px)', boxShadow: '0 12px 24px rgba(79, 70, 229, 0.4)' } }}>Vào lớp</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default StudentClasses;


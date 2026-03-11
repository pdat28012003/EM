import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  CalendarMonth,
  AccessTime,
  Room,
  School,
  Topic,
  Person,
} from '@mui/icons-material';
import { studentsAPI } from '../services/api';

const Schedules = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await studentsAPI.getAll({ isActive: true });
      setStudents(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Không thể tải danh sách học viên');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentChange = async (event, newValue) => {
    setSelectedStudent(newValue);
    if (newValue) {
      loadSchedule(newValue.studentId);
    } else {
      setSchedule([]);
    }
  };

  const loadSchedule = async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentsAPI.getSchedule(studentId);
      setSchedule(response.data);
    } catch (err) {
      console.error('Error loading schedule:', err);
      setError('Không thể tải lịch học của học viên');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Lịch Học Học Viên
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={students}
              getOptionLabel={(option) => `${option.fullName} (${option.email})`}
              value={selectedStudent}
              onChange={handleStudentChange}
              loading={loadingStudents}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Chọn Học Viên"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingStudents ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : selectedStudent ? (
        schedule.length > 0 ? (
          schedule.map((curriculum) => (
            <Box key={curriculum.curriculumId} sx={{ mb: 6 }}>
              <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white', mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {curriculum.className}
                    </Typography>
                    <Typography variant="subtitle1">
                      Chương trình: {curriculum.curriculumName}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2">
                      Từ: {new Date(curriculum.startDate).toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="body2">
                      Đến: {new Date(curriculum.endDate).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Grid container spacing={3}>
                {curriculum.curriculumDays
                  .sort((a, b) => new Date(a.scheduleDate) - new Date(b.scheduleDate))
                  .map((day) => (
                    <Grid item xs={12} key={day.curriculumDayId}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderBottom: '1px solid', borderColor: 'grey.300' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CalendarMonth color="primary" />
                            <Typography variant="subtitle1" fontWeight="bold">
                              {formatDate(day.scheduleDate)}
                            </Typography>
                            <Chip 
                              label={day.topic} 
                              size="small" 
                              color="secondary" 
                              variant="outlined" 
                              sx={{ ml: 'auto' }}
                            />
                          </Box>
                        </Box>
                        <CardContent>
                          <Grid container spacing={2}>
                            {day.curriculumSessions
                              .sort((a, b) => a.sessionNumber - b.sessionNumber)
                              .map((session) => (
                                <Grid item xs={12} key={session.curriculumSessionId}>
                                  <Box 
                                    sx={{ 
                                      p: 2, 
                                      borderLeft: '4px solid', 
                                      borderColor: 'primary.light',
                                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                                      borderRadius: '0 4px 4px 0'
                                    }}
                                  >
                                    <Grid container spacing={2} alignItems="center">
                                      <Grid item xs={12} sm={3}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <AccessTime fontSize="small" color="action" />
                                          <Typography variant="body1" fontWeight="bold">
                                            {session.startTime} - {session.endTime}
                                          </Typography>
                                        </Box>
                                        <Typography variant="caption" color="textSecondary">
                                          Ca học {session.sessionNumber}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} sm={5}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <Topic fontSize="small" color="action" />
                                          <Typography variant="body1">
                                            {session.sessionName}
                                          </Typography>
                                        </Box>
                                        <Typography variant="caption" color="textSecondary">
                                          Nội dung buổi học
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} sm={4}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <Room fontSize="small" color="action" />
                                          <Typography variant="body1">
                                            Phòng: {session.roomName}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </Grid>
                              ))}
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          ))
        ) : (
          <Paper sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              Học viên này hiện chưa có lịch học nào.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Vui lòng kiểm tra lại đăng ký lớp học của học viên.
            </Typography>
          </Paper>
        )
      ) : (
        <Paper sx={{ p: 10, textAlign: 'center', border: '2px dashed', borderColor: 'grey.300', bgcolor: 'transparent' }}>
          <Person sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Vui lòng chọn một học viên để xem lịch học
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Schedules;

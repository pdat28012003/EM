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

} from '@mui/material';

import {

  School,

  CalendarMonth,

  Person,

  LocationOn,

  PlayArrow

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

            Chương trình học

          </Typography>

          <Typography variant="h6" sx={{ opacity: 0.9 }}>

            Quản lý các chương trình học bạn đang tham gia tại trung tâm

          </Typography>

        </Box>

        <School 

          sx={{ 

            position: 'absolute', 

            right: -20, 

            bottom: -20, 

            fontSize: 200, 

            opacity: 0.05, 

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

                onClick={() => navigate(`/student/courses/${classItem.classId}`)}

                sx={{ 

                  borderRadius: 4, 

                  height: '100%', 

                  display: 'flex', 

                  flexDirection: 'column',

                  transition: 'all 0.3s ease',

                  cursor: 'pointer',

                  '&:hover': {

                    transform: 'translateY(-8px)',

                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)'

                  }

                }}

              >

                <CardContent sx={{ p: 4, flexGrow: 1 }}>

                  



                  <Typography variant="h5" fontWeight="700" gutterBottom>

                    {classItem.className}

                  </Typography>



                  <Typography variant="body1" color="textSecondary" sx={{ mb: 2, fontWeight: 500 }}>

                    {classItem.courseName}

                  </Typography>



                  <Divider sx={{ my: 2 }} />

                  {/* Progress Bar */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Tiến độ học tập
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {Math.floor(Math.random() * 60) + 20}%
                      </Typography>
                    </Box>
                    <MuiLinearProgress
                      variant="determinate"
                      value={Math.floor(Math.random() * 60) + 20}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)'
                        }
                      }}
                    />
                  </Box>



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

                  {/* CTA Button */}
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<PlayArrow />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/courses/${classItem.classId}`);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                        py: 1.5,
                        fontWeight: 600,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #3730A3 0%, #4338CA 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 24px rgba(79, 70, 229, 0.4)'
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      Vào lớp
                    </Button>
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


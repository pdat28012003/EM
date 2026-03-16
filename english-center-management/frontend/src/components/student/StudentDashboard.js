import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Person,
  School,
  Schedule,
  Assessment,
  Book,
  Event,
} from '@mui/icons-material';

const StudentDashboard = () => {
  const student = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { icon: <Book />, text: 'Khóa học của tôi', path: '/student/courses' },
    { icon: <Schedule />, text: 'Lịch học', path: '/student/schedule' },
    { icon: <Assessment />, text: 'Điểm số', path: '/student/grades' },
    { icon: <Event />, text: 'Sự kiện', path: '/student/events' },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Student Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Chào mừng bạn quay trở lại, {student.name || student.fullName || 'Student'}!
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                src={student.avatar}
              >
                <Person />
              </Avatar>
              <Typography variant="h6">{student.name || student.fullName || 'Student'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {student.email || 'student@englishcenter.com'}
              </Typography>
              <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                Level: {student.level || 'Beginner'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Truy cập nhanh
            </Typography>
            <List>
              {menuItems.map((item, index) => (
                <ListItem key={index} button>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  3
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Khóa học đang học
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  12
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Buổi học tháng này
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assessment color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  85%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Điểm trung bình
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  2
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Sự kiện sắp tới
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentDashboard;

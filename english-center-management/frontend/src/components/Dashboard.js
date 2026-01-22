import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import {
  People,
  School,
  Class,
  AttachMoney,
} from '@mui/icons-material';
import { dashboardAPI } from '../services/api';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card sx={{ height: '100%', bgcolor: color, color: 'white' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
            {title}
          </Typography>
        </Box>
        <Icon sx={{ fontSize: 50, opacity: 0.8 }} />
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeClasses: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return <Typography>Đang tải...</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" mb={4}>
        Dashboard - Tổng Quan
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng Học Viên"
            value={stats.totalStudents}
            icon={People}
            color="#1976d2"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Học Viên Đang Học"
            value={stats.activeStudents}
            icon={School}
            color="#2e7d32"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng Giáo Viên"
            value={stats.totalTeachers}
            icon={People}
            color="#ed6c02"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Lớp Đang Hoạt Động"
            value={`${stats.activeClasses}/${stats.totalClasses}`}
            icon={Class}
            color="#9c27b0"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Doanh Thu Tháng Này
            </Typography>
            <Typography variant="h3" color="primary" fontWeight="bold">
              {formatCurrency(stats.monthlyRevenue)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Tổng Doanh Thu
            </Typography>
            <Typography variant="h3" color="success.main" fontWeight="bold">
              {formatCurrency(stats.totalRevenue)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;

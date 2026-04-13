import React, { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Users,
  GraduationCap,
  DoorOpen,
  TrendingUp,
  CreditCard,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { dashboardAPI } from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <Card sx={{ 
    height: '100%', 
    borderRadius: '20px',
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
    border: 'none',
    overflow: 'hidden',
    position: 'relative'
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 0.25, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: '0.65rem' }}>
            {title}
          </Typography>
          <Typography variant="h2" component="div" sx={{ 
            fontWeight: 900, 
            color: 'text.primary', 
            letterSpacing: -1.5, 
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
              <ArrowUpRight size={16} color="#10b981" />
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                {trend}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ 
          p: 1.25, 
          borderRadius: '10px', 
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 6px 12px -3px ${color}66`
        }}>
          <Icon size={20} />
        </Box>
      </Box>
    </CardContent>
    <Box sx={{ 
      position: 'absolute', 
      bottom: -10, 
      right: -10, 
      opacity: 0.05, 
      color: 'text.primary',
      transform: 'rotate(-15deg)'
    }}>
      <Icon size={100} />
    </Box>
  </Card>
);

const RevenueCard = ({ title, value, icon: Icon, color, data }) => {
  return (
    <Card sx={{ 
      height: '100%', 
      borderRadius: '20px',
      boxShadow: '0 8px 24px -10px rgba(0,0,0,0.08)',
      border: 'none',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <CardContent sx={{ p: '20px 24px 0 24px' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box>
            <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 0.5 }}>
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', overflow: 'hidden' }}>
              <Typography variant="h3" sx={{ 
                fontWeight: 900, 
                color: 'text.primary', 
                mr: 0.5, 
                letterSpacing: -1, 
                lineHeight: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {value}
              </Typography>
              <Box component="span" sx={{ 
                fontWeight: 700, 
                color: 'text.secondary', 
                fontSize: '0.9rem',
                opacity: 0.6,
                flexShrink: 0
              }}>
                ₫
              </Box>
            </Box>
          </Box>
          <Box sx={{ 
            width: 42,
            height: 42,
            borderRadius: '12px', 
            bgcolor: `${color}15`, 
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={20} strokeWidth={2.5} />
          </Box>
        </Box>

        <Box sx={{ height: 60, mt: 1, mx: -4, mb: -4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`colorRef-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
                  <stop offset="100%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="val" 
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#colorRef-${color})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
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

  // Mock chart data
  const revenueData = [
    { month: 'T1', val: 4000000 },
    { month: 'T2', val: 3000000 },
    { month: 'T3', val: 5000000 },
    { month: 'T4', val: 4500000 },
    { month: 'T5', val: 6800000 },
    { month: 'T6', val: stats.monthlyRevenue || 6800000 },
  ];

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

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography variant="h6" color="textSecondary">Đang tải dữ liệu...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', mb: 0 }}>
            Tổng Quan
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Chào mừng admin! Dưới đây là tình hình trung tâm.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Paper elevation={0} sx={{ p: '6px 12px', borderRadius: '10px', bgcolor: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={14} color="#64748b" />
            <Typography variant="caption" fontWeight={600} sx={{ color: '#1e293b' }}>
              {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Typography>
          </Paper>
        </Box>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng Học Viên"
            value={stats.totalStudents}
            icon={Users}
            color="#3b82f6"
            trend="+12%"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Đang Theo Học"
            value={stats.activeStudents}
            icon={GraduationCap}
            color="#10b981"
            trend="+5%"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Đội Ngũ Giáo Viên"
            value={stats.totalTeachers}
            icon={Users}
            color="#f59e0b"
            trend="+2"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Lớp Đang Mở"
            value={`${stats.activeClasses}/${stats.totalClasses}`}
            icon={DoorOpen}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            <RevenueCard
              title="Doanh Thu Tháng Này"
              value={formatNumber(stats.monthlyRevenue)}
              icon={TrendingUp}
              color="#3b82f6"
              data={revenueData}
            />
            <RevenueCard
              title="Tổng Doanh Thu"
              value={formatNumber(stats.totalRevenue)}
              icon={CreditCard}
              color="#10b981"
              data={revenueData.map(d => ({ ...d, val: d.val * 2.5 }))}
            />
          </Box>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: '20px', p: 3, height: '100%', boxShadow: '0 8px 24px -12px rgba(0,0,0,0.1)', border: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'text.primary' }}>Xu Hướng Doanh Thu</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>6 tháng gần nhất</Typography>
            </Box>
            <Box sx={{ height: 260, width: '100%', px: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 600 }} 
                    dy={12}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis 
                    hide 
                  />
                  <Tooltip 
                    cursor={{ stroke: theme.palette.divider, strokeWidth: 2 }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      padding: '12px 16px',
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary
                    }}
                    itemStyle={{ fontSize: '13px', fontWeight: 700, color: theme.palette.primary.main }}
                    formatter={(value) => [new Intl.NumberFormat('vi-VN').format(value) + ' ₫', 'Doanh thu']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="val" 
                    stroke={theme.palette.primary.main} 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#fff', strokeWidth: 3, stroke: theme.palette.primary.main }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: theme.palette.primary.dark }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Alert
} from '@mui/material';
import {
  People,
  Assessment,
  Assignment,
  Grading,
  ArrowBack
} from '@mui/icons-material';
import { Button, Skeleton } from '@mui/material';
import { curriculumAPI } from '../../../../services/api';
import { useAsyncLoading } from '../../../../hooks/useDocuments';

// Import tabs
import StudentsTab from './StudentsTab';
import AttendanceTab from './AttendanceTab';
import AssignmentsTab from './AssignmentsTab';
import DynamicGradesTab from './DynamicGradesTab';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`class-detail-tabpanel-${index}`}
      aria-labelledby={`class-detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ClassDetail() {
  const { curriculumId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [curriculumInfo, setCurriculumInfo] = useState(null);
  
  // Sử dụng custom hook cho loading
  const { initialLoading, stopLoading } = useAsyncLoading();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'Đang hoạt động';
      case 'completed': return 'Đã kết thúc';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const loadCurriculumInfo = useCallback(async () => {
    try {
      // Load curriculum info from API
      const response = await curriculumAPI.getById(curriculumId);
      setCurriculumInfo(response.data);
    } catch (error) {
      console.error('Error loading curriculum info:', error);
      setCurriculumInfo(null);
    } finally {
      stopLoading(true);
    }
  }, [curriculumId, stopLoading]);

  useEffect(() => {
    loadCurriculumInfo();
  }, [loadCurriculumInfo]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };


  // Loading skeleton - chỉ hiện lần đầu
  if (initialLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* ClassDetail Skeleton */}
        <Skeleton variant="text" width={100} height={36} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={140} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (!curriculumInfo) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Không tìm thấy thông tin lớp học
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Box mb={2}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/teacher/curriculums')}
          sx={{ textTransform: 'none' }}
        >
          Quay lại
        </Button>
      </Box>

      {/* Header */}
      <Box mb={4}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1">
              {curriculumInfo.curriculumName}
            </Typography>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {curriculumInfo.courseName}
              </Typography>
              <Typography variant="body2">
                {curriculumInfo.currentStudents}/{curriculumInfo.maxStudents} học viên
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Phòng học:</strong> {curriculumInfo.room}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Bắt đầu:</strong> {formatDate(curriculumInfo.startDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Kết thúc:</strong> {formatDate(curriculumInfo.endDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Trạng thái:</strong>{' '}
                <span style={{ 
                  color: curriculumInfo.status === 'Active' ? '#4caf50' : '#f44336',
                  fontWeight: 'bold'
                }}>
                  {getStatusText(curriculumInfo.status)}
                </span>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTabs-indicator': { backgroundColor: '#10b981' },
            '& .MuiTab-root.Mui-selected': { color: '#10b981' }
          }}
        >
          <Tab 
            icon={<People />} 
            label="Học viên" 
            id="class-detail-tab-0"
            aria-controls="class-detail-tabpanel-0"
          />
          <Tab 
            icon={<Assessment />} 
            label="Điểm danh" 
            id="class-detail-tab-1"
            aria-controls="class-detail-tabpanel-1"
          />
          <Tab 
            icon={<Assignment />} 
            label="Bài tập" 
            id="class-detail-tab-2"
            aria-controls="class-detail-tabpanel-2"
          />
          <Tab 
            icon={<Grading />} 
            label="Bảng điểm" 
            id="class-detail-tab-3"
            aria-controls="class-detail-tabpanel-3"
          />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <StudentsTab curriculumId={curriculumId} curriculumInfo={curriculumInfo} />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <AttendanceTab curriculumId={curriculumId} curriculumInfo={curriculumInfo} />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <AssignmentsTab curriculumId={curriculumId} curriculumInfo={curriculumInfo} />
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <DynamicGradesTab curriculumId={curriculumId} curriculumInfo={curriculumInfo} />
        </TabPanel>
      </Paper>
    </Container>
  );
}

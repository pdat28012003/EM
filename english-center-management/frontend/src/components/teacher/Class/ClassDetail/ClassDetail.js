import React, { useState, useEffect } from 'react';
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
  Grading
} from '@mui/icons-material';
import { classesAPI } from '../../../../services/api';

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
  const { classId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadClassInfo();
  }, [classId]);

  const loadClassInfo = async () => {
    try {
      // Load class info from API
      const response = await classesAPI.getById(classId);
      setClassInfo(response.data);
    } catch (error) {
      console.error('Error loading class info:', error);
      setClassInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleBack = () => {
    navigate('/teacher/classes');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Đang tải thông tin lớp học...</Typography>
      </Container>
    );
  }

  if (!classInfo) {
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
      {/* Header */}
      <Box mb={4}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1">
              {classInfo.className}
            </Typography>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {classInfo.courseName}
              </Typography>
              <Typography variant="body2">
                {classInfo.currentStudents}/{classInfo.maxStudents} học viên
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Phòng học:</strong> {classInfo.room}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Bắt đầu:</strong> {formatDate(classInfo.startDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Kết thúc:</strong> {formatDate(classInfo.endDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Trạng thái:</strong>{' '}
                <span style={{ 
                  color: classInfo.status === 'Active' ? '#4caf50' : '#f44336',
                  fontWeight: 'bold'
                }}>
                  {getStatusText(classInfo.status)}
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
          sx={{ borderBottom: 1, borderColor: 'divider' }}
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
          <StudentsTab classId={classId} classInfo={classInfo} />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <AttendanceTab classId={classId} classInfo={classInfo} />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <AssignmentsTab classId={classId} classInfo={classInfo} />
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <DynamicGradesTab classId={classId} classInfo={classInfo} />
        </TabPanel>
      </Paper>
    </Container>
  );
}

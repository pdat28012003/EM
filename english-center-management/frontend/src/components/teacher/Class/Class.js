/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress
} from "@mui/material";

import {
  People,
  Class,
  Assessment
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { curriculumAPI } from "../../../services/api";

const TeacherClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoaded = React.useRef(false);

  // Helper functions
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

  const navigate = useNavigate();

  const handleViewClassDetail = (classItem) => {
    // Navigate to class detail page
    navigate(`/teacher/classes/${classItem.classId}`);
  };
  
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.teacherId || parsedUser.userId) {
        loadTeacherClasses(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, []);

  const loadTeacherClasses = async (teacherId) => {
    try {
      setLoading(true);
      const response = await curriculumAPI.getCurriculumsByTeacher(teacherId);
      const curriculumsData = response.data || [];
      // Map curriculum data to class format
      const mappedClasses = Array.isArray(curriculumsData) ? curriculumsData.map(c => ({
        classId: c.curriculumId,
        className: c.curriculumName,
        courseName: c.courseName,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        room: c.roomName,
        teacherName: c.teacherName,
        currentStudents: c.currentStudents || 0,
        maxStudents: c.maxStudents || 0
      })) : [];
      setClasses(mappedClasses);
    } catch (error) {
      console.error("Error loading classes:", error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "Active") return "success";
    if (status === "Completed") return "default";
    if (status === "Upcoming") return "warning";
    return "error";
  };

  const ClassCard = ({ classItem }) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: 'pointer', 
        '&:hover': { 
          transform: 'translateY(-4px)',
          boxShadow: 6 
        },
        transition: 'all 0.3s ease'
      }} 
      onClick={() => handleViewClassDetail(classItem)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
              {classItem.className}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {classItem.courseName}
            </Typography>
          </Box>
          <Chip
            label={getStatusText(classItem.status)}
            color={getStatusColor(classItem.status)}
            size="small"
          />
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Giáo viên:</strong> {classItem.teacherName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Phòng:</strong> {classItem.room}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Thời gian:</strong> {formatDate(classItem.startDate)} - {formatDate(classItem.endDate)}
          </Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Sĩ số:</strong> {classItem.currentStudents}{classItem.maxStudents > 0 ? `/${classItem.maxStudents}` : ''}
          </Typography>
          {classItem.maxStudents > 0 && (
            <LinearProgress
              variant="determinate"
              value={Math.min((classItem.currentStudents / classItem.maxStudents) * 100, 100)}
              sx={{ height: 8, borderRadius: 5 }}
            />
          )}
        </Box>

       
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Đang tải dữ liệu...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" mb={1}>
          Quản Lý Lớp Học
        </Typography>
        <Typography color="text.secondary">
          Quản lý các lớp bạn đang giảng dạy
        </Typography>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Class sx={{ fontSize: 40, color: "#1976d2" }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {classes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng khóa học
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <People sx={{ fontSize: 40, color: "#388e3c" }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {classes.reduce((sum, cls) => sum + (cls.currentStudents || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng học viên
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assessment sx={{ fontSize: 40, color: "#f57c00" }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {classes.filter(c => c.status === "Active").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lớp đang hoạt động
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {classes.map((classItem) => (
          <Grid item xs={12} sm={6} md={4} key={classItem.classId}>
            <ClassCard classItem={classItem} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default TeacherClasses;

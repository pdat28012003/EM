
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert
} from "@mui/material";

import {
  Schedule,
  Assignment,
  Assessment,
  People,
  Class,
  AccessTime,
  LocationOn,
  Email,
  Phone
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { classesAPI } from "../../../services/api";

const TeacherClasses = () => {

  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [gradesDialogOpen, setGradesDialogOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (userData) {
      const parsedUser = JSON.parse(userData);
      setTeacher(parsedUser);

      if (parsedUser.teacherId || parsedUser.userId) {
        loadTeacherClasses(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, []);

  const loadTeacherClasses = async (teacherId) => {
    try {

      setLoading(true);

      const response = await classesAPI.getAll({ teacherId });

      const classesData = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setClasses(classesData);

    } catch (error) {

      console.error("Error loading classes:", error);

      setClasses([
        {
          classId: 1,
          className: "IELTS 101 - Basic",
          courseName: "IELTS Preparation",
          startDate: "2024-01-15",
          endDate: "2024-03-15",
          room: "A101",
          currentStudents: 15,
          maxStudents: 20,
          status: "Active",
          schedule: "Thứ 2,4,6 - 19:00-21:00",
        },
        {
          classId: 2,
          className: "TOEIC 201 - Advanced",
          courseName: "TOEIC Preparation",
          startDate: "2024-01-20",
          endDate: "2024-03-20",
          room: "B205",
          currentStudents: 18,
          maxStudents: 25,
          status: "Active",
          schedule: "Thứ 3,5 - 18:00-20:00",
        },
      ]);

    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async (classId) => {
    try {
      const response = await classesAPI.getStudents(classId);
      
      console.log('Students API Response:', response.data);
      
      // API returns array directly, not wrapped in data property
      let studentsData = Array.isArray(response.data) ? response.data : [];
      
      console.log('Raw students data:', studentsData);

      // Map API response to expected format
      studentsData = studentsData.map(student => {
        console.log('Mapping student:', student);
        const mappedStudent = {
          studentId: student.StudentId || student.studentId,
          fullName: student.FullName || student.fullName,
          email: student.Email || student.email,
          phone: student.PhoneNumber || student.phoneNumber || student.phone,
          attendance: 0, // Default values for now
          averageScore: 0
        };
        console.log('Mapped student result:', mappedStudent);
        return mappedStudent;
      });

      console.log('Mapped students data:', studentsData);
      setStudents(studentsData);

    } catch (error) {
      console.error("Error loading students:", error);
      console.error("Error details:", error.response?.data);
      
      // Set empty array on error instead of mock data
      setStudents([]);
    }
  };

  const handleViewStudents = (classItem) => {
    setSelectedClass(classItem);
    loadClassStudents(classItem.classId);
    setStudentsDialogOpen(true);
  };

  const handleTakeAttendance = (classItem) => {
    setSelectedClass(classItem);
    setAttendanceDialogOpen(true);
  };

  const handleViewGrades = (classItem) => {
    setSelectedClass(classItem);
    setGradesDialogOpen(true);
  };

  const getStatusColor = (status) => {
    if (status === "Active") return "success";
    if (status === "Completed") return "default";
    if (status === "Upcoming") return "warning";
    return "error";
  };

  const getAttendanceColor = (attendance) => {
    if (attendance >= 90) return "success";
    if (attendance >= 75) return "warning";
    return "error";
  };

  const ClassCard = ({ classItem }) => (

    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "0.25s",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: 6,
        },
      }}
    >

      <CardContent>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2
          }}
        >

          <Typography variant="h6" fontWeight="bold">
            {classItem.className}
          </Typography>

          <Chip
            label={classItem.status}
            color={getStatusColor(classItem.status)}
            size="small"
          />

        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          {classItem.courseName}
        </Typography>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Schedule fontSize="small" />
          <Typography variant="body2">
            {classItem.schedule}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <LocationOn fontSize="small" />
          <Typography variant="body2">
            Phòng {classItem.room}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AccessTime fontSize="small" />
          <Typography variant="body2">
            {new Date(classItem.startDate).toLocaleDateString("vi-VN")}
            {" - "}
            {new Date(classItem.endDate).toLocaleDateString("vi-VN")}
          </Typography>
        </Box>

        <Box mb={2}>

          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Sĩ số
            </Typography>

            <Typography variant="body2" fontWeight="bold">
              {classItem.currentStudents}/{classItem.maxStudents}
            </Typography>

          </Box>

          <LinearProgress
            variant="determinate"
            value={(classItem.currentStudents / classItem.maxStudents) * 100}
            sx={{
              height: 8,
              borderRadius: 5
            }}
          />

        </Box>

        <Box display="flex" justifyContent="space-between">

          <Tooltip title="Xem học viên">
            <IconButton
              color="primary"
              onClick={() => handleViewStudents(classItem)}
            >
              <People />
            </IconButton>
          </Tooltip>

          <Tooltip title="Điểm danh">
            <IconButton
              color="success"
              onClick={() => handleTakeAttendance(classItem)}
            >
              <Assignment />
            </IconButton>
          </Tooltip>

          <Tooltip title="Xem điểm">
            <IconButton
              color="warning"
              onClick={() => handleViewGrades(classItem)}
            >
              <Assessment />
            </IconButton>
          </Tooltip>

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

        <Grid item xs={12} sm={6} md={3}>

          <Card sx={{ height: "100%" }}>
            <CardContent>

              <Box display="flex" alignItems="center" gap={2}>

                <Class sx={{ fontSize: 40, color: "#1976d2" }} />

                <Box>

                  <Typography variant="h4" fontWeight="bold">
                    {classes.length}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Tổng lớp
                  </Typography>

                </Box>

              </Box>

            </CardContent>
          </Card>

        </Grid>

        <Grid item xs={12} sm={6} md={3}>

          <Card sx={{ height: "100%" }}>
            <CardContent>

              <Box display="flex" alignItems="center" gap={2}>

                <People sx={{ fontSize: 40, color: "#388e3c" }} />

                <Box>

                  <Typography variant="h4" fontWeight="bold">
                    {classes.reduce((sum, cls) => sum + cls.currentStudents, 0)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Tổng học viên
                  </Typography>

                </Box>

              </Box>

            </CardContent>
          </Card>

        </Grid>

        <Grid item xs={12} sm={6} md={3}>

          <Card sx={{ height: "100%" }}>
            <CardContent>

              <Box display="flex" alignItems="center" gap={2}>

                <Schedule sx={{ fontSize: 40, color: "#f57c00" }} />

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

      <Dialog
        open={studentsDialogOpen}
        onClose={() => setStudentsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >

        <DialogTitle>
          Danh sách học viên - {selectedClass?.className}
        </DialogTitle>

        <DialogContent>

          <List>

            {students.map((student) => (

              <ListItem
                key={student.studentId}
                sx={{ borderBottom: "1px solid #eee" }}
              >

                <ListItemAvatar>
                  <Avatar>
                    {student.fullName ? student.fullName.charAt(0).toUpperCase() : '?'}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={student.fullName || 'Không có tên'}
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        <Email fontSize="small" /> {student.email || 'Không có email'}
                      </Typography>

                      <Typography variant="body2" component="span" sx={{ display: 'block', mt: 0.5 }}>
                        <Phone fontSize="small" /> {student.phone || 'Không có số điện thoại'}
                      </Typography>
                    </Box>
                  }
                />

                <Box textAlign="right">

                  <Chip
                    label={`Điểm danh ${student.attendance}%`}
                    color={getAttendanceColor(student.attendance)}
                    size="small"
                    sx={{ mb: 1 }}
                  />

                  <Typography variant="body2">
                    ĐTB {student.averageScore}
                  </Typography>

                </Box>

              </ListItem>

            ))}

          </List>

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setStudentsDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>

      </Dialog>

      <Dialog
        open={attendanceDialogOpen}
        onClose={() => setAttendanceDialogOpen(false)}
      >

        <DialogTitle>
          Điểm danh - {selectedClass?.className}
        </DialogTitle>

        <DialogContent>

          <Alert severity="info">
            Tính năng điểm danh sẽ triển khai ở phiên bản sau
          </Alert>

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setAttendanceDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>

      </Dialog>

      <Dialog
        open={gradesDialogOpen}
        onClose={() => setGradesDialogOpen(false)}
      >

        <DialogTitle>
          Quản lý điểm - {selectedClass?.className}
        </DialogTitle>

        <DialogContent>

          <Alert severity="info">
            Tính năng quản lý điểm sẽ triển khai ở phiên bản sau
          </Alert>

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setGradesDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>

      </Dialog>

    </Container>

  );
};

export default TeacherClasses;

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";

import {
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
import { classesAPI, attendanceAPI } from "../../../services/api";

const TeacherClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [gradesDialogOpen, setGradesDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [attendanceHistoryDialogOpen, setAttendanceHistoryDialogOpen] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({}); // Lưu trạng thái điểm danh cho từng học viên
  const [selectedClass, setSelectedClass] = useState(null);
  const [teacher, setTeacher] = useState(null);

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

  const handleViewExercises = (classItem) => {
    setSelectedClass(classItem);
    setAssignmentDialogOpen(true);
  };

  const handleViewClassDetail = (classItem) => {
    // Navigate to class detail page
    navigate(`/teacher/classes/${classItem.classId}`);
  };
  
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
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async (classId) => {
    try {
      const response = await classesAPI.getStudents(classId);
      let studentsData = Array.isArray(response.data)
        ? response.data
        : [];
      studentsData = studentsData.map(student => ({
        studentId: student.StudentId || student.studentId,
        fullName: student.FullName || student.fullName,
        email: student.Email || student.email,
        phone: student.PhoneNumber || student.phoneNumber || student.phone,
        attendance: 0,
        averageScore: 0
      }));
      setStudents(studentsData);
    } catch (error) {
      console.error("Error loading students:", error);
      setStudents([]);
    }
  };

  const handleViewStudents = (classItem) => {
    setSelectedClass(classItem);
    setAttendanceData({}); // Reset attendance data khi đổi lớp
    loadClassStudents(classItem.classId);
    setStudentsDialogOpen(true);
  };

  const handleViewGrades = (classItem) => {
    setSelectedClass(classItem);
    setAttendanceData({}); // Reset attendance data khi đổi lớp
    setGradesDialogOpen(true);
  };

  const handleAttendanceChange = (studentId, status) => {
    // Chỉ update local state - KHÔNG GỌI API
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAllAttendance = async () => {
    if (!selectedClass) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Load existing attendance 1 lần
      const existingResponse = await attendanceAPI.getAll({
        lessonId: selectedClass.classId,
        date: today
      });
      
      const existingMap = new Map();
      existingResponse.data?.forEach(a => {
        existingMap.set(a.studentId, a);
      });
      
      // Tạo promises cho tất cả operations
      const promises = Object.entries(attendanceData).map(([studentId, status]) => {
        const existing = existingMap.get(parseInt(studentId));
        
        if (existing) {
          return attendanceAPI.update(existing.attendanceId, {
            status: status,
            notes: ''
          });
        } else {
          return attendanceAPI.create({
            studentId: parseInt(studentId),
            lessonId: selectedClass.classId,
            attendanceDate: today,
            status: status
          });
        }
      });
      
      // Execute tất cả cùng lúc
      await Promise.all(promises);
      
      await loadClassStudents(selectedClass.classId);
      setAttendanceData({});
      alert('Đã lưu điểm danh cho tất cả học viên!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Lỗi khi lưu điểm danh: ' + (error.response?.data?.message || error.message));
    }
  };

  // Auto load attendance khi ngày thay đổi
  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendanceHistory();
    }
  }, [selectedDate, selectedClass]); // Chạy khi selectedDate hoặc selectedClass thay đổi

  const loadAttendanceHistory = async () => {
    console.log('loadAttendanceHistory called');
    if (!selectedClass) {
      console.log('No selectedClass');
      return;
    }
    
    try {
      console.log('Loading attendance for date:', selectedDate);
      const response = await attendanceAPI.getAll({
        lessonId: selectedClass.classId,
        date: selectedDate
      });
      const history = response.data || [];
      console.log('Attendance history loaded:', history);
      setAttendanceHistory(history);
    } catch (error) {
      console.error('Error loading attendance history:', error);
      alert('Lỗi khi tải lịch sử điểm danh');
    }
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
            Sĩ số: {classItem.currentStudents}/{classItem.maxStudents}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(classItem.currentStudents / classItem.maxStudents) * 100}
            sx={{ height: 8, borderRadius: 5 }}
          />
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
          <Card>
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
          <Card>
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

      {/* STUDENTS DIALOG */}
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
          {students.length === 0 ? (
            <Alert severity="info">
              Không có học viên trong lớp
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Họ tên</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>SĐT</TableCell>
                    <TableCell align="center">Điểm danh</TableCell>
                    <TableCell align="center">ĐTB</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.studentId} hover>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Email fontSize="small" />
                          {student.email}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Phone fontSize="small" />
                          {student.phone}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: '140px' }}>
                          <Select
                            value={attendanceData[student.studentId] || ''}
                            onChange={(e) => handleAttendanceChange(student.studentId, e.target.value)}
                            displayEmpty
                            size="small"
                          >
                            <MenuItem value="">Chọn...</MenuItem>
                            <MenuItem value="Present">Có mặt</MenuItem>
                            <MenuItem value="Absent">Vắng</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`Điểm danh ${student.attendance}%`}
                          color={getAttendanceColor(student.attendance)}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2">
                          ĐTB {student.averageScore}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentsDialogOpen(false)}>
            Đóng
          </Button>
          <Button 
            variant="contained" 
            color="info"
            onClick={() => {
            
              setAttendanceHistoryDialogOpen(true);
            }}
          >
            Lịch sử điểm danh
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleSaveAllAttendance}
            disabled={Object.keys(attendanceData).length === 0}
          >
            Lưu tất cả
          </Button>
        </DialogActions>
      </Dialog>

      {/* GRADES DIALOG */}
      <Dialog
        open={gradesDialogOpen}
        onClose={() => setGradesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Bảng điểm - {selectedClass?.className}
        </DialogTitle>
        <DialogContent>
          {students.length === 0 ? (
            <Alert severity="info">
              Không có học viên trong lớp
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Họ tên</TableCell>
                    <TableCell align="center">Giữa kỳ</TableCell>
                    <TableCell align="center">Cuối kỳ</TableCell>
                    <TableCell align="center">Trung bình</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.studentId} hover>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell align="center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          style={{ width: "60px" }}
                          defaultValue="0"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          style={{ width: "60px" }}
                          defaultValue="0"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={student.averageScore || 0}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="primary">
            Lưu điểm
          </Button>
          <Button onClick={() => setGradesDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* ATTENDANCE HISTORY DIALOG */}
      <Dialog
        open={attendanceHistoryDialogOpen}
        onClose={() => setAttendanceHistoryDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Lịch sử điểm danh - {selectedClass?.className}
        </DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <TextField
              label="Chọn ngày"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 200 }}
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                loadAttendanceHistory();
                setAttendanceHistoryDialogOpen(true);
              }}
              sx={{ ml: 2 }}
            >
              Tải lịch sử
            </Button>
          </Box>
          {attendanceHistory.length === 0 ? (
            <Alert severity="info">
              Không có dữ liệu điểm danh cho ngày đã chọn
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Họ tên</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>SĐT</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                    <TableCell>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceHistory.map((record) => (
                    <TableRow key={record.attendanceId} hover>
                      <TableCell>{record.studentName}</TableCell>
                      <TableCell>{record.studentEmail}</TableCell>
                      <TableCell>{record.studentPhone}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={record.status === 'Present' ? 'Có mặt' : 'Vắng'}
                          color={record.status === 'Present' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendanceHistoryDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* ASSIGNMENT DIALOG */}
      <Dialog
        open={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Bài tập - {selectedClass?.className}
        </DialogTitle>
        <DialogContent>
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Danh sách bài tập
            </Typography>
            <Button
              variant="contained"
              size="small"
            >
              Tạo bài tập
            </Button>
          </Box>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Tên bài tập</b></TableCell>
                  <TableCell><b>Hạn nộp</b></TableCell>
                  <TableCell align="center"><b>Đã nộp</b></TableCell>
                  <TableCell align="center"><b>Hành động</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow hover>
                  <TableCell>Essay Writing</TableCell>
                  <TableCell>20/03/2026</TableCell>
                  <TableCell align="center">
                    <Chip label="5 / 20" color="primary" size="small"/>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                    >
                      Xem bài nộp
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherClasses;

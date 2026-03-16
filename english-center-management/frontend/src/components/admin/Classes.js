import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  MenuItem,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, People, PersonAdd } from '@mui/icons-material';
import { classesAPI, coursesAPI, teachersAPI, enrollmentsAPI, studentsAPI } from '../../services/api';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [enrollDialog, setEnrollDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [formData, setFormData] = useState({
    className: '',
    courseId: '',
    teacherId: '',
    startDate: '',
    endDate: '',
    maxStudents: 20,
    room: '',
  });

  useEffect(() => {
    loadData();
  }, [paginationModel]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, coursesRes, teachersRes, studentsRes] = await Promise.all([
        classesAPI.getAll({
          page: paginationModel.page + 1,
          pageSize: paginationModel.pageSize,
        }),
        coursesAPI.getAll({ isActive: true }),
        teachersAPI.getAll({ isActive: true }),
        studentsAPI.getAll({ isActive: true }),
      ]);
      const classesData = Array.isArray(classesRes.data?.data) ? classesRes.data.data : [];
      setClasses(classesData);
      setCourses(Array.isArray(coursesRes.data?.data) ? coursesRes.data.data : []);
      setTeachers(Array.isArray(teachersRes.data?.data) ? teachersRes.data.data : []);
      setStudents(Array.isArray(studentsRes.data?.data) ? studentsRes.data.data : []);
      setRowCount(classesRes.data?.totalCount || classesData.length);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      className: '',
      courseId: '',
      teacherId: '',
      startDate: '',
      endDate: '',
      maxStudents: 20,
      room: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await classesAPI.create({
        ...formData,
        courseId: parseInt(formData.courseId),
        teacherId: parseInt(formData.teacherId),
        maxStudents: parseInt(formData.maxStudents),
      });
      handleCloseDialog();
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      loadData();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Có lỗi xảy ra khi lưu thông tin lớp học');
    }
  };

  const columns = [
    { field: 'classId', headerName: 'ID', width: 70 },
    { field: 'className', headerName: 'Tên Lớp', width: 180 },
    { field: 'courseName', headerName: 'Khóa Học', width: 200 },
    { field: 'teacherName', headerName: 'Giáo Viên', width: 180 },
    {
      field: 'startDate',
      headerName: 'Ngày Bắt Đầu',
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN'),
    },
    {
      field: 'endDate',
      headerName: 'Ngày Kết Thúc',
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN'),
    },
    {
      field: 'students',
      headerName: 'Sĩ Số',
      width: 100,
      renderCell: (params) => `${params.row.currentStudents}/${params.row.maxStudents}`,
    },
    { field: 'room', headerName: 'Phòng', width: 100 },
    {
      field: 'status',
      headerName: 'Trạng Thái',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'Active'
              ? 'success'
              : params.value === 'Completed'
              ? 'default'
              : 'error'
          }
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleEnrollStudent(params.row)}
          title="Thêm học viên"
        >
          <PersonAdd />
        </IconButton>
      ),
    },
  ];

  const handleEnrollStudent = (classItem) => {
    setSelectedClass(classItem);
    setSelectedStudent('');
    setEnrollDialog(true);
  };

  const handleSaveEnrollment = async () => {
    if (!selectedStudent || !selectedClass) {
      alert('Vui lòng chọn học viên');
      return;
    }

    try {
      await enrollmentsAPI.create({
        studentId: parseInt(selectedStudent),
        classId: selectedClass.classId,
      });
      
      alert('Đăng ký học viên thành công!');
      setEnrollDialog(false);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error enrolling student:', error);
      
      // Hiển thị lỗi rõ ràng từ backend
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0] || 
                          error.message || 
                          'Lỗi không xác định khi đăng ký học viên';
      
      alert('Lỗi đăng ký: ' + errorMessage);
    }
  };

  // Lọc học viên chưa đăng ký vào lớp đã chọn
  const getAvailableStudents = () => {
    if (!selectedClass || !students.length) return students;
    
    // Lấy danh sách học viên đã đăng ký trong lớp này
    const enrolledStudentIds = selectedClass.enrollments?.map(e => e.studentId) || [];
    
    // Trả về học viên chưa đăng ký
    return students.filter(student => !enrolledStudentIds.includes(student.studentId));
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản Lý Lớp Học
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Thêm Lớp Học
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={classes}
          columns={columns}
          getRowId={(row) => row.classId}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[1, 10, 25, 50]}
          rowCount={rowCount}
          paginationMode="server"
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Lớp Học Mới</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="className"
              label="Tên Lớp"
              value={formData.className}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="VD: ENG101-2024-01"
            />
            <TextField
              name="courseId"
              label="Khóa Học"
              select
              value={formData.courseId}
              onChange={handleInputChange}
              required
              fullWidth
            >
              {courses.map((course) => (
                <MenuItem key={course.courseId} value={course.courseId}>
                  {course.courseName} - {course.courseCode}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="teacherId"
              label="Giáo Viên"
              select
              value={formData.teacherId}
              onChange={handleInputChange}
              required
              fullWidth
            >
              {teachers.map((teacher) => (
                <MenuItem key={teacher.teacherId} value={teacher.teacherId}>
                  {teacher.fullName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="startDate"
              label="Ngày Bắt Đầu"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
            />
            <TextField
              name="endDate"
              label="Ngày Kết Thúc"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
            />
            <TextField
              name="maxStudents"
              label="Sĩ Số Tối Đa"
              type="number"
              value={formData.maxStudents}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              name="room"
              label="Phòng Học"
              value={formData.room}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="VD: A101, B205"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            Thêm Mới
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={enrollDialog} onClose={() => setEnrollDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm học viên vào lớp - {selectedClass?.className}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              select
              label="Chọn học viên"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              fullWidth
              required
              helperText={
                getAvailableStudents().length === 0 
                  ? "Không có học viên nào chưa đăng ký vào lớp này" 
                  : `Có ${getAvailableStudents().length} học viên có thể đăng ký`
              }
            >
              {getAvailableStudents().map((student) => (
                <MenuItem key={student.studentId} value={student.studentId}>
                  {student.fullName} - {student.email}
                </MenuItem>
              ))}
            </TextField>
            
            {getAvailableStudents().length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Tất cả học viên đã đăng ký vào lớp này. Không thể thêm học viên mới.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialog(false)}>Hủy</Button>
          <Button 
            onClick={handleSaveEnrollment} 
            variant="contained"
            disabled={!selectedStudent || getAvailableStudents().length === 0}
          >
            Đăng ký
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Classes;

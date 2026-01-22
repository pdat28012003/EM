import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Chip,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, People } from '@mui/icons-material';
import { classesAPI, coursesAPI, teachersAPI } from '../services/api';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
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
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, coursesRes, teachersRes] = await Promise.all([
        classesAPI.getAll(),
        coursesAPI.getAll({ isActive: true }),
        teachersAPI.getAll({ isActive: true }),
      ]);
      setClasses(classesRes.data);
      setCourses(coursesRes.data);
      setTeachers(teachersRes.data);
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
  ];

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
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
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
    </Container>
  );
};

export default Classes;

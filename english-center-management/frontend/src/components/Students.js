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
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { studentsAPI } from '../services/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    level: 'Beginner',
  });

  const levels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced'];

  useEffect(() => {
    loadStudents();
  }, [searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getAll({ search: searchTerm });
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (student = null) => {
    if (student) {
      setEditMode(true);
      setCurrentStudent(student);
      setFormData({
        fullName: student.fullName,
        email: student.email,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth.split('T')[0],
        address: student.address,
        level: student.level,
      });
    } else {
      setEditMode(false);
      setCurrentStudent(null);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        level: 'Beginner',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentStudent(null);
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
      if (editMode) {
        await studentsAPI.update(currentStudent.studentId, {
          ...formData,
          isActive: true,
        });
      } else {
        await studentsAPI.create(formData);
      }
      handleCloseDialog();
      loadStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Có lỗi xảy ra khi lưu thông tin học viên');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học viên này?')) {
      try {
        await studentsAPI.delete(id);
        loadStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Có lỗi xảy ra khi xóa học viên');
      }
    }
  };

  const columns = [
    { field: 'studentId', headerName: 'ID', width: 70 },
    { field: 'fullName', headerName: 'Họ và Tên', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phoneNumber', headerName: 'Số Điện Thoại', width: 130 },
    {
      field: 'dateOfBirth',
      headerName: 'Ngày Sinh',
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN'),
    },
    {
      field: 'level',
      headerName: 'Trình Độ',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'Advanced'
              ? 'success'
              : params.value === 'Intermediate'
              ? 'primary'
              : params.value === 'Elementary'
              ? 'warning'
              : 'default'
          }
          size="small"
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Trạng Thái',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Đang học' : 'Ngưng học'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 150,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.studentId)}
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản Lý Học Viên
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Học Viên
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          label="Tìm kiếm học viên"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nhập tên, email hoặc số điện thoại..."
        />
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={students}
          columns={columns}
          getRowId={(row) => row.studentId}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Chỉnh Sửa Học Viên' : 'Thêm Học Viên Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="fullName"
              label="Họ và Tên"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              name="phoneNumber"
              label="Số Điện Thoại"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              name="dateOfBirth"
              label="Ngày Sinh"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
            />
            <TextField
              name="address"
              label="Địa Chỉ"
              value={formData.address}
              onChange={handleInputChange}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              name="level"
              label="Trình Độ"
              select
              value={formData.level}
              onChange={handleInputChange}
              required
              fullWidth
            >
              {levels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Cập Nhật' : 'Thêm Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Students;

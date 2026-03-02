import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Schedule } from '@mui/icons-material';
import { teachersAPI } from '../services/api';

const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    qualifications: '',
    hourlyRate: '',
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersAPI.getAll();
      setTeachers(response.data);
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      specialization: '',
      qualifications: '',
      hourlyRate: '',
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
      await teachersAPI.create({
        ...formData,
        hourlyRate: parseFloat(formData.hourlyRate),
      });
      handleCloseDialog();
      loadTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Có lỗi xảy ra khi lưu thông tin giáo viên');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const columns = [
    { field: 'teacherId', headerName: 'ID', width: 70 },
    { field: 'fullName', headerName: 'Họ và Tên', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phoneNumber', headerName: 'Số Điện Thoại', width: 130 },
    { field: 'specialization', headerName: 'Chuyên Môn', width: 200 },
    {
      field: 'hourlyRate',
      headerName: 'Lương/Giờ',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: 'hireDate',
      headerName: 'Ngày Vào Làm',
      width: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN'),
    },
    {
      field: 'isActive',
      headerName: 'Trạng Thái',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Đang dạy' : 'Nghỉ'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành Động',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          color="primary"
          onClick={() => navigate(`/teacher-schedule/${params.row.teacherId}`)}
          title="Xem lịch giảng dạy"
        >
          <Schedule />
        </IconButton>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản Lý Giáo Viên
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Thêm Giáo Viên
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={teachers}
          columns={columns}
          getRowId={(row) => row.teacherId}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Giáo Viên Mới</DialogTitle>
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
              name="specialization"
              label="Chuyên Môn"
              value={formData.specialization}
              onChange={handleInputChange}
              placeholder="VD: General English, IELTS"
              fullWidth
            />
            <TextField
              name="qualifications"
              label="Bằng Cấp / Chứng Chỉ"
              value={formData.qualifications}
              onChange={handleInputChange}
              multiline
              rows={2}
              placeholder="VD: TESOL Certificate, MA in English Education"
              fullWidth
            />
            <TextField
              name="hourlyRate"
              label="Lương Theo Giờ (VND)"
              type="number"
              value={formData.hourlyRate}
              onChange={handleInputChange}
              required
              fullWidth
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

export default Teachers;

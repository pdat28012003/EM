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
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Schedule, Visibility, VisibilityOff, Search } from '@mui/icons-material';
import { teachersAPI } from '../../../services/api';

const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'active', 'inactive'
    search: ''
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    specialization: '',
    qualifications: '',
    hourlyRate: 0,
    isActive: true
  });

  useEffect(() => {
    loadTeachers();
  }, [paginationModel, filters]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      };
      
      // Add status filter
      if (filters.status === 'active') {
        params.isActive = true;
      } else if (filters.status === 'inactive') {
        params.isActive = false;
      }
      
      // Add search filter
      if (filters.search) {
        params.search = filters.search;
      }
      
      const response = await teachersAPI.getAll(params);
      const teachersData = response.data?.data || [];
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setRowCount(response.data?.totalCount || 0);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        fullName: teacher.fullName || '',
        email: teacher.email || '',
        phoneNumber: teacher.phoneNumber || '',
        password: '',
        specialization: teacher.specialization || '',
        qualifications: teacher.qualifications || '',
        hourlyRate: teacher.hourlyRate || 0,
        isActive: teacher.isActive ?? true
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        specialization: '',
        qualifications: '',
        hourlyRate: 0,
        isActive: true
      });
    }
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
      const submitData = {
        ...formData,
        hourlyRate: parseFloat(formData.hourlyRate),
      };
      
      if (editingTeacher && editingTeacher.teacherId) {
        await teachersAPI.update(editingTeacher.teacherId, submitData);
      } else {
        await teachersAPI.create(submitData);
      }
      handleCloseDialog();
      loadTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Có lỗi xảy ra khi lưu thông tin giáo viên');
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Bạn có chắc muốn xóa giảng viên này?')) {
      try {
        await teachersAPI.delete(teacherId);
        loadTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Có lỗi xảy ra khi xóa giảng viên');
      }
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
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
            title="Sửa"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteTeacher(params.row.teacherId)}
            title="Xóa"
          >
            <Delete />
          </IconButton>
          <IconButton
            size="small"
            color="info"
            onClick={() => navigate(`/teacher-schedule/${params.row.teacherId}`)}
            title="Xem lịch giảng dạy"
          > 
            <Schedule />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản Lý Giảng Viên
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Giảng Viên
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            select
            label="Trạng Thái"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">Tất Cả</MenuItem>
            <MenuItem value="active">Đang Dạy</MenuItem>
            <MenuItem value="inactive">Đã Nghỉ</MenuItem>
          </TextField>
          
          <TextField
            label="Tìm Kiếm"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            size="small"
            placeholder="Tên, Email, SĐT..."
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
            sx={{ minWidth: 200, flex: 1 }}
          />
          
          
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={teachers}
          columns={columns}
          getRowId={(row) => row.teacherId}
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
        <DialogTitle>{editingTeacher ? 'Sửa Giảng Viên' : 'Thêm Giảng Viên Mới'}</DialogTitle>
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
            {!editingTeacher && (
              <TextField
                name="password"
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                required
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ mr: 1 }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            )}
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
            {editingTeacher ? 'Cập Nhật' : 'Thêm Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Teachers;

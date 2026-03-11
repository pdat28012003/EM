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
  Avatar,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Schedule, CloudUpload, Visibility, VisibilityOff } from '@mui/icons-material';
import { teachersAPI, UPLOAD_URL } from '../services/api';

const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    username:'',
    password: '',
    avatar:'',
    specialization: '',
    qualifications: '',
    hourlyRate: '',
  });

  useEffect(() => {
    loadTeachers();
  }, [paginationModel]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersAPI.getAll({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });
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

  const handleOpenDialog = () => {
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      username: '',
      password: '',
      avatar: '',
      specialization: '',
      qualifications: '',
      hourlyRate: '',
    });
    setAvatarFile(null);
    setAvatarPreview('');
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const handleSubmit = async () => {
    try {
      let submitData = { ...formData };
      
      // Handle avatar upload
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', avatarFile);
        
        try {
          const uploadResponse = await fetch(UPLOAD_URL, {
            method: 'POST',
            body: formDataUpload,
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            submitData.avatar = uploadResult.url;
          } else {
            throw new Error('Upload failed');
          }
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          alert('Có lỗi xảy ra khi upload avatar. Vui lòng thử lại.');
          return;
        }
      }
      
      await teachersAPI.create({
        ...submitData,
        hourlyRate: parseFloat(submitData.hourlyRate),
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
    {field: 'username', headerName: 'Tên đăng nhập', width: 200},
    { field: 'avatar', headerName: 'Ảnh đại diện', width: 80,
      renderCell: (params) => (
        params.value ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={1}>
            <img 
              src={params.value.startsWith('http') ? params.value : `http://localhost:5000${params.value}`} 
              alt="Avatar" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNSAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTcuNSIgY3k9IjE3LjUiIHI9IjE3LjUiIGZpbGw9IiNGNUY1RjUiLz4KPHR5cG8gZD0iTTE3LjUgMTJDMTkuOTg5MyAxMiAyMiAxNC4wMTA3IDIyIDE2LjVDMjIgMTguOTg5MyAxOS45ODkzIDIxIDE3LjUgMjFDMTUuMDEwNyAyMSAxMyAxOC45ODkzIDEzIDE2LjVDMTMgMTQuMDEwNyAxNS4wMTA3IDEyIDE3LjUgMTJaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo=';
              }}
              style={{ 
                width: 35, 
                height: 35, 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '1px solid #e0e0e0'
              }}
            />
          </Box>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" p={1}>
            <Typography variant="caption" color="textSecondary">Không có</Typography>
          </Box>
        )
      ),
    },
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
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[1, 10, 25, 50]}
          rowCount={rowCount}
          paginationMode="server"
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
              name="username"
              label="Tên đăng nhập"
              value={formData.username}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
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
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Avatar
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {avatarPreview ? (
                  <>
                    <Avatar
                      src={avatarPreview}
                      sx={{ width: 80, height: 80 }}
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleRemoveAvatar}
                      size="small"
                    >
                      Xóa Avatar
                    </Button>
                  </>
                ) : (
                  <>
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'grey.300' }}>
                      <CloudUpload sx={{ fontSize: 40, color: 'grey.600' }} />
                    </Avatar>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUpload />}
                    >
                      Chọn Ảnh
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </Button>
                  </>
                )}
              </Box>
              {avatarFile && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Đã chọn: {avatarFile.name}
                </Typography>
              )}
            </Box>
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

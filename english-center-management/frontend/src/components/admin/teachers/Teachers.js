import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  InputAdornment,
  Grid,
  CircularProgress,
  useTheme,
  Avatar,
  Stack,
  Menu,
  Divider,
  Switch,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Add, 
  Edit, 
  Delete, 
  Schedule, 
  Visibility, 
  VisibilityOff, 
  Search,
  MoreVert,
  Mail,
  Phone,
  Clear
} from '@mui/icons-material';
import { teachersAPI } from '../../../services/api';

const Teachers = () => {
  const theme = useTheme();
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
    skill: 'all',
    search: ''
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    specialization: '',
    qualifications: '',
    hourlyRate: '',
    isActive: true,
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTeacherForMenu, setSelectedTeacherForMenu] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // Add skill filter
      if (filters.skill && filters.skill !== 'all') {
        params.search = params.search ? `${params.search} ${filters.skill}` : filters.skill;
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
        hourlyRate: teacher.hourlyRate !== undefined ? teacher.hourlyRate : '',
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
        hourlyRate: '',
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
    
    if (name === 'hourlyRate') {
      // Chỉ lấy số, loại bỏ mọi ký tự không phải số và các số 0 vô nghĩa ở đầu
      const rawValue = value.replace(/\D/g, '');
      const cleanValue = rawValue === '' ? '' : parseInt(rawValue, 10).toString();
      
      setFormData((prev) => ({
        ...prev,
        [name]: cleanValue === '' ? '' : parseInt(cleanValue, 10),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const formatInputCurrency = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    if (!editingTeacher && !formData.password.trim()) newErrors.password = 'Vui lòng nhập mật khẩu';
    if (!formData.hourlyRate || formData.hourlyRate <= 0) newErrors.hourlyRate = 'Lương phải lớn hơn 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
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
      setFilters(prev => ({ ...prev, search: '', status: 'all', skill: 'all' })); // Reset bộ lọc và tìm kiếm
      loadTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin giáo viên';
      alert(errorMessage);
    } finally {
      setLoading(false);
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
    }).format(amount || 0).replace('₫', 'đ');
  };

  const handleOpenMenu = (event, teacher) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTeacherForMenu(teacher);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedTeacherForMenu(null);
  };

  const handleToggleStatus = async (teacher) => {
    try {
      const newStatus = !teacher.isActive;
      await teachersAPI.update(teacher.teacherId, { ...teacher, isActive: newStatus });
      loadTeachers();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Có lỗi xảy ra khi thay đổi trạng thái');
    }
  };

  const getAvatarStyle = (name) => {
    const colors = ['#e1f5fe', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec'];
    const textColors = ['#0288d1', '#7b1fa2', '#2e7d32', '#e65100', '#c2185b'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return {
      bgcolor: colors[index],
      color: textColors[index],
      fontWeight: 700,
      fontSize: '0.75rem',
      width: 32,
      height: 32
    };
  };

  const columns = [
    { 
      field: 'teacherId', 
      headerName: 'ID', 
      width: 60,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'fullName', 
      headerName: 'Họ và Tên', 
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={getAvatarStyle(params.value)}>
            {params.value ? params.value.charAt(0) : 'T'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={800} noWrap>
              {params.value}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      field: 'contact',
      headerName: 'Liên Hệ',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, display: 'flex', alignItems: 'center', mb: 0.5 }}>
             <Mail sx={{ fontSize: 14, mr: 1, color: '#64748b' }} />
             {params.row.email}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
             <Phone sx={{ fontSize: 14, mr: 1, color: '#64748b' }} />
             {params.row.phoneNumber || 'Không có sđt'}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'specialization', 
      headerName: 'Kỹ Năng', 
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2" color="text.secondary">N/A</Typography>;
        // Split by comma or slash
        const skills = params.value.split(/[,/]+/).map(s => s.trim()).filter(s => s);
        const visibleSkills = skills.slice(0, 2);
        const hiddenCount = skills.length - 2;

        return (
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
            {visibleSkills.map((skill, index) => (
              <Chip 
                key={index} 
                label={skill} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(99, 102, 241, 0.1)', 
                  color: '#4f46e5', 
                  fontWeight: 600, 
                  height: 24, 
                  fontSize: '0.7rem',
                  borderRadius: 1.5
                }} 
              />
            ))}
            {hiddenCount > 0 && (
              <Tooltip title={skills.slice(2).join(', ')}>
                <Chip 
                  label={`+${hiddenCount}`} 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(100, 116, 139, 0.1)', 
                    color: '#64748b', 
                    fontWeight: 700, 
                    height: 24, 
                    fontSize: '0.7rem',
                    borderRadius: 1.5,
                    cursor: 'pointer'
                  }} 
                />
              </Tooltip>
            )}
          </Box>
        );
      }
    },
    {
      field: 'hourlyRate',
      headerName: 'Lương/Giờ',
      width: 140,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} color="primary.main">
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Trạng Thái',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={() => handleToggleStatus(params.row)}
          size="small"
          color="success"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 80,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params) => (
        <IconButton 
          size="small" 
          onClick={(e) => handleOpenMenu(e, params.row)}
          className="actions-icon"
          sx={{ transition: 'all 0.2s', color: 'text.secondary' }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ color: 'text.primary', mb: 0.5 }}>
            Quản Lý Giảng Viên
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng số: <strong>{rowCount}</strong> giảng viên
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: 2, 
            px: 3, 
            py: 1,
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
        >
          Thêm Giảng Viên
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Tìm theo tên, email, sđt..."
            value={filters.search}
            name="search_teacher_field_unique"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            size="small"
            sx={{ flexGrow: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2.5, bgcolor: 'background.paper' },
              autoComplete: 'off',
            }}
            inputProps={{
              autoComplete: 'off',
            }}
          />
          <Stack direction="row" spacing={1}>
            {['IELTS', 'TOEIC', 'Giao tiếp'].map((skill) => {
              const isActive = filters.skill === skill;
              return (
                <Chip 
                  key={skill} 
                  label={skill} 
                  onClick={() => setFilters({ ...filters, skill: isActive ? 'all' : skill })} 
                  variant={isActive ? 'filled' : 'outlined'}
                  color={isActive ? 'info' : 'default'}
                  sx={{ 
                    borderRadius: 2, 
                    fontWeight: 600, 
                    fontSize: '0.75rem',
                    height: 36,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    bgcolor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: isActive ? '#4f46e5' : 'text.secondary',
                    border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(226, 232, 240, 1)',
                    '&:hover': { 
                      bgcolor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(241, 245, 249, 1)',
                    }
                  }}
                />
              );
            })}
          </Stack>

          <Stack direction="row" spacing={1}>
            {['all', 'active', 'inactive'].map((status) => {
              const labels = { all: 'Tất cả trạng thái', active: 'Đang dạy', inactive: 'Nghỉ' };
              const isActive = filters.status === status;
              return (
                <Chip 
                  key={status} 
                  label={labels[status]} 
                  onClick={() => setFilters({ ...filters, status })} 
                  variant={isActive ? 'filled' : 'outlined'}
                  color={isActive ? 'primary' : 'default'}
                  sx={{ 
                    borderRadius: 2, 
                    fontWeight: 700, 
                    fontSize: '0.75rem',
                    height: 36,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    boxShadow: (isActive && theme.palette.mode === 'dark') 
                      ? '0 0 15px rgba(59, 130, 246, 0.4)' 
                      : 'none',
                    border: isActive ? 'none' : '1px solid rgba(226, 232, 240, 0.2)',
                    '&:hover': { 
                      bgcolor: isActive ? 'primary.dark' : 'rgba(59, 130, 246, 0.08)',
                      transform: 'translateY(-1px)',
                      boxShadow: isActive && theme.palette.mode === 'dark' 
                        ? '0 0 20px rgba(59, 130, 246, 0.6)' 
                        : '0 4px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ 
        height: 600, 
        width: '100%', 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <DataGrid
          rows={teachers}
          columns={columns}
          getRowId={(row) => row.teacherId}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          rowCount={rowCount}
          paginationMode="server"
          disableSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.5)',
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 800,
              color: 'text.secondary',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            },
            '& .MuiDataGrid-row': {
              transition: 'all 0.2s ease',
              borderBottom: '1px solid rgba(226, 232, 240, 0.05)',
              minHeight: '75px !important', // Tăng khoảng cách dòng
              maxHeight: '100px !important',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.04)' : '#f8fafc',
                '& .actions-icon': {
                  color: 'primary.main',
                  transform: 'scale(1.1)',
                }
              }
            },
            '& .MuiDataGrid-cell': {
              borderBottom: 'none',
              py: 2, // Tăng padding
              display: 'flex',
              alignItems: 'center'
            },
            // Scrollbar (Thanh cuộn mỏng nhẹ)
            '& ::-webkit-scrollbar': {
              width: '6px',
              height: '6px',
            },
            '& ::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '& ::-webkit-scrollbar-thumb': {
              background: 'rgba(148, 163, 184, 0.4)',
              borderRadius: '10px',
            },
            '& ::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(100, 116, 139, 0.6)',
            }
          }}
          rowHeight={80} // Tăng row height cho thoáng
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            minWidth: 160,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }
        }}
      >
        <MenuItem onClick={() => { handleOpenDialog(selectedTeacherForMenu); handleCloseMenu(); }}>
          <Edit sx={{ mr: 1.5, fontSize: 18, color: 'primary.main' }} /> Sửa thông tin
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/teacher-schedule/${selectedTeacherForMenu.teacherId}`); handleCloseMenu(); }}>
          <Schedule sx={{ mr: 1.5, fontSize: 18, color: 'info.main' }} /> Xem lịch giảng dạy
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => { handleDeleteTeacher(selectedTeacherForMenu.teacherId); handleCloseMenu(); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1.5, fontSize: 18 }} /> Xóa giảng viên
        </MenuItem>
      </Menu>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 0 }
        }}
      >
        <DialogTitle sx={{ p: 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={900}>
            {editingTeacher ? 'Cập Nhật Giảng Viên' : 'Thêm Giảng Viên Mới'}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small" sx={{ bgcolor: 'action.hover' }}>
            <Clear />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="fullName"
                label="Họ và Tên *"
                value={formData.fullName}
                onChange={handleInputChange}
                error={!!errors.fullName}
                helperText={errors.fullName}
                fullWidth
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email *"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phoneNumber"
                label="Số Điện Thoại *"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                fullWidth
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="specialization"
                label="Chuyên Môn"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="VD: English, IELTS"
                fullWidth
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="password"
                label={editingTeacher ? "Mật khẩu mới (Bỏ trống)" : "Mật khẩu *"}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
                fullWidth
                InputProps={{
                  sx: { borderRadius: 2.5 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="hourlyRate"
                label="Lương Theo Giờ (VND) *"
                value={formatInputCurrency(formData.hourlyRate)}
                onChange={handleInputChange}
                error={!!errors.hourlyRate}
                helperText={errors.hourlyRate}
                placeholder="0"
                fullWidth
                InputProps={{ 
                  sx: { borderRadius: 2.5 },
                  endAdornment: <InputAdornment position="end">đ/giờ</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="qualifications"
                label="Bằng Cấp / Chứng Chỉ"
                value={formData.qualifications}
                onChange={handleInputChange}
                multiline
                rows={2}
                placeholder="VD: TESOL Certificate, MA in English Education"
                fullWidth
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', fontWeight: 700 }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ 
              borderRadius: 2.5, 
              px: 3, 
              textTransform: 'none', 
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
            }}
          >
            {loading ? 'Đang lưu...' : (editingTeacher ? 'Cập Nhật' : 'Thêm Giảng Viên')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teachers;

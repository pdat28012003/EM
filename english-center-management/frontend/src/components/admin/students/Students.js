import React, { useEffect, useMemo, useState } from 'react';
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
  Avatar,
  Tooltip,
  Menu,
  InputAdornment,
  Fade,
  Drawer,
  Divider,
  Stack,
  useTheme,
  Grid,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Add, 
  Edit, 
  Delete, 
  Visibility, 
  VisibilityOff, 
  CalendarMonth, 
  AssignmentInd, 
  CloudUpload,
  MoreVert,
  Search,
  Clear,
  PersonAdd,
  FilterList,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { studentsAPI, enrollmentsAPI, classesAPI, UPLOAD_URL } from '../../../services/api';

const Students = () => {
  const theme = useTheme();
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Tất cả');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [studentSchedule, setStudentSchedule] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    password: '',
    avatar: '',
    level: 'Beginner',
    isActive: true
  });
  const [enrollData, setEnrollData] = useState({
    classId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedStudentForMenu, setSelectedStudentForMenu] = useState(null);

  const levels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced'];
  const quickFilters = useMemo(() => {
    const base = ['Tất cả', 'Đang học', 'Ngưng học'];
    // If user selected a level via menu, show it as a visible active chip too.
    if (
      filterValue &&
      filterValue !== 'Tất cả' &&
      filterValue !== 'Đang học' &&
      filterValue !== 'Ngưng học' &&
      !base.includes(filterValue)
    ) {
      return [...base, filterValue];
    }
    return base;
  }, [filterValue]);

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, [searchTerm, filterValue, paginationModel]);

  const toDateInputValue = (value) => {
    if (!value) return '';
    const s = value.toString();
    return s.includes('T') ? s.split('T')[0] : s;
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      };

      if (filterValue === 'Đang học') params.isActive = true;
      if (filterValue === 'Ngưng học') params.isActive = false;
      if (
        filterValue &&
        filterValue !== 'Tất cả' &&
        filterValue !== 'Đang học' &&
        filterValue !== 'Ngưng học'
      ) {
        params.level = filterValue;
      }

      const response = await studentsAPI.getAll(params);
      console.log('Students API Response:', response.data);
      
      // API returns { data: { data: { Data: [], TotalCount: number } } }
      // axios interceptor converts PascalCase Data to camelCase data
      const responseData = response.data?.data || {};
      const innerData = responseData.data || responseData;
      console.log('Students innerData:', innerData);
      
      // innerData is already the array after axios conversion
      const items = Array.isArray(innerData) ? innerData : [];
      console.log('Students items:', items);
      
      // Convert PascalCase to camelCase
      const normalizedStudents = Array.isArray(items) ? items.map(s => ({
        studentId: s.studentId,
        fullName: s.fullName,
        email: s.email,
        phoneNumber: s.phoneNumber,
        dateOfBirth: s.dateOfBirth,
        address: s.address,
        level: s.level,
        isActive: s.isActive,
        enrollmentDate: s.enrollmentDate,
        avatar: s.avatar
      })) : [];
      console.log('Students normalized:', normalizedStudents);
      
      setStudents(normalizedStudents); 
      setTotalCount(responseData.totalCount || responseData.TotalCount || normalizedStudents.length);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classesAPI.getAll({ status: 'Active' });
      const classesData = response.data?.Data || response.data?.data || response.data || [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleOpenDialog = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        fullName: student.fullName || '',
        email: student.email || '',
        phoneNumber: student.phoneNumber || '',
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        address: student.address || '',
        level: student.level || 'Beginner',
        isActive: student.isActive
      });
    } else {
      setEditingStudent(null);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        password: '',
        level: 'Beginner',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleOpenEnrollDialog = (student) => {
    setEditingStudent(student);
    setCurrentStudent(student);
    setEnrollData({ classId: '' });
    setOpenEnrollDialog(true);
  };

  const handleOpenScheduleDialog = async (student) => {
    setCurrentStudent(student);
    try {
      const response = await studentsAPI.getSchedule(student.studentId);
      setStudentSchedule(response.data);
      setOpenScheduleDialog(true);
    } catch (error) {
      console.error('Error loading student schedule:', error);
      alert('Có lỗi xảy ra khi tải thời khóa biểu');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setOpenEnrollDialog(false);
    setOpenScheduleDialog(false);
    setCurrentStudent(null);
  };

  const handleOpenMenu = (event, student) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedStudentForMenu(student);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedStudentForMenu(null);
  };

  const handleOpenFilterMenu = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleCloseFilterMenu = () => {
    setFilterAnchorEl(null);
  };

  const handleLevelFilterSelect = (level) => {
    setFilterValue(level);
    handleCloseFilterMenu();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEnrollChange = (e) => {
    setEnrollData({ classId: e.target.value });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      if (editingStudent) {
        await studentsAPI.update(editingStudent.studentId, formData);
      } else {
        // Tự động dùng số điện thoại làm mật khẩu khởi tạo nếu không nhập
        const dataToSave = {
          ...formData,
          password: formData.password || formData.phoneNumber
        };
        await studentsAPI.create(dataToSave);
      }
      handleCloseDialog();
      setSearchTerm(''); // Xóa nội dung tìm kiếm
      setFilterValue('Tất cả'); // Reset bộ lọc
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      loadStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin học viên';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollSubmit = async () => {
    if (!enrollData.classId) {
      alert('Vui lòng chọn lớp học');
      return;
    }
    
    if (!currentStudent || !currentStudent.studentId) {
      alert('Không tìm thấy thông tin học viên');
      return;
    }
    
    try {
      await enrollmentsAPI.create({
        studentId: currentStudent.studentId,
        classId: parseInt(enrollData.classId),
      });
      alert('Đăng ký vào chương trình học thành công');
      handleCloseDialog();
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký học viên');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học viên này?')) {
      try {
        await studentsAPI.delete(id);
        setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset về trang 1 sau khi xóa
        loadStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        // Hiển thị chính xác error message từ API
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa học viên';
        alert(errorMessage);
      }
    }
  };

  const avatarColors = [
    '#e1f5fe', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec', 
    '#efebe9', '#e0f2f1', '#f9fbe7', '#fff8e1'
  ];
  const avatarTextColors = [
    '#0288d1', '#7b1fa2', '#2e7d32', '#e65100', '#c2185b', 
    '#5d4037', '#00796b', '#827717', '#f57f17'
  ];

  const getAvatarStyle = (name) => {
    const index = name.charCodeAt(0) % avatarColors.length;
    return {
      bgcolor: avatarColors[index],
      color: avatarTextColors[index],
      fontWeight: 700,
      fontSize: '0.75rem',
      width: 28,
      height: 28,
      flexShrink: 0
    };
  };

  const levelStyles = {
    Beginner: { 
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(241, 245, 249, 0.8)', 
      color: theme.palette.mode === 'dark' ? '#94a3b8' : '#475569',
      border: theme.palette.mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid rgba(226, 232, 240, 0.5)',
      fontWeight: 600
    },
    Elementary: { 
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 251, 235, 0.8)', 
      color: theme.palette.mode === 'dark' ? '#f59e0b' : '#b45309',
      border: theme.palette.mode === 'dark' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(254, 243, 199, 0.5)',
      fontWeight: 600
    },
    'Pre-Intermediate': { 
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(236, 253, 245, 0.8)', 
      color: theme.palette.mode === 'dark' ? '#10b981' : '#047857',
      border: theme.palette.mode === 'dark' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(209, 250, 229, 0.5)',
      fontWeight: 600
    },
    Intermediate: { 
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 246, 255, 0.8)', 
      color: theme.palette.mode === 'dark' ? '#3b82f6' : '#1d4ed8',
      border: theme.palette.mode === 'dark' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(219, 234, 254, 0.5)',
      fontWeight: 600
    },
    'Upper-Intermediate': { 
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 243, 255, 0.8)', 
      color: theme.palette.mode === 'dark' ? '#8b5cf6' : '#6d28d9',
      border: theme.palette.mode === 'dark' ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(237, 233, 254, 0.5)',
      fontWeight: 600
    },
    Advanced: { 
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 242, 242, 0.8)', 
      color: theme.palette.mode === 'dark' ? '#ef4444' : '#b91c1c',
      border: theme.palette.mode === 'dark' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(254, 226, 226, 0.5)',
      fontWeight: 600
    },
  };

  const getLevelStyle = (level) => levelStyles[level] || levelStyles.Beginner;

  const columns = [
    { 
      field: 'studentId', 
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
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
          <Avatar 
            src={params.row.avatar ? `${UPLOAD_URL}/${params.row.avatar}` : ''}
            sx={getAvatarStyle(params.value)}
          >
            {params.value.charAt(0)}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.7 }}>
               {params.row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'phoneNumber',
      headerName: 'Số ĐT',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary', 
            fontWeight: 500,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'dateOfBirth',
      headerName: 'Ngày Sinh',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {params.value ? new Date(params.value).toLocaleDateString('vi-VN') : '-'}
        </Typography>
      ),
    },
    {
      field: 'address',
      headerName: 'Địa Chỉ',
      width: 240,
      renderCell: (params) => (
        <Tooltip title={params.value || '-'} arrow placement="top">
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              maxWidth: 240,
            }}
          >
            {params.value || '-'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'level',
      headerName: 'Trình Độ',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            ...getLevelStyle(params.value),
            borderRadius: 1.5,
            fontSize: '0.7rem',
            height: 22,
            minWidth: 80,
          }}
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Trạng Thái',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const isActive = params.value;
        return (
          <Chip
            label={isActive ? 'Đang học' : 'Ngưng học'}
            size="small"
            sx={{
              bgcolor: isActive ? 'rgba(46, 125, 50, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              color: isActive ? '#2e7d32' : '#9e9e9e',
              border: isActive ? '1px solid rgba(46, 125, 50, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: 1.5,
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22,
              minWidth: 80,
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
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
    <Box sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={900} sx={{ color: 'text.primary', letterSpacing: -0.5 }}>
          Quản Lý Học Viên
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Typography variant="body2" sx={{ color: 'text.secondary', alignSelf: 'center', mr: 2 }}>
            Tổng số: <strong>{totalCount}</strong> học viên
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              px: 3,
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 20px rgba(59, 130, 246, 0.35)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Thêm Học Viên
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ mb: 3, p: 2, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
             placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
             variant="outlined"
             size="small"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             name="search_student_field_unique"
             InputProps={{
               startAdornment: (
                 <InputAdornment position="start">
                   <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                 </InputAdornment>
               ),
               sx: { borderRadius: 3, bgcolor: 'background.default', minWidth: 320 },
               autoComplete: 'off'
             }}
             inputProps={{
               autoComplete: 'off'
             }}
          />
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            {quickFilters.map((label) => {
              const isActive = filterValue === label;
              const isLevel =
                label !== 'Tất cả' &&
                label !== 'Đang học' &&
                label !== 'Ngưng học';
              const levelStyle = isLevel ? getLevelStyle(label) : null;
              return (
                <Chip 
                  key={label} 
                  label={label} 
                  onClick={() => setFilterValue(label)} 
                  variant={isActive ? 'filled' : 'outlined'}
                  color={isActive ? 'primary' : 'default'}
                  sx={{ 
                    borderRadius: 1.5, 
                    fontWeight: 600, 
                    fontSize: '0.75rem',
                    height: 32,
                    px: 0.5,
                    cursor: 'pointer',
                    ...(isActive && isLevel ? {
                      bgcolor: levelStyle?.bgcolor,
                      color: levelStyle?.color,
                      border: levelStyle?.border,
                      boxShadow: 'none',
                    } : {}),
                    ...(!isActive ? {
                      border: (theme.palette.mode === 'dark') ? 'none' : '1px solid',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      color: 'inherit',
                      boxShadow: 'none',
                    } : {}),
                    ...(isActive && !isLevel ? {
                      bgcolor: 'primary.main',
                      color: 'white',
                      border: theme.palette.mode === 'dark' ? 'none' : '1px solid',
                      boxShadow: theme.palette.mode === 'dark' ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none',
                    } : {}),
                    '&:hover': { 
                      ...(isLevel
                        ? { bgcolor: levelStyle?.bgcolor, color: levelStyle?.color, border: levelStyle?.border, boxShadow: 'none' }
                        : { bgcolor: 'primary.main', color: 'white', boxShadow: theme.palette.mode === 'dark' ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none' })
                    }
                  }}
                />
              );
            })}
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <IconButton 
            onClick={handleOpenFilterMenu}
            sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'background.default', 
              borderRadius: 2,
              '&:hover': { bgcolor: 'primary.main', color: 'white' }
            }}
          >
            <FilterList fontSize="small" />
          </IconButton>
          
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleCloseFilterMenu}
            PaperProps={{
              sx: {
                width: 200,
                borderRadius: 2,
                mt: 1,
                boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.1)',
                border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : 'none',
              }
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Lọc theo trình độ
              </Typography>
            </Box>
            {['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced'].map((level) => (
              <MenuItem 
                key={level} 
                onClick={() => handleLevelFilterSelect(level)}
                selected={filterValue === level}
              >
                {level}
              </MenuItem>
            ))}
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => handleLevelFilterSelect('Tất cả')} sx={{ color: 'error.main' }}>
              Xóa bộ lọc
            </MenuItem>
          </Menu>
        </Box>
      </Paper>

      <Paper sx={{
        height: 600,
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <DataGrid
          rows={students}
          columns={columns}
          getRowId={(row) => row.studentId}
          loading={loading}
          rowCount={totalCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          disableSelectionOnClick
          initialState={{
            columns: {
              columnVisibilityModel: {
                dateOfBirth: window.innerWidth > 1200,
                address: window.innerWidth > 900,
              },
            },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnSeparator': { display: 'none' },
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
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.85rem',
              px: 2,
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            },
          }}
        />
      </Paper>

      {/* Dialog Thêm/Sửa Học Viên (Hiện thị ở giữa) */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 0 }
        }}
      >
        <Box sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={900}>
              {editingStudent ? 'Chỉnh Sửa Học Viên' : 'Thêm Học Viên Mới'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small" sx={{ bgcolor: 'action.hover' }}>
              <Clear />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 4 }} />

          <Box sx={{ px: 1 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="fullName"
                  label="Họ và Tên *"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  required
                  fullWidth
                  placeholder="Nguyễn Văn A"
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
                  required
                  fullWidth
                  placeholder="nguyenvan@gmail.com"
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
                  required
                  fullWidth
                  placeholder="0901234567"
                  InputProps={{ sx: { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="level"
                  label="Trình Độ"
                  select
                  value={formData.level}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  InputProps={{ sx: { borderRadius: 2.5 } }}
                >
                  {levels.map((level) => (
                    <MenuItem key={level} value={level} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: getLevelStyle(level).color || 'primary.main' 
                      }} />
                      {level}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="dateOfBirth"
                  label="Ngày Sinh *"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                  InputProps={{ sx: { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="address"
                  label="Địa Chỉ"
                  value={formData.address}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="123 Lê Lợi, Q1, TP.HCM"
                  InputProps={{ sx: { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="password"
                  label={editingStudent ? "Mật khẩu mới (Bỏ trống nếu không đổi)" : "Mật khẩu (Gợi ý: Dùng Số điện thoại)"}
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
            </Grid>
          </Box>

          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={handleCloseDialog}
              disabled={loading}
              sx={{ borderRadius: 2.5, py: 1.2, fontWeight: 700, textTransform: 'none' }}
            >
              Hủy
            </Button>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                borderRadius: 2.5, 
                py: 1.2, 
                fontWeight: 700, 
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
              }}
            >
              {loading ? 'Đang xử lý...' : (editingStudent ? 'Lưu Thay Đổi' : 'Tạo Học Viên')}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Dialog Đăng ký Chương trình học */}
      <Dialog open={openEnrollDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Đăng Ký Chương Trình Học</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography variant="body1">
              Học viên: <strong>{currentStudent?.fullName}</strong>
            </Typography>
            <TextField
              name="classId"
              label="Chọn Lớp Học (Chương Trình)"
              select
              value={enrollData.classId}
              onChange={handleEnrollChange}
              required
              fullWidth
            >
              {classes.map((cls) => (
                <MenuItem key={cls.classId} value={cls.classId}>
                  {cls.className} ({cls.courseName})
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleEnrollSubmit} variant="contained" color="primary">
            Đăng Ký
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Xem Thời Khóa Biểu */}
      <Dialog open={openScheduleDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Thời Khóa Biểu Học Viên: {currentStudent?.fullName}</DialogTitle>
        <DialogContent>
          {studentSchedule.length > 0 ? (
            studentSchedule.map((curr) => (
              <Box key={curr.curriculumId} sx={{ mb: 4 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Lớp: {curr.className} - {curr.curriculumName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Từ {new Date(curr.startDate).toLocaleDateString('vi-VN')} đến {new Date(curr.endDate).toLocaleDateString('vi-VN')}
                </Typography>
                
                {curr.curriculumDays.sort((a,b) => new Date(a.scheduleDate) - new Date(b.scheduleDate)).map((day) => (
                  <Paper key={day.curriculumDayId} sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Ngày {new Date(day.scheduleDate).toLocaleDateString('vi-VN')}: {day.topic}
                    </Typography>
                    {day.curriculumSessions.sort((a,b) => a.sessionNumber - b.sessionNumber).map((session) => (
                      <Box key={session.curriculumSessionId} sx={{ ml: 2, mt: 1, p: 1, borderLeft: '3px solid #1976d2' }}>
                        <Typography variant="body2">
                          <strong>Ca {session.sessionNumber}:</strong> {session.startTime} - {session.endTime} | Phòng: {session.roomName}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {session.sessionName}
                        </Typography>
                      </Box>
                    ))}
                  </Paper>
                ))}
              </Box>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">Học viên chưa đăng ký chương trình học nào hoặc chương trình chưa có lịch.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
            mt: 1,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleOpenEnrollDialog(selectedStudentForMenu);
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1 }}
        >
          <AssignmentInd fontSize="small" color="primary" />
          <Typography variant="body2">Đăng ký chương trình</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleOpenScheduleDialog(selectedStudentForMenu);
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1 }}
        >
          <CalendarMonth fontSize="small" color="secondary" />
          <Typography variant="body2">Xem thời khóa biểu</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleOpenDialog(selectedStudentForMenu);
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1 }}
        >
          <Edit fontSize="small" color="primary" />
          <Typography variant="body2">Chỉnh sửa</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDelete(selectedStudentForMenu?.studentId);
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1, color: 'error.main' }}
        >
          <Delete fontSize="small" color="error" />
          <Typography variant="body2">Xóa học viên</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Students;

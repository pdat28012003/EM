/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import {
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
  MenuItem,
  Stack,
  Chip,
  Menu,
  InputAdornment,
  useTheme,
  Grid,
  Avatar,
  Fade,
  Tooltip,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Add, 
  Edit, 
  Delete, 
  Search, 
  MoreVert, 
  School, 
  Payments, 
  AccessTime,
  Close,
} from '@mui/icons-material';
import { coursesAPI, studentsAPI } from '../../../services/api';
import { alpha } from '@mui/material/styles';

const Courses = () => {
  const theme = useTheme();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('Tất cả');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    description: '',
    level: '',
    duration: 12,
    price: 0,
  });

  // Student enrollment dialog
  const [openStudentDialog, setOpenStudentDialog] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const [errors, setErrors] = useState({});

  const levels = ['Tất cả', 'Beginner', 'Elementary', 'Intermediate', 'Advanced'];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, filterLevel, searchTerm]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: searchTerm,
      };
      
      if (filterLevel !== 'Tất cả') {
        params.level = filterLevel;
      }

      const response = await coursesAPI.getAll(params);
      
      setCourses(response.data.data || []);
      setRowCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value) => {
    const n = Number(value) || 0;
    return `${new Intl.NumberFormat('vi-VN').format(n)} đ`;
  };

  const handleOpenMenu = (event, course) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  const loadAllStudents = async () => {
    try {
      let allStudents = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await studentsAPI.getAll({ page: currentPage, pageSize: 100 });
        const pageData = response.data?.data?.data || response.data?.Data?.Data || [];
        
        allStudents = [...allStudents, ...pageData];
        
        // Check if there are more pages
        const paginationInfo = response.data?.data || response.data?.Data;
        hasMorePages = paginationInfo?.hasNextPage || false;
        currentPage++;
      }

      return allStudents;
    } catch (error) {
      console.error('Error loading all students:', error);
      return [];
    }
  };

  const handleOpenStudentDialog = async (course) => {
    setSelectedCourse(course);
    setOpenStudentDialog(true);
    setLoadingStudents(true);
    setStudentSearchTerm('');
    try {
      // Load enrolled students
      const enrolledRes = await coursesAPI.getStudents(course.courseId);
      setEnrolledStudents(enrolledRes.data || []);
      // Load all students from all pages
      const allStudents = await loadAllStudents();
      setStudents(allStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddStudent = async (studentId) => {
    try {
      await coursesAPI.addStudent(selectedCourse.courseId, studentId);
      // Refresh enrolled list
      const enrolledRes = await coursesAPI.getStudents(selectedCourse.courseId);
      setEnrolledStudents(enrolledRes.data || []);
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Lỗi khi thêm học viên: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa học viên này khỏi khóa học?')) return;
    try {
      await coursesAPI.removeStudent(selectedCourse.courseId, studentId);
      // Refresh enrolled list
      const enrolledRes = await coursesAPI.getStudents(selectedCourse.courseId);
      setEnrolledStudents(enrolledRes.data || []);
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Lỗi khi xóa học viên: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleOpenDialog = (course = null) => {
    if (course) {
      setEditingId(course.courseId);
      setFormData({
        courseName: course.courseName || '',
        courseCode: course.courseCode || '',
        description: course.description || '',
        level: course.level || '',
        duration: course.durationInWeeks ?? 12,
        price: course.fee ?? 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        courseName: '',
        courseCode: '',
        description: '',
        level: '',
        duration: 12,
        price: 0,
      });
    }
    setErrors({});
    setOpenDialog(true);
    handleCloseMenu();
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
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.courseName.trim()) newErrors.courseName = 'Tên khóa học không được trống';
    if (!formData.courseCode.trim()) newErrors.courseCode = 'Mã khóa học không được trống';
    if (!formData.level) newErrors.level = 'Vui lòng chọn cấp độ';
    if (formData.duration <= 0) newErrors.duration = 'Thời lượng phải lớn hơn 0';
    if (formData.price < 0) newErrors.price = 'Học phí không được âm';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        courseName: formData.courseName,
        courseCode: formData.courseCode,
        description: formData.description,
        level: formData.level,
        durationInWeeks: parseInt(formData.duration),
        totalHours: parseInt(formData.duration) * 4, 
        fee: parseFloat(formData.price),
      };

      if (editingId) {
        await coursesAPI.update(editingId, payload);
      } else {
        await coursesAPI.create(payload);
      }
      handleCloseDialog();
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Lỗi khi lưu khóa học: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteClick = () => {
    if (selectedCourse) {
      handleDeleteCourse(selectedCourse);
    }
    handleCloseMenu();
  };

  const handleDeleteCourse = async (course) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${course.courseName}"?`)) {
      try {
        await coursesAPI.delete(course.courseId);
        loadCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Lỗi khi xóa khóa học: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const levelColor = useMemo(() => ({
    Beginner: theme.palette.success.main,
    Elementary: theme.palette.info.main,
    Intermediate: theme.palette.warning.main,
    Advanced: theme.palette.error.main,
  }), [theme.palette.error.main, theme.palette.info.main, theme.palette.success.main, theme.palette.warning.main]);

  const getLevelStyle = (level) => {
    switch (level) {
      case 'Beginner':
      case 'Elementary':
      case 'Intermediate':
      case 'Advanced': {
        const c = levelColor[level];
        return {
          bg: alpha(c, theme.palette.mode === 'dark' ? 0.22 : 0.14),
          text: c,
          border: alpha(c, theme.palette.mode === 'dark' ? 0.35 : 0.25),
        };
      }
      default: {
        const c = theme.palette.text.secondary;
        return { bg: alpha(c, 0.1), text: c, border: alpha(c, 0.2) };
      }
    }
  };

  const columns = [
    { 
      field: 'courseId', 
      headerName: 'ID', 
      width: 60,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'courseName', 
      headerName: 'Tên Khóa Học', 
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '1rem' }}>
            <School fontSize="small" />
          </Avatar>
          <Typography variant="body2" fontWeight={700}>
            {params.value}
          </Typography>
        </Stack>
      )
    },
    { 
      field: 'courseCode', 
      headerName: 'Mã', 
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" sx={{ borderRadius: 1, height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
      )
    },
    { 
      field: 'description', 
      headerName: 'Mô Tả', 
      flex: 1.2,
      minWidth: 260,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <Typography variant="caption" color="text.secondary" sx={{
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.5,
            maxWidth: 420,
          }}>
            {params.value || 'Chưa có mô tả'}
          </Typography>
        </Tooltip>
      )
    },
    { 
      field: 'level', 
      headerName: 'Cấp Độ', 
      width: 130,
      renderCell: (params) => {
        const colors = getLevelStyle(params.value);
        return (
          <Chip 
            label={params.value} 
            size="small" 
            sx={{ 
              bgcolor: colors.bg, 
              color: colors.text, 
              fontWeight: 700, 
              borderRadius: 1.5,
              fontSize: '0.7rem',
              border: '1px solid',
              borderColor: colors.border
            }} 
          />
        );
      }
    },
    { 
      field: 'durationInWeeks', 
      headerName: 'Thời Lượng', 
      width: 120,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="body2" fontWeight={700}>
            {params.value} tuần
          </Typography>
          {params.row?.totalHours ? (
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
              • {params.row.totalHours} giờ
            </Typography>
          ) : null}
        </Stack>
      )
    },
    { 
      field: 'fee', 
      headerName: 'Học Phí', 
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} color="primary.main">
          {formatPrice(params.value)}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 80,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -0.5 }}>
          Quản Lý Khóa Học
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            px: 3,
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 20px rgba(59, 130, 246, 0.35)',
            },
            transition: 'all 0.3s'
          }}
        >
          Thêm Khóa Học Mới
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
             placeholder="Tìm kiếm theo tên hoặc mã..."
             variant="outlined"
             size="small"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             InputProps={{
               startAdornment: (
                 <InputAdornment position="start">
                   <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                 </InputAdornment>
               ),
               sx: { borderRadius: 3, bgcolor: 'background.default' },
               autoComplete: 'off'
             }}
          />
          <Stack direction="row" spacing={1}>
            {levels.map((lvl) => {
              const isActive = filterLevel === lvl;
              return (
                <Chip 
                  key={lvl} 
                  label={lvl} 
                  onClick={() => setFilterLevel(lvl)} 
                  variant={isActive ? 'filled' : 'outlined'}
                  color={isActive ? 'primary' : 'default'}
                  sx={{ 
                    borderRadius: 1.5, 
                    fontWeight: 600, 
                    fontSize: '0.75rem',
                    height: 32,
                    cursor: 'pointer',
                    bgcolor: isActive ? 'primary.main' : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent'),
                    boxShadow: (isActive && theme.palette.mode === 'dark') ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none',
                    '&:hover': { bgcolor: 'primary.main', color: 'white' }
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
        borderRadius: 4,
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative'
      }}>
        <DataGrid
          rows={courses}
          columns={columns}
          getRowId={(row) => row.courseId}
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
            '& .MuiDataGrid-row': {
              transition: 'background-color 0.18s ease',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                '& .actions-icon': {
                  opacity: 1,
                  transform: 'scale(1.1)',
                  color: 'primary.main'
                }
              }
            },
            '& .actions-icon': {
              opacity: 0.5,
              transition: 'all 0.2s'
            }
          }}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 150,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor: 'divider',
            mt: 1
          }
        }}
      >
        <MenuItem onClick={() => handleOpenDialog(selectedCourse)} sx={{ gap: 1.5, py: 1 }}>
          <Edit fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={600}>Chỉnh sửa</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleCloseMenu(); handleOpenStudentDialog(selectedCourse); }} sx={{ gap: 1.5, py: 1 }}>
          <School fontSize="small" color="success" />
          <Typography variant="body2" fontWeight={600}>Quản lý học viên</Typography>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ gap: 1.5, py: 1, color: 'error.main' }}>
          <Delete fontSize="small" />
          <Typography variant="body2" fontWeight={600}>Xóa khóa học</Typography>
        </MenuItem>
      </Menu>

      {/* Course Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <School />
            </Avatar>
            <Typography variant="h6" fontWeight={800}>
              {editingId ? 'Cập Nhật Khóa Học' : 'Thêm Khóa Học Mới'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} size="small" sx={{ color: 'text.secondary' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <TextField
                name="courseName"
                label="Tên Khóa Học *"
                value={formData.courseName}
                onChange={handleInputChange}
                error={!!errors.courseName}
                helperText={errors.courseName}
                fullWidth
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="courseCode"
                label="Mã Khóa Học *"
                value={formData.courseCode}
                onChange={handleInputChange}
                error={!!errors.courseCode}
                helperText={errors.courseCode}
                fullWidth
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Mô Tả"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                fullWidth
                InputProps={{ sx: { borderRadius: 2.5 } }}
                placeholder="Mô tả chi tiết về khóa học này..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="level"
                label="Cấp Độ *"
                value={formData.level}
                onChange={handleInputChange}
                error={!!errors.level}
                helperText={errors.level}
                select
                fullWidth
                InputProps={{ sx: { borderRadius: 2.5 } }}
              >
                {levels.filter(l => l !== 'Tất cả').map(l => (
                  <MenuItem key={l} value={l}>{l}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="duration"
                label="Thời Lượng (tuần) *"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                error={!!errors.duration}
                helperText={errors.duration}
                fullWidth
                InputProps={{ 
                  sx: { borderRadius: 2.5 },
                  startAdornment: <InputAdornment position="start"><AccessTime fontSize="small"/></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="price"
                label="Học Phí (VND) *"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                error={!!errors.price}
                helperText={errors.price}
                fullWidth
                InputProps={{ 
                  sx: { borderRadius: 2.5 },
                  startAdornment: <InputAdornment position="start"><Payments fontSize="small"/></InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ px: 4, borderRadius: 2.5, fontWeight: 700 }}>Hủy</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            sx={{ px: 4, borderRadius: 2.5, fontWeight: 700 }}
          >
            {editingId ? 'Cập Nhật' : 'Thêm Mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Enrollment Dialog */}
      <Dialog
        open={openStudentDialog}
        onClose={() => setOpenStudentDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
              <School />
            </Avatar>
            <Typography variant="h6" fontWeight={800}>
              Quản lý học viên - {selectedCourse?.courseName}
            </Typography>
          </Box>
          <IconButton onClick={() => { setOpenStudentDialog(false); setStudentSearchTerm(''); }} size="small" sx={{ color: 'text.secondary' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, minHeight: 400 }}>
          {loadingStudents ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
              <Typography>Đang tải...</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Học viên đã đăng ký ({enrolledStudents.length})
              </Typography>
              <Box sx={{ mb: 3 }}>
                {enrolledStudents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Chưa có học viên nào đăng ký khóa học này.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {enrolledStudents.map((enrollment) => (
                      <Chip
                        key={enrollment.enrollmentId}
                        label={enrollment.studentName}
                        onDelete={() => handleRemoveStudent(enrollment.studentId)}
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Thêm học viên mới
              </Typography>
              <TextField
                placeholder="Tìm kiếm học viên..."
                variant="outlined"
                size="small"
                fullWidth
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ maxHeight: 250, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1 }}>
                {(students || [])
                  .filter((s) => !(enrolledStudents || []).some((es) => es.studentId === s.studentId))
                  .filter((s) => {
                    const term = studentSearchTerm.toLowerCase();
                    return (
                      s.fullName?.toLowerCase().includes(term) ||
                      s.email?.toLowerCase().includes(term) ||
                      s.phoneNumber?.toLowerCase().includes(term)
                    );
                  })
                  .map((student) => (
                    <Box
                      key={student.studentId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => handleAddStudent(student.studentId)}
                    >
                     
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{student.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{student.email}</Typography>
                      </Box>
                      <Button size="small" variant="outlined" sx={{ borderRadius: 2 }}>
                        Thêm
                      </Button>
                    </Box>
                  ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => { setOpenStudentDialog(false); setStudentSearchTerm(''); }} sx={{ px: 4, borderRadius: 2.5, fontWeight: 700 }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Courses;

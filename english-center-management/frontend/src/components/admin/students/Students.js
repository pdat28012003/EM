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
  Avatar,
  Tooltip,
  Menu,
  InputAdornment,
  Fade,
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
  PersonAdd
} from '@mui/icons-material';
import { studentsAPI, enrollmentsAPI, classesAPI, UPLOAD_URL } from '../../../services/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [studentSchedule, setStudentSchedule] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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
  const [selectedStudentForMenu, setSelectedStudentForMenu] = useState(null);

  const levels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced'];

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, [searchTerm, paginationModel]);

  const toDateInputValue = (value) => {
    if (!value) return '';
    const s = value.toString();
    return s.includes('T') ? s.split('T')[0] : s;
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getAll({ 
        search: searchTerm, 
        isActive: true,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize
      });
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
      setTotalCount(responseData.TotalCount || 0);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEnrollChange = (e) => {
    setEnrollData({ classId: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent.studentId, formData);
      } else {
        await studentsAPI.create(formData);
      }
      handleCloseDialog();
      setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset về trang 1 sau khi tạo/sửa
      loadStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin học viên';
      alert(errorMessage);
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

  const levelStyles = {
    Beginner: { bgcolor: '#f5f5f5', color: '#616161', border: '1px solid #e0e0e0', fontWeight: 600 },
    Elementary: { bgcolor: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80', fontWeight: 600 },
    'Pre-Intermediate': { bgcolor: '#e1f5fe', color: '#0277bd', border: '1px solid #81d4fa', fontWeight: 600 },
    Intermediate: { bgcolor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9', fontWeight: 600 },
    'Upper-Intermediate': { bgcolor: '#f3e5f5', color: '#7b1fa2', border: '1px solid #ce93d8', fontWeight: 600 },
    Advanced: { bgcolor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', fontWeight: 600 },
  };

  const getLevelStyle = (level) => levelStyles[level] || levelStyles.Beginner;

  const columns = [
    {
      field: 'fullName',
      headerName: 'Họ và Tên',
      width: 160,
      renderCell: (params) => (
        <Tooltip title={params.value} placement="top" arrow>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 230,
      renderCell: (params) => (
        <Tooltip title={params.value} placement="top" arrow>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '100%' }}>
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'phoneNumber',
      headerName: 'Số ĐT',
      width: 150,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'dateOfBirth',
      headerName: 'Ngày Sinh',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('vi-VN');
      },
    },
    {
      field: 'address',
      headerName: 'Địa Chỉ',
      width: 250,
      renderCell: (params) => (
        <Tooltip title={params.value || '-'} placement="top" arrow>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '100%' }}>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'level',
      headerName: 'Trình Độ',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            ...getLevelStyle(params.value),
            borderRadius: 1.5,
            fontSize: '0.75rem',
            height: 24,
            minWidth: 90,
          }}
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Trạng Thái',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const isActive = params.value;
        return (
          <Chip
            label={isActive ? 'Đang học' : 'Ngưng học'}
            size="small"
            sx={{
              bgcolor: isActive ? '#e8f5e9' : '#fafafa',
              color: isActive ? '#2e7d32' : '#9e9e9e',
              border: isActive ? '1px solid #a5d6a7' : '1px solid #e0e0e0',
              borderRadius: 1.5,
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 24,
              minWidth: 80,
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Hành động" arrow>
          <IconButton
            size="small"
            onClick={(e) => handleOpenMenu(e, params.row)}
            sx={{ color: 'text.secondary' }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Quản Lý Học Viên
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 20px 0 rgba(25, 118, 210, 0.46)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Thêm Học Viên
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              bgcolor: 'background.paper',
              '& fieldset': {
                borderColor: 'divider',
              },
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
            },
          }}
        />
      </Paper>

      <Paper sx={{
        height: 600,
        width: '100%',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
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
          sx={{
            border: 'none',
            '& .MuiDataGrid-main': {
              borderRadius: 2,
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8fafc',
              borderBottom: '2px solid #e2e8f0',
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
                color: '#475569',
                fontSize: '0.875rem',
              },
            },
            '& .MuiDataGrid-row': {
              '&:nth-of-type(even)': {
                bgcolor: '#fafbfc',
              },
              '&:hover': {
                bgcolor: '#f1f5f9',
                transition: 'background-color 0.15s ease',
              },
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f1f5f9',
              fontSize: '0.875rem',
              py: 1.5,
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '2px solid #e2e8f0',
              bgcolor: '#f8fafc',
            },
          }}
        />
      </Paper>

      {/* Dialog Thêm/Sửa Học Viên */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStudent ? 'Chỉnh Sửa Học Viên' : 'Thêm Học Viên Mới'}
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
              name="password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
              required={!editingStudent}
              helperText={!editingStudent ? 'Bắt buộc khi tạo học viên mới' : 'Để trống nếu không muốn đổi mật khẩu'}
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
            {editingStudent ? 'Cập Nhật' : 'Thêm Mới'}
          </Button>
        </DialogActions>
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
    </Container>
  );
};

export default Students;

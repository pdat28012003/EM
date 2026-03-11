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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Visibility, VisibilityOff, CalendarMonth, AssignmentInd, CloudUpload } from '@mui/icons-material';
import { studentsAPI, enrollmentsAPI, classesAPI, UPLOAD_URL } from '../services/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [studentSchedule, setStudentSchedule] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    username: '',
    password: '',
    avatar: '',
    level: 'Beginner',
  });
  const [enrollData, setEnrollData] = useState({
    classId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

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
      setStudents(response.data?.data || response.data?.Data || []); 
      setTotalCount(response.data?.totalCount || response.data?.TotalCount || 0);
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
      setEditMode(true);
      setCurrentStudent(student);
      setFormData({
        fullName: student.fullName,
        email: student.email,
        phoneNumber: student.phoneNumber,
        dateOfBirth: toDateInputValue(student.dateOfBirth),
        address: student.address,
        username: student.username,
        password: '', // Không hiển thị password khi edit
        avatar: student.avatar || '',
        level: student.level,
      });
      setAvatarPreview(student.avatar || '');
    } else {
      setEditMode(false);
      setCurrentStudent(null);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        username: '',
        password: '',
        avatar: '',
        level: 'Beginner',
      });
      setAvatarPreview('');
    }
    setAvatarFile(null);
    setOpenDialog(true);
  };

  const handleOpenEnrollDialog = (student) => {
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
      // Create preview URL
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

  const handleEnrollChange = (e) => {
    setEnrollData({ classId: e.target.value });
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
      
      if (editMode) {
        await studentsAPI.update(currentStudent.studentId, {
          ...submitData,
          isActive: currentStudent?.isActive ?? true,
        });
      } else {
        await studentsAPI.create(submitData);
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

  const columns = [
    // { field: 'studentId', headerName: 'ID', width: 70 },
    { field: 'fullName', headerName: 'Họ và Tên', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phoneNumber', headerName: 'Số Điện Thoại', width: 130 },
    {
      field: 'dateOfBirth',
      headerName: 'Ngày Sinh',
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN'),
    },
    { field: 'address', headerName: 'Địa Chỉ', width: 180 },
    { field: 'username', headerName: 'Tên Đăng Nhập', width: 130 },
    { field: 'avatar', headerName: 'Avatar', width: 80,
      renderCell: (params) => (
        params.value ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={1}>
            <img 
              src={params.value.startsWith('http') ? params.value : `http://localhost:5000${params.value}`} 
              alt="Avatar" 
              onError={(e) => {
                console.log('Avatar load error:', params.value);
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
    {
      field: 'level',
      headerName: 'Trình Độ',
      width: 120,
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
      width: 100,
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
      width: 200,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            color="primary"
            title="Đăng ký chương trình học"
            onClick={() => handleOpenEnrollDialog(params.row)}
          >
            <AssignmentInd />
          </IconButton>
          <IconButton
            size="small"
            color="secondary"
            title="Xem thời khóa biểu"
            onClick={() => handleOpenScheduleDialog(params.row)}
          >
            <CalendarMonth />
          </IconButton>
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
          rowCount={totalCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[1, 10, 25, 50]}
          paginationMode="server"
          disableSelectionOnClick
        />
      </Paper>

      {/* Dialog Thêm/Sửa Học Viên */}
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
              name="username"
              label="Tên Đăng Nhập"
              value={formData.username}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              name="password"
              label="Mật Khẩu"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              required={!editMode} // Bắt buộc khi tạo mới, không bắt buộc khi edit
              fullWidth
              helperText={editMode ? "Để trống nếu không muốn đổi mật khẩu" : ""}
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
    </Container>
  );
};

export default Students;

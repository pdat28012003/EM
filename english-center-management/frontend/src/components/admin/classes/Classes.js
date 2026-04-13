import React, { useEffect, useState } from 'react';
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
  Chip,
  MenuItem,
  Alert,
  Avatar,
  useTheme,
  LinearProgress,
  Fade,
  Menu,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, PersonAdd, Delete, School, MoreVert } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { classesAPI, coursesAPI, teachersAPI, enrollmentsAPI, studentsAPI, roomsAPI, curriculumAPI } from '../../../services/api';

const Classes = () => {
  const theme = useTheme();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [enrollDialog, setEnrollDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedClassForMenu, setSelectedClassForMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    className: '',
    courseId: '',
    teacherId: '',
    startDate: '',
    endDate: '',
    maxStudents: 20,
    roomId: '',
    curriculumId: '',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading courses with pageSize: 1000');
      const [classesRes, coursesRes, teachersRes, studentsRes, roomsRes, curriculumsRes] = await Promise.all([
        classesAPI.getAll({ page: paginationModel.page + 1, pageSize: paginationModel.pageSize }),
        coursesAPI.getAll({ pageSize: 100 }),
        teachersAPI.getAll({ pageSize: 1000 }),
        studentsAPI.getAll({ pageSize: 1000 }),
        roomsAPI.getAll({ pageSize: 1000 }),
        curriculumAPI.getAll({ page: 1, pageSize: 1000 })
      ]);

      // Extract classes
      const classesData = classesRes.data?.data?.data || classesRes.data?.data || [];
      setClasses(classesData);
      setRowCount(classesRes.data?.data?.totalCount || classesRes.data?.totalCount || classesData.length);

      // Extract lookups
      const coursesData = coursesRes.data?.data?.data || coursesRes.data?.data || [];
      console.log('Courses loaded:', coursesData.length, coursesData);
      setCourses(coursesData);
      setTeachers(teachersRes.data?.data?.data || teachersRes.data?.data || []);
      setStudents(studentsRes.data?.data?.data || studentsRes.data?.data || []);
      setRooms(roomsRes.data?.data?.data || roomsRes.data?.data || []);
      setCurriculums(curriculumsRes.data?.data?.data || curriculumsRes.data?.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (classItem = null) => {
    if (classItem) {
      setEditingId(classItem.classId);
      setFormData({
        className: classItem.className,
        courseId: classItem.courseId,
        teacherId: classItem.teacherId,
        startDate: classItem.startDate ? classItem.startDate.split('T')[0] : '',
        endDate: classItem.endDate ? classItem.endDate.split('T')[0] : '',
        maxStudents: classItem.maxStudents,
        roomId: classItem.roomId || '',
        curriculumId: classItem.curriculumId || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        className: '',
        courseId: '',
        teacherId: '',
        startDate: '',
        endDate: '',
        maxStudents: 20,
        roomId: '',
        curriculumId: '',
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
      if (editingId) {
        await classesAPI.update(editingId, {
          ...formData,
          courseId: parseInt(formData.courseId),
          teacherId: parseInt(formData.teacherId),
          maxStudents: parseInt(formData.maxStudents),
          roomId: formData.roomId ? parseInt(formData.roomId) : null,
          curriculumId: formData.curriculumId ? parseInt(formData.curriculumId) : null,
        });
        alert('Cập nhật lớp học thành công!');
      } else {
        await classesAPI.create({
          ...formData,
          courseId: parseInt(formData.courseId),
          teacherId: parseInt(formData.teacherId),
          maxStudents: parseInt(formData.maxStudents),
          roomId: formData.roomId ? parseInt(formData.roomId) : null,
          curriculumId: formData.curriculumId ? parseInt(formData.curriculumId) : null,
        });
        alert('Tạo lớp học thành công!');
      }
      handleCloseDialog();
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      loadData();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Có lỗi xảy ra khi lưu thông tin lớp học');
    }
  };

  const getClassIcon = () => <School fontSize="small" />;

  const getClassStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 'Sắp khai giảng';
    if (now > end) return 'Đã kết thúc';
    return 'Active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sắp khai giảng': return 'warning';
      case 'Đã kết thúc': return 'default';
      case 'Active': return 'success';
      default: return 'default';
    }
  };

  const handleOpenMenu = (event, classItem) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedClassForMenu(classItem);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedClassForMenu(null);
  };

  const columns = [
    {
      field: 'classId',
      headerName: 'ID',
      width: 70,
      pinned: 'left',
    },
    {
      field: 'className',
      headerName: 'Tên Lớp',
      flex: 1,
      minWidth: 200,
      pinned: 'left',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.12)',
              color: theme.palette.primary.main,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.18)',
              flexShrink: 0,
            }}
          >
            {getClassIcon()}
          </Avatar>
          <Typography variant="body2" fontWeight={800} noWrap>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'courseAndCurriculum',
      headerName: 'Khóa Học / Chương Trình',
      width: 280,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, py: 1 }}>
          <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            {params.row.courseName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
            {params.row.curriculumName}
          </Typography>
        </Box>
      ),
    },
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
      width: 160,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => {
        const current = params.row.currentStudents || 0;
        const max = params.row.maxStudents || 20;
        const percentage = Math.round((current / max) * 100);

        // Logic màu bar: xanh < 90%, cam 90-99%, đỏ >= 100%
        let barColor = theme.palette.success.main;
        if (percentage >= 100) {
          barColor = theme.palette.error.main;
        } else if (percentage >= 90) {
          barColor = theme.palette.warning.main;
        }

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%', py: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={700}>
                {current}/{max}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(percentage, 100)}
              sx={{
                height: 6,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.grey[400], 0.3),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: barColor,
                  borderRadius: 1,
                },
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'roomName',
      headerName: 'Phòng',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
          <Typography
            component="span"
            sx={{
              color: theme.palette.primary.main,
              cursor: 'pointer',
              fontWeight: 700,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
            title="Xem lịch phòng"
          >
            {params.value || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng Thái',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => {
        const status = getClassStatus(params.row.startDate, params.row.endDate);
        return (
          <Chip
            label={status}
            color={getStatusColor(status)}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Hành Động',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      pinned: 'right',
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            onClick={(e) => handleOpenMenu(e, params.row)}
            sx={{ color: 'text.secondary' }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  const handleEnrollStudent = (classItem) => {
    setSelectedClass(classItem);
    setSelectedStudent('');
    setEnrollDialog(true);
    handleCloseMenu();
  };

  const handleDeleteClass = (classItem) => {
    setClassToDelete(classItem);
    setDeleteDialog(true);
    handleCloseMenu();
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      await classesAPI.delete(classToDelete.classId);
      alert('Xóa lớp học thành công!');
      setDeleteDialog(false);
      setClassToDelete(null);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      loadData();
    } catch (error) {
      console.error('Error deleting class:', error);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message ||
        'Lỗi không xác định khi xóa lớp học';

      alert('Lỗi xóa: ' + errorMessage);
    }
  };

  const handleSaveEnrollment = async () => {
    if (!selectedStudent || !selectedClass) {
      alert('Vui lòng chọn học viên');
      return;
    }

    try {
      await enrollmentsAPI.create({
        studentId: parseInt(selectedStudent),
        classId: selectedClass.classId,
      });

      alert('Đăng ký học viên thành công!');
      setEnrollDialog(false);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error enrolling student:', error);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message ||
        'Lỗi không xác định khi đăng ký học viên';

      alert('Lỗi đăng ký: ' + errorMessage);
    }
  };

  // Lọc học viên chưa đăng ký vào lớp đã chọn
  const getAvailableStudents = () => {
    if (!selectedClass || !students.length) return students;

    // Lấy danh sách học viên đã đăng ký trong lớp này
    const enrolledStudentIds = selectedClass.enrollments?.map(e => e.studentId) || [];

    // Trả về học viên chưa đăng ký
    return students.filter(student => !enrolledStudentIds.includes(student.studentId));
  };

  return (
    <Box sx={{ mt: 2, mb: 4, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
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

      <Paper sx={{ flex: 1, width: '100%', overflow: 'auto' }}>
        <DataGrid
          rows={classes}
          columns={columns}
          getRowId={(row) => row.classId}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[1, 10, 25, 50]}
          rowCount={rowCount}
          paginationMode="server"
          disableSelectionOnClick
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
            mt: 1,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedClassForMenu) handleEnrollStudent(selectedClassForMenu);
          }}
          sx={{ gap: 1.5, py: 1 }}
        >
          <PersonAdd fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={700}>Thêm Học Viên</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedClassForMenu) handleOpenDialog(selectedClassForMenu);
          }}
          sx={{ gap: 1.5, py: 1 }}
        >
          <Edit fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={700}>Chỉnh Sửa</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedClassForMenu) handleDeleteClass(selectedClassForMenu);
          }}
          sx={{ gap: 1.5, py: 1, color: 'error.main' }}
        >
          <Delete fontSize="small" />
          <Typography variant="body2" fontWeight={700}>Xóa Lớp</Typography>
        </MenuItem>
      </Menu>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Cập Nhật Lớp Học' : 'Thêm Lớp Học Mới'}</DialogTitle>
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
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 'auto',
                    },
                  },
                },
              }}
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
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 'auto',
                    },
                  },
                },
              }}
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
              name="roomId"
              label="Phòng Học"
              value={formData.roomId}
              onChange={handleInputChange}
              select
              required
              fullWidth
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 'auto',
                    },
                  },
                },
              }}
            >
              {rooms.map((room) => (
                <MenuItem key={room.roomId} value={room.roomId}>
                  {room.roomName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="curriculumId"
              label="Chương trình học"
              value={formData.curriculumId}
              onChange={handleInputChange}
              select
              fullWidth
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 'auto',
                    },
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>-- Không chọn --</em>
              </MenuItem>
              {curriculums
                .filter((c) => !formData.courseId || c.courseId === parseInt(formData.courseId))
                .map((curriculum) => (
                  <MenuItem key={curriculum.curriculumId} value={curriculum.curriculumId}>
                    {curriculum.curriculumName}
                  </MenuItem>
                ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? 'Cập Nhật' : 'Thêm Mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={enrollDialog} onClose={() => setEnrollDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm học viên vào lớp - {selectedClass?.className}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              select
              label="Chọn học viên"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              fullWidth
              required
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 'auto',
                    },
                  },
                },
              }}
              helperText={
                getAvailableStudents().length === 0
                  ? "Không có học viên nào chưa đăng ký vào lớp này"
                  : `Có ${getAvailableStudents().length} học viên có thể đăng ký`
              }
            >
              {getAvailableStudents().map((student) => (
                <MenuItem key={student.studentId} value={student.studentId}>
                  {student.fullName} - {student.email}
                </MenuItem>
              ))}
            </TextField>

            {getAvailableStudents().length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Tất cả học viên đã đăng ký vào lớp này. Không thể thêm học viên mới.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialog(false)}>Hủy</Button>
          <Button
            onClick={handleSaveEnrollment}
            variant="contained"
            disabled={!selectedStudent || getAvailableStudents().length === 0}
          >
            Đăng ký
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xác nhận xóa lớp học</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa lớp học "{classToDelete?.className}"?
          </Typography>
          {classToDelete?.currentStudents > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Lớp học này có {classToDelete.currentStudents} học viên. Cẩn thận khi xóa!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Hủy</Button>
          <Button
            onClick={confirmDeleteClass}
            variant="contained"
            color="error"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Classes;

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  IconButton,
  Chip,
  Avatar,
  useTheme,
  Menu,
  MenuItem,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Info, People, MapOutlined, MoreVert, Search, Close } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { curriculumAPI, coursesAPI, teachersAPI } from '../../../services/api';

const Curriculum = () => {
  const theme = useTheme();
  const [curriculums, setCurriculums] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [selectedCurriculumForTeachers, setSelectedCurriculumForTeachers] = useState(null);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCurriculumForMenu, setSelectedCurriculumForMenu] = useState(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  // Form state
  const [formData, setFormData] = useState({
    curriculumName: '',
    courseId: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [dateError, setDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Searchable course dropdown state
  const [courseSearch, setCourseSearch] = useState('');
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const courseDropdownRef = useRef(null);
  const selectedCourseName = courses.find(c => c.courseId === parseInt(formData.courseId))?.courseName || '';
  const filteredCourses = courses.filter(c =>
    c.courseName.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const statusStyle = useMemo(() => {
    const active = theme.palette.success.main;
    const activeTextLight = theme.palette.mode === 'light' ? theme.palette.success.dark : active;
    const inactive = theme.palette.text.secondary;
    return {
      active: {
        bg: alpha(active, theme.palette.mode === 'dark' ? 0.22 : 0.12),
        text: activeTextLight,
        border: alpha(active, theme.palette.mode === 'dark' ? 0.35 : 0.25),
      },
      inactive: {
        bg: alpha(inactive, theme.palette.mode === 'dark' ? 0.16 : 0.08),
        text: inactive,
        border: alpha(inactive, theme.palette.mode === 'dark' ? 0.28 : 0.18),
      },
    };
  }, [theme.palette.mode, theme.palette.success.dark, theme.palette.success.main, theme.palette.text.secondary]);

  const loadCurriculums = useCallback(async () => {
    try {
      let params = {};
      let allData = [];
      
      if (selectedCourseFilter !== 'all') {
        // Load all data for filtering
        params = { page: 1, pageSize: 1000 }; // Load many items
        const response = await curriculumAPI.getAll(params);
        allData = Array.isArray(response.data?.data) ? response.data.data : [];
        allData = allData.filter(c => c.courseId === parseInt(selectedCourseFilter));
        
        // Apply pagination to filtered data
        const startIndex = paginationModel.page * paginationModel.pageSize;
        const endIndex = startIndex + paginationModel.pageSize;
        const paginatedData = allData.slice(startIndex, endIndex);
        
        setCurriculums(paginatedData);
        setRowCount(allData.length);
      } else {
        params = {
          page: paginationModel.page + 1,
          pageSize: paginationModel.pageSize,
        };
        
        const response = await curriculumAPI.getAll(params);
        const curriculumData = Array.isArray(response.data?.data) ? response.data.data : [];
        setCurriculums(curriculumData);
        setRowCount(response.data?.totalCount || 0);
      }
      
    } catch (error) {
      console.error('Error loading curriculums:', error);
      console.error('Error details:', error.response?.data);
    }
  }, [paginationModel, selectedCourseFilter]);

  useEffect(() => {
    loadCurriculums();
  }, [loadCurriculums]);
  
  useEffect(() => {
    // Reset pagination when filter changes
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [selectedCourseFilter]);

  useEffect(() => {
    loadCourses();
    loadTeachers();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await coursesAPI.getAll({
        page: 1,
        pageSize: 100,
      });
      const coursesData = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      alert('Lỗi khi tải dữ liệu khóa học');
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await teachersAPI.getAll({ isActive: true });
      const teachersData = response.data?.Data || response.data?.data || response.data || [];
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
    } catch (error) {
      console.error('Error loading teachers:', error);
      alert('Lỗi khi tải dữ liệu giáo viên');
    }
  };

  // Close course dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target)) {
        setCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    // Realtime date validation
    if (name === 'endDate' || name === 'startDate') {
      const start = name === 'startDate' ? value : formData.startDate;
      const end = name === 'endDate' ? value : formData.endDate;
      if (start && end && new Date(end) <= new Date(start)) {
        setDateError('Ngày kết thúc phải sau ngày bắt đầu.');
      } else {
        setDateError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.curriculumName || !formData.courseId || !formData.startDate || !formData.endDate) {
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setDateError('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCurriculum) {
        await curriculumAPI.update(editingCurriculum.curriculumId, {
          CurriculumName: formData.curriculumName,
          StartDate: formData.startDate,
          EndDate: formData.endDate,
          Description: formData.description,
          Status: editingCurriculum.status,
          ParticipantTeacherIds: []
        });
      } else {
        await curriculumAPI.create({
          CurriculumName: formData.curriculumName,
          CourseId: parseInt(formData.courseId),
          StartDate: formData.startDate,
          EndDate: formData.endDate,
          Description: formData.description,
          ParticipantTeacherIds: []
        });
      }
      
      loadCurriculums();
      setShowModal(false);
      resetForm();
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    } catch (error) {
      console.error('Error saving curriculum:', error);
      alert('Lỗi khi lưu chương trình: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (curriculum) => {
    setEditingCurriculum(curriculum);
    setFormData({
      curriculumName: curriculum.curriculumName,
      courseId: curriculum.courseId,
      startDate: curriculum.startDate ? curriculum.startDate.split('T')[0] : '',
      endDate: curriculum.endDate ? curriculum.endDate.split('T')[0] : '',
      description: curriculum.description
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this curriculum?')) {
      try {
        await curriculumAPI.delete(id);
        setPaginationModel(prev => ({ ...prev, page: 0 }));
        loadCurriculums();
      } catch (error) {
        console.error('Error deleting curriculum:', error);
        alert('Error deleting curriculum');
      }
    }
  };

  const handleOpenMenu = (event, curriculum) => {
    setAnchorEl(event.currentTarget);
    setSelectedCurriculumForMenu(curriculum);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedCurriculumForMenu(null);
  };

  const openTeacherModal = (curriculum) => {
    setSelectedCurriculumForTeachers(curriculum);
    const teacherIds = curriculum.participantTeachers?.map(t => parseInt(t.teacherId)) || [];
    setSelectedTeacherIds(teacherIds);
    setShowTeacherModal(true);
  };

  const handleTeacherToggle = (teacherId) => {
    const id = parseInt(teacherId);
    setSelectedTeacherIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(existingId => existingId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSaveTeachers = async () => {
    if (!selectedCurriculumForTeachers || !selectedCurriculumForTeachers.curriculumId) {
      alert('Lỗi: Không tìm thấy chương trình học');
      return;
    }

    try {
      const curriculumId = selectedCurriculumForTeachers.curriculumId;
      
      // Convert teacher IDs to numbers
      const teacherIds = selectedTeacherIds.map(id => 
        typeof id === 'string' ? parseInt(id) : id
      );

      console.log('Saving Teachers:', {
        curriculumId,
        curriculumName: selectedCurriculumForTeachers.curriculumName,
        startDate: selectedCurriculumForTeachers.startDate,
        endDate: selectedCurriculumForTeachers.endDate,
        description: selectedCurriculumForTeachers.description,
        status: selectedCurriculumForTeachers.status,
        participantTeacherIds: teacherIds
      });

      // Send PascalCase property names to match backend DTO
      await curriculumAPI.update(curriculumId, {
        CurriculumName: selectedCurriculumForTeachers.curriculumName,
        StartDate: selectedCurriculumForTeachers.startDate,
        EndDate: selectedCurriculumForTeachers.endDate,
        Description: selectedCurriculumForTeachers.description,
        Status: selectedCurriculumForTeachers.status,
        ParticipantTeacherIds: teacherIds
      });

      loadCurriculums();
      setShowTeacherModal(false);
      alert('Cập nhật giáo viên thành công');
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    } catch (error) {
      console.error('Error saving teachers:', error);
      alert('Lỗi khi cập nhật giáo viên: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      curriculumName: '',
      courseId: '',
      startDate: '',
      endDate: '',
      description: ''
    });
    setEditingCurriculum(null);
    setDateError('');
    setCourseSearch('');
    setCourseDropdownOpen(false);
  };

  const columns = [
    { field: 'curriculumId', headerName: 'ID', width: 70 },
    {
      field: 'curriculumName',
      headerName: 'Chương trình / Khóa học',
      flex: 1,
      minWidth: 280,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(168, 85, 247, 0.12)',
              color: theme.palette.mode === 'dark' ? '#d8b4fe' : '#a855f7',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.18)',
              flexShrink: 0,
              alignSelf: 'flex-start', // Căn trên để cân đối với text
            }}
          >
            <MapOutlined fontSize="small" />
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {params.row.curriculumName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {params.row.courseName}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'timeRange',
      headerName: 'Thời gian',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => {
        const startDate = new Date(params.row.startDate).toLocaleDateString('vi-VN');
        const endDate = new Date(params.row.endDate).toLocaleDateString('vi-VN');
        return (
          <Typography variant="body2" fontWeight={600}>
            {startDate} - {endDate}
          </Typography>
        );
      },
    },
    {
      field: 'lessonCount',
      headerName: 'Bài học',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => {
        // Count total lessons from curriculum structure
        const totalLessons = params.row.curriculumDays?.reduce((dayTotal, day) => {
          return dayTotal + (day.curriculumSessions?.reduce((sessionTotal, session) => {
            return sessionTotal + (session.lessons?.length || 0);
          }, 0) || 0);
        }, 0) || 0;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {totalLessons}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              bài
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => {
        const isActive = params.value === 'Active';
        const s = isActive ? statusStyle.active : statusStyle.inactive;
        return (
          <Chip
            label={params.value}
            size="small"
            sx={{
              bgcolor: s.bg,
              color: s.text,
              border: '1px solid',
              borderColor: s.border,
              fontWeight: 800,
              borderRadius: 1.5,
              fontSize: '0.7rem',
              height: 22,
              minWidth: 88,
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => handleOpenMenu(e, params.row)}
          sx={{ color: 'text.secondary' }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ mt: 2, mb: 4, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý Chương trình học
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Tạo chương trình mới
        </Button>
      </Box>

      {/* Filter Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: 'text.secondary' }}>
          Lọc theo Khóa học:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label="Tất cả"
            variant={selectedCourseFilter === 'all' ? 'filled' : 'outlined'}
            color={selectedCourseFilter === 'all' ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedCourseFilter('all')}
            sx={{ fontWeight: 600 }}
          />
          {courses.slice(0, 8).map((course) => (
            <Chip
              key={course.courseId}
              label={course.courseName}
              variant={selectedCourseFilter === course.courseId.toString() ? 'filled' : 'outlined'}
              color={selectedCourseFilter === course.courseId.toString() ? 'primary' : 'default'}
              size="small"
              onClick={() => setSelectedCourseFilter(course.courseId.toString())}
              sx={{ fontWeight: 500 }}
            />
          ))}
        </Box>
      </Box>

      <Paper sx={{ flex: 1, width: '100%', overflow: 'auto' }}>
        <DataGrid
          rows={curriculums}
          columns={columns}
          getRowId={(row) => row.curriculumId}
          loading={false}
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
        <MenuItem onClick={() => {
          window.location.href = `/curriculum/${selectedCurriculumForMenu?.curriculumId}`;
          handleCloseMenu();
        }}>
          <Info fontSize="small" color="info" />
          <Typography variant="body2" fontWeight={700} sx={{ ml: 1 }}>Chi tiết</Typography>
        </MenuItem>
        <MenuItem onClick={() => {
          openTeacherModal(selectedCurriculumForMenu);
          handleCloseMenu();
        }}>
          <People fontSize="small" color="success" />
          <Typography variant="body2" fontWeight={700} sx={{ ml: 1 }}>Quản lý giáo viên</Typography>
        </MenuItem>
        <MenuItem onClick={() => {
          handleEdit(selectedCurriculumForMenu);
          handleCloseMenu();
        }}>
          <Edit fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={700} sx={{ ml: 1 }}>Chỉnh sửa</Typography>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDelete(selectedCurriculumForMenu?.curriculumId);
          handleCloseMenu();
        }} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" />
          <Typography variant="body2" fontWeight={700} sx={{ ml: 1 }}>Xóa</Typography>
        </MenuItem>
      </Menu>

      {/* ── CREATE / EDIT CURRICULUM MODAL ── */}
      <Dialog
        open={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            pt: 2.5,
            px: 3,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {editingCurriculum ? 'Chỉnh sửa chương trình' : 'Tạo chương trình mới'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => { setShowModal(false); resetForm(); }}
            sx={{ color: 'text.secondary' }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="curriculum-form" onSubmit={handleSubmit} noValidate>
            {/* Tên chương trình */}
            <TextField
              label="Tên chương trình"
              name="curriculumName"
              value={formData.curriculumName}
              onChange={handleInputChange}
              required
              fullWidth
              size="small"
              sx={{ mb: 2.5 }}
              inputProps={{ id: 'curriculum-name-input' }}
            />

            {/* Searchable Khóa học dropdown */}
            {!editingCurriculum && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>
                  Khóa học <Typography component="span" color="error.main">*</Typography>
                </Typography>
                <Box ref={courseDropdownRef} sx={{ position: 'relative' }}>
                  {/* Trigger box */}
                  <Box
                    id="course-select-trigger"
                    onClick={() => setCourseDropdownOpen(prev => !prev)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: '8.5px',
                      border: '1px solid',
                      borderColor: courseDropdownOpen ? 'primary.main' : 'divider',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      bgcolor: 'background.paper',
                      transition: 'border-color 0.15s',
                      '&:hover': { borderColor: 'text.primary' },
                      boxShadow: courseDropdownOpen ? theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.15)}` : 'none',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: selectedCourseName ? 'text.primary' : 'text.disabled' }}
                    >
                      {selectedCourseName || 'Chọn khóa học'}
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        fontSize: 10,
                        color: 'text.secondary',
                        transform: courseDropdownOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                      }}
                    >
                      ▼
                    </Box>
                  </Box>

                  {/* Dropdown panel */}
                  {courseDropdownOpen && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        zIndex: 1400,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Search input */}
                      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Tìm kiếm khóa học..."
                          value={courseSearch}
                          onChange={e => setCourseSearch(e.target.value)}
                          autoFocus
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                              </InputAdornment>
                            ),
                          }}
                          inputProps={{ id: 'course-search-input' }}
                          sx={{ '& fieldset': { border: 'none' } }}
                        />
                      </Box>
                      {/* Options list */}
                      <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                        {filteredCourses.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                            Không tìm thấy khóa học
                          </Typography>
                        ) : (
                          filteredCourses.map(c => (
                            <Box
                              key={c.courseId}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, courseId: c.courseId.toString() }));
                                setCourseDropdownOpen(false);
                                setCourseSearch('');
                              }}
                              sx={{
                                px: 2,
                                py: 1,
                                cursor: 'pointer',
                                bgcolor: formData.courseId === c.courseId.toString()
                                  ? theme => alpha(theme.palette.primary.main, 0.1)
                                  : 'transparent',
                                color: formData.courseId === c.courseId.toString() ? 'primary.main' : 'text.primary',
                                fontWeight: formData.courseId === c.courseId.toString() ? 700 : 400,
                                fontSize: '0.875rem',
                                '&:hover': { bgcolor: theme => alpha(theme.palette.primary.main, 0.06) },
                                transition: 'background-color 0.1s',
                              }}
                            >
                              {c.courseName}
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
                {/* Hidden required input for native form validation */}
                <input
                  tabIndex={-1}
                  required
                  value={formData.courseId}
                  onChange={() => {}}
                  style={{ opacity: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
                />
              </Box>
            )}

            {/* Ngày bắt đầu + Ngày kết thúc side by side */}
            <Box sx={{ display: 'flex', gap: 2, mb: dateError ? 0.5 : 2.5 }}>
              <TextField
                label="Ngày bắt đầu"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ id: 'start-date-input' }}
                error={Boolean(dateError)}
              />
              <TextField
                label="Ngày kết thúc"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ id: 'end-date-input' }}
                error={Boolean(dateError)}
              />
            </Box>
            {dateError && (
              <Typography variant="caption" color="error.main" sx={{ mb: 2, display: 'block', mt: 0.5 }}>
                ⚠ {dateError}
              </Typography>
            )}

            {/* Mô tả */}
            <TextField
              label="Mô tả"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              minRows={2}
              maxRows={5}
              size="small"
              inputProps={{ id: 'description-input' }}
              sx={{
                '& .MuiInputBase-inputMultiline': {
                  minHeight: 56,
                  maxHeight: 120,
                  overflowY: 'auto',
                },
              }}
            />
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            id="cancel-curriculum-btn"
            variant="outlined"
            color="inherit"
            onClick={() => { setShowModal(false); resetForm(); }}
            disabled={isSubmitting}
            sx={{ borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'text.secondary' } }}
          >
            Hủy
          </Button>
          <Button
            id="submit-curriculum-btn"
            type="submit"
            form="curriculum-form"
            variant="contained"
            disabled={isSubmitting || Boolean(dateError)}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isSubmitting ? 'Đang lưu...' : (editingCurriculum ? 'Cập nhật' : 'Tạo')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── TEACHER MANAGEMENT MODAL ── */}
      <Dialog
        open={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            pt: 2.5,
            px: 3,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>Quản lý giáo viên</Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedCurriculumForTeachers?.curriculumName}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowTeacherModal(false)} sx={{ color: 'text.secondary' }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Chọn các giáo viên tham gia chương trình này:
          </Typography>
          <Box
            sx={{
              maxHeight: 360,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              pr: 0.5,
            }}
          >
            {teachers.length > 0 ? (
              teachers.map(teacher => {
                const checked = selectedTeacherIds.includes(parseInt(teacher.teacherId));
                return (
                  <Box
                    key={teacher.teacherId}
                    onClick={() => handleTeacherToggle(teacher.teacherId)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: checked ? 'primary.main' : 'divider',
                      bgcolor: checked
                        ? theme => alpha(theme.palette.primary.main, 0.06)
                        : 'background.paper',
                      transition: 'all 0.15s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: theme => alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: 0.75,
                        border: '2px solid',
                        borderColor: checked ? 'primary.main' : 'divider',
                        bgcolor: checked ? 'primary.main' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {checked && (
                        <Typography sx={{ color: '#fff', fontSize: 11, lineHeight: 1, fontWeight: 900 }}>✓</Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{teacher.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{teacher.email}</Typography>
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>
                Không có giáo viên nào
              </Typography>
            )}
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setShowTeacherModal(false)}
            sx={{ borderColor: 'divider', color: 'text.secondary' }}
          >
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSaveTeachers}>
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Curriculum;

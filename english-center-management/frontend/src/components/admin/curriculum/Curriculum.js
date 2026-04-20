import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Info, People, MapOutlined, MoreVert } from '@mui/icons-material';
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
  const [formData, setFormData] = useState({
    curriculumName: '',
    courses: [], // Array of { courseId, orderIndex }
    startDate: '',
    endDate: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

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
        allData = allData.filter(c => c.courses?.some(course => course.courseId === parseInt(selectedCourseFilter)));
        
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
      
      console.log('Curriculums loaded:', selectedCourseFilter, curriculums.length);
    } catch (error) {
      console.error('Error loading curriculums:', error);
      console.error('Error details:', error.response?.data);
    }
  }, [paginationModel, selectedCourseFilter, curriculums.length]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.curriculumName.trim()) newErrors.curriculumName = 'Vui lòng nhập tên chương trình';
    if (formData.courses.length === 0) newErrors.courses = 'Vui lòng chọn ít nhất 1 khóa học';
    if (!formData.startDate) newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
    if (!formData.endDate) newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (editingCurriculum) {
        await curriculumAPI.update(editingCurriculum.curriculumId, {
          CurriculumName: formData.curriculumName,
          Courses: formData.courses.map((c, index) => ({ courseId: c.courseId, orderIndex: index })),
          StartDate: formData.startDate,
          EndDate: formData.endDate,
          Description: formData.description,
          Status: editingCurriculum.status,
          ParticipantTeacherIds: []
        });
      } else {
        await curriculumAPI.create({
          CurriculumName: formData.curriculumName,
          Courses: formData.courses.map((c, index) => ({ courseId: c.courseId, orderIndex: index })),
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
      console.error('Error details:', error.response?.data);
      alert('Error saving curriculum: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (curriculum) => {
    setEditingCurriculum(curriculum);
    setFormData({
      curriculumName: curriculum.curriculumName,
      courses: curriculum.courses || [],
      startDate: curriculum.startDate.split('T')[0],
      endDate: curriculum.endDate.split('T')[0],
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
      courses: [],
      startDate: '',
      endDate: '',
      description: ''
    });
    setEditingCurriculum(null);
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
              {params.row.courses?.map(c => c.courseName).join(', ') || 'Chưa có khóa học'}
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

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCurriculum ? 'Chỉnh sửa chương trình' : 'Tạo chương trình mới'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên chương trình *</label>
                <input
                  type="text"
                  name="curriculumName"
                  value={formData.curriculumName}
                  onChange={handleInputChange}
                  required
                />
                {errors.curriculumName && <span className="error-message">{errors.curriculumName}</span>}
              </div>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="courses-select-label">Khóa học *</InputLabel>
                <Select
                  labelId="courses-select-label"
                  id="courses-select"
                  multiple
                  value={formData.courses.map(c => c.courseId)}
                  onChange={(e) => {
                    const selectedIds = e.target.value;
                    const selectedCourses = selectedIds.map(id => ({
                      courseId: id,
                      courseName: courses.find(c => c.courseId === id)?.courseName || ''
                    }));
                    setFormData({ ...formData, courses: selectedCourses });
                    if (errors.courses) setErrors(prev => ({ ...prev, courses: '' }));
                  }}
                  input={<OutlinedInput label="Khóa học *" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={courses.find(c => c.courseId === value)?.courseName} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    disablePortal: true,
                    PaperProps: {
                      sx: { zIndex: 1300, maxHeight: 300 }
                    }
                  }}
                >
                  {courses.map((course) => (
                    <MenuItem key={course.courseId} value={course.courseId}>
                      <Checkbox checked={formData.courses.some(c => c.courseId === course.courseId)} />
                      <ListItemText primary={course.courseName} />
                    </MenuItem>
                  ))}
                </Select>
                {errors.courses && <span className="error-message">{errors.courses}</span>}
              </FormControl>

              <div className="form-group">
                <label>Ngày bắt đầu *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
                {errors.startDate && <span className="error-message">{errors.startDate}</span>}
              </div>

              <div className="form-group">
                <label>Ngày kết thúc *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
                {errors.endDate && <span className="error-message">{errors.endDate}</span>}
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCurriculum ? 'Cập nhật' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeacherModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Quản lý giáo viên - {selectedCurriculumForTeachers?.curriculumName}</h3>
              <button className="close-btn" onClick={() => setShowTeacherModal(false)}>×</button>
            </div>
            <div className="teacher-list">
              <p style={{ marginBottom: '15px', color: '#666' }}>Chọn các giáo viên tham gia chương trình này:</p>
              {teachers.length > 0 ? (
                teachers.map(teacher => (
                  <div key={teacher.teacherId} className="teacher-checkbox-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedTeacherIds.includes(parseInt(teacher.teacherId))}
                        onChange={() => handleTeacherToggle(teacher.teacherId)}
                      />
                      <span className="teacher-name">
                        <strong>{teacher.fullName}</strong>
                        <span className="teacher-email"> ({teacher.email})</span>
                      </span>
                    </label>
                  </div>
                ))
              ) : (
                <p style={{ color: '#999' }}>Không có giáo viên nào</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTeacherModal(false)}>
                Hủy
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveTeachers}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal {
          display: flex;
          position: fixed;
          z-index: 9999;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.4);
          justify-content: center;
          align-items: center;
        }
        .modal-content {
          background-color: #fefefe;
          padding: 20px;
          border: 1px solid #888;
          border-radius: 5px;
          width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          z-index: 10000;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-primary {
          background-color: #007bff;
          color: white;
        }
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        .teacher-list {
          max-height: 400px;
          overflow-y: auto;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f9f9f9;
        }
        .teacher-checkbox-item {
          margin-bottom: 12px;
          padding: 10px;
          background-color: white;
          border-radius: 4px;
          border-left: 3px solid #007bff;
        }
        .teacher-checkbox-item label {
          display: flex;
          align-items: center;
          margin: 0;
          cursor: pointer;
        }
        .teacher-checkbox-item input[type="checkbox"] {
          width: auto;
          margin-right: 10px;
          cursor: pointer;
        }
        .teacher-name {
          flex: 1;
        }
        .teacher-email {
          color: #666;
          font-size: 13px;
          margin-left: 5px;
        }
        .error-message {
          color: #d32f2f;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }
      `}</style>
    </Box>
  );
};

export default Curriculum;

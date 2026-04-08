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
  MenuItem,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import { coursesAPI } from '../../../services/api';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    description: '',
    level: '',
    duration: 12,
    price: 0,
  });

  useEffect(() => {
    loadCourses();
  }, [paginationModel]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getAll({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });
      
      setCourses(response.data.data || []);
      setRowCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
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
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Có lỗi xảy ra khi lưu thông tin khóa học');
    }
  };

  const columns = [
    { field: 'courseId', headerName: 'ID', width: 70 },
    { field: 'courseName', headerName: 'Tên Khóa Học', width: 200 },
    { field: 'courseCode', headerName: 'Mã Khóa Học', width: 150 },
    { field: 'description', headerName: 'Mô Tả', width: 250 },
    { field: 'level', headerName: 'Cấp Độ', width: 100 },
    { field: 'durationInWeeks', headerName: 'Thời Lượng (tuần)', width: 120 },
    { field: 'fee', headerName: 'Học Phí', width: 120 },
    {
      field: 'actions',
      headerName: 'Hành Động',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
            title="Chỉnh sửa"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteCourse(params.row)}
            title="Xóa khóa học"
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  const handleDeleteCourse = async (course) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${course.courseName}"?`)) {
      try {
        await coursesAPI.delete(course.courseId);
        alert('Xóa khóa học thành công!');
        loadCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Lỗi không xác định khi xóa khóa học';
        alert('Lỗi xóa: ' + errorMessage);
      }
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản Lý Khóa Học
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Thêm Khóa Học Mới
        </Button>
      </Box>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={courses}
          columns={columns}
          getRowId={(row) => row.courseId}
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
        <DialogTitle>
          {editingId ? 'Cập Nhật Khóa Học' : 'Thêm Khóa Học Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="courseName"
              label="Tên Khóa Học"
              value={formData.courseName}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="VD: Tiếng Anh Giao Tiếp"
            />
            <TextField
              name="courseCode"
              label="Mã Khóa Học"
              value={formData.courseCode}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="VD: ENG101"
            />
            <TextField
              name="description"
              label="Mô Tả"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={4}
              fullWidth
              placeholder="Mô tả chi tiết về khóa học..."
            />
            <TextField
              name="level"
              label="Cấp Độ"
              value={formData.level}
              onChange={handleInputChange}
              select
              fullWidth
            >
              <MenuItem value="">-- Chọn cấp độ --</MenuItem>
              <MenuItem value="Beginner">Beginner (Sơ cấp)</MenuItem>
              <MenuItem value="Intermediate">Intermediate (Trung cấp)</MenuItem>
              <MenuItem value="Advanced">Advanced (Cao cấp)</MenuItem>
            </TextField>
            <TextField
              name="duration"
              label="Thời Lượng (tuần)"
              type="number"
              value={formData.duration}
              onChange={handleInputChange}
              required
              fullWidth
              inputProps={{ min: 1, max: 52 }}
            />
            <TextField
              name="price"
              label="Học Phí"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              required
              fullWidth
              inputProps={{ min: 0, step: 100000 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? 'Cập Nhật' : 'Thêm Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Courses;

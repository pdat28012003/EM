import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Pagination,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Assignment,
  Description,
  Schedule
} from '@mui/icons-material';
import { assignmentsAPI } from '../../../../services/api';

export default function AssignmentsTab({ classId, classInfo }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    type: 'Homework',
    maxScore: 100
  });

  useEffect(() => {
    loadAssignments();
  }, [classId, page, rowsPerPage]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentsAPI.getAll({
        classId: classId,
        page: page,
        pageSize: rowsPerPage
      });
      setAssignments(response.data?.data || []);
      setTotalCount(response.data?.totalCount || 0);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'closed': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleSaveAssignment = async () => {
    try {
      const assignmentData = {
        ...formData,
        classId: classId,
        dueDate: new Date(formData.dueDate).toISOString()
      };

      if (selectedAssignment) {
        // Update existing assignment
        await assignmentsAPI.update(selectedAssignment.assignmentId, assignmentData);
      } else {
        // Create new assignment
        await assignmentsAPI.create(assignmentData);
      }

      setCreateDialogOpen(false);
      setSelectedAssignment(null);
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        type: 'Homework',
        maxScore: 100
      });
      loadAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      type: assignment.type,
      maxScore: assignment.maxScore
    });
    setCreateDialogOpen(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
      try {
        await assignmentsAPI.delete(assignmentId);
        loadAssignments();
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Lỗi khi xóa bài tập: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Bài tập - {classInfo?.className || `Lớp ${classId}`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Tạo bài tập
        </Button>
      </Box>

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <Alert severity="info">
          Chưa có bài tập nào trong lớp này
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Tiêu đề</strong></TableCell>
                <TableCell><strong>Loại</strong></TableCell>
                <TableCell align="center"><strong>Hạn nộp</strong></TableCell>
                <TableCell align="center"><strong>Điểm tối đa</strong></TableCell>
                <TableCell align="center"><strong>Trạng thái</strong></TableCell>
                <TableCell align="center"><strong>Đã nộp</strong></TableCell>
                <TableCell align="center"><strong>Thao tác</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.assignmentId} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {assignment.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignment.description?.substring(0, 100)}
                        {assignment.description?.length > 100 ? '...' : ''}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={assignment.type} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDate(assignment.dueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {assignment.maxScore}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={assignment.status}
                      color={getStatusColor(assignment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {assignment.submissionsCount || 0} / {assignment.gradedCount || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title="Xem chi tiết">
                        <IconButton size="small">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton 
                          size="small"
                          onClick={() => handleEditAssignment(assignment)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAssignment(assignment.assignmentId)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, totalCount)} của {totalCount} bài tập
          </Typography>
          <Pagination
            count={Math.ceil(totalCount / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAssignment ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tiêu đề"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Mô tả"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Loại bài tập"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="Homework">Bài tập về nhà</MenuItem>
                <MenuItem value="Quiz">Bài kiểm tra</MenuItem>
                <MenuItem value="Project">Dự án</MenuItem>
                <MenuItem value="Exam">Kỳ thi</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Điểm tối đa"
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Hạn nộp"
                InputLabelProps={{ shrink: true }}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSaveAssignment} variant="contained">
            {selectedAssignment ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

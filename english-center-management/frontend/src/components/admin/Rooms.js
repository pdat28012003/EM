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
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Room } from '@mui/icons-material';
import { roomsAPI } from '../../services/api';

const Rooms = () => {
  const formatTimeHHmm = (value) => {
    if (value === null || value === undefined) return '--:--';
    const s = value.toString();
    return s.length >= 5 ? s.substring(0, 5) : s;
  };

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    roomName: '',
    description: '',
    capacity: 30,
    availableStartTime: '08:00',
    availableEndTime: '21:00',
    isActive: true,
  });
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    loadRooms();
  }, [paginationModel]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getAll({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });
      
      setRooms(response.data.data);
      setRowCount(response.data.totalCount);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (room = null) => {
    if (room) {
      setEditingId(room.roomId);
      setFormData({
        roomName: room.roomName,
        description: room.description || '',
        capacity: room.capacity,
        availableStartTime: formatTimeHHmm(room.availableStartTime),
        availableEndTime: formatTimeHHmm(room.availableEndTime),
        isActive: room.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        roomName: '',
        description: '',
        capacity: 30,
        availableStartTime: '08:00',
        availableEndTime: '21:00',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      // Format times to HH:mm:ss for backend TimeSpan
      const dataToSave = {
        ...formData,
        capacity: parseInt(formData.capacity),
        availableStartTime: formData.availableStartTime.includes(':') && formData.availableStartTime.split(':').length === 2 
          ? `${formData.availableStartTime}:00` 
          : formData.availableStartTime,
        availableEndTime: formData.availableEndTime.includes(':') && formData.availableEndTime.split(':').length === 2 
          ? `${formData.availableEndTime}:00` 
          : formData.availableEndTime,
      };

      if (editingId) {
        await roomsAPI.update(editingId, { ...dataToSave, roomId: editingId });
      } else {
        await roomsAPI.create(dataToSave);
      }
      handleCloseDialog();
      loadRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Có lỗi xảy ra khi lưu thông tin phòng học');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng học này?')) {
      try {
        await roomsAPI.delete(id);
        setPaginationModel(prev => ({ ...prev, page: 0 }));
        loadRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('Có lỗi xảy ra khi xóa phòng học');
      }
    }
  };

  const columns = [
    { field: 'roomId', headerName: 'ID', width: 70 },
    { field: 'roomName', headerName: 'Tên Phòng', width: 150 },
    { field: 'capacity', headerName: 'Sức Chứa', width: 100 },
    { 
      field: 'availableHours', 
      headerName: 'Khung Giờ Cho Phép', 
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2">
          {formatTimeHHmm(params.row.availableStartTime)} - {formatTimeHHmm(params.row.availableEndTime)}
        </Typography>
      )
    },
    { field: 'description', headerName: 'Mô Tả', width: 250 },
    {
      field: 'isActive',
      headerName: 'Trạng Thái',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Sẵn sàng' : 'Bảo trì'}
          color={params.value ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleOpenDialog(params.row)} color="primary" size="small">
            <Edit fontSize="small" />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.roomId)} color="error" size="small">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Room color="primary" fontSize="large" />
          <Typography variant="h4" fontWeight="bold">
            Quản Lý Phòng Học
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Phòng Học
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rooms}
          columns={columns}
          getRowId={(row) => row.roomId}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[1, 5, 10, 25, 50]}
          rowCount={rowCount}
          paginationMode="server"
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Chỉnh Sửa Phòng Học' : 'Thêm Phòng Học Mới'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="roomName"
              label="Tên Phòng"
              value={formData.roomName}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              name="capacity"
              label="Sức Chứa"
              type="number"
              value={formData.capacity}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  name="availableStartTime"
                  label="Giờ Mở Cửa"
                  type="time"
                  value={formData.availableStartTime}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="availableEndTime"
                  label="Giờ Đóng Cửa"
                  type="time"
                  value={formData.availableEndTime}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <TextField
              name="description"
              label="Mô Tả"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              fullWidth
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
    </Container>
  );
};

export default Rooms;

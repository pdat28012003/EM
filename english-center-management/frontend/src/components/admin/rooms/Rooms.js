/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
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
  Grid,
  Avatar,
  useTheme,
  Menu,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Room, MoreVert } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { roomsAPI } from '../../../services/api';

const Rooms = () => {
  const theme = useTheme();
  
  const formatTimeHHmm = (value) => {
    if (value === null || value === undefined) return '--:--';
    const s = value.toString();
    return s.length >= 5 ? s.substring(0, 5) : s;
  };

  const [rooms, setRooms] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleOpenMenu = (event, room) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRoom(room);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedRoom(null);
  };

  const columns = [
    { field: 'roomId', headerName: 'ID', width: 70 },
    {
      field: 'roomName',
      headerName: 'Tên Phòng',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(249, 115, 22, 0.18)' : 'rgba(249, 115, 22, 0.12)',
              color: theme.palette.warning.main,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.18)',
              flexShrink: 0,
            }}
          >
            <Room fontSize="small" />
          </Avatar>
          <Typography variant="body2" fontWeight={800} noWrap>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    { 
      field: 'capacity', 
      headerName: 'Sức Chứa', 
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700}>
          {params.value} chỗ
        </Typography>
      ),
    },
    { 
      field: 'description', 
      headerName: 'Mô Tả', 
      width: 250,
      renderCell: (params) => {
        const desc = params.value || '';
        const features = [];
        
        // Parse features from description
        if (desc.toLowerCase().includes('máy chiếu') || desc.toLowerCase().includes('projector')) {
          features.push({ label: 'Máy Chiếu', icon: '📽️' });
        }
        if (desc.toLowerCase().includes('lab') || desc.toLowerCase().includes('phòng lab')) {
          features.push({ label: 'Phòng Lab', icon: '🖥️' });
        }
        if (desc.toLowerCase().includes('bảng thông minh') || desc.toLowerCase().includes('smart board')) {
          features.push({ label: 'Bảng Thông Minh', icon: '📺' });
        }
        if (desc.toLowerCase().includes('wifi') || desc.toLowerCase().includes('internet')) {
          features.push({ label: 'WiFi', icon: '📶' });
        }
        
        if (features.length > 0) {
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {features.map((feature, index) => (
                <Chip
                  key={index}
                  label={`${feature.icon} ${feature.label}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
              ))}
            </Box>
          );
        }
        
        // Fallback to original description if no features detected
        return (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {desc || 'Không có mô tả'}
          </Typography>
        );
      },
    },
    {
      field: 'isActive',
      headerName: 'Trạng Thái',
      width: 140,
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: (params) => {
        const isActive = Boolean(params.value);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-start' }}>
            <Chip
              label={isActive ? 'Sẵn sàng' : 'Bảo trì'}
              color={isActive ? 'success' : 'warning'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
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
        <Box display="flex" alignItems="center" gap={1}>
        
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

      <Paper sx={{ flex: 1, width: '100%', overflow: 'auto' }}>
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
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
            if (selectedRoom) handleOpenDialog(selectedRoom);
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1 }}
        >
          <Edit fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={700}>Chỉnh Sửa</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedRoom) handleDelete(selectedRoom.roomId);
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1, color: 'error.main' }}
        >
          <Delete fontSize="small" />
          <Typography variant="body2" fontWeight={700}>Xóa Phòng</Typography>
        </MenuItem>
      </Menu>

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
    </Box>
  );
};

export default Rooms;

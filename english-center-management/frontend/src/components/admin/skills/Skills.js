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
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import { skillsAPI } from '../../../services/api';

const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    console.log('Pagination changed:', paginationModel);
    loadSkills();
  }, [paginationModel.page, paginationModel.pageSize]);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await skillsAPI.getAll({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });

      setSkills(response.data.data || []);
      setRowCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (skill = null) => {
    if (skill) {
      setEditingId(skill.skillId);
      setFormData({
        name: skill.name,
        description: skill.description || '',
        isActive: skill.isActive !== undefined ? skill.isActive : true,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
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
      if (editingId) {
        await skillsAPI.update(editingId, formData);
      } else {
        await skillsAPI.create(formData);
      }
      handleCloseDialog();
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      loadSkills();
    } catch (error) {
      console.error('Error saving skill:', error);
      alert('Có lỗi xảy ra khi lưu thông tin kỹ năng');
    }
  };

  const handleDeleteSkill = async (skill) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa kỹ năng "${skill.name}"?`)) {
      try {
        await skillsAPI.delete(skill.skillId);
        alert('Xóa kỹ năng thành công!');
        loadSkills();
      } catch (error) {
        console.error('Error deleting skill:', error);
        alert('Lỗi xóa kỹ năng: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const columns = [
    { field: 'skillId', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Tên Kỹ Năng', width: 250 },
    { field: 'description', headerName: 'Mô Tả', width: 400 },
    {
      field: 'isActive',
      headerName: 'Trạng Thái',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
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
            onClick={() => handleDeleteSkill(params.row)}
            title="Xóa kỹ năng"
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản Lý Kỹ Năng
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Kỹ Năng Mới
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={skills}
          columns={columns}
          getRowId={(row) => row.skillId}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={(newModel) => {
            setPaginationModel(newModel);
          }}
          pageSizeOptions={[1, 10, 25, 50]}
          rowCount={rowCount}
          paginationMode="server"
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Cập Nhật Kỹ Năng' : 'Thêm Kỹ Năng Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="name"
              label="Tên Kỹ Năng"
              value={formData.name}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder="VD: Listening, Speaking, Reading, Writing"
            />
            <TextField
              name="description"
              label="Mô Tả"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={4}
              fullWidth
              placeholder="Mô tả chi tiết về kỹ năng..."
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                id="isActive"
              />
              <label htmlFor="isActive">Kích hoạt</label>
            </Box>
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

export default Skills;

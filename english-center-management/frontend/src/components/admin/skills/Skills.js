import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Menu,
  MenuItem,
  Fade,
  Tooltip,
  Switch,
  FormControlLabel,
  useTheme,
  Avatar,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  MenuBook,
  Headphones,
  Mic,
  AutoStories,
  Create,
  Abc,
} from '@mui/icons-material';
import { skillsAPI } from '../../../services/api';
import { alpha } from '@mui/material/styles';

const Skills = () => {
  const theme = useTheme();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [filterStatus, setFilterStatus] = useState('all');

  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      const requestParams = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      };
      if (filterStatus === 'active') {
        requestParams.isActive = true;
      } else if (filterStatus === 'inactive') {
        requestParams.isActive = false;
      } else {
        requestParams.showAll = true;
      }

      const response = await skillsAPI.getAll(requestParams);

      setSkills(response.data.data || []);
      setRowCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, filterStatus]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

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

  const handleOpenMenu = (event, skill) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedSkill(skill);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedSkill(null);
  };

  const statusStyle = useMemo(() => {
    return {
      active: {
        bg: alpha('#22c55e', 0.12),
        text: '#15803d',
        border: alpha('#22c55e', 0.25),
      },
      inactive: {
        bg: alpha('#64748b', 0.08),
        text: '#64748b',
        border: alpha('#64748b', 0.18),
      },
    };
  }, []);

  const getSkillIcon = (name) => {
    const n = String(name || '').toLowerCase();
    if (n.includes('listening')) return <Headphones fontSize="small" />;
    if (n.includes('speaking')) return <Mic fontSize="small" />;
    if (n.includes('reading')) return <AutoStories fontSize="small" />;
    if (n.includes('writing')) return <Create fontSize="small" />;
    if (n.includes('grammar')) return <MenuBook fontSize="small" />;
    if (n.includes('vocabulary')) return <Abc fontSize="small" />;
    return <MenuBook fontSize="small" />;
  };

  const handleToggleActive = async (skill, next) => {
    try {
      // API currently filters only active skills, so turning OFF will remove it from list after reload.
      await skillsAPI.update(skill.skillId, {
        name: skill.name,
        description: skill.description || '',
        isActive: next,
      });
      loadSkills();
    } catch (error) {
      console.error('Error toggling skill active:', error);
      alert(error.response?.data?.message || 'Không thể cập nhật trạng thái kỹ năng');
    }
  };

  const columns = [
    { field: 'skillId', headerName: 'ID', width: 70, headerAlign: 'center', align: 'center' },
    {
      field: 'name',
      headerName: 'Tên Kỹ Năng',
      flex: 1,
      minWidth: 240,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              border: '1px solid',
              borderColor: 'rgba(59, 130, 246, 0.18)',
              flexShrink: 0,
            }}
          >
            {getSkillIcon(params.value)}
          </Avatar>
          <Typography variant="body2" fontWeight={800} noWrap>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    { 
      field: 'description', 
      headerName: 'Mô Tả', 
      width: 420,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4,
              maxWidth: 420,
            }}
          >
            {params.value || '—'}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'isActive',
      headerName: 'Trạng Thái',
      width: 160,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params) => {
        const isActive = Boolean(params.value);
        const s = isActive ? statusStyle.active : statusStyle.inactive;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.25 }}>
            <Chip
              label={isActive ? 'Active' : 'Inactive'}
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
            <Switch
              size="small"
              checked={isActive}
              onChange={(e) => handleToggleActive(params.row, e.target.checked)}
              inputProps={{ 'aria-label': 'toggle-skill-active' }}
              sx={{ 
                ml: 0.25,
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: theme.palette.primary.main,
                },
                '& .MuiSwitch-switchBase + .MuiSwitch-track': {
                  backgroundColor: theme.palette.grey[300],
                },
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Hành Động',
      width: 70,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => handleOpenMenu(e, params.row)} sx={{ color: 'text.secondary' }}>
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ mt: 2, mb: 4, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
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

      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          {['all', 'active', 'inactive'].map((status) => {
            const labels = { all: 'Tất cả', active: 'Active', inactive: 'Inactive' };
            const isActive = filterStatus === status;
            return (
              <Button
                key={status}
                variant={isActive ? 'contained' : 'outlined'}
                color={isActive ? 'primary' : 'inherit'}
                size="small"
                onClick={() => {
                  setFilterStatus(status);
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
                sx={{ textTransform: 'none' }}
              >
                {labels[status]}
              </Button>
            );
          })}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Hiện {filterStatus === 'all' ? 'tất cả kỹ năng' : filterStatus === 'active' ? 'kỹ năng đang kích hoạt' : 'kỹ năng không kích hoạt'}
        </Typography>
      </Box>

      <Paper sx={{ flex: 1, width: '100%', overflow: 'auto' }}>
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
          initialState={{
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            },
          }}
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
            minWidth: 160,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
            mt: 1,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleOpenDialog(selectedSkill);
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1 }}
        >
          <Edit fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={700}>Chỉnh sửa</Typography>
        </MenuItem>
        <MenuItem
          onClick={async () => {
            if (selectedSkill) await handleDeleteSkill(selectedSkill);
            handleCloseMenu();
          }}
          sx={{ gap: 1.5, py: 1, color: 'error.main' }}
        >
          <Delete fontSize="small" />
          <Typography variant="body2" fontWeight={700}>Xóa kỹ năng</Typography>
        </MenuItem>
      </Menu>

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
              rows={3}
              fullWidth
              placeholder="Mô tả chi tiết về kỹ năng..."
            />
            <FormControlLabel
              control={
                <Switch
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                />
              }
              label="Kích hoạt"
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

export default Skills;

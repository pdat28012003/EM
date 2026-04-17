import React from 'react';
import { Box, Grid, TextField, Button, CircularProgress, Typography, Paper, Chip } from '@mui/material';
import { Save, Cancel, PersonOutline, Email, Phone, Home, CheckCircle, Edit } from '@mui/icons-material';

const ProfileField = ({ label, value, icon, editMode, name, onChange, disabled = false, verified = false }) => {
  if (editMode) {
    return (
      <TextField
        fullWidth
        label={label}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        variant="outlined"
        InputProps={{
          startAdornment: icon && (
            <Box sx={{ color: '#4F46E5', mr: 1, display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
          ),
          endAdornment: verified && (
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', ml: 1 }}>
              <CheckCircle fontSize="small" />
              <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 500 }}>
                Đã xác thực
              </Typography>
            </Box>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: disabled ? 'rgba(0,0,0,0.05)' : 'white',
          }
        }}
      />
    );
  }

  // View mode - Facebook/LinkedIn style
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.08)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          {icon}
          {label}
        </Typography>
        {verified && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
            <CheckCircle fontSize="small" />
            <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 500 }}>
              Đã xác thực
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body1" fontWeight={500}>
          {value || <span style={{ color: '#999', fontStyle: 'italic' }}>Chưa cập nhật</span>}
        </Typography>
        {!value && (
          <Chip
            icon={<Edit fontSize="small" />}
            label="Thêm"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              '& .MuiChip-label': { pl: 0.5 },
              '& .MuiChip-icon': { fontSize: 14, ml: 0.5 }
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

const ProfileForm = ({
  formData,
  editMode,
  loading,
  onInputChange,
  onSave,
  onCancel,
  onEditToggle
}) => {
  return (
    <Box component="form">
      {!editMode && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={onEditToggle}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            Chỉnh sửa thông tin
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ProfileField
            label="Họ và tên"
            value={formData.fullName}
            icon={<PersonOutline fontSize="small" />}
            editMode={editMode}
            name="fullName"
            onChange={onInputChange}
          />
        </Grid>
        <Grid item xs={12}>
          <ProfileField
            label="Email"
            value={formData.email}
            icon={<Email fontSize="small" />}
            editMode={editMode}
            name="email"
            onChange={onInputChange}
            disabled
            verified
          />
        </Grid>
        <Grid item xs={12}>
          <ProfileField
            label="Số điện thoại"
            value={formData.phoneNumber}
            icon={<Phone fontSize="small" />}
            editMode={editMode}
            name="phoneNumber"
            onChange={onInputChange}
          />
        </Grid>
        <Grid item xs={12}>
          <ProfileField
            label="Địa chỉ"
            value={formData.address}
            icon={<Home fontSize="small" />}
            editMode={editMode}
            name="address"
            onChange={onInputChange}
          />
        </Grid>
      </Grid>

      {editMode && (
        <Box sx={{ mt: 4, display: 'flex', gap: 2, pt: 2, borderTop: '1px solid #eee', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Cancel />}
            onClick={onCancel}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <Save />}
            onClick={onSave}
            disabled={loading}
            sx={{
              minWidth: 140,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProfileForm;

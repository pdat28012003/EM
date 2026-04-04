import React from 'react';
import { Box, Grid, TextField, Button, CircularProgress, Typography, Paper } from '@mui/material';
import { Save, Cancel, PersonOutline, Email, Phone } from '@mui/icons-material';

const ProfileField = ({ label, value, icon, editMode, name, onChange, disabled = false }) => {
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
            <Box sx={{ color: 'text.secondary', mr: 1, display: 'flex', alignItems: 'center' }}>
              {icon}
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
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        {icon}
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500}>
        {value || <span style={{ color: '#999', fontStyle: 'italic' }}>Chưa cập nhật</span>}
      </Typography>
    </Paper>
  );
};

const ProfileForm = ({ 
  formData, 
  editMode, 
  loading, 
  onInputChange, 
  onSave, 
  onCancel 
}) => {
  return (
    <Box component="form">
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
      </Grid>

      {editMode && (
        <Box sx={{ mt: 4, display: 'flex', gap: 2, pt: 2, borderTop: '1px solid #eee' }}>
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
        </Box>
      )}
    </Box>
  );
};

export default ProfileForm;

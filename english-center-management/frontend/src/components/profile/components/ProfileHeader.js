import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Edit, Cancel, Person } from '@mui/icons-material';

const ProfileHeader = ({ editMode, onEditToggle, loading }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      mb: 4,
      pb: 2,
      borderBottom: '1px solid #e0e0e0'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Person sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={600}>
          Thông tin cá nhân
        </Typography>
      </Box>
      <Button
        variant={editMode ? "outlined" : "contained"}
        color={editMode ? "inherit" : "primary"}
        startIcon={editMode ? <Cancel /> : <Edit />}
        onClick={onEditToggle}
        disabled={loading}
        sx={{ textTransform: 'none' }}
      >
        {editMode ? 'Hủy' : 'Chỉnh sửa'}
      </Button>
    </Box>
  );
};

export default ProfileHeader;

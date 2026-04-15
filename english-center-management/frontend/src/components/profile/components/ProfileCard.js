import React from 'react';
import { Box, Typography, Avatar, Card, CardContent, CircularProgress } from '@mui/material';
import { School, Work, Person, CameraAlt } from '@mui/icons-material';

const getRoleInfo = (role) => {
  const roleLower = role?.toLowerCase();
  switch (roleLower) {
    case 'teacher':
      return { title: 'Giáo viên', color: '#1976d2', icon: <School /> };
    case 'student':
      return { title: 'Học viên', color: '#388e3c', icon: <School /> };
    case 'admin':
      return { title: 'Quản trị viên', color: '#d32f2f', icon: <Work /> };
    default:
      return { title: 'Người dùng', color: '#757575', icon: <Person /> };
  }
};

const ProfileCard = ({ user, avatarPreview, uploading, fileInputRef, onAvatarClick, onFileChange }) => {
  const roleInfo = getRoleInfo(user?.role);
  const [imgError, setImgError] = React.useState(false);

  const avatarSrc = avatarPreview || user?.avatar;
  
  return (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
          <Avatar
            sx={{
              width: 140,
              height: 140,
              mx: 'auto',
              bgcolor: roleInfo.color,
              fontSize: '3.5rem',
              cursor: 'pointer',
              border: '4px solid #f0f0f0',
              '& img': { objectFit: 'cover' }
            }}
            src={!imgError ? avatarSrc : undefined}
            onClick={onAvatarClick}
            onError={() => setImgError(true)}
          >
            {user?.fullName?.charAt(0) || 'U'}
          </Avatar>
          
          {/* Hover Overlay */}
          <Box
            onClick={onAvatarClick}
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              opacity: 0,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': { opacity: 1 },
            }}
          >
            {uploading ? (
              <CircularProgress size={32} color="inherit" />
            ) : (
              <>
                <CameraAlt sx={{ fontSize: 28, mb: 0.5 }} />
                <Typography variant="caption" fontWeight={500}>
                  Đổi ảnh
                </Typography>
              </>
            )}
          </Box>
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ display: 'none' }}
        />
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {user?.fullName || 'User'}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 1,
          mb: 1,
          px: 2,
          py: 0.5,
          bgcolor: `${roleInfo.color}15`,
          borderRadius: 2,
          width: 'fit-content',
          mx: 'auto'
        }}>
          {React.cloneElement(roleInfo.icon, { sx: { fontSize: 18, color: roleInfo.color } })}
          <Typography variant="body2" fontWeight={500} sx={{ color: roleInfo.color }}>
            {roleInfo.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {user?.email}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;

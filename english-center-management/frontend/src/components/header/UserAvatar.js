import React, { useState, useEffect } from 'react';
import {
  Avatar as MuiAvatar,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';

const UserAvatar = ({ 
  user, 
  isAuthenticated, 
  size = 32, 
  showName = false, 
  sx = {},
  onUserMenuOpen,
  ...props 
}) => {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    // Listen for user updates to refresh avatar
    const handleUserUpdate = () => {
      setUpdateTrigger(prev => prev + 1);
    };

    const handleStorageChange = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        // Force re-render by updating trigger
        setUpdateTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleClick = (e) => {
    if (onUserMenuOpen) {
      onUserMenuOpen(e);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Tooltip title="Profile">
        <IconButton
          onClick={handleClick}
          sx={{ 
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
          {...props}
        >
          <MuiAvatar 
            key={updateTrigger} // Force re-render when user updates
            sx={{ 
              width: size, 
              height: size,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white'
            }}
            src={user.avatar}
          >
            {user.fullName?.charAt(0) || user.name?.charAt(0) || 'U'}
          </MuiAvatar>
        </IconButton>
      </Tooltip>
      {showName && (
        <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
          {user.fullName || user.name || 'User'}
        </Typography>
      )}
    </>
  );
};

export default UserAvatar;

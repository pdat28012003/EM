import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  Box,
  ListItemIcon,
  Typography,
  Divider
} from '@mui/material';
import { Assignment, Dashboard, Class, Schedule, AccountCircle, Logout, Description } from '@mui/icons-material';
import { useNavigation } from '../../hooks/useNavigation';

const NavigationMenu = ({ 
  anchorEl, 
  open, 
  onClose, 
  isAuthenticated, 
  user 
}) => {
  const { navigateToHomeWindow } = useNavigation();

  const handleHomeClick = () => {
    navigateToHomeWindow(user);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      sx={{ display: { xs: 'block', md: 'none' } }}
      PaperProps={{
        sx: {
          mt: 1.5,
          minWidth: 220,
          '& .MuiMenuItem-root': {
            px: 2,
            py: 1,
            borderRadius: 1,
            mx: 1,
            my: 0.5
          }
        }
      }}
    >
      <MenuItem onClick={handleHomeClick}>
        <ListItemIcon>
          <Dashboard fontSize="small" sx={{ color: '#7c3aed' }} />
        </ListItemIcon>
        <Typography variant="body2">Dashboard</Typography>
      </MenuItem>
      
      <MenuItem component={Link} to="/teacher/classes" onClick={onClose}>
        <ListItemIcon>
          <Class fontSize="small" sx={{ color: '#7c3aed' }} />
        </ListItemIcon>
        <Typography variant="body2">Lớp học</Typography>
      </MenuItem>

      <MenuItem component={Link} to="/teacher/schedule" onClick={onClose}>
        <ListItemIcon>
          <Schedule fontSize="small" sx={{ color: '#7c3aed' }} />
        </ListItemIcon>
        <Typography variant="body2">Lịch dạy</Typography>
      </MenuItem>
      <MenuItem component={Link} to="/teacher/assignments" onClick={onClose}>
        <ListItemIcon>
          <Assignment fontSize="small" sx={{ color: '#7c3aed' }} />
        </ListItemIcon>
        <Typography variant="body2">Bài tập</Typography>
      </MenuItem>
      <MenuItem component={Link} to="/teacher/documents" onClick={onClose}>
        <ListItemIcon>
          <Description fontSize="small" sx={{ color: '#7c3aed' }} />
        </ListItemIcon>
        <Typography variant="body2">Tài liệu</Typography>
      </MenuItem> 

      {isAuthenticated && user ? (
        <>
          <MenuItem disabled>
            <Typography variant="caption" sx={{ color: 'text.secondary', pl: 4 }}>
              Xin chào, {user.name || user.fullName || 'User'}
            </Typography>
          </MenuItem>
          <MenuItem component={Link} to="/profile" onClick={onClose}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <Typography variant="body2">Thông tin cá nhân</Typography>
          </MenuItem>
          <MenuItem component={Link} to="/login" onClick={onClose}>
            <ListItemIcon>
              <Logout fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ color: 'error.main' }}>Đăng xuất</Typography>
          </MenuItem>
        </>
      ) : (
        <MenuItem component={Link} to="/login" onClick={onClose}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Đăng nhập</Typography>
        </MenuItem>
      )}
    </Menu>
  );
};

export default NavigationMenu;

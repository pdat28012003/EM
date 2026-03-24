import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  Box
} from '@mui/material';
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
    >
      <MenuItem onClick={handleHomeClick}>
        Trang chủ
      </MenuItem>
      <MenuItem component={Link} to="/teacher/classes" onClick={onClose}>
        Lớp học
      </MenuItem>

      <MenuItem component={Link} to="/teacher/schedule" onClick={onClose}>
        Lịch dạy
      </MenuItem>
      <MenuItem component={Link} to="/teacher/documents" onClick={onClose}>
        Tài liệu
      </MenuItem> 

      {isAuthenticated && user ? (
        <>
          <MenuItem disabled>
            <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Xin chào, {user.name || user.fullName || 'User'}
            </Box>
          </MenuItem>
          <MenuItem component={Link} to="/profile" onClick={onClose}>
            Thông tin cá nhân
          </MenuItem>
          <MenuItem component={Link} to="/login" onClick={onClose}>
            Đăng xuất
          </MenuItem>
        </>
      ) : (
        <MenuItem component={Link} to="/login" onClick={onClose}>
          Đăng nhập
        </MenuItem>
      )}
    </Menu>
  );
};

export default NavigationMenu;

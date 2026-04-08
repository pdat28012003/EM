import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  Box,
  Divider
} from '@mui/material';
import { useNavigation } from '../../hooks/useNavigation';

const StudentNavigationMenu = ({
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
        Dashboard
      </MenuItem>
      <MenuItem component={Link} to="/student/courses" onClick={onClose}>
        Khóa học của tôi
      </MenuItem>
      <MenuItem component={Link} to="/student/schedule" onClick={onClose}>
        Lịch học
      </MenuItem>
      <MenuItem component={Link} to="/student/assignments" onClick={onClose}>
        Bài tập
      </MenuItem>
      <MenuItem component={Link} to="/student/documents" onClick={onClose}>
        Tài liệu
      </MenuItem>
      <MenuItem component={Link} to="/student/payments" onClick={onClose}>
        Thanh toán
      </MenuItem>

      {isAuthenticated && user ? (
        <>
          <Divider />
          <MenuItem disabled>
            <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Xin chào, {user.fullName || user.name || 'User'}
            </Box>
          </MenuItem>
          <MenuItem component={Link} to="/student/profile" onClick={onClose}>
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

export default StudentNavigationMenu;

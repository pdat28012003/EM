import {
  Menu,
  MenuItem,
  Typography,
  Divider 
} from '@mui/material';
import {
  Person,
  Logout
} from '@mui/icons-material';

const UserMenu = ({ 
  anchorEl, 
  open, 
  onClose, 
  user, 
  onProfileClick, 
  onLogout 
}) => {
  const handleProfileClick = () => {
   onProfileClick?.();
   onClose();
  };

  const handleLogoutClick = () => {
   onLogout?.();
   onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 3,
        sx: {
          mt: 1.5,
          minWidth: 200,
        }
      }}
    >
      <MenuItem disabled>
        <Typography variant="body2" color="text.secondary">
          Xin chào, {user?.fullName || user?.name || 'User'}
        </Typography>
      </MenuItem>
     <Divider />
      <MenuItem onClick={handleProfileClick}>
        <Person sx={{ mr: 1, fontSize: 18 }} />
        Thông tin cá nhân
      </MenuItem>
      <MenuItem onClick={handleLogoutClick}>
        <Logout sx={{ mr: 1, fontSize: 18 }} />
        Đăng xuất
      </MenuItem>
    </Menu>
  );
};

export default UserMenu;

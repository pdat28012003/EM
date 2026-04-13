import {
  Menu,
  MenuItem,
  Typography,
  Divider,
  Box,
  Avatar
} from '@mui/material';
import {
  Person,
  Logout,
  Settings
} from '@mui/icons-material';

const UserMenu = ({ 
  anchorEl, 
  open, 
  onClose, 
  user, 
  onProfileClick, 
  onSettingsClick,
  onLogout 
}) => {
  const handleProfileClick = () => {
    onProfileClick?.();
    onClose();
  };

  const handleSettingsClick = () => {
    onSettingsClick?.();
    onClose();
  };

  const handleLogoutClick = () => {
    onLogout?.();
    onClose();
  };

  const displayName = user?.fullName || user?.name || 'User';
  const displayEmail = user?.email || '';
  const avatarChar = displayName.charAt(0).toUpperCase();

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        elevation: 4,
        sx: {
          mt: 1,
          minWidth: 220,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }
      }}
    >
      {/* User Info Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          src={user?.avatar}
          sx={{
            width: 38,
            height: 38,
            bgcolor: 'rgba(255,255,255,0.25)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 700,
            border: '2px solid rgba(255,255,255,0.4)',
          }}
        >
          {avatarChar}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography
            variant="body2"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: '0.85rem',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 140,
            }}
          >
            {displayName}
          </Typography>
          {displayEmail && (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: '0.72rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                maxWidth: 140,
              }}
            >
              {displayEmail}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ m: 0 }} />

      {/* Profile */}
      <MenuItem
        onClick={handleProfileClick}
        sx={{
          px: 2,
          py: 1.2,
          gap: 1.5,
          fontSize: '0.85rem',
          color: 'text.primary',
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.07)',
            color: '#2563eb',
            '& .menu-icon': { color: '#2563eb' }
          }
        }}
      >
        <Person
          className="menu-icon"
          sx={{ fontSize: 18, color: 'text.secondary', transition: 'color 0.15s ease' }}
        />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Hồ sơ cá nhân
        </Typography>
      </MenuItem>

      {/* Settings */}
      <MenuItem
        onClick={handleSettingsClick}
        sx={{
          px: 2,
          py: 1.2,
          gap: 1.5,
          fontSize: '0.85rem',
          color: 'text.primary',
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.07)',
            color: '#2563eb',
            '& .menu-icon': { color: '#2563eb' }
          }
        }}
      >
        <Settings
          className="menu-icon"
          sx={{ fontSize: 18, color: 'text.secondary', transition: 'color 0.15s ease' }}
        />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Cài đặt
        </Typography>
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      {/* Logout — highlighted in red */}
      <MenuItem
        onClick={handleLogoutClick}
        sx={{
          px: 2,
          py: 1.2,
          gap: 1.5,
          fontSize: '0.85rem',
          color: '#dc2626',
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(220, 38, 38, 0.07)',
          }
        }}
      >
        <Logout sx={{ fontSize: 18, color: '#dc2626' }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Đăng xuất
        </Typography>
      </MenuItem>
    </Menu>
  );
};

export default UserMenu;

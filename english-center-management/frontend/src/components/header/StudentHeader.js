import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  School,
  Notifications,
  AccountCircle
} from '@mui/icons-material';
import { authAPI } from '../../services/api';
import { useNavigation } from '../../hooks/useNavigation';
import UserAvatar from './UserAvatar';
import UserMenu from './UserMenu';
import StudentNavigationMenu from './StudentNavigationMenu';
import NotificationDropdown from './NotificationDropdown';

const StudentHeader = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { navigateToHome } = useNavigation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const userData = localStorage.getItem('user');

      setIsAuthenticated(isAuthenticated);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };

    loadUserData();

    // Listen for user updates to refresh header data
    const handleUserUpdate = (event) => {
      const updatedUser = event.detail;
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        // Fallback: reload from localStorage
        loadUserData();
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleLogout = async () => {
    try {
      // Call logout API if available
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar sx={{ minHeight: '48px !important', height: '48px' }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box
            onClick={() => navigateToHome(user, navigate)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <School sx={{ color: 'white', fontSize: 20, mr: 1 }} />
            <Typography
              variant="h6"
              component="h1"
              sx={{
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                letterSpacing: 'tight'
              }}
            >
              English Center
            </Typography>
          </Box>
        </Box>

        {/* Desktop Navigation - Student focused */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
          <Button
            onClick={() => navigateToHome(user, navigate)}
            sx={{
              color: 'white',
              fontSize: '0.75rem',
              px: 2,
              py: 0.5,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Dashboard
          </Button>
          <Button
            component={Link}
            to="/student/courses"
            sx={{
              color: 'white',
              fontSize: '0.75rem',
              px: 2,
              py: 0.5,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Khóa học của tôi
          </Button>
          <Button
            component={Link}
            to="/student/schedule"
            sx={{
              color: 'white',
              fontSize: '0.75rem',
              px: 2,
              py: 0.5,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Lịch học
          </Button>
          <Button
            component={Link}
            to="/student/assignments"
            sx={{
              color: 'white',
              fontSize: '0.75rem',
              px: 2,
              py: 0.5,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Bài tập
          </Button>
          <Button
            component={Link}
            to="/student/documents"
            sx={{
              color: 'white',
              fontSize: '0.75rem',
              px: 2,
              py: 0.5,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Tài liệu
          </Button>
          <Button
            component={Link}
            to="/student/payments"
            sx={{
              color: 'white',
              fontSize: '0.75rem',
              px: 2,
              py: 0.5,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Thanh toán
          </Button>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, ml: 2, alignItems: 'center' }}>
          {isAuthenticated && user ? (
            <>
              {/* Notifications */}
              <NotificationDropdown />

              <UserAvatar
                user={user}
                isAuthenticated={isAuthenticated}
                showName={true}
                onUserMenuOpen={handleUserMenuOpen}
              />
              <UserMenu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                user={user}
                onProfileClick={handleProfile}
                onLogout={handleLogout}
              />
            </>
          ) : (
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              sx={{
                borderColor: 'white',
                color: 'white',
                fontSize: '0.75rem',
                px: 2,
                py: 0.5,
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Đăng nhập
            </Button>
          )}
        </Box>

        {/* Mobile Menu Button */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenuOpen}
          sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </IconButton>

        {/* Mobile Menu */}
        <StudentNavigationMenu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          isAuthenticated={isAuthenticated}
          user={user}
        />
      </Toolbar>
    </AppBar>
  );
};

export default StudentHeader;

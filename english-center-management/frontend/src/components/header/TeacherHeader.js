import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Container,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  School
} from '@mui/icons-material';
import { authAPI } from '../../services/api';
import { useNavigation } from '../../hooks/useNavigation';
import UserAvatar from './UserAvatar';
import UserMenu from './UserMenu';
import NavigationMenu from './NavigationMenu';
import NotificationDropdown from './NotificationDropdown';

const TeacherHeader = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { navigateToHome } = useNavigation();
  const navigate = useNavigate();

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);  
  };

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

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      handleUserMenuClose();
      navigate('/login');
    }
  };

  const handleProfile = () => {
    handleUserMenuClose();
    // Navigate to profile page based on user role
    if (user?.role) {
      const role = user.role.toLowerCase();
      if (role === 'teacher') {
        navigate('/teacher/profile');
      } else if (role === 'student') {
        navigate('/student/profile');
      } else if (role === 'admin') {
        navigate('/admin/profile');
      } else {
        navigate('/profile');
      }
    } else {
      navigate('/profile');
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 9999
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Toolbar disableGutters sx={{ minHeight: '48px !important', height: '48px' }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box 
            onClick={() => navigateToHome(user)}
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

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, ml: 2 }}>
          <Button 
            component={Link}
            to="/teacher/dashboard"
            sx={{ 
              color: 'white', 
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Dashboard
          </Button>
          <Button 
            component={Link}
            to="/teacher/classes"
            sx={{ 
              color: 'white', 
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Khóa học
          </Button>
          <Button 
            component={Link}
            to="/teacher/schedule"
            sx={{ 
              color: 'white', 
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Lịch dạy
          </Button>
          {/* <Button 
            component={Link}
            to="/teacher/availability"
            sx={{ 
              color: 'white', 
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Lịch rảnh
          </Button> */}
          <Button 
            component={Link}
            to="/teacher/documents"
            sx={{ 
              color: 'white', 
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Tài liệu
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
                py: 0.5,
                '&:hover': { 
                  borderColor: 'white',
                  backgroundColor: 'white',
                  color: '#7c3aed'
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
        <NavigationMenu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          isAuthenticated={isAuthenticated}
          user={user}
        />
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default TeacherHeader;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  InputBase,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  School,
  Notifications,
  Search as SearchIcon,
  AccountCircle,
  Assignment,
  Assessment
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
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      // Handle search logic here
      console.log('Searching for:', search);
      // You can add navigation to search results page
      // navigate(`/search?q=${encodeURIComponent(search)}`);
    }
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

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
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
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar sx={{ minHeight: '48px !important', height: '48px' }}>
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

   {/* Search Bar */}
<Box
  sx={{
    display: { xs: 'none', md: 'flex' },
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: '20px',
    px: 2,
    py: 0.2,
    width: '300px'
  }}
>
  <SearchIcon sx={{ color: 'white', mr: 1, fontSize: 18 }} />
  <InputBase
    placeholder="Tìm kiếm..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    onKeyDown={handleSearch}
    sx={{
      color: 'white',
      fontSize: '0.85rem',
      width: '100%',
      '& input::placeholder': {
        color: 'rgba(255,255,255,0.7)'
      }
    }}
  />
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
    </AppBar>
  );
};

export default TeacherHeader;

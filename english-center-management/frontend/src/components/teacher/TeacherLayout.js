import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Menu as MuiMenu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  FileText,
  LogOut,
  Menu as MenuIcon,
  ChevronDown,
  Home,
  GraduationCap,
  User,
} from 'lucide-react';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import NotificationDropdown from '../header/NotificationDropdown';

const drawerWidth = 280;
const collapsedWidth = 80;

const teacherMenuItems = [
  { text: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/teacher/dashboard' },
  { text: 'Khóa Học', icon: <BookOpen size={22} />, path: '/teacher/curriculums' },
  { text: 'Lịch Dạy', icon: <Calendar size={22} />, path: '/teacher/schedule' },
  { text: 'Tài Liệu', icon: <FileText size={22} />, path: '/teacher/documents' },
];

const TeacherLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const collapsedWidthValue = collapsed ? collapsedWidth : drawerWidth;

  React.useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const handleSidebarExpand = () => {
    if (collapsed) setCollapsed(false);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigateHome = () => {
    navigate('/teacher/dashboard');
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      navigate('/login');
      handleMenuClose();
    }
  };

  const drawer = (
    <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', height: '100%', display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, transition: 'all 0.3s ease' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 1.5, transition: 'all 0.3s ease' }}>
          {collapsed ? (
            <Tooltip title="M menu" arrow>
              <IconButton
                onClick={handleSidebarExpand}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                <GraduationCap color="white" size={18} />
              </IconButton>
            </Tooltip>
          ) : (
            <Box sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <GraduationCap color="white" size={18} />
            </Box>
          )}
          {!collapsed && (
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
              English Center
            </Typography>
          )}
        </Box>
        <Tooltip title={collapsed ? 'Mở menu' : 'Thu gọn menu'} arrow>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={handleSidebarCollapse}
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              bgcolor: 'rgba(15, 23, 42, 0.05)',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.25s ease',
              '&:hover': {
                bgcolor: 'rgba(15, 23, 42, 0.12)',
                transform: 'scale(1.02)',
              },
            }}
          >
            <MenuIcon size={18} />
          </IconButton>
        </Tooltip>
      </Box>
      <List sx={{ px: collapsed ? 0 : 1.5, mt: 0.5, '& .MuiListItem-root': { px: 0.5 } }}>
        {teacherMenuItems.map((item) => {
          const isActive = item.path === '/teacher/dashboard'
            ? location.pathname === '/teacher/dashboard'
            : location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                title={collapsed ? item.text : undefined}
                sx={{
                  width: '100%',
                  borderRadius: '10px',
                  py: 0.8,
                  px: collapsed ? 0 : 1.5,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  alignItems: 'center',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  bgcolor: isActive ? 'rgba(59, 130, 246, 0.16)' : 'transparent',
                  color: isActive ? 'text.primary' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(59, 130, 246, 0.22)' : 'rgba(0, 0, 0, 0.04)',
                    color: 'text.primary',
                    transform: collapsed ? 'none' : 'translateX(6px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 1.5,
                    display: 'flex',
                    justifyContent: 'center',
                    color: 'inherit',
                    width: collapsed ? '100%' : 'auto',
                  }}
                >
                  {React.cloneElement(item.icon, { size: 20, strokeWidth: isActive ? 2.5 : 2 })}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: isActive ? 700 : 500,
                    sx: { fontSize: '0.85rem' }
                  }}
                  sx={{
                    opacity: collapsed ? 0 : 1,
                    width: collapsed ? 0 : 'auto',
                    transition: 'opacity 0.25s ease, width 0.25s ease',
                    overflow: 'hidden',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ mt: 'auto', p: 1, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            width: '100%',
            borderRadius: '10px',
            py: 0.8,
            px: collapsed ? 0 : 1.5,
            justifyContent: collapsed ? 'center' : 'flex-start',
            alignItems: 'center',
            color: '#dc2626',
            '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.12)' },
          }}
          title={collapsed ? 'Đăng xuất' : undefined}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.5, display: 'flex', justifyContent: 'center', color: 'inherit' }}>
            <LogOut size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Đăng xuất"
            primaryTypographyProps={{ variant: 'body2', fontWeight: 600, sx: { fontSize: '0.85rem' } }}
            sx={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : 'auto',
              transition: 'opacity 0.25s ease, width 0.25s ease',
              overflow: 'hidden',
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${collapsedWidthValue}px)` },
          ml: { sm: `${collapsedWidthValue}px` },
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          color: 'text.primary',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon size={24} />
            </IconButton>
            <Box
              onClick={handleNavigateHome}
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1.5,
                ml: 1,
                cursor: 'pointer',
                '&:hover .headerBreadcrumb': {
                  color: 'primary.main',
                },
              }}
            >
              <Home size={18} color="#64748b" />
              <Typography variant="body2" sx={{ color: 'divider' }}>/</Typography>
              <Typography className="headerBreadcrumb" variant="subtitle2" component="div" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: -0.2 }}>
                Dashboard
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <NotificationDropdown />
            </Box>

            <Button
              onClick={handleMenuClick}
              sx={{
                textTransform: 'none',
                ml: 1,
                borderRadius: '14px',
                px: 1.5,
                py: 0.75,
                bgcolor: 'transparent',
                border: '1px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(99, 102, 241, 0.08)',
                  borderColor: 'rgba(99, 102, 241, 0.2)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={user?.avatar || ''}
                  alt={user?.fullName || 'Avatar'}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                    border: '2px solid white',
                  }}
                >
                  {!user?.avatar && (user?.fullName?.[0] || 'G')}
                </Avatar>
                <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
                    {user?.fullName || 'Giáo viên'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}>
                    Giáo viên
                  </Typography>
                </Box>
                <ChevronDown size={16} color="#6366f1" style={{ marginLeft: 4 }} />
              </Box>
            </Button>
            <MuiMenu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1.5,
                  borderRadius: '16px',
                  minWidth: 200,
                  overflow: 'visible',
                  bgcolor: 'background.paper',
                  boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: -6,
                    right: 20,
                    width: 12,
                    height: 12,
                    bgcolor: 'background.paper',
                    transform: 'rotate(45deg)',
                    borderRadius: '2px',
                    boxShadow: '-2px -2px 4px rgba(0,0,0,0.04)',
                    zIndex: 0,
                  },
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {user?.fullName || 'Giáo viên'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {user?.email || 'teacher@englishcenter.com'}
                </Typography>
              </Box>
              <MenuItem
                onClick={() => { navigate('/teacher/profile'); handleMenuClose(); }}
                sx={{
                  py: 1.25,
                  px: 2,
                  mx: 1,
                  my: 0.5,
                  borderRadius: '10px',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                  }
                }}
              >
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5
                }}>
                  <User size={16} color="#6366f1" />
                </Box>
                <ListItemText primary="Trang cá nhân" sx={{ '& .MuiTypography-root': { fontWeight: 500, fontSize: '0.9rem' } }} />
              </MenuItem>
              <Divider sx={{ mx: 1.5, my: 0.5 }} />
              <MenuItem
                onClick={handleLogout}
                sx={{
                  py: 1.25,
                  px: 2,
                  mx: 1,
                  my: 0.5,
                  borderRadius: '10px',
                  color: '#ef4444',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                  }
                }}
              >
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5
                }}>
                  <LogOut size={16} color="#ef4444" />
                </Box>
                <ListItemText primary="Đăng xuất" sx={{ '& .MuiTypography-root': { fontWeight: 500, fontSize: '0.9rem' } }} />
              </MenuItem>
            </MuiMenu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{
          width: { sm: collapsedWidthValue },
          flexShrink: { sm: 0 },
          cursor: collapsed ? 'pointer' : 'default',
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: collapsedWidthValue,
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          width: { sm: `calc(100% - ${collapsedWidthValue}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          transition: 'width 0.3s ease',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default TeacherLayout;

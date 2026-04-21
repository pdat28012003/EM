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
  CreditCard,
  LogOut,
  Menu as MenuIcon,
  ChevronDown,
  Home,
  GraduationCap
} from 'lucide-react';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import NotificationDropdown from '../header/NotificationDropdown';

const drawerWidth = 280;
const collapsedWidth = 80;

const studentMenuItems = [
  { text: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/student/dashboard' },
  { text: 'Chương Trình Học', icon: <BookOpen size={22} />, path: '/student/courses' },
  { text: 'Thời Khóa Biểu', icon: <Calendar size={22} />, path: '/student/schedule' },
  { text: 'Bài Tập', icon: <FileText size={22} />, path: '/student/assignments' },
  { text: 'Tài Liệu', icon: <FileText size={22} />, path: '/student/documents' },
  { text: 'Thanh Toán', icon: <CreditCard size={22} />, path: '/student/payments' },
];

const StudentLayout = ({ children }) => {
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
    navigate('/student/dashboard');
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
            <Tooltip title="Mở menu" arrow>
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
      <List sx={{ px: collapsed ? 1 : 2, py: 1, '& .MuiListItem-root': { px: 0, mb: 0.5 } }}>
        {studentMenuItems.map((item) => {
          const isActive = item.path === '/student/dashboard'
            ? location.pathname === '/student/dashboard'
            : location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                title={collapsed ? item.text : undefined}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: collapsed ? 1 : 1.5,
                  minHeight: 44,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  bgcolor: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(59, 130, 246, 0.18)' : 'rgba(0, 0, 0, 0.04)',
                    color: isActive ? 'primary.main' : 'text.primary',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    width: 36,
                    height: 36,
                    mr: collapsed ? 0 : 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'inherit',
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
      <Box sx={{ mt: 'auto', px: collapsed ? 1 : 2, py: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            py: 1,
            px: collapsed ? 1 : 1.5,
            minHeight: 44,
            justifyContent: collapsed ? 'center' : 'flex-start',
            alignItems: 'center',
            color: 'error.main',
            '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.08)' },
          }}
          title={collapsed ? 'Đăng xuất' : undefined}
        >
          <ListItemIcon sx={{ minWidth: 36, width: 36, height: 36, mr: collapsed ? 0 : 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
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
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: 'none' } }}
            >
              <MenuIcon size={22} />
            </IconButton>
            <Box
              onClick={handleNavigateHome}
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <Home size={18} color="#64748b" />
              <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 500 }}>/</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Dashboard
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <NotificationDropdown />

            <Button
              onClick={handleMenuClick}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 1.5,
                py: 0.75,
                ml: 1,
                border: '1px solid rgba(0, 0, 0, 0.08)',
                bgcolor: 'rgba(255, 255, 255, 0.6)',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(0, 0, 0, 0.12)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
                    {user?.fullName || 'Học viên'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}>Học viên</Typography>
                </Box>
                <Avatar
                  src={user?.avatar}
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'primary.main',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.fullName?.[0] || 'H'}
                </Avatar>
                <ChevronDown size={16} color="#64748b" />
              </Box>
            </Button>
            <MuiMenu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 2,
                sx: {
                  mt: 1.5,
                  borderRadius: 2,
                  minWidth: 200,
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {user?.fullName || 'Học viên'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {user?.email || 'student@email.com'}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { navigate('/student/profile'); handleMenuClose(); }} sx={{ py: 1.25 }}>
                <ListItemText primary="Hồ sơ" primaryTypographyProps={{ fontWeight: 500 }} />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 1.25, color: 'error.main' }}>
                <LogOut size={18} style={{ marginRight: 12 }} />
                <ListItemText primary="Đăng xuất" primaryTypographyProps={{ fontWeight: 500 }} />
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

export default StudentLayout;

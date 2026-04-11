import React, { useState, useContext } from 'react';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from '../../App';
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
  InputBase,
  Tooltip,
} from '@mui/material';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  DoorOpen, 
  Calendar, 
  BarChart3, 
  CreditCard, 
  FileText,
  LogOut,
  Menu as MenuIcon,
  Bell,
  Search,
  ChevronDown,
  Home,
  Moon,
  Sun
} from 'lucide-react';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const drawerWidth = 280;
const collapsedWidth = 80;

const menuItems = [
  { text: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/' },
  { text: 'Học Viên', icon: <Users size={22} />, path: '/students' },
  { text: 'Giáo Viên', icon: <GraduationCap size={22} />, path: '/teachers' },
  { text: 'Khóa Học', icon: <BookOpen size={22} />, path: '/courses' },
  { text: 'Kỹ Năng', icon: <BarChart3 size={22} />, path: '/skills' },
  { text: 'Lớp Học', icon: <BookOpen size={22} />, path: '/classes' },
  { text: 'Phòng Học', icon: <DoorOpen size={22} />, path: '/rooms' },
  { text: 'Chương Trình Học', icon: <FileText size={22} />, path: '/curriculum' },
  { text: 'Thanh Toán', icon: <CreditCard size={22} />, path: '/payments' },
  { text: 'Lịch Học', icon: <Calendar size={22} />, path: '/schedules' },
  { text: 'Điểm Số', icon: <BarChart3 size={22} />, path: '/grades' },
  { text: 'Tài Liệu', icon: <FileText size={22} />, path: '/documents' },
];

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const collapsedWidthValue = collapsed ? collapsedWidth : drawerWidth;

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
    navigate('/');
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
    <Box sx={{ bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, height: '100%', display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease' }}>
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
              bgcolor: theme.palette.mode === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.08)',
              boxShadow: theme.palette.mode === 'light' ? '0 8px 20px rgba(15, 23, 42, 0.08)' : '0 8px 20px rgba(15, 23, 42, 0.14)',
              transition: 'all 0.25s ease',
              '&:hover': {
                bgcolor: theme.palette.mode === 'light' ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.16)',
                transform: 'scale(1.02)',
              },
            }}
          >
            <MenuIcon size={18} />
          </IconButton>
        </Tooltip>
      </Box>
      <List sx={{ px: collapsed ? 0 : 1.5, mt: 0.5, '& .MuiListItem-root': { px: 0.5 } }}>
        {menuItems.map((item) => {
          const isActive = item.path === '/' 
            ? location.pathname === '/' 
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
                  bgcolor: isActive
                    ? theme.palette.mode === 'light'
                      ? 'rgba(59, 130, 246, 0.16)'
                      : 'rgba(59, 130, 246, 0.24)'
                    : 'transparent',
                  color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: isActive
                      ? theme.palette.mode === 'light'
                        ? 'rgba(59, 130, 246, 0.22)'
                        : 'rgba(59, 130, 246, 0.28)'
                      : theme.palette.action.hover,
                    color: theme.palette.text.primary,
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
      <Box sx={{ mt: 'auto', p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            width: '100%',
            borderRadius: '10px',
            py: 0.8,
            px: collapsed ? 0 : 1.5,
            justifyContent: collapsed ? 'center' : 'flex-start',
            alignItems: 'center',
            color: theme.palette.mode === 'light' ? '#dc2626' : '#f87171',
            '&:hover': { bgcolor: theme.palette.mode === 'light' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(248, 113, 113, 0.14)' },
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
          bgcolor: theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.8)' 
            : 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(12px)',
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'}`,
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
                  color: theme.palette.primary.main,
                },
              }}
            >
              <Home size={18} color={theme.palette.text.secondary} />
              <Typography variant="body2" sx={{ color: theme.palette.divider }}>/</Typography>
              <Typography className="headerBreadcrumb" variant="subtitle2" component="div" sx={{ fontWeight: 800, color: theme.palette.text.primary, letterSpacing: -0.2 }}>
                Dashboard
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              bgcolor: theme.palette.mode === 'light' 
                ? 'rgba(0, 0, 0, 0.04)' 
                : 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              px: 1.5,
              py: 0.5,
              mr: 1,
              border: `1px solid ${theme.palette.mode === 'light' ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:focus-within': {
                bgcolor: theme.palette.mode === 'light' ? 'white' : 'transparent',
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 0 2px ${theme.palette.primary.main}33`
              }
            }}>
              <Search size={16} color={theme.palette.text.secondary} />
              <InputBase
                placeholder="Tìm kiếm..."
                sx={{ 
                  ml: 1, 
                  fontSize: '0.85rem', 
                  color: theme.palette.text.primary,
                  width: 150,
                  transition: 'width 0.3s',
                  '& .MuiInputBase-input::placeholder': {
                    color: theme.palette.text.secondary,
                    opacity: 0.5
                  },
                  '&:focus-within': { width: 220 }
                }}
              />
            </Box>

            <IconButton onClick={colorMode.toggleColorMode} sx={{ color: theme.palette.text.secondary }}>
              {theme.palette.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
            <IconButton sx={{ color: theme.palette.text.secondary }}>
              <Bell size={20} />
            </IconButton>
            
            <Button
              onClick={handleMenuClick}
              sx={{ 
                textTransform: 'none',
                ml: 1,
                borderRadius: '12px',
                px: 1,
                py: 0.5,
                '&:hover': { bgcolor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1, color: theme.palette.text.primary }}>Admin</Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>Quản trị viên</Typography>
                </Box>
                <Avatar sx={{ 
                  width: 38, 
                  height: 38, 
                  bgcolor: theme.palette.primary.main, 
                  fontSize: '0.9rem', 
                  fontWeight: 800,
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}33`
                }}>A</Avatar>
                <ChevronDown size={14} color={theme.palette.text.secondary} />
              </Box>
            </Button>
            <MuiMenu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: { 
                  mt: 1, 
                  borderRadius: '12px', 
                  minWidth: 180,
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#f87171' }}>
                <LogOut size={18} style={{ marginRight: 12 }} />
                Đăng xuất
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

export default Layout;

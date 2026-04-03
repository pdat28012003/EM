import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Notifications,
  MoreVert,
  Delete,
  MarkEmailRead,
  MarkEmailUnread,
  Circle
} from '@mui/icons-material';
import { notificationsAPI } from '../../services/api';

const NotificationDropdown = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const hasLoaded = useRef(false);

  const open = Boolean(anchorEl);
  const actionMenuOpen = Boolean(actionMenuAnchor);

  useEffect(() => {
    loadUnreadCount();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll({ limit: 50 });
      const data = res.data || [];

      const sorted = data.sort((a, b) => {
        if (a.isRead === b.isRead) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.isRead ? 1 : -1;
      });

      setNotifications(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      setUnreadCount(res.data || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);

    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadNotifications();
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleItemClick = async (n) => {
    if (!n.isRead) {
      await notificationsAPI.markAsRead(n.notificationId);

      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === n.notificationId
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (n.link) {
      window.location.href = n.link;
    }
  };

  const handleMarkAll = async () => {
    await notificationsAPI.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    try {
      await notificationsAPI.markAsUnread(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: false } : n
        )
      );
      setUnreadCount((prev) => prev + 1);
    } catch (err) {
      console.error('Error marking as unread:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationsAPI.delete(notificationId);
      const deleted = notifications.find((n) => n.notificationId === notificationId);
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const openActionMenu = (event, notification) => {
    event.stopPropagation();
    setSelectedNotification(notification);
    setActionMenuAnchor(event.currentTarget);
  };

  const closeActionMenu = () => {
    setActionMenuAnchor(null);
    setSelectedNotification(null);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);

    if (diff < 1) return 'Vừa xong';
    if (diff < 60) return `${diff} phút`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ`;
    return `${Math.floor(diff / 1440)} ngày`;
  };

  return (
    <>
      <IconButton onClick={handleClick} sx={{ color: 'white' }}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            mt: 1.5,
            borderRadius: 2
          }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography fontWeight="bold">Thông báo</Typography>
          <Typography
            variant="caption"
            sx={{ color: '#1877f2', cursor: 'pointer' }}
            onClick={handleMarkAll}
          >
            Đánh dấu tất cả đã đọc
          </Typography>
        </Box>

        <Divider />

        {/* List */}
        {notifications.map((n) => (
          <Box
            key={n.notificationId}
            onClick={() => handleItemClick(n)}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              px: 2,
              py: 1.5,
              cursor: 'pointer',
              bgcolor: n.isRead ? 'transparent' : '#e7f3ff',
              '&:hover': { bgcolor: '#f0f2f5' }
            }}
          >
            {/* Unread indicator dot */}
            <Box sx={{ mt: 1, mr: 1.5 }}>
              {!n.isRead ? (
                <Circle sx={{ fontSize: 10, color: '#1877f2' }} />
              ) : (
                <Box sx={{ width: 10 }} />
              )}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">
                <strong>{n.title}</strong> {n.message}
              </Typography>

              <Typography variant="caption" sx={{ color: '#65676b' }}>
                {formatTime(n.createdAt)}
              </Typography>
            </Box>

            {/* Action menu button */}
            <IconButton
              size="small"
              onClick={(e) => openActionMenu(e, n)}
              sx={{ ml: 0.5, color: '#65676b' }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        ))}

        {notifications.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Không có thông báo
            </Typography>
          </Box>
        )}

        <Divider />

        {/* Footer */}
        <Box
          sx={{
            textAlign: 'center',
            py: 1.5,
            cursor: 'pointer',
            color: '#1877f2',
            fontWeight: 500,
            '&:hover': { bgcolor: '#f0f2f5' }
          }}
        >
          Xem tất cả thông báo
        </Box>
      </Menu>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={actionMenuOpen}
        onClose={closeActionMenu}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: { minWidth: 180 }
        }}
      >
        {selectedNotification?.isRead ? (
          <MenuItem onClick={() => {
            handleMarkAsUnread(selectedNotification.notificationId);
            closeActionMenu();
          }}>
            <ListItemIcon>
              <MarkEmailUnread fontSize="small" />
            </ListItemIcon>
            <ListItemText>Đánh dấu chưa đọc</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => {
            handleMarkAsRead(selectedNotification?.notificationId);
            closeActionMenu();
          }}>
            <ListItemIcon>
              <MarkEmailRead fontSize="small" />
            </ListItemIcon>
            <ListItemText>Đánh dấu đã đọc</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          handleDelete(selectedNotification?.notificationId);
          closeActionMenu();
        }} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Xóa thông báo</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationDropdown;

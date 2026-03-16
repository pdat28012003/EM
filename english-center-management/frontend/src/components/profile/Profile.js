import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Avatar,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  School,
  Work,
  Edit,
  Save,
  Cancel,
  Camera
} from '@mui/icons-material';
import { authAPI, UPLOAD_URL, BASE_URL } from '../../services/api';
import { validateProfileForm, validateFileUpload } from './components/ProfileValidator';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        const userData = response.data;
        setUser(userData);
        setFormData({
          fullName: userData.fullName || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || ''
        });
        // Set avatar preview from API data
        setAvatarPreview(userData.avatar || '');
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Fallback to localStorage if API fails
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setFormData({
            fullName: parsedUser.fullName || '',
            email: parsedUser.email || '',
            phoneNumber: parsedUser.phoneNumber || ''
          });
          // Set avatar preview from localStorage data
          setAvatarPreview(parsedUser.avatar || '');
        } else {
          navigate('/login');
        }
      }
    };

    loadUserProfile();
  }, [navigate]);

  const handleEditToggle = () => {
    if (editMode) {
      // Reset form data when canceling
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
      setError('');
      setSuccess('');
    }
    setEditMode(!editMode);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate form
    const validation = validateProfileForm(formData);
    if (!validation.isValid) {
      setError(Object.values(validation.errors)[0]); // Show first error
      setLoading(false);
      return;
    }

    try {
      // Update user data via API (without avatar)
      const response = await authAPI.updateProfile(formData);
      const updatedUser = response.data;
      
      // Update localStorage and state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
      
      setSuccess('Cập nhật thông tin thành công!');
      setEditMode(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Cập nhật thông tin thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      setError(validation.errors[0]); // Show first error
      return;
    }

    setUploading(true);
    setError('');
    
    // Create preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      // Upload avatar
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: uploadFormData
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      const avatarUrl = uploadResult.url || uploadResult.data?.url;
      const fullAvatarUrl = avatarUrl && !avatarUrl.startsWith('http') 
        ? `${BASE_URL}${avatarUrl}`
        : avatarUrl;
      
      // Update profile with new avatar
      await authAPI.updateProfile({ avatar: fullAvatarUrl });
      
      // Reload user profile to get updated data
      const profileResponse = await authAPI.getProfile();
      const updatedUserData = profileResponse.data;
      
      setUser(updatedUserData);
      setAvatarPreview(fullAvatarUrl);
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUserData }));
      
      setSuccess('Cập nhật avatar thành công!');
    } catch (err) {
      console.error('Failed to update avatar:', err);
      setError('Cập nhật avatar thất bại. Vui lòng thử lại.');
      // Reset to original avatar on error
      setAvatarPreview(user.avatar || '');
    } finally {
      setUploading(false);
      setAvatarFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRoleInfo = () => {
    const role = user?.role?.toLowerCase();
    switch (role) {
      case 'teacher':
        return {
          title: 'Giáo viên',
          color: '#1976d2',
          icon: <School />
        };
      case 'student':
        return {
          title: 'Học viên',
          color: '#388e3c',
          icon: <School />
        };
      case 'admin':
        return {
          title: 'Quản trị viên',
          color: '#d32f2f',
          icon: <Work />
        };
      default:
        return {
          title: 'Người dùng',
          color: '#757575',
          icon: <Person />
        };
    }
  };

  const roleInfo = getRoleInfo();

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Thông tin cá nhân
          </Typography>
          <Button
            variant={editMode ? "outlined" : "contained"}
            startIcon={editMode ? <Cancel /> : <Edit />}
            onClick={handleEditToggle}
            disabled={loading}
          >
            {editMode ? 'Hủy' : 'Chỉnh sửa'}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={4}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: roleInfo.color,
                      fontSize: '3rem',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                    src={avatarPreview || user.avatar}
                    onClick={handleAvatarClick}
                  >
                    {user.fullName?.charAt(0) || 'U'}
                  </Avatar>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 0,
                      bgcolor: 'white',
                      borderRadius: '50%',
                      boxShadow: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'grey.100'
                      }
                    }}
                    onClick={handleAvatarClick}
                  >
                    {uploading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Camera sx={{ fontSize: 20 }} />
                    )}
                  </Box>
                </Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <Typography variant="h6" gutterBottom>
                  {user.fullName || user.name || 'User'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {roleInfo.icon}
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {roleInfo.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Form */}
          <Grid item xs={12} md={8}>
            <Box component="form">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Họ và tên"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    InputProps={{
                      readOnly: !editMode
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    InputProps={{
                      readOnly: !editMode
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    InputProps={{
                      readOnly: !editMode
                    }}
                  />
                </Grid>
              </Grid>

              {editMode && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Lưu thay đổi'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleEditToggle}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Additional Info */}
        <Typography variant="h6" gutterBottom>
          Thông tin chi tiết
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon><Email color="primary" /></ListItemIcon>
            <ListItemText 
              primary="Email" 
              secondary={user.email || 'Chưa cập nhật'} 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Phone color="primary" /></ListItemIcon>
            <ListItemText 
              primary="Số điện thoại" 
              secondary={user.phoneNumber || 'Chưa cập nhật'} 
            />
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
};

export default Profile;

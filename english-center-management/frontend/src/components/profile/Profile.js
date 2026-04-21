import React, { useState } from 'react';
import { Container, Paper, Grid, Alert, CircularProgress, Box, Tabs, Tab, Typography } from '@mui/material';
import { useProfile } from './hooks/useProfile';
import ProfileCard from './components/ProfileCard';
import ProfileForm from './components/ProfileForm';
import SecurityForm from './components/SecurityForm';

const Profile = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);

  const {
    user,
    formData,
    setFormData,
    loading,
    uploading,
    avatarPreview,
    error,
    success,
    fileInputRef,
    setError,
    setSuccess,
    handleInputChange,
    updateProfile,
    uploadAvatar,
    changePassword
  } = useProfile();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
    if (newValue === 0) {
      setEditMode(false);
    }
  };

  // Reset form when cancel edit
  const handleEditToggle = () => {
    if (editMode) {
      setFormData(prev => ({
        ...prev,
        fullName: user?.fullName || '',
        phoneNumber: user?.phoneNumber || '',
        address: user?.address || ''
      }));
      setError('');
      setSuccess('');
    }
    setEditMode(!editMode);
  };

  // Handle save
  const handleSave = async () => {
    const result = await updateProfile();
    if (result) {
      setEditMode(false);
    }
  };

  // Handle avatar file change
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  // Handle avatar click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Loading state
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#f8fafc', py: 3 }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
            Hồ sơ của tôi
          </Typography>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              mb: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 44
              },
              '& .Mui-selected': {
                color: 'primary.main'
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab label="Thông tin cá nhân" />
            <Tab label="Bảo mật" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Grid container spacing={3} alignItems="flex-start">
            {/* Left - Profile Card */}
            <Grid item xs={12} md={4}>
              <ProfileCard
                user={user}
                avatarPreview={avatarPreview}
                uploading={uploading}
                fileInputRef={fileInputRef}
                onAvatarClick={handleAvatarClick}
                onFileChange={handleFileChange}
              />
            </Grid>

            {/* Right - Content based on active tab */}
            <Grid item xs={12} md={8}>
              {activeTab === 0 ? (
                <ProfileForm
                  formData={formData}
                  editMode={editMode}
                  loading={loading}
                  onInputChange={handleInputChange}
                  onSave={handleSave}
                  onCancel={handleEditToggle}
                  onEditToggle={handleEditToggle}
                />
              ) : (
                <SecurityForm
                  loading={loading}
                  onChangePassword={changePassword}
                />
              )}
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Profile;

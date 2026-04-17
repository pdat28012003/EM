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
    <Box sx={{ backgroundColor: '#f8fafc', py: 4 }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
          }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
            Hồ sơ của tôi
          </Typography>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              mb: 4,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              },
              '& .MuiTabs-indicator': {
                borderRadius: 2
              }
            }}
          >
            <Tab label="Thông tin cá nhân" />
            <Tab label="Bảo mật" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
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

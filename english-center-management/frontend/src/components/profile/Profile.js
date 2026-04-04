import React, { useState } from 'react';
import { Container, Paper, Grid, Alert, CircularProgress, Box } from '@mui/material';
import { useProfile } from './hooks/useProfile';
import ProfileHeader from './components/ProfileHeader';
import ProfileCard from './components/ProfileCard';
import ProfileForm from './components/ProfileForm';
import ProfileInfo from './components/ProfileInfo';

const Profile = () => {
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
    uploadAvatar
  } = useProfile();

  // Reset form when cancel edit
  const handleEditToggle = () => {
    if (editMode) {
      setFormData(prev => ({
        ...prev,
        fullName: user?.fullName || '',
        phoneNumber: user?.phoneNumber || ''
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
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 4, 
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
          }}
        >
        <ProfileHeader 
          editMode={editMode}
          onEditToggle={handleEditToggle}
          loading={loading}
        />

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

          {/* Right - Profile Form */}
          <Grid item xs={12} md={8}>
            <ProfileForm
              formData={formData}
              editMode={editMode}
              loading={loading}
              onInputChange={handleInputChange}
              onSave={handleSave}
              onCancel={handleEditToggle}
            />
          </Grid>
        </Grid>

        <ProfileInfo user={user} />
      </Paper>
    </Container>
  </Box>
  );
};

export default Profile;

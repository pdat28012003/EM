import React from 'react';
import { Typography, List, ListItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import { Email, Phone } from '@mui/icons-material';

const ProfileInfo = ({ user }) => {
  return (
    <>
      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h6" gutterBottom>
        Thông tin chi tiết
      </Typography>
      
      <List>
        <ListItem>
          <ListItemIcon><Email color="primary" /></ListItemIcon>
          <ListItemText 
            primary="Email" 
            secondary={user?.email || 'Chưa cập nhật'} 
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><Phone color="primary" /></ListItemIcon>
          <ListItemText 
            primary="Số điện thoại" 
            secondary={user?.phoneNumber || 'Chưa cập nhật'} 
          />
        </ListItem>
      </List>
    </>
  );
};

export default ProfileInfo;

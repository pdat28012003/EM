import React from 'react';
import { Box } from '@mui/material';
import StudentHeader from '../header/StudentHeader';

const StudentLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Student Header */}
      <StudentHeader />
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          p: 3,
          backgroundColor: '#f5f5f5',
          minHeight: 'calc(100vh - 48px)' // Subtract header height
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default StudentLayout;

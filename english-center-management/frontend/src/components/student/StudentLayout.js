import React from 'react';
import { Box } from '@mui/material';
import StudentHeader from '../header/StudentHeader';
import Footer from '../footer/Footer';

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
          mt: 8, // Margin top for fixed header (64px)
          pt: 2,
          pb: 4
        }}
      >
        {children}
      </Box>
      
      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default StudentLayout;

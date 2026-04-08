import React from 'react';
import { Box, Container } from '@mui/material';
import StudentHeader from '../header/StudentHeader';
import Footer from '../footer/Footer';

const StudentLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Student Header */}
      <StudentHeader />
      
      {/* Scrollable Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          pt: '48px',
          height: 'calc(100vh - 48px)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <Box component="main" sx={{ pb: 4 }}>
          <Container maxWidth="lg">
            {children}
          </Container>
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default StudentLayout;

import React from 'react';
import { Box, Container } from '@mui/material';
import TeacherHeader from '../header/TeacherHeader';
import Footer from '../footer/Footer';

const TeacherLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TeacherHeader />
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

export default TeacherLayout;

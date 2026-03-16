import React from 'react';
import { Box } from '@mui/material';
import TeacherHeader from '../header/TeacherHeader';
import Footer from '../footer/Footer';

const TeacherLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TeacherHeader />
      <Box component="main" sx={{ flexGrow: 1, pt: 2, pb: 4 }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default TeacherLayout;

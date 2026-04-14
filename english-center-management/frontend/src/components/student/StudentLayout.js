import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import StudentHeader from '../header/StudentHeader';

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
        <Box component="main" sx={{ pb: 4, minHeight: 'calc(100vh - 100px)' }}>
          <Container maxWidth="lg">
            {children}
          </Container>
        </Box>
        {/* Minimalist Footer */}
        <Box sx={{ py: 2, textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <Typography variant="body2" color="text.secondary">
            © 2026 English Center. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentLayout;

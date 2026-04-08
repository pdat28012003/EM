import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';

const ClassSelection = ({ classes, onSelectClass, loading }) => {
  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">Đang tải...</Typography>
      </Box>
    );
  }

  if (classes.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">
          Không có lớp học nào được phân công
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight="600" gutterBottom>
        Chọn lớp học để chấm điểm
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tổng số: {classes.length} lớp
      </Typography>
      
      <Grid container spacing={2}>
        {classes.map((cls) => (
          <Grid item xs={12} sm={6} md={4} key={cls.classId}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={() => onSelectClass(cls)}
            >
              <CardContent>
                <Box>
                  <Typography variant="subtitle1" fontWeight="600" noWrap>
                    {cls.className}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {cls.courseName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {cls.students} học viên
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default React.memo(ClassSelection);

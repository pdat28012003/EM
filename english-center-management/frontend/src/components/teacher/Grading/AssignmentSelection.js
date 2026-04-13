import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Tooltip,
} from '@mui/material';
import { formatDate } from './gradingUtils';

const AssignmentSelection = ({
  selectedClass,
  assignments,
  onBack,
  onSelectAssignment,
  loading,
}) => {
  if (loading) {
    return (
      <Box>
        <Button onClick={onBack} sx={{ mb: 2 }}>
          Quay lại
        </Button>
        <Typography textAlign="center" py={4} color="text.secondary">
          Đang tải...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button onClick={onBack} sx={{ mr: 2 }}>
          Quay lại
        </Button>
        <Box>
          <Typography variant="h6" fontWeight="600">
            {selectedClass?.className}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chọn bài tập để chấm điểm
          </Typography>
        </Box>
      </Box>

      {assignments.length === 0 ? (
        <Alert severity="info">Lớp này chưa có bài tập nào.</Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tổng số: {assignments.length} bài tập
          </Typography>
          
          <Grid container spacing={2}>
            {assignments.map((assignment) => {
              const submissionsCount = assignment.submissionsCount || 0;
              const gradedCount = assignment.gradedCount || 0;
              const pendingCount = submissionsCount - gradedCount;
              const isFullyGraded = submissionsCount > 0 && pendingCount === 0;
              const hasSkill = assignment.skillId || assignment.skillName;

              return (
                <Grid item xs={12} sm={6} key={assignment.assignmentId}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': { 
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        transform: 'translateY(-2px)',
                      },
                      ...(isFullyGraded && {
                        borderColor: 'success.main',
                        borderWidth: 1,
                        borderStyle: 'solid',
                      }),
                      ...(!hasSkill && {
                        borderColor: 'warning.main',
                        borderWidth: 1,
                        borderStyle: 'dashed',
                      }),
                    }}
                    onClick={() => onSelectAssignment(assignment)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box flex={1}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="600">
                              {assignment.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Hạn nộp: {formatDate(assignment.dueDate)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Điểm tối đa: {assignment.maxScore || 100}
                            </Typography>
                          </Box>
                          {/* Skill Info */}
                          <Box sx={{ mt: 1 }}>
                            {hasSkill ? (
                              <Chip
                                label={assignment.skillName || 'Có kỹ năng'}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            ) : (
                              <Tooltip title="Bài tập chưa gắn kỹ năng - Điểm sẽ không vào bảng điểm">
                                <Chip
                                  label="Chưa gắn kỹ năng"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                        <Chip
                          label={`${submissionsCount} nộp`}
                          size="small"
                          color={submissionsCount > 0 ? 'primary' : 'default'}
                        />
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {assignment.description || 'Không có mô tả'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={`${gradedCount} đã chấm`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                        {pendingCount > 0 && (
                          <Chip
                            label={`${pendingCount} chờ chấm`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default React.memo(AssignmentSelection);

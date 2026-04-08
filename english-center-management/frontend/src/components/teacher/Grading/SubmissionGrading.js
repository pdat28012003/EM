import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Divider,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  getStatusColor,
  getStatusLabel,
  getScoreColor,
  formatDateTime,
  calculateGradingStats,
} from './gradingUtils';

const SubmissionGrading = ({
  selectedAssignment,
  submissions,
  onBack,
  onOpenGradeDialog,
  onDownloadFile,
  loading,
}) => {
  const stats = calculateGradingStats(submissions);

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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onBack}>
          Quay lại
        </Button>
        <Box flex={1}>
          <Typography variant="h6" fontWeight="600">
            {selectedAssignment?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chấm điểm bài nộp của học viên
          </Typography>
        </Box>
      </Box>

      {/* Statistics Summary */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Tổng số</Typography>
          <Typography variant="h6" fontWeight="600">{stats.total}</Typography>
        </Box>
        <Box sx={{ borderLeft: 1, borderColor: 'divider', pl: 2 }}>
          <Typography variant="caption" color="text.secondary">Đã chấm</Typography>
          <Typography variant="h6" fontWeight="600" color="success.main">
            {stats.graded}
          </Typography>
        </Box>
        <Box sx={{ borderLeft: 1, borderColor: 'divider', pl: 2 }}>
          <Typography variant="caption" color="text.secondary">Chờ chấm</Typography>
          <Typography variant="h6" fontWeight="600" color="warning.main">
            {stats.pending}
          </Typography>
        </Box>
        <Box sx={{ borderLeft: 1, borderColor: 'divider', pl: 2 }}>
          <Typography variant="caption" color="text.secondary">Điểm TB</Typography>
          <Typography variant="h6" fontWeight="600" color="primary.main">
            {stats.averageScore}
          </Typography>
        </Box>
        {/* Skill Info */}
        <Box sx={{ ml: 'auto' }}>
          {selectedAssignment?.skillId || selectedAssignment?.skillName ? (
            <Chip
              label={`Kỹ năng: ${selectedAssignment?.skillName || 'Đã gắn'}`}
              color="info"
              size="small"
              variant="outlined"
            />
          ) : (
            <Tooltip title="Điểm sẽ không được lưu vào bảng điểm vì bài tập chưa gắn kỹ năng">
              <Chip
                label="Chưa gắn kỹ năng"
                color="warning"
                size="small"
                variant="outlined"
              />
            </Tooltip>
          )}
        </Box>
      </Paper>

      {submissions.length === 0 ? (
        <Alert severity="info">Chưa có học viên nào nộp bài.</Alert>
      ) : (
        <Paper>
          <List disablePadding>
            {submissions.map((submission, index) => {
              const isGraded = submission.status?.toLowerCase() === 'graded';
              const maxScore = selectedAssignment?.maxScore || 100;

              return (
                <React.Fragment key={submission.submissionId}>
                  <ListItem
                    sx={{
                      bgcolor: isGraded ? 'success.50' : 'background.paper',
                      py: 2,
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={1} alignItems="center">
                        {submission.attachmentUrl && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownloadFile(submission.submissionId, submission.originalFileName);
                            }}
                          >
                            Tải file
                          </Button>
                        )}
                        <Button
                          variant={isGraded ? 'outlined' : 'contained'}
                          color={isGraded ? 'success' : 'primary'}
                          onClick={() => onOpenGradeDialog(submission)}
                          size="small"
                        >
                          {isGraded ? 'Sửa điểm' : 'Chấm điểm'}
                        </Button>
                      </Stack>
                    }
                  >
                    <ListItemText
                      disableTypography
                      primary={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Typography variant="subtitle1" fontWeight="600">
                            {submission.studentName}
                          </Typography>
                          <Chip
                            label={getStatusLabel(submission.status)}
                            size="small"
                            color={getStatusColor(submission.status)}
                          />
                        </div>
                      }
                      secondary={
                        <div>
                          <Typography variant="body2" color="text.secondary" display="block">
                            Nộp lúc: {formatDateTime(submission.submittedAt)}
                          </Typography>
                          {isGraded && (
                            <div style={{ marginTop: 8 }}>
                              <Typography variant="body2" component="span">
                                Điểm:{' '}
                              </Typography>
                              <Chip
                                label={`${submission.score}/${maxScore}`}
                                color={getScoreColor(submission.score, maxScore)}
                                size="small"
                              />
                            </div>
                          )}
                          {submission.feedback && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} display="block">
                              Nhận xét: {submission.feedback}
                            </Typography>
                          )}
                          {submission.originalFileName && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }} display="block">
                              File: {submission.originalFileName}
                            </Typography>
                          )}
                        </div>
                      }
                    />
                  </ListItem>
                  {index < submissions.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default React.memo(SubmissionGrading);

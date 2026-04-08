import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import { validateScore } from './gradingUtils';

const GradeDialog = ({
  open,
  onClose,
  onSubmit,
  submission,
  assignment,
  onDownloadFile,
}) => {
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const maxScore = assignment?.maxScore || 100;
  const isGraded = submission?.status?.toLowerCase() === 'graded';
  const hasSkill = assignment?.skillId || assignment?.skillName;

  // Reset form when dialog opens with new submission
  useEffect(() => {
    if (open && submission) {
      setScore(submission.score?.toString() || '');
      setFeedback(submission.feedback || '');
      setError(null);
    }
  }, [open, submission]);

  const handleScoreChange = (e) => {
    const value = e.target.value;
    setScore(value);
    
    // Real-time validation
    const validation = validateScore(value, maxScore);
    if (!validation.valid && value !== '') {
      setError(validation.error);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    const validation = validateScore(score, maxScore);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        score: validation.score,
        feedback: feedback.trim(),
      });
      onClose();
    } catch (err) {
      setError('Có lỗi xảy ra khi lưu điểm. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isGraded ? 'Sửa điểm' : 'Chấm điểm'} - {submission?.studentName}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Skill Info */}
          <Box sx={{ mb: 2 }}>
            {hasSkill ? (
              <Chip
                label={`Kỹ năng: ${assignment?.skillName || 'Đã gắn'}`}
                color="info"
                size="small"
                variant="outlined"
              />
            ) : (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                <Typography variant="body2">
                  Bài tập chưa gắn kỹ năng - Điểm sẽ không vào bảng điểm
                </Typography>
              </Alert>
            )}
          </Box>

          {/* Submission Content */}
          <Typography variant="subtitle2" gutterBottom>
            Bài nộp:
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mb: 3, 
              bgcolor: 'grey.50',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {submission?.content ? (
              <div dangerouslySetInnerHTML={{ __html: submission.content }} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                (Không có nội dung)
              </Typography>
            )}
          </Paper>

          {/* File Attachment */}
          {submission?.attachmentUrl ? (
            <Button
              variant="outlined"
              onClick={() => onDownloadFile(submission.submissionId, submission.originalFileName)}
              sx={{ mb: 3 }}
              size="small"
            >
              {submission.originalFileName || 'Tải file đính kèm'}
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              (Không có file đính kèm)
            </Typography>
          )}

          {/* Score Input */}
          <TextField
            label="Điểm số"
            type="number"
            value={score}
            onChange={handleScoreChange}
            fullWidth
            required
            error={!!error}
            helperText={error || `Tối đa: ${maxScore} điểm`}
            inputProps={{
              min: 0,
              max: maxScore,
              step: 0.5,
            }}
            sx={{ mb: 2 }}
            disabled={submitting}
          />

          {/* Feedback Input */}
          <TextField
            label="Nhận xét"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="Nhận xét về bài làm của học viên..."
            disabled={submitting}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Hủy
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={submitting || !!error || score === ''}
        >
          {submitting ? 'Đang lưu...' : 'Lưu điểm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradeDialog;

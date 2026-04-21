import React, { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {
  getStatusColor,
  getStatusLabel,
  getScoreColor,
  formatDateTime,
} from './gradingUtils';

const FILTERS = {
  ALL: 'all',
  PENDING: 'pending',
  GRADED: 'graded',
  LATE: 'late',
};

const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
  SCORE_HIGH: 'score_high',
  SCORE_LOW: 'score_low',
};

const SubmissionGrading = ({
  selectedAssignment,
  submissions,
  stats,
  onBack,
  onOpenGradeDialog,
  onDownloadFile,
  onFilterChange,
  loading,
}) => {
  // Stats from BE
  const { 
    gradedCount = 0, 
    pendingCount = 0, 
    lateCount = 0, 
    total = 0, 
    averageScore = "0" 
  } = stats || {};
  
  // Filter, search, sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);

  // Map filter to API status param
  const getApiStatus = (filter) => {
    switch (filter) {
      case FILTERS.PENDING: return 'Submitted';
      case FILTERS.GRADED: return 'Graded';
      case FILTERS.LATE: return 'Late';
      default: return null;
    }
  };

  // Map sort to API params
  const getApiSort = (sort) => {
    switch (sort) {
      case SORT_OPTIONS.NEWEST: return { sortBy: 'submittedAt', sortOrder: 'desc' };
      case SORT_OPTIONS.OLDEST: return { sortBy: 'submittedAt', sortOrder: 'asc' };
      case SORT_OPTIONS.NAME_ASC: return { sortBy: 'studentName', sortOrder: 'asc' };
      case SORT_OPTIONS.NAME_DESC: return { sortBy: 'studentName', sortOrder: 'desc' };
      case SORT_OPTIONS.SCORE_HIGH: return { sortBy: 'score', sortOrder: 'desc' };
      case SORT_OPTIONS.SCORE_LOW: return { sortBy: 'score', sortOrder: 'asc' };
      default: return { sortBy: 'submittedAt', sortOrder: 'desc' };
    }
  };

  // Call API when filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const apiFilters = {
        status: getApiStatus(activeFilter),
        search: searchQuery.trim() || null,
        ...getApiSort(sortBy),
      };
      onFilterChange?.(apiFilters);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeFilter, sortBy, onFilterChange]);


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
          <Typography variant="h6" fontWeight="600">{total}</Typography>
        </Box>
        <Box sx={{ borderLeft: 1, borderColor: 'divider', pl: 2 }}>
          <Typography variant="caption" color="text.secondary">Đã chấm</Typography>
          <Typography variant="h6" fontWeight="600" color="success.main">
            {gradedCount}
          </Typography>
        </Box>
        <Box sx={{ borderLeft: 1, borderColor: 'divider', pl: 2 }}>
          <Typography variant="caption" color="text.secondary">Chờ chấm</Typography>
          <Typography variant="h6" fontWeight="600" color="warning.main">
            {pendingCount}
          </Typography>
        </Box>
        <Box sx={{ borderLeft: 1, borderColor: 'divider', pl: 2 }}>
          <Typography variant="caption" color="text.secondary">Điểm TB</Typography>
          <Typography variant="h6" fontWeight="600" color="primary.main">
            {averageScore}
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

      {/* Search and Filter Toolbar - always visible */}
      <Paper sx={{ p: 2, mb: 2, ...(loading && { opacity: 0.7 }) }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Tìm học viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
            sx={{ minWidth: 200, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          {/* Sort */}
          <FormControl size="small" sx={{ minWidth: 140 }} disabled={loading}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
            >
              <MenuItem value={SORT_OPTIONS.NEWEST}>Mới nhất</MenuItem>
              <MenuItem value={SORT_OPTIONS.OLDEST}>Cũ nhất</MenuItem>
              <MenuItem value={SORT_OPTIONS.NAME_ASC}>Tên A-Z</MenuItem>
              <MenuItem value={SORT_OPTIONS.NAME_DESC}>Tên Z-A</MenuItem>
              <MenuItem value={SORT_OPTIONS.SCORE_HIGH}>Điểm cao → thấp</MenuItem>
              <MenuItem value={SORT_OPTIONS.SCORE_LOW}>Điểm thấp → cao</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* Filter Chips */}
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`Tất cả (${total})`}
            onClick={() => !loading && setActiveFilter(FILTERS.ALL)}
            color={activeFilter === FILTERS.ALL ? 'primary' : 'default'}
            variant={activeFilter === FILTERS.ALL ? 'filled' : 'outlined'}
            sx={{ cursor: loading ? 'default' : 'pointer', ...(loading && { opacity: 0.6 }) }}
          />
          <Chip
            label={`Chưa chấm (${pendingCount})`}
            onClick={() => !loading && setActiveFilter(FILTERS.PENDING)}
            color={activeFilter === FILTERS.PENDING ? 'warning' : 'default'}
            variant={activeFilter === FILTERS.PENDING ? 'filled' : 'outlined'}
            sx={{ cursor: loading ? 'default' : 'pointer', ...(loading && { opacity: 0.6 }) }}
          />
          <Chip
            label={`Đã chấm (${gradedCount})`}
            onClick={() => !loading && setActiveFilter(FILTERS.GRADED)}
            color={activeFilter === FILTERS.GRADED ? 'success' : 'default'}
            variant={activeFilter === FILTERS.GRADED ? 'filled' : 'outlined'}
            sx={{ cursor: loading ? 'default' : 'pointer', ...(loading && { opacity: 0.6 }) }}
          />
          {lateCount > 0 && (
            <Chip
              label={`Nộp muộn (${lateCount})`}
              onClick={() => !loading && setActiveFilter(FILTERS.LATE)}
              color={activeFilter === FILTERS.LATE ? 'error' : 'default'}
              variant={activeFilter === FILTERS.LATE ? 'filled' : 'outlined'}
              sx={{ cursor: loading ? 'default' : 'pointer', ...(loading && { opacity: 0.6 }) }}
            />
          )}
        </Stack>
      </Paper>

      {submissions.length === 0 ? (
        <Alert severity="info">
          {searchQuery ? 'Không tìm thấy bài nộp phù hợp.' : 'Chưa có học viên nào nộp bài.'}
        </Alert>
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

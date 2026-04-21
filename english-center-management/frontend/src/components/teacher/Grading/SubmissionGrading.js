import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {
  getStatusColor,
  getStatusLabel,
  getScoreColor,
  formatDateTime,
} from './gradingUtils';

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
  totalPages: propTotalPages,
}) => {
  // Stats from BE
  const { 
    gradedCount = 0, 
    pendingCount = 0, 
    lateCount = 0, 
    total = 0, 
    averageScore = "0" 
  } = stats || {};
  
  // Search, sort, status states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = propTotalPages || 1;

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

  // Call API when search/sort/status changes (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const apiFilters = {
        search: searchQuery.trim() || null,
        status: statusFilter === 'all' ? null : statusFilter,
        ...getApiSort(sortBy),
        page,
        pageSize,
      };
      onFilterChange?.(apiFilters);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, sortBy, statusFilter, page, pageSize, onFilterChange]);

  // Reset page when search/status changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);


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
          
          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }} disabled={loading}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              <MenuItem value="Submitted">Chưa chấm</MenuItem>
              <MenuItem value="Graded">Đã chấm</MenuItem>
              <MenuItem value="Late">Nộp muộn</MenuItem>
            </Select>
          </FormControl>
          
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
        
      </Paper>

      {submissions.length === 0 ? (
        <Alert severity="info">
          {searchQuery ? 'Không tìm thấy bài nộp phù hợp.' : 'Chưa có học viên nào nộp bài.'}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Học viên</TableCell>
                <TableCell>Ngày nộp</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="center">Điểm</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => {
                const isGraded = submission.status?.toLowerCase() === 'graded';
                const maxScore = selectedAssignment?.maxScore || 100;

                return (
                  <TableRow
                    key={submission.submissionId}
                    hover
                    sx={{
                      bgcolor: isGraded ? 'success.50' : 'background.paper',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {submission.studentName}
                      </Typography>
                      {submission.originalFileName && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          File: {submission.originalFileName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(submission.submittedAt)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(submission.status)}
                        size="small"
                        color={getStatusColor(submission.status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {isGraded ? (
                        <Chip
                          label={`${submission.score}/${maxScore}`}
                          color={getScoreColor(submission.score, maxScore)}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {submission.attachmentUrl && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => onDownloadFile(submission.submissionId, submission.originalFileName)}
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2, flexWrap: 'wrap' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
          disabled={loading}
        />
        <FormControl size="small" sx={{ minWidth: 80 }} disabled={loading}>
          <Select
            value={pageSize}
            onChange={(e) => {
              setPageSize(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default React.memo(SubmissionGrading);

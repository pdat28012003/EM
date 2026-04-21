import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Stack,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatDate } from './gradingUtils';

const SORT_OPTIONS = {
  NEWEST: 'newest',
  DUE_DATE: 'due_date',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
};

const AssignmentSelection = ({
  selectedClass,
  assignments,
  totalPages: propTotalPages,
  onBack,
  onSelectAssignment,
  onFilterChange,
  loading,
}) => {
  // Search, sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = propTotalPages || 1;

  // Map sort to API params
  const getApiSort = (sort) => {
    switch (sort) {
      case SORT_OPTIONS.DUE_DATE: return { sortBy: 'dueDate', sortOrder: 'asc' };
      case SORT_OPTIONS.NAME_ASC: return { sortBy: 'name', sortOrder: 'asc' };
      case SORT_OPTIONS.NAME_DESC: return { sortBy: 'name', sortOrder: 'desc' };
      default: return { sortBy: 'newest' };
    }
  };

  // Call API when search/sort changes (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const apiFilters = {
        search: searchQuery.trim() || null,
        ...getApiSort(sortBy),
        page,
        pageSize,
      };
      onFilterChange?.(apiFilters);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, sortBy, page, pageSize, onFilterChange]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);


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

      {/* Search and Filter Toolbar - always visible */}
      <Paper sx={{ p: 2, mb: 2, ...(loading && { opacity: 0.7 }) }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Tìm bài tập..."
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
              <MenuItem value={SORT_OPTIONS.DUE_DATE}>Hạn nộp</MenuItem>
              <MenuItem value={SORT_OPTIONS.NAME_ASC}>Tên A-Z</MenuItem>
              <MenuItem value={SORT_OPTIONS.NAME_DESC}>Tên Z-A</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
      </Paper>

      {assignments.length === 0 ? (
        <Alert severity="info">
          {searchQuery ? 'Không tìm thấy bài tập phù hợp.' : 'Lớp này chưa có bài tập nào.'}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bài tập</TableCell>
                <TableCell>Hạn nộp</TableCell>
                <TableCell>Kỹ năng</TableCell>
                <TableCell align="center">Bài nộp</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => {
                const submissionsCount = assignment.submissionsCount || 0;
                const gradedCount = assignment.gradedCount || 0;
                const pendingCount = submissionsCount - gradedCount;
                const isFullyGraded = submissionsCount > 0 && pendingCount === 0;
                const hasSkill = assignment.skillId || assignment.skillName;

                return (
                  <TableRow
                    key={assignment.assignmentId}
                    hover
                    sx={{
                      cursor: 'pointer',
                      ...(isFullyGraded && { backgroundColor: 'success.50' }),
                      ...(!hasSkill && { backgroundColor: 'warning.50' }),
                    }}
                    onClick={() => onSelectAssignment(assignment)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {assignment.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Điểm tối đa: {assignment.maxScore || 100}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(assignment.dueDate)}</TableCell>
                    <TableCell>
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
                            label="Chưa gắn"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={submissionsCount}
                        size="small"
                        color={submissionsCount > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Chip
                          label={`${gradedCount} đã chấm`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                        {pendingCount > 0 && (
                          <Chip
                            label={`${pendingCount} chờ`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAssignment(assignment);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
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

export default React.memo(AssignmentSelection);

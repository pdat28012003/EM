import React, { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { formatDate } from './gradingUtils';

const FILTERS = {
  ALL: 'all',
  HAS_SUBMISSIONS: 'has_submissions',
  FULLY_GRADED: 'fully_graded',
  PENDING: 'pending',
  NO_SKILL: 'no_skill',
};

const SORT_OPTIONS = {
  NEWEST: 'newest',
  DUE_DATE: 'due_date',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
};

const AssignmentSelection = ({
  selectedClass,
  assignments,
  onBack,
  onSelectAssignment,
  onFilterChange,
  loading,
}) => {
  // Filter, search, sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);

  // Map filter to API params
  const getApiFilters = (filter) => {
    switch (filter) {
      case FILTERS.HAS_SUBMISSIONS: return { hasSubmissions: true };
      case FILTERS.FULLY_GRADED: return { fullyGraded: true };
      case FILTERS.PENDING: return { hasPending: true };
      case FILTERS.NO_SKILL: return { skillId: 0 };
      default: return {};
    }
  };

  // Map sort to API params
  const getApiSort = (sort) => {
    switch (sort) {
      case SORT_OPTIONS.DUE_DATE: return { sortBy: 'dueDate', sortOrder: 'asc' };
      case SORT_OPTIONS.NAME_ASC: return { sortBy: 'name', sortOrder: 'asc' };
      case SORT_OPTIONS.NAME_DESC: return { sortBy: 'name', sortOrder: 'desc' };
      default: return { sortBy: 'newest' };
    }
  };

  // Call API when filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const apiFilters = {
        search: searchQuery.trim() || null,
        ...getApiFilters(activeFilter),
        ...getApiSort(sortBy),
      };
      onFilterChange?.(apiFilters);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeFilter, sortBy, onFilterChange]);

  // Count for display
  const hasSubmissionsCount = assignments.filter(a => (a.submissionsCount || 0) > 0).length;
  const fullyGradedCount = assignments.filter(a => {
    const subs = a.submissionsCount || 0;
    const graded = a.gradedCount || 0;
    return subs > 0 && subs === graded;
  }).length;
  const pendingCount = assignments.filter(a => {
    const subs = a.submissionsCount || 0;
    const graded = a.gradedCount || 0;
    return subs > graded;
  }).length;
  const noSkillCount = assignments.filter(a => !a.skillId && !a.skillName).length;

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
        
        {/* Filter Chips */}
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`Tất cả (${assignments.length})`}
            onClick={() => !loading && setActiveFilter(FILTERS.ALL)}
            color={activeFilter === FILTERS.ALL ? 'primary' : 'default'}
            variant={activeFilter === FILTERS.ALL ? 'filled' : 'outlined'}
            sx={{ cursor: loading ? 'default' : 'pointer', ...(loading && { opacity: 0.6 }) }}
          />
          <Chip
            label={`Có bài nộp (${hasSubmissionsCount})`}
            onClick={() => !loading && setActiveFilter(FILTERS.HAS_SUBMISSIONS)}
            color={activeFilter === FILTERS.HAS_SUBMISSIONS ? 'primary' : 'default'}
            variant={activeFilter === FILTERS.HAS_SUBMISSIONS ? 'filled' : 'outlined'}
            sx={{ cursor: loading ? 'default' : 'pointer', ...(loading && { opacity: 0.6 }) }}
          />
          <Chip
            label={`Chấm xong (${fullyGradedCount})`}
            onClick={() => !loading && setActiveFilter(FILTERS.FULLY_GRADED)}
            color={activeFilter === FILTERS.FULLY_GRADED ? 'success' : 'default'}
            variant={activeFilter === FILTERS.FULLY_GRADED ? 'filled' : 'outlined'}
            sx={{ cursor: loading ? 'default' : 'pointer', ...(loading && { opacity: 0.6 }) }}
          />
          {pendingCount > 0 && (
            <Chip
              label={`Chờ chấm (${pendingCount})`}
              onClick={() => !loading && setActiveFilter(FILTERS.PENDING)}
              color={activeFilter === FILTERS.PENDING ? 'warning' : 'default'}
              variant={activeFilter === FILTERS.PENDING ? 'filled' : 'outlined'}
              sx={{ cursor: loading ? 'default' : 'pointer', ...(loading && { opacity: 0.6 }) }}
            />
          )}
          {noSkillCount > 0 && (
            <Chip
              label={`Chưa gắn kỹ năng (${noSkillCount})`}
              onClick={() => !loading && setActiveFilter(FILTERS.NO_SKILL)}
              color={activeFilter === FILTERS.NO_SKILL ? 'error' : 'default'}
              variant={activeFilter === FILTERS.NO_SKILL ? 'filled' : 'outlined'}
              sx={{ cursor: loading ? 'default' : 'pointer', ...(loading && { opacity: 0.6 }) }}
            />
          )}
        </Stack>
      </Paper>

      {assignments.length === 0 ? (
        <Alert severity="info">
          {searchQuery ? 'Không tìm thấy bài tập phù hợp.' : 'Lớp này chưa có bài tập nào.'}
        </Alert>
      ) : (
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
      )}
    </Box>
  );
};

export default React.memo(AssignmentSelection);

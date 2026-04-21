import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";

import {
  People,
  Class,
  Assessment,
  Search,
  Clear,
  Visibility,
  GridView,
  TableRows,
  School
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { curriculumAPI } from "../../../services/api";
import { useAsyncLoading } from "../../../hooks/useDocuments";

const TeacherClasses = () => {
  const [allClasses, setAllClasses] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  
  // Sử dụng custom hook cho loading
  const { initialLoading, startLoading, stopLoading } = useAsyncLoading();
  
  // Control bar filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'Ended' | 'Completed' | 'Cancelled'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Click stats to filter
  const [statFilter, setStatFilter] = useState(null);

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'Đang hoạt động';
      case 'completed': return 'Đã hoàn thành';
      case 'ended': return 'Đã kết thúc';
      case 'cancelled': return 'Đã hủy';
      case 'draft': return 'Bản nháp';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    if (status === "Active") return "success";
    if (status === "Completed") return "info";
    if (status === "Ended") return "error";
    if (status === "Upcoming") return "warning";
    if (status === "Draft") return "default";
    return "default";
  };

  const navigate = useNavigate();

  const handleViewClassDetail = (classItem) => {
    // Navigate to class detail page
    navigate(`/teacher/curriculums/${classItem.classId}`);
  };
  
  const loadTeacherClasses = useCallback(async (teacherId) => {
    try {
      startLoading(true);
      // Load all classes, filter client-side for SaaS dashboard experience
      const response = await curriculumAPI.getCurriculumsByTeacher(teacherId);
      const curriculumsData = response.data || [];
      const mappedClasses = Array.isArray(curriculumsData) 
        ? curriculumsData.map(c => ({
            classId: c.curriculumId,
            className: c.curriculumName,
            courseName: c.courseName,
            startDate: c.startDate,
            endDate: c.endDate,
            status: c.status,
            room: c.roomName,
            teacherName: c.teacherName,
            currentStudents: c.currentStudents || 0,
            maxStudents: c.maxStudents || 0
          }))
        : [];
      setAllClasses(mappedClasses);
    } catch (error) {
      console.error("Error loading classes:", error);
      setAllClasses([]);
    } finally {
      stopLoading(true);
    }
  }, [startLoading, stopLoading]);

  // Load once on mount
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.teacherId || parsedUser.userId) {
        loadTeacherClasses(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, [loadTeacherClasses]);

  // Comprehensive client-side filtering
  const filteredClasses = React.useMemo(() => {
    let filtered = [...allClasses];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.className?.toLowerCase().includes(term) ||
        c.courseName?.toLowerCase().includes(term) ||
        c.room?.toLowerCase().includes(term)
      );
    }
    
    // Status filter (from dropdown or stat click)
    const effectiveStatus = statFilter || statusFilter;
    if (effectiveStatus && effectiveStatus !== 'all') {
      filtered = filtered.filter(c => c.status === effectiveStatus);
    }
    
    // Date range filter
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start || end) {
      filtered = filtered.filter(c => {
        const classStart = new Date(c.startDate);
        const classEnd = new Date(c.endDate || c.startDate);
        if (start && classEnd < start) return false;
        if (end && classStart > end) return false;
        return true;
      });
    }
    
    return filtered;
  }, [allClasses, searchTerm, statusFilter, statFilter, startDate, endDate]);

  const stats = {
    total: allClasses.length,
    active: allClasses.filter(c => c.status === 'Active').length,
    ended: allClasses.filter(c => ['Ended', 'Completed', 'Cancelled'].includes(c.status)).length,
    students: allClasses.reduce((sum, c) => sum + (c.currentStudents || 0), 0)
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setStatFilter(null);
  };

  const handleStatClick = (statType) => {
    setStatFilter(statType === statFilter ? null : statType);
  };

  const ClassCard = ({ classItem }) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: 'pointer', 
        '&:hover': { 
          transform: 'translateY(-4px)',
          boxShadow: 6 
        },
        transition: 'all 0.3s ease'
      }} 
      onClick={() => handleViewClassDetail(classItem)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
              {classItem.className}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {classItem.courseName}
            </Typography>
          </Box>
          <Chip
            label={getStatusText(classItem.status)}
            color={getStatusColor(classItem.status)}
            size="small"
          />
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Giáo viên:</strong> {classItem.teacherName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Phòng:</strong> {classItem.room}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Thời gian:</strong> {formatDate(classItem.startDate)} - {formatDate(classItem.endDate)}
          </Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Sĩ số:</strong> {classItem.currentStudents}{classItem.maxStudents > 0 ? `/${classItem.maxStudents}` : ''}
          </Typography>
          {classItem.maxStudents > 0 && (
            <LinearProgress
              variant="determinate"
              value={Math.min((classItem.currentStudents / classItem.maxStudents) * 100, 100)}
              sx={{ height: 8, borderRadius: 5 }}
            />
          )}
        </Box>

       
      </CardContent>
    </Card>
  );

  // Loading skeleton - chỉ hiện lần đầu
  if (initialLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Class Skeleton */}
        <Skeleton variant="rounded" height={120} sx={{ mb: 3, borderRadius: 3 }} />
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 4 }} />
        <Grid container spacing={3} mb={4}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} />
      </Container>
    );
  }

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || startDate || endDate || statFilter;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" mb={1}>
          Quản Lý Khóa Học
        </Typography>
        <Typography color="text.secondary">
          Quản lý các khóa học bạn đang giảng dạy
        </Typography>
      </Box>

      {/* Stats Cards - Clickable */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} md={3}>
          <Card 
            onClick={() => handleStatClick(null)}
            sx={{ 
              cursor: 'pointer',
              bgcolor: statFilter === null ? 'primary.50' : 'background.paper',
              border: statFilter === null ? 2 : 0,
              borderColor: 'primary.main',
              '&:hover': { boxShadow: 4 }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <School sx={{ fontSize: 32, color: "#1976d2", opacity: 0.8 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">{stats.total}</Typography>
                  <Typography variant="caption" color="text.secondary">Tổng khóa học</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card 
            onClick={() => handleStatClick('Active')}
            sx={{ 
              cursor: 'pointer',
              bgcolor: statFilter === 'Active' ? 'success.50' : 'background.paper',
              border: statFilter === 'Active' ? 2 : 0,
              borderColor: 'success.main',
              '&:hover': { boxShadow: 4 }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Class sx={{ fontSize: 32, color: "#2e7d32", opacity: 0.8 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">{stats.active}</Typography>
                  <Typography variant="caption" color="text.secondary">Đang hoạt động</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card 
            onClick={() => handleStatClick('Ended')}
            sx={{ 
              cursor: 'pointer',
              bgcolor: statFilter === 'Ended' ? 'error.50' : 'background.paper',
              border: statFilter === 'Ended' ? 2 : 0,
              borderColor: 'error.main',
              '&:hover': { boxShadow: 4 }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Assessment sx={{ fontSize: 32, color: "#d32f2f", opacity: 0.8 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">{stats.ended}</Typography>
                  <Typography variant="caption" color="text.secondary">Đã kết thúc</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <People sx={{ fontSize: 32, color: "#ed6c02", opacity: 0.8 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">{stats.students}</Typography>
                  <Typography variant="caption" color="text.secondary">Tổng học viên</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Control Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {/* Search */}
          <TextField
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 250, flex: 1 }}
            size="small"
          />

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Trạng thái"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="Active">Đang hoạt động</MenuItem>
              <MenuItem value="Ended">Đã kết thúc</MenuItem>
            </Select>
          </FormControl>

          {/* Date Range */}
          <TextField
            type="date"
            label="Từ"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ width: 140 }}
          />
          <TextField
            type="date"
            label="Đến"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ width: 140 }}
          />

          {/* View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newValue) => newValue && setViewMode(newValue)}
            size="small"
          >
            <ToggleButton value="table">
              <TableRows fontSize="small" />
            </ToggleButton>
            <ToggleButton value="grid">
              <GridView fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={clearAllFilters}
              startIcon={<Clear />}
            >
              Xóa lọc
            </Button>
          )}
        </Box>
      </Paper>

      {/* Results Count */}
      <Box mb={2} display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          Hiển thị <strong>{filteredClasses.length}</strong> / {allClasses.length} khóa học
        </Typography>
      </Box>

      {/* Content */}
      {filteredClasses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <School sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Không tìm thấy khóa học nào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
          </Typography>
          {hasActiveFilters && (
            <Button variant="contained" onClick={clearAllFilters}>
              Xóa tất cả bộ lọc
            </Button>
          )}
        </Paper>
      ) : viewMode === 'table' ? (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell>Khóa học</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Sĩ số</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Phòng</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClasses.map((classItem) => (
                <TableRow 
                  key={classItem.classId}
                  hover
                  onClick={() => handleViewClassDetail(classItem)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {classItem.className}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {classItem.courseName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(classItem.status)}
                      color={getStatusColor(classItem.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ minWidth: 100 }}>
                      <Typography variant="body2">
                        {classItem.currentStudents}{classItem.maxStudents > 0 ? `/${classItem.maxStudents}` : ''} HV
                      </Typography>
                      {classItem.maxStudents > 0 && (
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((classItem.currentStudents / classItem.maxStudents) * 100, 100)}
                          sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(classItem.startDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      đến {formatDate(classItem.endDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{classItem.room}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewClassDetail(classItem);
                      }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={3}>
          {filteredClasses.map((classItem) => (
            <Grid item xs={12} sm={6} md={4} key={classItem.classId}>
              <ClassCard classItem={classItem} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default TeacherClasses;

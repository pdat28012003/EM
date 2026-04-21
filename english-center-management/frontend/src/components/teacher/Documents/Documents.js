import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  IconButton,
  Chip,
  TextField,
  FormControl,
  Select,
  Skeleton,
  Tooltip,
  Fade,
  MenuItem,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Download,
  Visibility,
  FilterList,
  MenuBook,
  School,
  CalendarToday,
  PlayCircleOutline,
  VolumeUp,
  Slideshow,
  Assignment
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { documentsAPI, curriculumAPI } from '../../../services/api';
import { useAsyncLoading } from '../../../hooks/useDocuments';

const Documents = () => {
  const [teacher, setTeacher] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCurriculum, setFilterCurriculum] = useState('all');
  const [filterDate, setFilterDate] = useState(null);
  const [curriculums, setCurriculums] = useState([]);
  const [actionLoading, setActionLoading] = useState({}); // Map: { [id]: boolean }

  // Sử dụng custom hook cho loading
  const {
    initialLoading,
    loading,
    startLoading,
    stopLoading,
    getAbortSignal,
    useDebounce
  } = useAsyncLoading({ debounceDelay: 500 });

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm);

  // Initial load - chỉ load curriculums, documents sẽ load ở effect dưới
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setTeacher(parsedUser);
      if (parsedUser.teacherId || parsedUser.userId) {
        loadCurriculums(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, []);

  // Normalize document data từ backend
  const normalizeDocuments = (docs) => {
    if (!Array.isArray(docs)) return [];
    return docs.map(doc => ({
      ...doc,
      id: doc.documentId ?? doc.DocumentId ?? doc.id // Chuẩn hóa ID
    }));
  };

  // Load documents với AbortController từ hook
  const loadDocuments = useCallback(async (teacherId) => {
    const signal = getAbortSignal();
    const isFirstLoad = initialLoading;

    startLoading(isFirstLoad);

    try {
      const params = {
        search: debouncedSearch,
        type: filterType !== 'all' ? filterType : undefined,
        curriculumId: filterCurriculum !== 'all' ? filterCurriculum : undefined,
        date: filterDate ? filterDate.format('YYYY-MM-DD') : undefined
      };

      const response = await documentsAPI.getTeacherDocuments(teacherId, params, { signal });

      const rawData = response.data?.data || response.data || [];
      const normalized = normalizeDocuments(rawData);
      setDocuments(normalized);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      stopLoading(isFirstLoad);
    }
  }, [debouncedSearch, filterType, filterCurriculum, filterDate, initialLoading, startLoading, stopLoading, getAbortSignal]);

  // Gọi API khi teacher hoặc filters thay đổi
  useEffect(() => {
    if (!teacher) return;
    loadDocuments(teacher.teacherId || teacher.userId);
  }, [teacher, loadDocuments]);

  const loadCurriculums = async (teacherId) => {
    try {
      const response = await curriculumAPI.getCurriculumsByTeacher(teacherId);
      const curriculumsData = response.data?.data || response.data || [];
      setCurriculums(Array.isArray(curriculumsData) ? curriculumsData : []);
    } catch (error) {
      console.error('Error loading curriculums:', error);
      setCurriculums([]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'material':
        return 'Tài liệu';
      case 'exercise':
        return 'Bài tập';
      case 'presentation':
        return 'Trình chiếu';
      case 'audio':
        return 'Audio';
      case 'video':
        return 'Video';
      default:
        return 'Khác';
    }
  };


  const canPreviewFile = (doc) => {
    const fileName = doc.originalFileName || doc.fileName || '';
    // Fix: Check file có extension không
    const ext = fileName.includes('.')
      ? fileName.split('.').pop().toLowerCase()
      : '';
    const previewableExts = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'mp3', 'wav'];
    return previewableExts.includes(ext);
  };

  // Helper để set loading state cho 1 doc
  const setDocLoading = (id, isLoading) => {
    setActionLoading(prev => {
      if (isLoading) {
        return { ...prev, [id]: true };
      } else {
        const next = { ...prev };
        delete next[id];
        return next;
      }
    });
  };

  const handleDownload = async (doc) => {
    const id = doc.id; // Đã được normalize
    if (!id) {
      console.error('Missing document ID');
      return;
    }
    setDocLoading(id, true);
    try {
      const response = await documentsAPI.download(id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.originalFileName || doc.fileName || 'download';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setDocLoading(id, false);
    }
  };

  const handleView = async (doc) => {
    const id = doc.id; // Đã được normalize
    if (!id) {
      console.error('Missing document ID');
      return;
    }
    if (!canPreviewFile(doc)) {
      // Nếu không preview được, tải về luôn
      handleDownload(doc);
      return;
    }
    setDocLoading(id, true);
    try {
      const response = await documentsAPI.download(id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
    } finally {
      setDocLoading(id, false);
    }
  };



  // Skeleton full chỉ hiển thị lần đầu
  if (initialLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header Shimmer */}
        <Paper sx={{ p: 4, borderRadius: 3, mb: 4, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Skeleton variant="rounded" width={60} height={60} sx={{ borderRadius: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={250} height={45} sx={{ mb: 1 }} />
                <Skeleton variant="text" width={180} height={24} />
              </Box>
              <Skeleton variant="text" width={60} height={60} />
            </Box>
          </Paper>
          
          {/* Filter Bar Shimmer */}
          <Paper sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: '#f8fafc' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><Skeleton variant="rounded" height={40} sx={{ borderRadius: 2 }} /></Grid>
              <Grid item xs={6} md={2}><Skeleton variant="rounded" height={40} sx={{ borderRadius: 2 }} /></Grid>
              <Grid item xs={6} md={3}><Skeleton variant="rounded" height={40} sx={{ borderRadius: 2 }} /></Grid>
              <Grid item xs={6} md={2}><Skeleton variant="rounded" height={40} sx={{ borderRadius: 2 }} /></Grid>
              <Grid item xs={6} md={1}><Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 2, mx: 'auto' }} /></Grid>
            </Grid>
          </Paper>
          
          {/* Results Count Shimmer */}
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width={100} height={24} />
          </Box>
          
          {/* Shimmer Cards Grid */}
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Paper sx={{ borderRadius: 3, overflow: 'hidden', height: 280 }}>
                  {/* Icon area shimmer */}
                  <Box sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'center', bgcolor: '#f1f5f9' }}>
                    <Skeleton variant="rounded" width={64} height={64} sx={{ borderRadius: 2 }} />
                  </Box>
                  {/* Content shimmer */}
                  <Box sx={{ p: 2.5 }}>
                    <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1.5 }} />
                    <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: 4, mb: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Skeleton variant="text" width={50} height={18} />
                      <Skeleton variant="text" width={60} height={18} />
                    </Box>
                  </Box>
                  {/* Buttons shimmer */}
                  <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                    <Skeleton variant="rounded" height={32} sx={{ flex: 1, borderRadius: 2 }} />
                    <Skeleton variant="rounded" height={32} sx={{ flex: 1, borderRadius: 2 }} />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          {/* Shimmer Animation CSS */}
          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>
        </Container>
      );
    }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Modern Header */}
          <Box sx={{ mb: 4 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Decorative circles */}
              <Box sx={{ 
                position: 'absolute', 
                top: -50, 
                right: -50, 
                width: 200, 
                height: 200, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255,255,255,0.05)' 
              }} />
              <Box sx={{ 
                position: 'absolute', 
                bottom: -30, 
                right: 100, 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255,255,255,0.03)' 
              }} />
              
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <MenuBook sx={{ fontSize: 40 }} />
                  </Box>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '-0.5px' }}>
                      Thư viện tài liệu
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.85, fontWeight: 400 }}>
                      Tra cứu và tải tài liệu giảng dạy • {teacher?.fullName || 'Giáo viên'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, opacity: 0.3, lineHeight: 1 }}>
                    {documents.length}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Tài liệu
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Modern Filter Bar với Soft Loading Overlay */}
          <Box sx={{ position: 'relative' }}>
            <Paper elevation={0} sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="🔍 Tìm kiếm tài liệu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    disabled={loading} // Disable khi soft loading
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white',
                        borderRadius: 2,
                        '& fieldset': { borderColor: '#cbd5e1' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      displayEmpty
                      disabled={loading} // Disable khi soft loading
                      sx={{ bgcolor: 'white', borderRadius: 2 }}
                    >
                      <MenuItem value="all">📁 Tất cả loại</MenuItem>
                      <MenuItem value="material">📖 Giáo trình</MenuItem>
                      <MenuItem value="exercise">✏️ Bài tập</MenuItem>
                      <MenuItem value="presentation">📊 Trình chiếu</MenuItem>
                      <MenuItem value="video">🎥 Video</MenuItem>
                      <MenuItem value="audio">🎵 Audio</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filterCurriculum}
                      onChange={(e) => setFilterCurriculum(e.target.value)}
                      displayEmpty
                      disabled={loading} // Disable khi soft loading
                      sx={{ bgcolor: 'white', borderRadius: 2 }}
                    >
                      <MenuItem value="all">🏫 Tất cả chương trình</MenuItem>
                      {curriculums.map(curr => (
                        <MenuItem key={curr.curriculumId} value={curr.curriculumId}>
                          {curr.curriculumName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <DatePicker
                    label="📅 Ngày tải"
                    value={filterDate}
                    onChange={setFilterDate}
                    format="DD/MM/YYYY"
                    disabled={loading} // Disable khi soft loading
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        sx: { bgcolor: 'white', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={1}>
                  <Tooltip title="Xóa bộ lọc">
                    <IconButton
                      onClick={() => {
                        setSearchTerm('');
                        setFilterType('all');
                        setFilterCurriculum('all');
                        setFilterDate(null);
                      }}
                      disabled={loading} // Disable khi soft loading
                      sx={{
                        bgcolor: 'white',
                        border: '1px solid #e2e8f0',
                        '&:hover': { bgcolor: '#f1f5f9' }
                      }}
                    >
                      <FilterList />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </Paper>

            {/* Soft Loading Overlay - chỉ hiện khi loading (không phải initial) */}
            {loading && !initialLoading && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.7)',
                borderRadius: 2,
                zIndex: 1
              }}>
                <CircularProgress size={28} />
              </Box>
            )}
          </Box>

          {/* Results Count */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {documents.length} tài liệu
            </Typography>
            {(searchTerm || filterType !== 'all' || filterCurriculum !== 'all' || filterDate) && (
              <Chip 
                label="Đã lọc" 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ height: 24 }}
              />
            )}
          </Box>

          {/* Soft Loading Bar - chỉ hiện khi filter change */}
          {loading && !initialLoading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress sx={{ borderRadius: 1, height: 2 }} />
            </Box>
          )}

          {/* Documents Grid */}
          <Box sx={{ opacity: loading && !initialLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {documents.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc' }}>
              <Box sx={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'rgba(99, 102, 241, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}>
                <MenuBook sx={{ fontSize: 60, color: '#6366f1' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                Chưa có tài liệu nào
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {documents.map((document, index) => {
                const typeColors = {
                  material: { bg: '#dbeafe', icon: '#3b82f6', iconComponent: MenuBook },
                  exercise: { bg: '#dcfce7', icon: '#22c55e', iconComponent: Assignment },
                  presentation: { bg: '#fef3c7', icon: '#f59e0b', iconComponent: Slideshow },
                  video: { bg: '#fce7f3', icon: '#ec4899', iconComponent: PlayCircleOutline },
                  audio: { bg: '#e0e7ff', icon: '#6366f1', iconComponent: VolumeUp },
                };
                const typeConfig = typeColors[document.type] || typeColors.material;
                const TypeIcon = typeConfig.iconComponent;
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={document.id || index}>
                    <Fade in timeout={300 + index * 50}>
                      <Card 
                        sx={{ 
                          borderRadius: 3, 
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            transform: 'translateY(-4px)'
                          },
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        {/* File Icon Header */}
                        <Box sx={{ 
                          p: 3, 
                          pb: 2,
                          display: 'flex', 
                          justifyContent: 'center',
                          bgcolor: typeConfig.bg,
                          borderRadius: '12px 12px 0 0'
                        }}>
                          <Box sx={{ 
                            width: 64, 
                            height: 64, 
                            borderRadius: 2, 
                            bgcolor: 'white',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}>
                            <TypeIcon sx={{ fontSize: 32, color: typeConfig.icon }} />
                          </Box>
                        </Box>
                        
                        <CardContent sx={{ flex: 1, p: 2.5 }}>
                          {/* File Name */}
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#1e293b',
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.4,
                              minHeight: 44
                            }}
                            title={document.originalFileName}
                          >
                            {document.originalFileName}
                          </Typography>
                          
                          {/* Type Chip */}
                          <Chip 
                            label={getTypeLabel(document.type)} 
                            size="small"
                            sx={{ 
                              bgcolor: typeConfig.bg,
                              color: typeConfig.icon,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              mb: 1.5,
                              border: 'none'
                            }}
                          />
                          
                          {/* Curriculum */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <School sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {document.curriculumName || 'Dùng chung'}
                            </Typography>
                          </Box>
                          
                          {/* Meta Info */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(document.fileSize)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarToday sx={{ fontSize: 12, color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.disabled">
                                {new Date(document.uploadDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                        
                        {/* Action Buttons */}
                        <Box sx={{ 
                          p: 2, 
                          pt: 0,
                          display: 'flex', 
                          gap: 1
                        }}>
                          {canPreviewFile(document) ? (
                            <>
                              <Button
                                fullWidth
                                size="small"
                                variant="outlined"
                                startIcon={actionLoading[document.id] ? <CircularProgress size={16} /> : <Visibility sx={{ fontSize: 18 }} />}
                                onClick={() => handleView(document)}
                                disabled={actionLoading[document.id]}
                                sx={{ 
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.8rem'
                                }}
                              >
                                {actionLoading[document.id] ? 'Đang tải...' : 'Xem'}
                              </Button>
                              <Button
                                fullWidth
                                size="small"
                                variant="contained"
                                startIcon={actionLoading[document.id] ? <CircularProgress size={16} color="inherit" /> : <Download sx={{ fontSize: 18 }} />}
                                onClick={() => handleDownload(document)}
                                disabled={actionLoading[document.id]}
                                sx={{ 
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  bgcolor: typeConfig.icon,
                                  '&:hover': { bgcolor: typeConfig.icon, opacity: 0.9 }
                                }}
                              >
                                {actionLoading[document.id] ? 'Đang tải...' : 'Tải'}
                              </Button>
                            </>
                          ) : (
                            <Button
                              fullWidth
                              size="small"
                              variant="contained"
                              startIcon={actionLoading[document.id] ? <CircularProgress size={16} color="inherit" /> : <Download sx={{ fontSize: 18 }} />}
                              onClick={() => handleDownload(document)}
                              disabled={!!actionLoading[document.id]}
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                bgcolor: typeConfig.icon,
                                '&:hover': { bgcolor: typeConfig.icon, opacity: 0.9 }
                              }}
                            >
                              {actionLoading[document.id] ? 'Đang tải...' : 'Tải về'}
                            </Button>
                          )}
                        </Box>
                      </Card>
                    </Fade>
                  </Grid>
                );
              })}
            </Grid>
          )}
          </Box>

        </Container>
      </LocalizationProvider>
    );
  };

export default Documents;

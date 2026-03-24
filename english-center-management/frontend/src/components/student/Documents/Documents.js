import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Description,
  Search,
  Download,
  Visibility,
  FilterList,
  PictureAsPdf,
  VideoLibrary,
  AudioFile,
  Image,
  InsertDriveFile
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { documentsAPI, classesAPI } from '../../../services/api';

const Documents = () => {
  const [student, setStudent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterDate, setFilterDate] = useState(null);
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setStudent(parsedUser);
      if (parsedUser.studentId || parsedUser.userId) {
        loadDocuments(parsedUser.studentId || parsedUser.userId);
        loadClasses(parsedUser.studentId || parsedUser.userId);
      }
    }
  }, []);

  useEffect(() => {
    if (student) {
      loadDocuments(student.studentId || student.userId);
    }
  }, [searchTerm, filterType, filterClass, filterDate]);

  const loadDocuments = async (studentId) => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        type: filterType !== 'all' ? filterType : undefined,
        classId: filterClass !== 'all' ? filterClass : undefined,
        date: filterDate ? filterDate.format('YYYY-MM-DD') : undefined
      };
      
      const response = await documentsAPI.getStudentDocuments(studentId, params);
      const documentsData = response.data?.data || response.data || [];
      
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async (studentId) => {
    try {
      // Get student's enrolled classes
      const response = await classesAPI.getStudentClasses(studentId);
      const classesData = response.data?.data || response.data || [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#f44336' }} />;
      case 'docx':
      case 'doc':
        return <Description sx={{ color: '#2196f3' }} />;
      case 'mp3':
      case 'wav':
        return <AudioFile sx={{ color: '#ff9800' }} />;
      case 'mp4':
      case 'avi':
        return <VideoLibrary sx={{ color: '#4caf50' }} />;
      case 'pptx':
      case 'ppt':
        return <InsertDriveFile sx={{ color: '#9c27b0' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image sx={{ color: '#e91e63' }} />;
      default:
        return <InsertDriveFile sx={{ color: '#607d8b' }} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'material':
        return 'primary';
      case 'exercise':
        return 'success';
      case 'presentation':
        return 'warning';
      case 'audio':
        return 'info';
      case 'video':
        return 'secondary';
      default:
        return 'default';
    }
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (document) => {
    try {
      const response = await documentsAPI.download(document.documentId);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.originalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleView = async (document) => {
    try {
      const response = await documentsAPI.download(document.documentId);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography>Đang tải tài liệu...</Typography>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <IconButton 
                color="inherit" 
                onClick={() => navigate('/student/dashboard')}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
              >
                <Description />
              </IconButton>
              <Avatar
                sx={{ 
                  width: 60, 
                  height: 60, 
                  border: '3px solid rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }}
                src={student?.avatar}
              >
                {student?.fullName?.charAt(0) || 'S'}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Tài liệu học tập
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {student?.fullName || 'Học viên'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: '#4caf50', p: 1, borderRadius: 1, bgcolor: 'rgba(76,175,80,0.1)' }}>
                    <Description sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {documents.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Tổng tài liệu
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: '#2196f3', p: 1, borderRadius: 1, bgcolor: 'rgba(33,150,243,0.1)' }}>
                    <Download sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {documents.reduce((sum, doc) => sum + doc.downloadCount, 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Lượt tải
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: '#ff9800', p: 1, borderRadius: 1, bgcolor: 'rgba(255,152,0,0.1)' }}>
                    <Visibility sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {classes.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Lớp học
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: '#9c27b0', p: 1, borderRadius: 1, bgcolor: 'rgba(156,39,176,0.1)' }}>
                    <Search sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {documents.filter(d => d.uploadDate === new Date().toISOString().split('T')[0]).length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Hôm nay
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Loại tài liệu</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Loại tài liệu"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="material">Tài liệu</MenuItem>
                <MenuItem value="exercise">Bài tập</MenuItem>
                <MenuItem value="presentation">Trình chiếu</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="video">Video</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Lớp học</InputLabel>
              <Select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                label="Lớp học"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls.classId} value={cls.classId}>
                    {cls.className}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <DatePicker
              label="Ngày tải lên"
              value={filterDate}
              onChange={setFilterDate}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterClass('all');
                setFilterDate(null);
              }}
              fullWidth
            >
              Xóa bộ lọc
            </Button>
          </Grid>
        </Grid>

        {/* Documents Table */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Danh sách tài liệu
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tên tài liệu</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Loại</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Lớp học</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Giáo viên</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Kích thước</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ngày tải</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Lượt tải</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="textSecondary">
                            Chưa có tài liệu nào
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Giáo viên của bạn sẽ tải tài liệu lên sớm
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      documents.map((document) => (
                        <TableRow key={document.documentId} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {getFileIcon(document.fileName.split('.').pop().toLowerCase())}
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {document.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {document.description}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getTypeLabel(document.type)} 
                              color={getTypeColor(document.type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{document.className}</TableCell>
                          <TableCell>{document.teacherName}</TableCell>
                          <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                          <TableCell>{document.uploadDate}</TableCell>
                          <TableCell>{document.downloadCount}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Xem">
                                <IconButton
                                  size="small"
                                  onClick={() => handleView(document)}
                                  sx={{ color: '#1976d2' }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Tải xuống">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownload(document)}
                                  sx={{ color: '#4caf50' }}
                                >
                                  <Download />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default Documents;

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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Fab
} from '@mui/material';
import {
  Description,
  Search,
  CloudUpload,
  Download,
  Delete,
  Edit,
  Visibility,
  FilterList,
  Add,
  Folder,
  InsertDriveFile,
  PictureAsPdf,
  VideoLibrary,
  AudioFile,
  Image,
  MoreVert
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { documentsAPI, classesAPI } from '../../../services/api';
import DocumentEditDialog from '../../../hooks/DocumentEditDialog';

const Documents = () => {
  const [teacher, setTeacher] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterDate, setFilterDate] = useState(null);
  const [classes, setClasses] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentForm, setDocumentForm] = useState({
    title: '',
    description: '',
    classId: '',
    type: 'material'
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setTeacher(parsedUser);
      if (parsedUser.teacherId || parsedUser.userId) {
        loadDocuments(parsedUser.teacherId || parsedUser.userId);
        loadClasses(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, []);

  useEffect(() => {
    if (teacher) {
      loadDocuments(teacher.teacherId || teacher.userId);
    }
  }, [searchTerm, filterType, filterClass, filterDate]);

  const loadDocuments = async (teacherId) => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        type: filterType !== 'all' ? filterType : undefined,
        classId: filterClass !== 'all' ? filterClass : undefined,
        date: filterDate ? filterDate.format('YYYY-MM-DD') : undefined
      };
      
      const response = await documentsAPI.getTeacherDocuments(teacherId, params);
      const documentsData = response.data?.data || response.data || [];
      
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async (teacherId) => {
    try {
      const response = await classesAPI.getAll({ teacherId });
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

  const handleMenuOpen = (event, document) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

const handleDownload = async (doc) => {
  try {
    const response = await documentsAPI.download(doc.documentId);

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const link = window.document.createElement('a');
    link.href = url;
    link.download = doc.originalFileName || doc.title;

    window.document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading document:', error);
    alert('Có lỗi xảy ra khi tải tài liệu');
  } finally {
    handleMenuClose();
  }
};
const handleView = async (doc) => {
  try {
    const response = await documentsAPI.download(doc.documentId);

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    window.open(url, '_blank');
  } catch (error) {
    console.error('Error viewing document:', error);
    alert('Có lỗi xảy ra khi xem tài liệu');
  } finally {
    handleMenuClose();
  }
};

  const handleEdit = (document) => {
    setEditingDocument(document);
    setDocumentForm({
      title: document.title || '',
      description: document.description || '',
      classId: document.classId || '',
      type: document.type || 'material'
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

const handleDelete = async (doc) => {
  if (!window.confirm('Bạn có chắc muốn xóa tài liệu này?')) return;

  try {
    await documentsAPI.delete(doc.documentId);

    setDocuments(prev => prev.filter(d => d.documentId !== doc.documentId));
  } catch (error) {
    console.error('Error deleting document:', error);
    alert('Xóa thất bại');
  } finally {
    handleMenuClose();
  }
};

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingDocument(null);
    setDocumentForm({
      title: '',
      description: '',
      classId: '',
      type: 'material'
    });
  };

  const handleEditSave = async () => {
    if (!editingDocument) return;

    try {
      const updateData = {
        title: documentForm.title,
        description: documentForm.description,
        type: documentForm.type,
        classId: documentForm.classId ? parseInt(documentForm.classId) : null
      };

      await documentsAPI.update(editingDocument.documentId, updateData);

      alert('Cập nhật thành công');

      // reload list
      loadDocuments(teacher.teacherId || teacher.userId);

      handleEditClose();
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Cập nhật thất bại');
    }
  };

  const handleUploadOpen = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadClose = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDocumentForm({
      title: '',
      description: '',
      classId: '',
      type: 'material'
    });
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

const handleUpload = async () => {
  if (!selectedFile) return;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', documentForm.title);
    formData.append('description', documentForm.description);
    formData.append('classId', documentForm.classId);
    formData.append('type', documentForm.type);
    formData.append('teacherId', teacher.teacherId || teacher.userId);

    await documentsAPI.upload(formData);

    alert('Upload thành công');

    // reload list
    loadDocuments(teacher.teacherId || teacher.userId);

    handleUploadClose();
  } catch (error) {
    console.error('Error uploading:', error);
    alert('Upload thất bại');
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <IconButton 
                  color="inherit" 
                  onClick={() => navigate('/teacher/dashboard')}
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
                  src={teacher?.avatar}
                >
                  {teacher?.fullName?.charAt(0) || 'T'}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    Quản lý tài liệu
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    {teacher?.fullName || 'Giáo viên'}
                  </Typography>
                </Box>
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
                  <Box sx={{ color: '#1976d2', p: 1, borderRadius: 1, bgcolor: 'rgba(25,118,210,0.1)' }}>
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
                  <Box sx={{ color: '#388e3c', p: 1, borderRadius: 1, bgcolor: 'rgba(56,142,60,0.1)' }}>
                    <CloudUpload sx={{ fontSize: 32 }} />
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
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: '#f57c00', p: 1, borderRadius: 1, bgcolor: 'rgba(245,124,0,0.1)' }}>
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
                  <Box sx={{ color: '#7c4dff', p: 1, borderRadius: 1, bgcolor: 'rgba(124,77,255,0.1)' }}>
                    <Folder sx={{ fontSize: 32 }} />
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
                      <TableCell sx={{ fontWeight: 'bold' }}>Kích thước</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ngày tải</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Lượt tải</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="textSecondary">
                            Chưa có tài liệu nào
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Tải lên tài liệu đầu tiên của bạn
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      documents.map((document) => (
                       <TableRow key={document.documentId} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {getFileIcon(document.fileType)}
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
                          <TableCell>{document.fileSize}</TableCell>
                          <TableCell>{document.uploadDate}</TableCell>
                          <TableCell>{document.downloadCount}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, document)}
                            >
                              <MoreVert />
                            </IconButton>
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

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="upload"
          onClick={handleUploadOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <CloudUpload />
        </Fab>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleView(selectedDocument)}>
            <Visibility sx={{ mr: 1 }} />
            Xem
          </MenuItem>
          <MenuItem onClick={() => handleDownload(selectedDocument)}>
            <Download sx={{ mr: 1 }} />
            Tải xuống
          </MenuItem>
          <MenuItem onClick={() => handleEdit(selectedDocument)}>
            <Edit sx={{ mr: 1 }} />
            Chỉnh sửa
          </MenuItem>
          <MenuItem onClick={() => handleDelete(selectedDocument)} sx={{ color: 'error' }}>
            <Delete sx={{ mr: 1 }} />
            Xóa
          </MenuItem>
        </Menu>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onClose={handleUploadClose} maxWidth="sm" fullWidth>
          <DialogTitle>Tải lên tài liệu mới</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Tên tài liệu"
                value={documentForm.title}
                onChange={(e) => setDocumentForm(prev => ({ ...prev, title: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Mô tả"
                value={documentForm.description}
                onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Loại tài liệu</InputLabel>
                <Select
                  value={documentForm.type}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, type: e.target.value }))}
                  label="Loại tài liệu"
                >
                  <MenuItem value="material">Tài liệu</MenuItem>
                  <MenuItem value="exercise">Bài tập</MenuItem>
                  <MenuItem value="presentation">Trình chiếu</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Lớp học</InputLabel>
                <Select
                  value={documentForm.classId}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, classId: e.target.value }))}
                  label="Lớp học"
                >
                  {classes.map(cls => (
                    <MenuItem key={cls.classId} value={cls.classId}>
                      {cls.className}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2 }}
              >
                Chọn file
                <input
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                />
              </Button>
              {selectedFile && (
                <Typography variant="body2" color="textSecondary">
                  File đã chọn: {selectedFile.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUploadClose}>Hủy</Button>
            <Button onClick={handleUpload} variant="contained" disabled={!selectedFile || !documentForm.title}>
              Tải lên
            </Button>
          </DialogActions>
        </Dialog>
        {/* Edit Dialog */}
        <DocumentEditDialog
          open={editDialogOpen}
          onClose={handleEditClose}
          onSave={handleEditSave}
          documentForm={documentForm}
          setDocumentForm={setDocumentForm}
          classes={classes}
          dialogTitle="Chỉnh sửa tài liệu"
        />
      </Container>
    </LocalizationProvider>
  );
};

export default Documents;

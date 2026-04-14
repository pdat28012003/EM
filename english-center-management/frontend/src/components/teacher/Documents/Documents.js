/* eslint-disable react-hooks/exhaustive-deps */
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
  Select
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
import { documentsAPI, curriculumAPI } from '../../../services/api';
import DocumentEditDialog from '../../../hooks/DocumentEditDialog';

const Documents = () => {
  const [teacher, setTeacher] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCurriculum, setFilterCurriculum] = useState('all');
  const [filterDate, setFilterDate] = useState(null);
  const [curriculums, setCurriculums] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentForm, setDocumentForm] = useState({
    curriculumId: '',
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
        loadCurriculums(parsedUser.teacherId || parsedUser.userId);
        loadDocuments(parsedUser.teacherId || parsedUser.userId);
      }
    }
  }, []);

  useEffect(() => {
    if (teacher) {
      loadDocuments(teacher.teacherId || teacher.userId);
    }
  }, [searchTerm, filterType, filterCurriculum, filterDate]);

  const loadDocuments = async (teacherId) => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        type: filterType !== 'all' ? filterType : undefined,
        curriculumId: filterCurriculum !== 'all' ? filterCurriculum : undefined,
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

  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const getFileExtension = (doc) => {
    if (!doc) return 'unknown';
    if (doc.fileType) return doc.fileType.toLowerCase();
    const fileName = doc.originalFileName || doc.fileName;
    if (fileName && fileName.includes('.')) return fileName.split('.').pop().toLowerCase();
    return 'unknown';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (doc) => {
    const fileType = typeof doc === 'string' ? doc.toLowerCase() : getFileExtension(doc);
    switch (fileType) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#ef4444', fontSize: 32 }} />;
      case 'docx':
      case 'doc':
        return <Description sx={{ color: '#3b82f6', fontSize: 32 }} />;
      case 'mp3':
      case 'wav':
        return <AudioFile sx={{ color: '#f59e0b', fontSize: 32 }} />;
      case 'mp4':
      case 'avi':
        return <VideoLibrary sx={{ color: '#8b5cf6', fontSize: 32 }} />;
      case 'pptx':
      case 'ppt':
        return <InsertDriveFile sx={{ color: '#d946ef', fontSize: 32 }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image sx={{ color: '#10b981', fontSize: 32 }} />;
      default:
        return <InsertDriveFile sx={{ color: '#64748b', fontSize: 32 }} />;
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
    const response = await documentsAPI.download(doc.DocumentId);

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
      curriculumId: document.curriculumId || '',
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
      curriculumId: '',
      type: 'material'
    });
  };

  const handleEditSave = async () => {
    if (!editingDocument) return;

    try {
      const updateData = {
        type: documentForm.type,
        curriculumId: documentForm.curriculumId ? parseInt(documentForm.curriculumId) : null
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
      curriculumId: '',
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
    formData.append('curriculumId', documentForm.curriculumId);
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
                      {documents.filter(d => d.UploadDate === new Date().toISOString().split('T')[0]).length}
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
                      {documents.reduce((sum, doc) => sum + (doc.DownloadCount || 0), 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Lượt tải
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
       
        </Grid>

        {/* Filters and Search */}
        {/* Filters and Search */}
        <Box sx={{ mb: 4 }}>
          {/* Filter Chips */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'material', label: 'Giáo trình' },
              { value: 'exercise', label: 'Bài tập' },
              { value: 'presentation', label: 'Trình chiếu' },
              { value: 'video', label: 'Video bài giảng' },
              { value: 'audio', label: 'Audio' }
            ].map(ft => (
              <Chip
                key={ft.value}
                label={ft.label}
                onClick={() => setFilterType(ft.value)}
                sx={{ 
                  fontWeight: filterType === ft.value ? 600 : 500,
                  bgcolor: filterType === ft.value ? '#10b981' : 'transparent',
                  color: filterType === ft.value ? 'white' : 'text.primary',
                  border: filterType === ft.value ? 'none' : '1px solid #cbd5e1',
                  '&:hover': { bgcolor: filterType === ft.value ? '#059669' : 'rgba(16, 185, 129, 0.1)' }
                }}
              />
            ))}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm tài liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Chương trình</InputLabel>
                <Select
                  value={filterCurriculum}
                  onChange={(e) => setFilterCurriculum(e.target.value)}
                  label="Chương trình"
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {curriculums.map(curr => (
                    <MenuItem key={curr.curriculumId} value={curr.curriculumId}>
                      {curr.curriculumName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Ngày tải lên"
                value={filterDate}
                onChange={setFilterDate}
                format="DD/MM/YYYY"
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterCurriculum('all');
                  setFilterDate(null);
                }}
                fullWidth
                sx={{ height: 40 }}
              >
                Xóa bộ lọc
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Documents Table */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Danh sách tài liệu
                </Typography>
                
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tên file</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Loại</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Chương trình</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Dung lượng</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Ngày tải</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Lượt tải</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Thao tác</TableCell>
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
                      documents.map((document, index) => (
                        <TableRow key={document.documentId || index} hover sx={{ '& td': { py: 1.5 }, transition: '0.2s' }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {getFileIcon(document)}
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                  {document.originalFileName}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getTypeLabel(document.type)} 
                              color={getTypeColor(document.type)}
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell>{document.curriculumName || 'Dùng chung'}</TableCell>
                          <TableCell align="right">{formatFileSize(document.fileSize)}</TableCell>
                          <TableCell align="center">{new Date(document.uploadDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</TableCell>
                          <TableCell align="center">{document.downloadCount || 0}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, document)}
                              sx={{ '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}
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
                <InputLabel>Chương trình</InputLabel>
                <Select
                  value={documentForm.curriculumId}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, curriculumId: e.target.value }))}
                  label="Chương trình"
                >
                  {curriculums.map(curr => (
                    <MenuItem key={curr.curriculumId} value={curr.curriculumId}>
                      {curr.curriculumName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                sx={{ 
                  mb: 2, p: 4, 
                  border: '2px dashed', 
                  borderColor: dragActive ? '#10b981' : '#cbd5e1', 
                  borderRadius: 2, 
                  bgcolor: dragActive ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <CloudUpload sx={{ fontSize: 48, color: dragActive ? '#10b981' : '#94a3b8', mb: 1 }} />
                <Typography variant="body1" fontWeight={600} color={dragActive ? '#10b981' : '#475569'}>
                  Kéo thả file vào đây hoặc click để chọn
                </Typography>
                <Typography variant="caption" color="text.secondary" mt={1}>
                  Hỗ trợ: PDF, DOCX, MP4, MP3, JPG, PNG...
                </Typography>
                <input
                  id="file-upload"
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                />
              </Box>
              {selectedFile && (
                <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Description sx={{ color: '#16a34a' }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="#166534">
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="#166534">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUploadClose}>Hủy</Button>
            <Button onClick={handleUpload} variant="contained" disabled={!selectedFile}>
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
          curriculums={curriculums}
          dialogTitle="Chỉnh sửa tài liệu"
        />
      </Container>
    </LocalizationProvider>
  );
};

export default Documents;

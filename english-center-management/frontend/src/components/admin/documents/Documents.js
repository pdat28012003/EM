/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Grid,
  Fab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Description,
  Download,
  Visibility,
  Delete,
  Search,
  FilterList,
  PictureAsPdf,
  VideoLibrary,
  AudioFile,
  Image,
  InsertDriveFile,
  CloudUpload,
  Edit
} from '@mui/icons-material';
import { documentsAPI, curriculumAPI } from '../../../services/api';
import DocumentEditDialog from '../../../hooks/DocumentEditDialog';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [curriculums, setCurriculums] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCurriculum, setFilterCurriculum] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    type: 'material',
    curriculumId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    type: 'material',
    curriculumId: ''
  });
  const [editingDocument, setEditingDocument] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadDocuments();
    loadCurriculums();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadDocuments();
  }, [searchTerm, filterType, filterCurriculum, paginationModel.page, paginationModel.pageSize]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        type: filterType !== 'all' ? filterType : undefined,
        curriculumId: filterCurriculum !== 'all' ? filterCurriculum : undefined,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize
      };
      
      const response = await documentsAPI.getAll(params);
      const documentsData = response.data?.data || response.data || [];
      
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      setTotalCount(response.data?.totalCount || 0);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const loadCurriculums = async () => {
    try {
      const response = await curriculumAPI.getAll();
      const curriculumsData = response.data?.data || response.data || [];
      setCurriculums(Array.isArray(curriculumsData) ? curriculumsData : []);
    } catch (error) {
      console.error('Error loading curriculums:', error);
      setCurriculums([]);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#f44336', fontSize: 20 }} />;
      case 'docx':
      case 'doc':
        return <Description sx={{ color: '#2196f3', fontSize: 20 }} />;
      case 'mp3':
      case 'wav':
        return <AudioFile sx={{ color: '#ff9800', fontSize: 20 }} />;
      case 'mp4':
      case 'avi':
        return <VideoLibrary sx={{ color: '#4caf50', fontSize: 20 }} />;
      case 'pptx':
      case 'ppt':
        return <InsertDriveFile sx={{ color: '#9c27b0', fontSize: 20 }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image sx={{ color: '#e91e63', fontSize: 20 }} />;
      default:
        return <InsertDriveFile sx={{ color: '#607d8b', fontSize: 20 }} />;
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

const handleDownload = async (doc) => {
  try {
    const response = await documentsAPI.download(doc.documentId);
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const link = window.document.createElement('a'); // thêm window cho chắc
    link.href = url;
    link.download = doc.originalFileName;

    window.document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading document:', error);
    alert('Có lỗi xảy ra khi tải tài liệu');
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
  }
};

  const handleDelete = (document) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedDocument) {
      try {
        await documentsAPI.delete(selectedDocument.documentId);
        setDeleteDialogOpen(false);
        setSelectedDocument(null);
        loadDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Có lỗi xảy ra khi xóa tài liệu');
      }
    }
  };

  const handleEdit = (document) => {
    setEditingDocument(document);
    setEditFormData({
      type: document.type || 'material',
      curriculumId: document.curriculumId || document.classId || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingDocument(null);
    setEditFormData({
      type: 'material',
      curriculumId: ''
    });
  };

  const handleEditSave = async () => {
    if (!editingDocument) return;

    try {
      const updateData = {
        type: editFormData.type,
        curriculumId: editFormData.curriculumId ? parseInt(editFormData.curriculumId) : null
      };

      await documentsAPI.update(editingDocument.documentId, updateData);

      alert('Cập nhật thành công');
      loadDocuments();
      handleEditClose();
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Cập nhật thất bại');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCurriculum('all');
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleOpenUploadDialog = () => {
    setUploadFormData({
      type: 'material',
      curriculumId: ''
    });
    setSelectedFile(null);
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setUploadFormData({
      type: 'material',
      curriculumId: ''
    });
    setSelectedFile(null);
  };

  const handleUploadFormChange = (e) => {
    const { name, value } = e.target;
    setUploadFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file để tải lên');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', uploadFormData.type);
      formData.append('curriculumId', uploadFormData.curriculumId || '');
      
      await documentsAPI.upload(formData);
      handleCloseUploadDialog();
      loadDocuments();
      alert('Tải tài liệu lên thành công!');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tải tài liệu');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      field: 'originalFileName',
      headerName: 'Tên file',
      flex: 2.5,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          {getFileIcon(params.row.originalFileName?.split('.').pop().toLowerCase())}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {params.row.originalFileName}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Loại',
      width: 100,
      align: 'center',
      renderCell: (params) => (
        <Chip 
          label={getTypeLabel(params.row.type)} 
          color={getTypeColor(params.row.type)}
          size="small"
          sx={{ fontSize: '0.75rem', fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'curriculumName',
      headerName: 'Chương trình',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.row.curriculumName || params.row.className || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'fileSize',
      headerName: 'Dung lượng',
      width: 100,
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          {formatFileSize(params.row.fileSize)}
        </Typography>
      ),
    },
    {
      field: 'uploadDate',
      headerName: 'Ngày tải',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {new Date(params.row.uploadDate).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          })}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 140,
      sortable: false,
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Xem trước" arrow>
            <IconButton
              size="small"
              onClick={() => handleView(params.row)}
              sx={{ 
                color: '#1976d2',
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa" arrow>
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
              sx={{ 
                color: '#ff9800',
                '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.08)' }
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tải xuống" arrow>
            <IconButton
              size="small"
              onClick={() => handleDownload(params.row)}
              sx={{ 
                color: '#4caf50',
                '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.08)' }
              }}
            >
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa" arrow>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row)}
              sx={{ 
                color: '#f44336',
                '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.08)' }
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Quản lý tài liệu hệ thống
        </Typography>
        
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm kiếm tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
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
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={handleClearFilters}
              fullWidth
            >
              Xóa bộ lọc
            </Button>
          </Grid>
        </Grid>

        {/* Data Grid */}
        <Box sx={{ height: 650, width: '100%' }}>
          <DataGrid
            rows={documents}
            columns={columns}
            rowCount={totalCount}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            disableRowSelectionOnClick
            getRowId={(row) => row.documentId}
            sx={{
              border: '1px solid rgba(224, 224, 224, 1)',
              borderRadius: 1,
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid rgba(224, 224, 224, 1)',
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#2c3e50'
                }
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                },
                '&:nth-of-type(even)': {
                  backgroundColor: '#fafafa',
                }
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                padding: '8px 12px',
                '&:focus': {
                  outline: 'none'
                }
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid rgba(224, 224, 224, 1)',
                backgroundColor: '#f8f9fa',
              }
            }}
          />
        </Box>
      </Paper>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="upload"
        onClick={handleOpenUploadDialog}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#4caf50',
          '&:hover': {
            bgcolor: '#45a049'
          }
        }}
      >
        <CloudUpload />
      </Fab>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Tải lên tài liệu mới</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ p: 2, border: '2px dashed', borderColor: 'primary.main' }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body1">
                    {selectedFile ? selectedFile.name : 'Chọn file để tải lên'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PDF, DOC, PPT, Audio, Video, Images (Max: 50MB)
                  </Typography>
                </Box>
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp3,.mp4,.avi,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileSelect}
                />
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Loại tài liệu</InputLabel>
                <Select
                  name="type"
                  value={uploadFormData.type}
                  onChange={handleUploadFormChange}
                  label="Loại tài liệu"
                >
                  <MenuItem value="material">Tài liệu</MenuItem>
                  <MenuItem value="exercise">Bài tập</MenuItem>
                  <MenuItem value="presentation">Trình chiếu</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Chương trình (tùy chọn)</InputLabel>
                <Select
                  name="curriculumId"
                  value={uploadFormData.curriculumId}
                  onChange={handleUploadFormChange}
                  label="Chương trình"
                >
                  <MenuItem value="">Không gán chương trình</MenuItem>
                  {curriculums.map(curr => (
                    <MenuItem key={curr.curriculumId} value={curr.curriculumId}>
                      {curr.curriculumName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            Hủy
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={uploading}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
          >
            {uploading ? 'Đang tải...' : 'Tải lên'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa tài liệu</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa tài liệu "{selectedDocument?.originalFileName}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
      {/* Edit Dialog */}
      <DocumentEditDialog
        open={editDialogOpen}
        onClose={handleEditClose}
        onSave={handleEditSave}
        documentForm={editFormData}
        setDocumentForm={setEditFormData}
        curriculums={curriculums}
        dialogTitle="Chỉnh sửa tài liệu"
      />
    </Box>
  );
};

export default Documents;

import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const DocumentEditDialog = ({
  open,
  onClose,
  onSave,
  documentForm,
  setDocumentForm,
  classes,
  dialogTitle = 'Chỉnh sửa tài liệu'
}) => {
  const handleInputChange = (field) => (e) => {
    setDocumentForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Tên tài liệu"
            value={documentForm.title || ''}
            onChange={handleInputChange('title')}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Mô tả"
            value={documentForm.description || ''}
            onChange={handleInputChange('description')}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Loại tài liệu</InputLabel>
            <Select
              value={documentForm.type || 'material'}
              onChange={handleInputChange('type')}
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
              value={documentForm.classId || ''}
              onChange={handleInputChange('classId')}
              label="Lớp học"
            >
              <MenuItem value="">
                <em>Chọn lớp học</em>
              </MenuItem>
              {classes.map(cls => (
                <MenuItem key={cls.classId} value={cls.classId}>
                  {cls.className}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={onSave} variant="contained" disabled={!documentForm.title}>
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentEditDialog;

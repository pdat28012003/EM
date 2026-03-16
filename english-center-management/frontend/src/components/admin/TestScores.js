import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  MenuItem,
  Chip,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, School, Person } from '@mui/icons-material';
import { testScoresAPI, studentsAPI, classesAPI } from '../../services/api';

const TestScores = () => {
  const [testScores, setTestScores] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTestScore, setCurrentTestScore] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
    testDate: '',
    testType: 'Midterm',
    listeningScore: '',
    readingScore: '',
    writingScore: '',
    speakingScore: '',
    comments: '',
  });

  const testTypes = ['Quiz', 'Midterm', 'Final', 'Assignment'];

  useEffect(() => {
    loadData();
  }, [paginationModel]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [testScoresRes, studentsRes, classesRes] = await Promise.all([
        testScoresAPI.getAll({
          page: paginationModel.page + 1,
          pageSize: paginationModel.pageSize,
        }),
        studentsAPI.getAll({ isActive: true }),
        classesAPI.getAll({ status: 'Active' }),
      ]);
      
      const testScoresData = Array.isArray(testScoresRes.data?.data) ? testScoresRes.data.data : [];
      setTestScores(testScoresData);
      setStudents(Array.isArray(studentsRes.data?.data) ? studentsRes.data.data : []);
      setClasses(Array.isArray(classesRes.data?.data) ? classesRes.data.data : []);
      setRowCount(testScoresRes.data?.totalCount || testScoresData.length);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (testScore = null) => {
    if (testScore) {
      setEditMode(true);
      setCurrentTestScore(testScore);
      setFormData({
        studentId: testScore.studentId,
        classId: testScore.classId,
        testDate: testScore.testDate?.split('T')[0] || '',
        testType: testScore.testType,
        listeningScore: testScore.listeningScore,
        readingScore: testScore.readingScore,
        writingScore: testScore.writingScore,
        speakingScore: testScore.speakingScore,
        comments: testScore.comments || '',
      });
    } else {
      setEditMode(false);
      setCurrentTestScore(null);
      setFormData({
        studentId: '',
        classId: '',
        testDate: '',
        testType: 'Midterm',
        listeningScore: '',
        readingScore: '',
        writingScore: '',
        speakingScore: '',
        comments: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTotalScore = () => {
    const scores = [
      parseFloat(formData.listeningScore) || 0,
      parseFloat(formData.readingScore) || 0,
      parseFloat(formData.writingScore) || 0,
      parseFloat(formData.speakingScore) || 0,
    ];
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        listeningScore: parseFloat(formData.listeningScore) || 0,
        readingScore: parseFloat(formData.readingScore) || 0,
        writingScore: parseFloat(formData.writingScore) || 0,
        speakingScore: parseFloat(formData.speakingScore) || 0,
      };

      if (editMode) {
        await testScoresAPI.update(currentTestScore.testScoreId, submitData);
      } else {
        await testScoresAPI.create(submitData);
      }
      
      handleCloseDialog();
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      loadData();
    } catch (error) {
      console.error('Error saving test score:', error);
      alert('Có lỗi xảy ra khi lưu điểm thi');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa điểm thi này?')) {
      try {
        await testScoresAPI.delete(id);
        setPaginationModel(prev => ({ ...prev, page: 0 }));
        loadData();
      } catch (error) {
        console.error('Error deleting test score:', error);
        alert('Có lỗi xảy ra khi xóa điểm thi');
      }
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8.5) return 'success';
    if (score >= 7.0) return 'primary';
    if (score >= 5.5) return 'warning';
    return 'error';
  };

  const columns = [
    { field: 'testScoreId', headerName: 'ID', width: 70 },
    { field: 'studentName', headerName: 'Học Viên', width: 200 },
    { field: 'className', headerName: 'Lớp Học', width: 150 },
    {
      field: 'testDate',
      headerName: 'Ngày Thi',
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN'),
    },
    {
      field: 'testType',
      headerName: 'Loại Thi',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'Final' ? 'error' :
            params.value === 'Midterm' ? 'warning' :
            params.value === 'Quiz' ? 'info' : 'default'
          }
          size="small"
        />
      ),
    },
    {
      field: 'listeningScore',
      headerName: 'Nghe',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getScoreColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'readingScore',
      headerName: 'Đọc',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getScoreColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'writingScore',
      headerName: 'Viết',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getScoreColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'speakingScore',
      headerName: 'Nói',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getScoreColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'totalScore',
      headerName: 'Tổng',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getScoreColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao Tác',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
          >
            <Edit />
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.testScoreId)}
          >
            <Delete />
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản Lý Điểm Thi
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Điểm Thi
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={testScores}
          columns={columns}
          getRowId={(row) => row.testScoreId}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[1, 10, 25, 50]}
          rowCount={rowCount}
          paginationMode="server"
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Chỉnh Sửa Điểm Thi' : 'Thêm Điểm Thi Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="studentId"
                  label="Học Viên"
                  select
                  value={formData.studentId}
                  onChange={handleInputChange}
                  required
                  fullWidth
                >
                  {students.map((student) => (
                    <MenuItem key={student.studentId} value={student.studentId}>
                      {student.fullName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="classId"
                  label="Lớp Học"
                  select
                  value={formData.classId}
                  onChange={handleInputChange}
                  required
                  fullWidth
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls.classId} value={cls.classId}>
                      {cls.className}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="testDate"
                  label="Ngày Thi"
                  type="date"
                  value={formData.testDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="testType"
                  label="Loại Thi"
                  select
                  value={formData.testType}
                  onChange={handleInputChange}
                  required
                  fullWidth
                >
                  {testTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>
              Điểm Số (0-10)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="listeningScore"
                  label="Nghe"
                  type="number"
                  value={formData.listeningScore}
                  onChange={handleInputChange}
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="readingScore"
                  label="Đọc"
                  type="number"
                  value={formData.readingScore}
                  onChange={handleInputChange}
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="writingScore"
                  label="Viết"
                  type="number"
                  value={formData.writingScore}
                  onChange={handleInputChange}
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="speakingScore"
                  label="Nói"
                  type="number"
                  value={formData.speakingScore}
                  onChange={handleInputChange}
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>

            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h6" color="primary">
                Điểm Trung Bình: {calculateTotalScore()}
              </Typography>
            </Box>

            <TextField
              name="comments"
              label="Nhận Xét"
              value={formData.comments}
              onChange={handleInputChange}
              multiline
              rows={3}
              fullWidth
              placeholder="Nhận xét về bài thi..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Cập Nhật' : 'Thêm Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestScores;

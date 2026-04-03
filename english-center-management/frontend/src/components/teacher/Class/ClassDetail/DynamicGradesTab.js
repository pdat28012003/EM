import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import {
  Assessment,
  Assignment,
  TrendingUp,
  TrendingDown,
  School,
  Add,
  Edit,
  Delete,
  ExpandMore,
  Settings,
  Visibility
} from '@mui/icons-material';
import { classesAPI, assignmentsAPI, skillsAPI, gradesAPI } from '../../../../services/api';

export default function DynamicGradesTab({ classId, classInfo }) {
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addGradeDialogOpen, setAddGradeDialogOpen] = useState(false);
  const [editGradeDialogOpen, setEditGradeDialogOpen] = useState(false);
  const [viewStudentDetailDialogOpen, setViewStudentDetailDialogOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editStudentDialogOpen, setEditStudentDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [newGrade, setNewGrade] = useState({
    studentId: '',
    assignmentId: '',
    skillId: '',
    score: '',
    maxScore: '10',
    comments: ''
  });

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [studentsRes, assignmentsRes, skillsRes, gradesRes] = await Promise.all([
        classesAPI.getStudents(classId),
        assignmentsAPI.getAll({ classId }),
        skillsAPI.getAll(),
        gradesAPI.getByClass(classId)
      ]);

      const studentsData = studentsRes.data?.data || [];
      const assignmentsData = assignmentsRes.data?.data || [];
      const skillsData = Array.isArray(skillsRes.data) ? skillsRes.data : (skillsRes.data?.data || []);
      const gradesData = gradesRes.data || [];

      setStudents(studentsData);
      setAssignments(assignmentsData);
      setSkills(skillsData);
      setGrades(gradesData);

    } catch (error) {
      console.error('Error loading dynamic grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGrade = async () => {
    try {
      const gradeData = {
        studentId: parseInt(newGrade.studentId),
        assignmentId: parseInt(newGrade.assignmentId),
        skillId: parseInt(newGrade.skillId),
        score: parseFloat(newGrade.score) || 0,
        maxScore: parseFloat(newGrade.maxScore) || 10,
        comments: newGrade.comments
      };

      await gradesAPI.create(gradeData);
      setAddGradeDialogOpen(false);
      resetNewGrade();
      loadData();
    } catch (error) {
      console.error('Error adding grade:', error);
      alert('Lỗi khi thêm điểm: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditGrade = async () => {
    try {
      const updateData = {
        score: parseFloat(selectedGrade.score) || 0,
        comments: selectedGrade.comments
      };

      await gradesAPI.update(selectedGrade.gradeId, updateData);
      setEditGradeDialogOpen(false);
      setSelectedGrade(null);
      loadData();
    } catch (error) {
      console.error('Error updating grade:', error);
      alert('Lỗi khi cập nhật điểm: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa điểm này?')) {
      try {
        await gradesAPI.delete(gradeId);
        loadData();
      } catch (error) {
        console.error('Error deleting grade:', error);
        alert('Lỗi khi xóa điểm: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const resetNewGrade = () => {
    setNewGrade({
      studentId: '',
      assignmentId: '',
      skillId: '',
      score: '',
      maxScore: '10',
      comments: ''
    });
  };



  const getGradeColor = (score) => {
    if (score >= 8.5) return "success";
    if (score >= 7.0) return "warning";
    if (score >= 5.0) return "info";
    return "error";
  };



  // Group grades by assignment
  const gradesByAssignment = grades.reduce((acc, grade) => {
    if (!acc[grade.assignmentId]) {
      acc[grade.assignmentId] = {
        assignment: assignments.find(a => a.assignmentId === grade.assignmentId),
        grades: []
      };
    }
    acc[grade.assignmentId].grades.push(grade);
    return acc;
  }, {});

  // Calculate statistics for each student
  const studentStats = students.map(student => {
    const studentGrades = grades.filter(g => g.studentId === student.studentId);
    const averageScore = studentGrades.length > 0 
      ? studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length 
      : 0;
    
    const skillBreakdown = skills.map(skill => {
      const skillGrades = studentGrades.filter(g => g.skillId === skill.skillId);
      return {
        skillName: skill.name,
        averageScore: skillGrades.length > 0 
          ? skillGrades.reduce((sum, g) => sum + g.score, 0) / skillGrades.length 
          : 0,
        count: skillGrades.length
      };
    });

    return {
      studentId: student.studentId,
      studentName: student.fullName,
      averageScore: averageScore.toFixed(2),
      totalGrades: studentGrades.length,
      skillBreakdown
    };
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography ml={2}>Đang tải bảng điểm động...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Bảng điểm động - {classInfo?.className}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddGradeDialogOpen(true)}
        >
          Thêm điểm
        </Button>
      </Box>
    

      {/* Student Statistics */}
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
          Thống kê điểm theo học viên
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Họ tên</strong></TableCell>
                <TableCell align="center"><strong>Điểm TB</strong></TableCell>
                {skills.map((skill) => (
                  <TableCell align="center" key={skill.skillId}>
                    <strong>{skill.name}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {studentStats.map((stat) => (
                <TableRow key={stat.studentId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {stat.studentName}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={stat.averageScore}
                      color={getGradeColor(parseFloat(stat.averageScore))}
                      size="small"
                    />
                  </TableCell>
                  {stat.skillBreakdown.map((skill) => (
                    <TableCell align="center" key={skill.skillName}>
                      {skill.count > 0 ? (
                        <Typography
                          key={skill.skillId}
                          variant="body2"
                          sx={{
                            fontSize: '0.75rem',
                            color: getGradeColor(skill.averageScore),
                            mr: 0.5,
                            mb: 0.25
                          }}
                        >
                          {skill.name} {skill.averageScore.toFixed(1)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Grades by Assignment */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
          Chi tiết điểm theo bài tập
        </Typography>
        {Object.keys(gradesByAssignment).length === 0 ? (
          <Alert severity="info">
            Chưa có điểm nào cho lớp này
          </Alert>
        ) : (
          Object.values(gradesByAssignment).map(({ assignment, grades: assignmentGrades }) => (
            <Accordion key={assignment?.assignmentId} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Typography variant="subtitle1" fontWeight="medium">
                    {assignment?.title || 'Unknown Assignment'}
                  </Typography>
                  <Chip 
                    label={`${assignmentGrades.length} điểm`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Học viên</strong></TableCell>
                        <TableCell><strong>Kỹ năng</strong></TableCell>
                        <TableCell align="center"><strong>Điểm</strong></TableCell>
                        <TableCell align="center"><strong>Max</strong></TableCell>
                        <TableCell><strong>Ghi chú</strong></TableCell>
                        <TableCell align="center"><strong>Thao tác</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignmentGrades.map((grade) => (
                        <TableRow key={grade.gradeId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {grade.studentName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${grade.skillName}: ${grade.score.toFixed(1)}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={grade.score}
                              color={getGradeColor(grade.score)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {grade.maxScore}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {grade.comments || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={1} justifyContent="center">
                              <Tooltip title="Sửa">
                                <IconButton 
                                  size="small" 
                                  onClick={() => {
                                    setSelectedGrade(grade);
                                    setEditGradeDialogOpen(true);
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteGrade(grade.gradeId)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      {/* Add Grade Dialog */}
      <Dialog open={addGradeDialogOpen} onClose={() => setAddGradeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Thêm điểm mới</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Học viên</InputLabel>
                <Select
                  value={newGrade.studentId}
                  onChange={(e) => setNewGrade({ ...newGrade, studentId: e.target.value })}
                >
                  {students.map((student) => (
                    <MenuItem key={student.studentId} value={student.studentId}>
                      {student.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink id="assignment-label">Bài tập</InputLabel>
                <Select
                  labelId="assignment-label"
                  value={newGrade.assignmentId || ''}
                  onChange={(e) => setNewGrade({ ...newGrade, assignmentId: e.target.value || null })}
                  displayEmpty
                  label="Bài tập"
                >
                  <MenuItem value="">
                    <em>Không chọn</em>
                  </MenuItem>
                  {assignments.map((assignment) => (
                    <MenuItem key={assignment.assignmentId} value={assignment.assignmentId}>
                      {assignment.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Kỹ năng</InputLabel>
                <Select
                  value={newGrade.skillId}
                  onChange={(e) => setNewGrade({ ...newGrade, skillId: e.target.value })}
                >
                  {skills.map((skill) => (
                    <MenuItem key={skill.skillId} value={skill.skillId}>
                      {skill.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Điểm"
                value={newGrade.score}
                onChange={(e) => setNewGrade({ ...newGrade, score: e.target.value })}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Điểm tối đa"
                value={newGrade.maxScore}
                onChange={(e) => setNewGrade({ ...newGrade, maxScore: e.target.value })}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                value={newGrade.comments}
                onChange={(e) => setNewGrade({ ...newGrade, comments: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddGradeDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleAddGrade} variant="contained">
            Thêm điểm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Grade Dialog */}
      <Dialog open={editGradeDialogOpen} onClose={() => setEditGradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sửa điểm</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Học viên: {selectedGrade?.studentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bài tập: {selectedGrade?.assignmentTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kỹ năng: {selectedGrade?.skillName}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Điểm"
                value={selectedGrade?.score || ''}
                onChange={(e) => setSelectedGrade({ ...selectedGrade, score: e.target.value })}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                value={selectedGrade?.comments || ''}
                onChange={(e) => setSelectedGrade({ ...selectedGrade, comments: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGradeDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleEditGrade} variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Student Detail Dialog */}
      <Dialog open={viewStudentDetailDialogOpen} onClose={() => setViewStudentDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết điểm - {viewingStudent?.studentName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Điểm trung bình: {viewingStudent?.averageScore}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Tổng số điểm: {viewingStudent?.totalGrades}
            </Typography>
            
            <Box mt={3}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Chi tiết theo kỹ năng
              </Typography>
              {viewingStudent?.skillBreakdown?.map((skill) => (
                <Box key={skill.skillName} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1">{skill.skillName}</Typography>
                    <Chip
                      label={skill.count > 0 ? skill.averageScore.toFixed(1) : '-'}
                      color={skill.count > 0 ? getGradeColor(skill.averageScore) : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {skill.count > 0 ? `${skill.count} điểm` : 'Chưa có điểm'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewStudentDetailDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Student Grades Dialog */}
      <Dialog open={editStudentDialogOpen} onClose={() => setEditStudentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa điểm - {viewingStudent?.studentName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Chi tiết điểm theo kỹ năng
            </Typography>
            {viewingStudent?.skillBreakdown?.map((skill) => (
              <Box key={skill.skillName} sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body1" fontWeight="medium">{skill.skillName}</Typography>
                  <Chip
                    label={skill.count > 0 ? skill.averageScore.toFixed(1) : '-'}
                    color={skill.count > 0 ? getGradeColor(skill.averageScore) : 'default'}
                    size="small"
                  />
                </Box>
                {skill.count > 0 && (
                  <TextField
                    fullWidth
                    type="number"
                    label={`Nhập điểm ${skill.skillName}`}
                    defaultValue={skill.averageScore.toFixed(1)}
                    inputProps={{ min: 0, max: 10, step: 0.1 }}
                    size="small"
                  />
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStudentDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={() => setEditStudentDialogOpen(false)}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

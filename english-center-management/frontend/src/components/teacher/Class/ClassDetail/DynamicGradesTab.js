import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
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
  IconButton,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  Done,
  Close,
  Search,
  School
} from '@mui/icons-material';
import { assignmentsAPI, skillsAPI, gradesAPI, assignmentSkillsAPI, curriculumAPI } from '../../../../services/api';
import { useAsyncLoading } from '../../../../hooks/useDocuments';

// Normalize ID helper - đảm bảo so sánh number
const normId = (v) => Number(v);

export default function DynamicGradesTab({ curriculumId, curriculumInfo }) {
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [grades, setGrades] = useState([]);
  // assignmentSkills state local cho dialog (tránh global state)
  const [dialogAssignmentSkills, setDialogAssignmentSkills] = useState([]);
  
  // Sử dụng custom hook cho loading
  const { initialLoading, startLoading, stopLoading, getAbortSignal } = useAsyncLoading();
  const [addGradeDialogOpen, setAddGradeDialogOpen] = useState(false);
  const [editGradeDialogOpen, setEditGradeDialogOpen] = useState(false);
  const [viewStudentDetailDialogOpen, setViewStudentDetailDialogOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editStudentDialogOpen, setEditStudentDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  // Inline edit state dạng map để tránh re-render toàn table
  const [editingMap, setEditingMap] = useState({}); // { [gradeId]: { score: string, originalScore: number } }
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [minScoreFilter, setMinScoreFilter] = useState('');
  const [maxScoreFilter, setMaxScoreFilter] = useState('');
  
  // Debounced filter states
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedMinScore, setDebouncedMinScore] = useState('');
  const [debouncedMaxScore, setDebouncedMaxScore] = useState('');
  const [newGrade, setNewGrade] = useState({
    studentId: '',
    assignmentId: '',
    skillId: '',
    score: '',
    maxScore: '10',
    comments: ''
  });

  const theme = useTheme();

  const loadData = useCallback(async (filters = {}) => {
    const isFirstLoad = initialLoading;
    startLoading(isFirstLoad);
    
    if (!curriculumId) {
      stopLoading(isFirstLoad);
      return;
    }
    
    const signal = getAbortSignal();
    
    try {
      const [assignmentsRes, skillsRes, gradesRes, studentsRes] = await Promise.all([
        assignmentsAPI.getAll({ curriculumId, signal }),
        skillsAPI.getAll({ signal }),
        gradesAPI.getFiltered(curriculumId, { 
          ...filters, 
          signal
        }),
        curriculumAPI.getStudents(curriculumId, { signal })
      ]);

      const assignmentsData = assignmentsRes.data?.data || [];
      const skillsData = Array.isArray(skillsRes.data) ? skillsRes.data : (skillsRes.data?.data || []);
      const gradesData = gradesRes.data || [];
      const studentsData = studentsRes.data?.students || studentsRes.data?.data?.students || [];

      setAssignments(assignmentsData);
      setSkills(skillsData);
      setGrades(gradesData);
      setStudents(studentsData);

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading dynamic grades:', error);
      }
    } finally {
      stopLoading(isFirstLoad);
    }
  }, [curriculumId, initialLoading, startLoading, stopLoading, getAbortSignal]);

  // Chỉ reload grades sau CRUD - giữ cache students/assignments/skills
  const reloadGradesOnly = useCallback(async (filters = {}) => {
    try {
      const gradesRes = await gradesAPI.getFiltered(curriculumId, filters);
      setGrades(gradesRes.data || []);
    } catch (error) {
      console.error('Error reloading grades:', error);
    }
  }, [curriculumId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(studentSearch);
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [studentSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinScore(minScoreFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [minScoreFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMaxScore(maxScoreFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [maxScoreFilter]);

  // BE Filters: tất cả filter đều gọi API
  const filters = useMemo(() => ({
    studentName: debouncedSearch.trim() || undefined,
    assignmentType: assignmentTypeFilter !== 'all' ? assignmentTypeFilter : undefined,
    skillId: skillFilter !== 'all' ? parseInt(skillFilter) : undefined,
    minScore: debouncedMinScore ? parseFloat(debouncedMinScore) : undefined,
    maxScore: debouncedMaxScore ? parseFloat(debouncedMaxScore) : undefined
  }), [debouncedSearch, assignmentTypeFilter, skillFilter, debouncedMinScore, debouncedMaxScore]);

  // Gọi API khi filters đổi
  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  const handleAddGrade = async () => {
    // Validation
    if (!newGrade.studentId || !newGrade.assignmentId || !newGrade.skillId) {
      alert('Vui lòng chọn đầy đủ: Học viên, Bài tập, Kỹ năng');
      return;
    }
    if (!newGrade.score || isNaN(parseFloat(newGrade.score))) {
      alert('Vui lòng nhập điểm hợp lệ');
      return;
    }
    
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
      reloadGradesOnly(filters);
    } catch (error) {
      console.error('Error adding grade:', error);
      alert('Lỗi khi thêm điểm: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditGrade = async () => {
    if (!selectedGrade.score || isNaN(parseFloat(selectedGrade.score))) {
      alert('Vui lòng nhập điểm hợp lệ');
      return;
    }
    
    try {
      const updateData = {
        score: parseFloat(selectedGrade.score) || 0,
        comments: selectedGrade.comments
      };

      await gradesAPI.update(selectedGrade.gradeId, updateData);
      setEditGradeDialogOpen(false);
      setSelectedGrade(null);
      reloadGradesOnly(filters);
    } catch (error) {
      console.error('Error updating grade:', error);
      alert('Lỗi khi cập nhật điểm: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa điểm này?')) {
      try {
        await gradesAPI.delete(gradeId);
        reloadGradesOnly(filters);
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



  const assignmentTypes = useMemo(() => Array.from(
    new Set(
      assignments
        .map((assignment) => (assignment.type || assignment.Type || '').trim())
        .filter(Boolean)
    )
  ), [assignments]);

  // Normalize grades với id chuẩn (API đã filter)
  const normalizedGrades = useMemo(() => {
    return grades.map(g => ({
      ...g,
      studentId: normId(g.studentId),
      assignmentId: normId(g.assignmentId),
      skillId: normId(g.skillId)
    }));
  }, [grades]);

  // Grades đã được filter từ API
  const filteredGrades = normalizedGrades;



  // Pre-filter valid skills
  const validSkills = useMemo(() => skills.filter(s => s.skillId != null), [skills]);

  // Hiện tất cả students trong lớp
  const filteredStudents = useMemo(() => students, [students]);

  // Index grades by student - O(1) lookup
  const gradesByStudent = useMemo(() => {
    const map = {};
    for (const g of filteredGrades) {
      if (!map[g.studentId]) map[g.studentId] = [];
      map[g.studentId].push(g);
    }
    return map;
  }, [filteredGrades]);

  // Group grades by assignment - memoized
  const gradesByAssignment = useMemo(() => {
    const acc = {};
    const assignmentMap = {};
    assignments.forEach(a => {
      assignmentMap[a.assignmentId] = a;
    });

    for (const grade of filteredGrades) {
      if (!acc[grade.assignmentId]) {
        acc[grade.assignmentId] = {
          assignment: assignmentMap[grade.assignmentId],
          grades: []
        };
      }
      acc[grade.assignmentId].grades.push(grade);
    }
    return acc;
  }, [filteredGrades, assignments]);

  // Pre-index cho performance - tách riêng để memoize
  const { gradesByStudentSkill, studentAverages } = useMemo(() => {
    // Index by (studentId, skillId)
    const byStudentSkill = {};
    // Index by studentId cho average
    const byStudent = {};
    
    filteredGrades.forEach(g => {
      const studentId = normId(g.studentId);
      const skillId = normId(g.skillId);
      
      // By student-skill
      const key = `${studentId}_${skillId}`;
      if (!byStudentSkill[key]) byStudentSkill[key] = [];
      byStudentSkill[key].push(g);
      
      // By student only
      if (!byStudent[studentId]) byStudent[studentId] = [];
      byStudent[studentId].push(g);
    });
    
    // Pre-calculate averages
    const averages = {};
    Object.keys(byStudent).forEach(studentId => {
      const grades = byStudent[studentId];
      averages[studentId] = grades.length > 0
        ? grades.reduce((sum, g) => sum + (g.score ?? 0), 0) / grades.length
        : 0;
    });
    
    return { gradesByStudentSkill: byStudentSkill, studentAverages: averages };
  }, [filteredGrades]);

  // Calculate statistics - O(students × skills) nhưng lookup O(1)
  const studentStats = useMemo(() => {
    return filteredStudents.map(student => {
      const studentId = normId(student.studentId);
      const studentGrades = gradesByStudent[studentId] || [];
      const averageScore = studentAverages[studentId] || 0;

      const skillBreakdown = skills.map(skill => {
        const key = `${studentId}_${normId(skill.skillId)}`;
        const skillGrades = gradesByStudentSkill[key] || [];
        const skillAverage = skillGrades.length > 0
          ? skillGrades.reduce((sum, g) => sum + (g.score ?? 0), 0) / skillGrades.length
          : 0;
        return {
          skillId: skill.skillId,
          skillName: skill.name,
          averageScore: skillAverage,
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
  }, [filteredStudents, gradesByStudent, skills, gradesByStudentSkill, studentAverages]);

  const handleStartInlineEdit = useCallback((grade) => {
    setEditingMap(prev => ({
      ...prev,
      [grade.gradeId]: { score: String(grade.score), originalScore: grade.score }
    }));
  }, []);

  const handleCancelInlineEdit = useCallback((gradeId) => {
    setEditingMap(prev => {
      const newMap = { ...prev };
      delete newMap[gradeId];
      return newMap;
    });
  }, []);

  const [savingInlineId, setSavingInlineId] = useState(null); // Loading state cho inline edit

  const handleSaveInlineGrade = useCallback(async (grade, valueToSave) => {
    if (savingInlineId === grade.gradeId) return; // Prevent spam click
    
    try {
      const value = parseFloat(valueToSave);
      if (isNaN(value)) {
        alert('Điểm phải là số hợp lệ');
        return;
      }
      setSavingInlineId(grade.gradeId);
      await gradesAPI.update(grade.gradeId, { score: value });
      setEditingMap(prev => {
        const newMap = { ...prev };
        delete newMap[grade.gradeId];
        return newMap;
      });
      reloadGradesOnly(filters);
    } catch (err) {
      console.error('Error saving inline grade:', err);
      alert('Lỗi khi lưu điểm nhanh');
    } finally {
      setSavingInlineId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, savingInlineId]);

  // Skeleton loading component - chỉ hiện lần đầu
  if (initialLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Box display="flex" gap={2} mb={3}>
          <Skeleton variant="rectangular" width={200} height={40} />
          <Skeleton variant="rectangular" width={100} height={40} />
          <Skeleton variant="rectangular" width={100} height={40} />
        </Box>
        <Grid container spacing={2}>
          {[1,2,3,4,5,6].map(i => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Bảng điểm động - {curriculumInfo?.curriculumName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filteredStudents.length} học viên | {filteredGrades.length} điểm
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddGradeDialogOpen(true)}
        >
          Thêm điểm
        </Button>
      </Box>

      {assignmentTypes.length > 0 && (
        <Box mb={3} display="flex" alignItems="center" flexWrap="wrap" gap={2}>
          <TextField
            placeholder="Tìm học viên..."
            size="small"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Loại bài tập</InputLabel>
            <Select
              value={assignmentTypeFilter}
              onChange={(e) => setAssignmentTypeFilter(e.target.value)}
              label="Loại bài tập"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {assignmentTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Kỹ năng</InputLabel>
            <Select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              label="Kỹ năng"
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {validSkills.map((skill) => (
                <MenuItem key={skill.skillId} value={skill.skillId}>{skill.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            placeholder="Điểm từ"
            size="small"
            type="number"
            value={minScoreFilter}
            onChange={(e) => setMinScoreFilter(e.target.value)}
            sx={{ minWidth: 80 }}
          />
          <TextField
            placeholder="Điểm đến"
            size="small"
            type="number"
            value={maxScoreFilter}
            onChange={(e) => setMaxScoreFilter(e.target.value)}
            sx={{ minWidth: 80 }}
          />
        </Box>
      )}

      {/* Student Statistics - Table View */}
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
          Thống kê điểm theo học viên
        </Typography>
        
        {studentStats.length === 0 ? (
          // Empty State
          <Card sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
            <CardContent>
              <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Chưa có dữ liệu điểm
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {studentSearch 
                  ? 'Không tìm thấy học viên phù hợp' 
                  : 'Bắt đầu bằng cách thêm điểm cho học viên'}
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={() => setAddGradeDialogOpen(true)}
              >
                Thêm điểm đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      background: theme.palette.background.paper,
                      zIndex: 2,
                      minWidth: 240,
                      boxShadow: '1px 0 0 rgba(0,0,0,0.08)'
                    }}
                  ><strong>Họ tên</strong></TableCell>
                  <TableCell align="center"><strong>Điểm TB</strong></TableCell>
                  {validSkills.map((skill) => (
                    <TableCell align="center" key={skill.skillId}>
                      <strong>{skill.name}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {studentStats.map((stat) => (
                  <TableRow key={stat.studentId} hover>
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        background: theme.palette.background.paper,
                        zIndex: 1,
                        minWidth: 240,
                        boxShadow: '1px 0 0 rgba(0,0,0,0.08)'
                      }}
                    >
                      <Box
                        onClick={() => {
                          setViewingStudent(stat);
                          setViewStudentDetailDialogOpen(true);
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {stat.studentName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          #{stat.studentId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {stat.averageScore}
                      </Typography>
                    </TableCell>
                    {stat.skillBreakdown.map((skill) => (
                      <TableCell align="center" key={skill.skillId}>
                        {skill.count > 0 ? (
                          <Typography variant="body2">
                            {skill.averageScore.toFixed(1)}
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
        )}
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
                        <TableCell
                          sx={{
                            position: 'sticky',
                            left: 0,
                            background: theme.palette.background.paper,
                            zIndex: 2,
                            minWidth: 240,
                            boxShadow: '1px 0 0 rgba(0,0,0,0.08)'
                          }}
                        ><strong>Học viên</strong></TableCell>
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
                          <TableCell
                            sx={{
                              position: 'sticky',
                              left: 0,
                              background: theme.palette.background.paper,
                              zIndex: 1,
                              minWidth: 240,
                              boxShadow: '1px 0 0 rgba(0,0,0,0.08)'
                            }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {grade.studentName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                #{grade.studentId}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${grade.skillName}: ${Number(grade.score ?? 0).toFixed(1)}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {editingMap[grade.gradeId] ? (
                              <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                                <TextField
                                  value={editingMap[grade.gradeId].score}
                                  onChange={(e) => setEditingMap(prev => ({
                                    ...prev,
                                    [grade.gradeId]: { ...prev[grade.gradeId], score: e.target.value }
                                  }))}
                                  onKeyDown={(e) => {
                                    if (savingInlineId) return; // Không cho phép khi đang lưu
                                    if (e.key === 'Enter') handleSaveInlineGrade(grade, editingMap[grade.gradeId].score);
                                    if (e.key === 'Escape') handleCancelInlineEdit(grade.gradeId);
                                  }}
                                  type="number"
                                  size="small"
                                  inputProps={{ min: 0, max: grade.maxScore || 10, step: 0.1 }}
                                  sx={{ width: 90 }}
                                  autoFocus
                                  disabled={savingInlineId === grade.gradeId}
                                />
                                {savingInlineId === grade.gradeId ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <>
                                    <IconButton size="small" color="success" onClick={() => handleSaveInlineGrade(grade, editingMap[grade.gradeId].score)}>
                                      <Done fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="inherit" onClick={() => handleCancelInlineEdit(grade.gradeId)}>
                                      <Close fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            ) : (
                              <Tooltip title="Nhấp để sửa nhanh">
                                <Chip
                                  label={grade.score}
                                  size="small"
                                  onClick={() => handleStartInlineEdit(grade)}
                                  sx={{ cursor: savingInlineId ? 'not-allowed' : 'pointer', opacity: savingInlineId ? 0.5 : 1 }}
                                />
                              </Tooltip>
                            )}
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
                  onChange={async (e) => {
                    const assignmentId = e.target.value;
                    setNewGrade(prev => ({ 
                      ...prev, 
                      assignmentId: assignmentId || null, 
                      skillId: '' 
                    }));
                    if (assignmentId) {
                      try {
                        const response = await assignmentSkillsAPI.getByAssignment(assignmentId);
                        const skillsData = response.data?.Data || response.data?.data || [];
                        setDialogAssignmentSkills(Array.isArray(skillsData) ? skillsData : []);
                      } catch (err) {
                        console.error('Error loading assignment skills:', err);
                        setDialogAssignmentSkills([]);
                      }
                    } else {
                      setDialogAssignmentSkills([]);
                    }
                  }}
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
              <FormControl fullWidth disabled={newGrade.assignmentId ? dialogAssignmentSkills.length === 0 : skills.length === 0}>
                <InputLabel>
                  {newGrade.assignmentId
                    ? (dialogAssignmentSkills.length === 0 ? 'Bài tập chưa có kỹ năng' : 'Kỹ năng')
                    : 'Kỹ năng'}
                </InputLabel>
                <Select
                  value={newGrade.skillId}
                  onChange={(e) => setNewGrade({ ...newGrade, skillId: e.target.value })}
                >
                  {newGrade.assignmentId
                    ? dialogAssignmentSkills.map((assignmentSkill) => (
                        <MenuItem key={assignmentSkill.skillId} value={assignmentSkill.skillId}>
                          {assignmentSkill.skillName}
                        </MenuItem>
                      ))
                    : skills.map((skill) => (
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
                onChange={(e) => setSelectedGrade(prev => prev ? { ...prev, score: e.target.value } : null)}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                value={selectedGrade?.comments || ''}
                onChange={(e) => setSelectedGrade(prev => prev ? { ...prev, comments: e.target.value } : null)}
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
                <Box key={skill.skillId} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1">{skill.skillName}</Typography>
                    <Typography variant="body2">
                      {skill.count > 0 ? skill.averageScore.toFixed(1) : '-'}
                    </Typography>
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
              <Box key={skill.skillId} sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body1" fontWeight="medium">{skill.skillName}</Typography>
                  <Typography variant="body2">
                    {skill.count > 0 ? skill.averageScore.toFixed(1) : '-'}
                  </Typography>
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

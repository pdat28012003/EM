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
  Alert,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Pagination
} from '@mui/material';

import {
  Email,
  Phone,
  CalendarToday,
  TrendingUp
} from '@mui/icons-material';

import { attendanceAPI, classesAPI } from '../../../../services/api';

export default function AttendanceTab({ classId, classInfo }) {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    rate: 0
  });

  useEffect(() => {
    loadData();
  }, [classId, selectedDate, page, rowsPerPage]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadStudents(), loadAttendanceStats()]);
    setLoading(false);
  };

  const loadStudents = async () => {
    try {
      const res = await classesAPI.getStudents(classId, {
        page: page,
        pageSize: rowsPerPage
      });
      const studentsData = res.data?.data || res.data || [];
      setStudents(studentsData);
      setTotalCount(res.data?.totalCount || res.data?.TotalCount || 0);
    } catch {
      setStudents([]);
      setTotalCount(0);
    }
  };

  const loadAttendanceStats = async () => {
    try {
      const res = await attendanceAPI.getAll({
        lessonId: classId,
        date: selectedDate
      });

      const attendance = res.data || [];
      const present = attendance.filter(a => a.status === 'Present').length;
      const absent = attendance.filter(a => a.status === 'Absent').length;
      const total = students.length;

      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({ total, present, absent, rate });

      const map = {};
      attendance.forEach(a => {
        map[a.studentId] = a.status;
      });
      setAttendanceData(map);
    } catch {
      setStats({ total: 0, present: 0, absent: 0, rate: 0 });
    }
  };

  const handleAttendanceChange = async (studentId, status) => {
    try {
      const today = selectedDate;

      const res = await attendanceAPI.getAll({
        studentId: parseInt(studentId),
        lessonId: classId,
        date: today
      });

      if (res.data?.length > 0) {
        await attendanceAPI.update(res.data[0].attendanceId, {
          status
        });
      } else {
        await attendanceAPI.create({
          studentId: parseInt(studentId),
          lessonId: classId,
          attendanceDate: today,
          status
        });
      }

      loadAttendanceStats();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const getRateColor = () => {
    if (stats.rate >= 90) return 'success';
    if (stats.rate >= 75) return 'warning';
    return 'error';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  return (
    <Box>
      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" fontWeight="bold">
          Điểm danh - {classInfo?.className}
        </Typography>

        <TextField
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </Box>

      {/* STATS */}
      <Grid container spacing={3} mb={3}>
        {[
          { label: 'Tổng', value: stats.total },
          { label: 'Có mặt', value: stats.present, color: 'success' },
          { label: 'Vắng', value: stats.absent, color: 'error' },
          { label: 'Tỷ lệ', value: `${stats.rate}%`, color: getRateColor() }
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  color={item.color || 'text.primary'}
                >
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* TABLE */}
      {loading ? (
        <Box textAlign="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : students.length === 0 ? (
        <Alert severity="info">Không có học viên</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Họ tên</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>SĐT</b></TableCell>
                <TableCell align="center"><b>Trạng thái</b></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student.studentId || student.StudentId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {(page - 1) * rowsPerPage + index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>{student.fullName || student.FullName}</TableCell>

                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Email fontSize="small" />
                      {student.email || student.Email}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Phone fontSize="small" />
                      {student.phoneNumber || student.PhoneNumber}
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <FormControl size="small">
                      <Select
                        value={attendanceData[student.studentId] || ''}
                        onChange={(e) =>
                          handleAttendanceChange(
                            student.studentId,
                            e.target.value
                          )
                        }
                      >
                        <MenuItem value="">--</MenuItem>
                        <MenuItem value="Present">
                          <Chip label="Có mặt" color="success" size="small" />
                        </MenuItem>
                        <MenuItem value="Absent">
                          <Chip label="Vắng" color="error" size="small" />
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* PAGINATION */}
      {totalCount > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, totalCount)} của {totalCount} học viên
          </Typography>
          <Pagination
            count={Math.ceil(totalCount / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}
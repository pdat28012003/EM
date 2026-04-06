import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
  CircularProgress,
} from '@mui/material';
import { classesAPI, authAPI } from '../../../services/api';
import AssignmentsTab from '../Class/ClassDetail/AssignmentsTab';

const TeacherAssignments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  const selectedClassInfo = useMemo(() => {
    const id = Number(selectedClassId);
    return classes.find((c) => c.classId === id) || null;
  }, [classes, selectedClassId]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const userData = localStorage.getItem('user');
        if (!userData) {
          setError('Vui lòng đăng nhập để quản lý bài tập.');
          return;
        }

        const user = JSON.parse(userData);
        let tId = user.teacherId || user.userId;

        if (!tId) {
          try {
            const profileRes = await authAPI.getProfile();
            const profile = profileRes.data?.data || profileRes.data;
            tId = profile?.teacherId || profile?.userId;
            if (tId) {
              localStorage.setItem('user', JSON.stringify({ ...user, teacherId: tId }));
            }
          } catch (e) {
            // ignore and handle below
          }
        }

        if (!tId) {
          setError('Không tìm thấy thông tin giảng viên. Vui lòng liên hệ Admin.');
          return;
        }

        setTeacherId(tId);

        const res = await classesAPI.getAll({ teacherId: tId, pageSize: 1000 });
        const clsData = res.data?.data || res.data?.Data || res.data || [];
        const list = Array.isArray(clsData) ? clsData : clsData?.data || [];
        const normalized = Array.isArray(list) ? list : [];

        setClasses(normalized);

        if (normalized.length > 0) {
          setSelectedClassId(String(normalized[0].classId));
        } else {
          setSelectedClassId('');
        }
      } catch (err) {
        console.error('Error loading teacher assignments page:', err);
        setError('Không thể tải danh sách lớp. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Bài tập
        </Typography>
        <Typography sx={{ opacity: 0.9 }}>
          Tạo và quản lý bài tập theo từng lớp học.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!error && (
        <>
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <Typography fontWeight={700}>Chọn lớp</Typography>
              <FormControl sx={{ minWidth: 320 }} size="small">
                <InputLabel id="teacher-assignments-class-label">Lớp học</InputLabel>
                <Select
                  labelId="teacher-assignments-class-label"
                  value={selectedClassId}
                  label="Lớp học"
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <MenuItem key={c.classId} value={String(c.classId)}>
                      {c.className || `Lớp #${c.classId}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ flex: 1 }} />
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {teacherId ? `TeacherId: ${teacherId}` : ''}
              </Typography>
            </Box>
          </Paper>

          {selectedClassId ? (
            <AssignmentsTab classId={Number(selectedClassId)} classInfo={selectedClassInfo} />
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Bạn chưa được gán lớp nào để tạo bài tập.
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default TeacherAssignments;


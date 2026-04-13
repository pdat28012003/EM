import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  CalendarMonth,
  AccessTime,
  Room,
  Topic,
  Person,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const StudentSchedule = ({
  students,
  selectedStudent,
  schedule,
  loading,
  loadingStudents,
  totalSchedule,
  schedulePagination,
  selectedDate,
  startDate,
  endDate,
  error,
  onStudentChange,
  onStudentsSearch,
  onSchedulePageChange,
  onDateChange,
  onStartChange,
  onEndChange,
}) => {

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={students}
                getOptionLabel={(option) => option ? `${option.fullName} (${option.email})` : ''}
                value={selectedStudent}
                onChange={onStudentChange}
                onInputChange={(event, value, reason) => {
                  // Chỉ search khi user gõ, không phải khi chọn hoặc clear
                  if (reason === 'input') {
                    onStudentsSearch(event, value);
                  }
                }}
                loading={loadingStudents}
                isOptionEqualToValue={(option, value) => option?.studentId === value?.studentId}
                filterOptions={(options, state) => {
                  // Chỉ filter khi user đang gõ, không phải khi đang chọn
                  if (state.inputValue === '') {
                    return options;
                  }
                  return options.filter(option => 
                    option.fullName.toLowerCase().includes(state.inputValue.toLowerCase()) ||
                    option.email.toLowerCase().includes(state.inputValue.toLowerCase())
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chọn Học Viên"
                    variant="outlined"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingStudents ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Lọc theo ngày"
                value={selectedDate}
                onChange={onDateChange}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Từ ngày"
                value={startDate}
                onChange={onStartChange}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Đến ngày"
                value={endDate}
                onChange={onEndChange}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                * Có thể lọc theo 1 ngày hoặc khoảng ngày
              </Typography>
            </Grid>
          </Grid>
        </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : !selectedStudent ? (
        <Paper sx={{ p: 10, textAlign: 'center', border: '2px dashed', borderColor: 'grey.300', bgcolor: 'transparent' }}>
          <Person sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Vui lòng chọn một học viên để xem lịch học
          </Typography>
        </Paper>
      ) : (
        <>
          {schedule.length > 0 ? (
            <>
              <Grid container spacing={3}>
                {schedule
                  .sort((a, b) => {
                    // Sắp xếp theo ngày và giờ
                    if (!a.date || !b.date) return 0;
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
                    return (a.startTime || '').localeCompare(b.startTime || '');
                  })
                  .map((sessionItem) => (
                    <Grid item xs={12} sm={6} md={4} key={sessionItem.sessionId}>
                      <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
                          <Typography variant="h6" fontWeight="bold">
                            {dayjs(sessionItem.date).format('DD/MM/YYYY')}
                          </Typography>
                          <Typography variant="body2">
                            {sessionItem.courseName}
                          </Typography>
                          {sessionItem.curriculumName && (
                            <Typography variant="caption">
                              {sessionItem.curriculumName}
                            </Typography>
                          )}
                        </Box>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <AccessTime fontSize="small" color="action" />
                            <Typography variant="body1" fontWeight="bold">
                              {sessionItem.startTime} - {sessionItem.endTime}
                            </Typography>
                          </Box>
                          {sessionItem.sessionName && (
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Topic fontSize="small" color="action" />
                              <Typography variant="body2">
                                Buổi {sessionItem.sessionNumber}: {sessionItem.sessionName}
                              </Typography>
                            </Box>
                          )}
                          {sessionItem.topic && (
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <CalendarMonth fontSize="small" color="action" />
                              <Typography variant="body2">
                                Chủ đề: {sessionItem.topic}
                              </Typography>
                            </Box>
                          )}
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Room fontSize="small" color="action" />
                            <Typography variant="body2">
                              Phòng: {sessionItem.roomName}
                            </Typography>
                          </Box>
                          {sessionItem.teacherName && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Person fontSize="small" color="action" />
                              <Typography variant="body2">
                                Giáo viên: {sessionItem.teacherName}
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ mt: 'auto', pt: 1 }}>
                            <Chip 
                              label={sessionItem.status || 'Scheduled'} 
                              size="small" 
                              color={sessionItem.status === 'Scheduled' ? 'success' : 'default'}
                              variant="outlined" 
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
              
              {/* Pagination for Schedule */}
              {schedule.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={Math.ceil(totalSchedule / schedulePagination.pageSize)}
                    page={schedulePagination.page + 1}
                    onChange={onSchedulePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          ) : (
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                Học viên này hiện chưa có lịch học nào.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Vui lòng kiểm tra lại đăng ký lớp học của học viên.
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
    </LocalizationProvider>
  );
};

export default StudentSchedule;

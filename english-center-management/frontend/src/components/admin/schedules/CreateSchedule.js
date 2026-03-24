import React from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  AccessTime,
  Save,
} from '@mui/icons-material';

const CreateSchedule = ({
  classes,
  teachers,
  rooms,
  selectedClass,
  selectedTeacher,
  selectedRoom,
  scheduleForm,
  createLoading,
  error,
  successMessage,
  onClassChange,
  onTeacherChange,
  onRoomChange,
  onScheduleFormChange,
  onCreateSchedule,
}) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Tạo Lịch Học Mới
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={classes}
            getOptionLabel={(option) => option ? `${option.className} - ${option.courseName || 'N/A'}` : ''}
            value={selectedClass}
            onChange={onClassChange}
            isOptionEqualToValue={(option, value) => option?.classId === value?.classId}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chọn Lớp Học"
                variant="outlined"
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Autocomplete
            options={teachers}
            getOptionLabel={(option) => option ? `${option.fullName} - ${option.email}` : ''}
            value={selectedTeacher}
            onChange={onTeacherChange}
            isOptionEqualToValue={(option, value) => option?.teacherId === value?.teacherId}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chọn Giáo Viên"
                variant="outlined"
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Autocomplete
            options={rooms}
            getOptionLabel={(option) => option ? `${option.roomName} (Sức chứa: ${option.capacity})` : ''}
            value={selectedRoom}
            onChange={onRoomChange}
            isOptionEqualToValue={(option, value) => option?.roomId === value?.roomId}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chọn Phòng Học"
                variant="outlined"
                required
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" required>
            <InputLabel>Thứ trong tuần</InputLabel>
            <Select
              value={scheduleForm.dayOfWeek}
              onChange={onScheduleFormChange('dayOfWeek')}
              label="Thứ trong tuần"
            >
              <MenuItem value="Monday">Thứ Hai</MenuItem>
              <MenuItem value="Tuesday">Thứ Ba</MenuItem>
              <MenuItem value="Wednesday">Thứ Tư</MenuItem>
              <MenuItem value="Thursday">Thứ Năm</MenuItem>
              <MenuItem value="Friday">Thứ Sáu</MenuItem>
              <MenuItem value="Saturday">Thứ Bảy</MenuItem>
              <MenuItem value="Sunday">Chủ Nhật</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Thời Gian Bắt Đầu"
            type="time"
            variant="outlined"
            value={scheduleForm.startTime}
            onChange={onScheduleFormChange('startTime')}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccessTime />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Thời Gian Kết Thúc"
            type="time"
            variant="outlined"
            value={scheduleForm.endTime}
            onChange={onScheduleFormChange('endTime')}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccessTime />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={onCreateSchedule}
              disabled={createLoading}
              startIcon={<Save />}
              sx={{ minWidth: 120 }}
            >
              {createLoading ? 'Đang tạo...' : 'Tạo Lịch Học'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateSchedule;

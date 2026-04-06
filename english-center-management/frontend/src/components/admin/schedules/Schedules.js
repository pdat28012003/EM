import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CalendarMonth,
  Person,
  Add,
} from '@mui/icons-material';
import { studentsAPI, classesAPI, teachersAPI, roomsAPI } from '../../../services/api';
import StudentSchedule from './StudentSchedule';
import TeacherSchedule from './TeacherSchedule';
import CreateSchedule from './CreateSchedule';
import dayjs from 'dayjs';

const Schedules = () => {
  const [tabValue, setTabValue] = useState(0);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [teacherSchedules, setTeacherSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [studentsSearch, setStudentsSearch] = useState('');
  const [teachersSearch, setTeachersSearch] = useState('');
  const [schedulePagination, setSchedulePagination] = useState({ page: 0, pageSize: 10 });
  const [totalSchedule, setTotalSchedule] = useState(0);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    classId: '',
    teacherId: '',
    roomId: '',
    dayOfWeek: '',
    startTime: '',
    endTime: ''
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadStudents();
    loadClasses();
    loadTeachers();
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      loadTeacherSchedule(selectedTeacher.teacherId);
    }
  }, [selectedTeacher, selectedDate, startDate, endDate]);

  useEffect(() => {
    if (selectedStudent) {
      loadSchedule(selectedStudent.studentId);
    }
  }, [selectedStudent, schedulePagination.page, selectedDate, startDate, endDate]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await studentsAPI.getAll({ 
        isActive: true,
        search: studentsSearch
      });
      const studentsData = Array.isArray(response.data?.data?.data) ? response.data.data.data : [];
      setStudents(studentsData);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Không thể tải danh sách học viên');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    // Clear date range when single date is selected
    setStartDate(null);
    setEndDate(null);
  };

  const handleStartDateChange = (newDate) => {
    setStartDate(newDate);
    // Clear single date when date range is used
    setSelectedDate(null);
  };

  const handleEndDateChange = (newDate) => {
    setEndDate(newDate);
    // Clear single date when date range is used
    setSelectedDate(null);
  };

  const handleStudentChange = async (event, newValue) => {
    setSelectedStudent(newValue);
    if (newValue) {
      setSchedulePagination({ page: 0, pageSize: schedulePagination.pageSize });
      // Load student schedule with current date filters
      loadSchedule(newValue.studentId);
    } else {
      setSchedule([]);
      setTotalSchedule(0);
    }
  };

  const handleStudentsSearch = (event, value) => {
    setStudentsSearch(value);
  };

  const handleTeachersSearch = (event, value) => {
    setTeachersSearch(value);
  };

  // Debounced search functions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (studentsSearch !== undefined) {
        loadStudents();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [studentsSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (teachersSearch !== undefined) {
        loadTeachers();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [teachersSearch]);

  const handleSchedulePageChange = (event, newPage) => {
    setSchedulePagination(prev => ({ ...prev, page: newPage - 1 }));
  };

  const loadSchedule = async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      
      // Use single date filter if provided
      if (selectedDate) {
        params.date = selectedDate.format('YYYY-MM-DD');
      }
      // Use date range filter if provided
      else if (startDate && endDate) {
        params.startDate = startDate.format('YYYY-MM-DD');
        params.endDate = endDate.format('YYYY-MM-DD');
      }
      else if (startDate) {
        params.startDate = startDate.format('YYYY-MM-DD');
      }
      else if (endDate) {
        params.endDate = endDate.format('YYYY-MM-DD');
      }
      
      const response = await studentsAPI.getSchedule(studentId, params);
      
      let scheduleData = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        scheduleData = response.data.data;
      } else if (response.data?.Data && Array.isArray(response.data.Data)) {
        scheduleData = response.data.Data;
      } else if (response.data && Array.isArray(response.data)) {
        scheduleData = response.data;
      }
      
      setSchedule(scheduleData);
      setTotalSchedule(response.data?.totalCount || response.data?.TotalCount || scheduleData.length || 0);
    } catch (err) {
      console.error('Error loading schedule:', err);
      setError('Không thể tải lịch học');
      setSchedule([]);
      setTotalSchedule(0);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      const classesData = Array.isArray(response.data?.data) ? response.data.data : [];
      setClasses(classesData);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await teachersAPI.getAll({ isActive: true });
      const teachersData = Array.isArray(response.data?.data) ? response.data.data : [];
      setTeachers(teachersData);
    } catch (err) {
      console.error('Error loading teachers:', err);
    }
  };

  const loadTeacherSchedule = async (teacherId, date = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      
      // Use single date filter if provided
      if (selectedDate) {
        params.date = selectedDate.format('YYYY-MM-DD');
      }
      // Use date range filter if provided
      else if (startDate && endDate) {
        params.startDate = startDate.format('YYYY-MM-DD');
        params.endDate = endDate.format('YYYY-MM-DD');
      }
      else if (startDate) {
        params.startDate = startDate.format('YYYY-MM-DD');
      }
      else if (endDate) {
        params.endDate = endDate.format('YYYY-MM-DD');
      }
      
      const response = await teachersAPI.getSchedule(teacherId, params);
      
      let teacherScheduleData = [];
      if (response.data?.Data && Array.isArray(response.data.Data)) {
        teacherScheduleData = response.data.Data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        teacherScheduleData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        teacherScheduleData = response.data;
      }
      
      setTeacherSchedules(teacherScheduleData);
    } catch (err) {
      console.error('Error loading teacher schedule:', err);
      setError('Không thể tải lịch dạy của giáo viên');
      setTeacherSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await roomsAPI.getAll();
      const roomsData = Array.isArray(response.data?.data) ? response.data.data : [];
      setRooms(roomsData);
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError(null);
    setSuccessMessage('');
  };

  const handleScheduleFormChange = (field) => (event) => {
    setScheduleForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleClassChange = (event, newValue) => {
    setSelectedClass(newValue);
    if (newValue && newValue.classId) {
      setScheduleForm(prev => ({ ...prev, classId: newValue.classId }));
    }
  };

  const handleTeacherChange = (event, newValue) => {
    setSelectedTeacher(newValue);
    if (newValue && newValue.teacherId) {
      setScheduleForm(prev => ({ ...prev, teacherId: newValue.teacherId }));
      
      // Load teacher schedule with current date filters
      loadTeacherSchedule(newValue.teacherId);
    } else {
      // Clear schedules nếu không chọn giáo viên
      setTeacherSchedules([]);
    }
  };

  const handleRoomChange = (event, newValue) => {
    setSelectedRoom(newValue);
    if (newValue && newValue.roomId) {
      setScheduleForm(prev => ({ ...prev, roomId: newValue.roomId }));
    }
  };

  const handleCreateSchedule = async () => {
    try {
      setCreateLoading(true);
      setError(null);
      setSuccessMessage('');

      setError('Vui lòng sử dụng trang Quản lý Curriculum để tạo lịch học mới');
      return;
    } catch (error) {
      console.error('Error creating schedule:', error);
      setError(error.response?.data?.message || 'Không thể tạo lịch học');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Quản Lý Lịch Học
      </Typography>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Xem Lịch Học Học Viên" icon={<CalendarMonth />} iconPosition="start" />
          <Tab label="Xem Lịch Giảng Viên" icon={<Person />} iconPosition="start" />
          <Tab label="Tạo Lịch Học Mới" icon={<Add />} iconPosition="start" />
        </Tabs>

        {tabValue === 0 && (
          <StudentSchedule
            students={students}
            selectedStudent={selectedStudent}
            schedule={schedule}
            loading={loading}
            loadingStudents={loadingStudents}
            totalSchedule={totalSchedule}
            schedulePagination={schedulePagination}
            selectedDate={selectedDate}
            startDate={startDate}
            endDate={endDate}
            error={error}
            onStudentChange={handleStudentChange}
            onStudentsSearch={handleStudentsSearch}
            onSchedulePageChange={handleSchedulePageChange}
            onDateChange={handleDateChange}
            onStartChange={handleStartDateChange}
            onEndChange={handleEndDateChange}
          />
        )}
        
        {tabValue === 1 && (
          <TeacherSchedule
            teachers={teachers}
            selectedTeacher={selectedTeacher}
            teacherSchedules={teacherSchedules}
            loadingTeachers={loadingTeachers}
            selectedDate={selectedDate}
            startDate={startDate}
            endDate={endDate}
            error={error}
            onTeacherChange={handleTeacherChange}
            onTeachersSearch={handleTeachersSearch}
            onDateChange={handleDateChange}
            onStartChange={handleStartDateChange}
            onEndChange={handleEndDateChange}
          />
        )}

        {tabValue === 2 && (
          <CreateSchedule
            classes={classes}
            teachers={teachers}
            rooms={rooms}
            selectedClass={selectedClass}
            selectedTeacher={selectedTeacher}
            selectedRoom={selectedRoom}
            scheduleForm={scheduleForm}
            createLoading={createLoading}
            error={error}
            successMessage={successMessage}
            onClassChange={handleClassChange}
            onTeacherChange={handleTeacherChange}
            onRoomChange={handleRoomChange}
            onScheduleFormChange={handleScheduleFormChange}
            onCreateSchedule={handleCreateSchedule}
          />
        )}
      </Paper>
    </Container>
  );
};

export default Schedules;

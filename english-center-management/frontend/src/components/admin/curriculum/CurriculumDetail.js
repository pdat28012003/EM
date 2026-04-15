/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Add, 
  Edit, 
  Delete, 
  Close, 
  School, 
  Person, 
  People,
  Room, 
  AccessTime,
  MenuBook,
  Group,
  EventNote,
  ArrowBack,
} from '@mui/icons-material';
import { curriculumAPI, roomsAPI, teachersAPI, documentsAPI, studentsAPI } from '../../../services/api';

const CurriculumDetail = () => {
  const { curriculumId } = useParams();
  const [curriculum, setCurriculum] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  // New state for teachers with availability status from BE
  const [teachersWithAvailability, setTeachersWithAvailability] = useState([]);
  const [loadingTeachersAvailability, setLoadingTeachersAvailability] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [, setSelectedSession] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'students'
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentCapacity, setStudentCapacity] = useState({ max: null, available: null });
  const [showStudentSelectModal, setShowStudentSelectModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [showFullDesc, setShowFullDesc] = useState(false);
  // Session Students
  const [showSessionStudentModal, setShowSessionStudentModal] = useState(false);
  const [selectedSessionForStudents, setSelectedSessionForStudents] = useState(null);
  const [sessionStudents, setSessionStudents] = useState([]);
  const [sessionStudentCapacity, setSessionStudentCapacity] = useState({ max: null, available: null });
  const [availableStudentsForSession, setAvailableStudentsForSession] = useState([]);
  const [selectedSessionStudentIds, setSelectedSessionStudentIds] = useState([]);
  
  const navigate = useNavigate();
  
  const [sessionForm, setSessionForm] = useState({
    curriculumSessionId: null,
    curriculumDayId: '',
    sessionNumber: 1,
    startTime: '09:00',
    endTime: '10:00',
    sessionName: '',
    sessionDescription: '',
    roomId: '',
    teacherId: '',
    documentId: '',
    searchDate: '' // Date picker for finding available teachers
  });

  const [lessonForm, setLessonForm] = useState({
    curriculumSessionId: '',
    lessonNumber: 1,
    lessonTitle: '',
    content: '',
    duration: '01:00',
    resources: '',
    notes: ''
  });

  useEffect(() => {
    loadCurriculum();
    loadRooms();
    loadTeachers();
    loadDocuments();
    loadStudents();
  }, [curriculumId]);

  useEffect(() => {
    if (curriculum) {
      generateDateRange();
      setSelectedTeacherIds(curriculum.participantTeachers?.map(t => t.teacherId) || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculum]);

  // Load students when tab changes to students
  useEffect(() => {
    console.log('Tab changed:', activeTab);
    if (activeTab === 'students' && curriculumId) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, curriculumId]);

  const loadCurriculum = async () => {
    try {
      const response = await curriculumAPI.getById(curriculumId);
      setCurriculum(response.data);
    } catch (error) {
      console.error('Error loading curriculum:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await roomsAPI.getAll();
      const roomsData = Array.isArray(response.data) ? response.data : response.data?.data || response.data?.Data || [];
      setRooms(Array.isArray(roomsData) ? roomsData : []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setRooms([]);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.getAll({ pageSize: 1000 });
      const docsData = response.data?.data || response.data || [];
      setDocuments(Array.isArray(docsData) ? docsData : []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await teachersAPI.getAll({ isActive: true });
      const teachersData = response.data?.Data || response.data?.data || response.data || [];
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
    }
  };

  const handleTeacherToggle = (teacherId) => {
    const id = parseInt(teacherId);
    setSelectedTeacherIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(existingId => existingId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSaveTeachers = async () => {
    try {
      await curriculumAPI.update(curriculumId, {
        CurriculumName: curriculum.curriculumName,
        StartDate: curriculum.startDate,
        EndDate: curriculum.endDate,
        Description: curriculum.description,
        Status: curriculum.status,
        ParticipantTeacherIds: selectedTeacherIds
      });

      loadCurriculum();
      setShowTeacherModal(false);
      alert('Đã cập nhật danh sách giáo viên!');
    } catch (error) {
      console.error('Error saving teachers:', error);
      alert('Không thể cập nhật giáo viên. Vui lòng thử lại!');
    }
  };

  // Load students in curriculum
  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await curriculumAPI.getStudents(curriculumId);
      const data = response.data || {};
      setStudents(data.students || []);
      setStudentCapacity({
        max: data.maxCapacity,
        available: data.availableSlots
      });
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedStudentIds.length === availableStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(availableStudents.map(s => s.studentId));
    }
  };

  // Add selected students to curriculum
  const handleAddSelectedStudents = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Bạn chưa chọn học viên nào!');
      return;
    }
    
    try {
      // Add each student one by one
      for (const studentId of selectedStudentIds) {
        await curriculumAPI.addStudent(curriculumId, studentId);
      }
      
      loadStudents();
      setShowStudentSelectModal(false);
      setSelectedStudentIds([]);
      alert(`Thêm thành công ${selectedStudentIds.length} học viên!`);
    } catch (error) {
      console.error('Error adding students:', error);
      alert(error.response?.data?.message || 'Không thể thêm học viên. Vui lòng kiểm tra lại!');
    }
  };

  // Remove student from curriculum
  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Xóa học viên này khỏi chương trình?')) return;
    try {
      await curriculumAPI.removeStudent(curriculumId, studentId);
      loadStudents();
      alert('Đã xóa học viên!');
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Không thể xóa học viên. Vui lòng thử lại!');
    }
  };

  // Load available students (not in curriculum)
  const loadAvailableStudents = async () => {
    try {
      setSelectedStudentIds([]); // Reset selection
      
      const response = await curriculumAPI.getStudents(curriculumId);
      const enrolledStudents = response.data?.students || response.data || [];
      const enrolledIds = Array.isArray(enrolledStudents) ? enrolledStudents.map(s => s.studentId) : [];
      
      // Get all students and filter out enrolled ones
      const allStudentsRes = await studentsAPI.getAll({ pageSize: 1000 });
      const allStudents = allStudentsRes.data?.data?.data || allStudentsRes.data?.data?.Data || [];
      
      const available = Array.isArray(allStudents) ? allStudents.filter(s => {
        return !enrolledIds.includes(s.studentId) && s.isActive;
      }) : [];
      
      setAvailableStudents(available);
    } catch (error) {
      console.error('Error loading available students:', error);
    }
  };

  // Load session students
  const loadSessionStudents = async (sessionId) => {
    try {
      const response = await curriculumAPI.getSessionStudents(sessionId);
      const data = response.data || {};
      setSessionStudents(data.students || []);
      setSessionStudentCapacity({
        max: data.maxCapacity,
        available: data.availableSlots
      });
    } catch (error) {
      console.error('Error loading session students:', error);
    }
  };

  // Load available students for session
  const loadAvailableStudentsForSession = async (sessionId) => {
    try {
      setSelectedSessionStudentIds([]);
      const response = await curriculumAPI.getAvailableStudentsForSession(sessionId);
      const data = response.data || [];
      setAvailableStudentsForSession(data);
    } catch (error) {
      console.error('Error loading available students for session:', error);
    }
  };

  // Toggle session student selection
  const toggleSessionStudentSelection = (studentId) => {
    setSelectedSessionStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Select/deselect all for session
  const toggleSelectAllForSession = () => {
    if (selectedSessionStudentIds.length === availableStudentsForSession.length) {
      setSelectedSessionStudentIds([]);
    } else {
      setSelectedSessionStudentIds(availableStudentsForSession.map(s => s.studentId));
    }
  };

  // Add selected students to session
  const handleAddStudentsToSession = async () => {
    if (selectedSessionStudentIds.length === 0) {
      alert('Bạn chưa chọn học viên nào!');
      return;
    }
    
    try {
      for (const studentId of selectedSessionStudentIds) {
        await curriculumAPI.addStudentToSession(selectedSessionForStudents.curriculumSessionId, studentId);
      }
      
      loadSessionStudents(selectedSessionForStudents.curriculumSessionId);
      loadAvailableStudentsForSession(selectedSessionForStudents.curriculumSessionId);
      setSelectedSessionStudentIds([]);
      alert(`Thêm thành công ${selectedSessionStudentIds.length} học viên vào buổi học!`);
    } catch (error) {
      console.error('Error adding students to session:', error);
      alert(error.response?.data?.message || 'Không thể thêm học viên. Kiểm tra sức chứa phòng!');
    }
  };

  // Remove student from session
  const handleRemoveStudentFromSession = async (studentId) => {
    if (!window.confirm('Xóa học viên này khỏi buổi học?')) return;
    try {
      await curriculumAPI.removeStudentFromSession(selectedSessionForStudents.curriculumSessionId, studentId);
      loadSessionStudents(selectedSessionForStudents.curriculumSessionId);
      loadAvailableStudentsForSession(selectedSessionForStudents.curriculumSessionId);
      alert('Đã xóa học viên khỏi buổi học!');
    } catch (error) {
      console.error('Error removing student from session:', error);
      alert('Không thể xóa học viên. Vui lòng thử lại!');
    }
  };

  // Open session student modal
  const openSessionStudentModal = (session) => {
    setSelectedSessionForStudents(session);
    loadSessionStudents(session.curriculumSessionId);
    loadAvailableStudentsForSession(session.curriculumSessionId);
    setShowSessionStudentModal(true);
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Load teachers with availability status from backend (includes room check)
  const loadTeachersWithAvailability = async () => {
    if (!selectedDay || !sessionForm.startTime || !sessionForm.endTime) {
      setTeachersWithAvailability([]);
      setRoomInfo(null);
      return;
    }

    try {
      setLoadingTeachersAvailability(true);
      const date = selectedDay.scheduleDate.split('T')[0];
      const params = {
        date: date,
        startTime: sessionForm.startTime?.substring(0, 5), // HH:mm format
        endTime: sessionForm.endTime?.substring(0, 5),     // HH:mm format
        excludeSessionId: isEditingSession ? sessionForm.curriculumSessionId : undefined,
        roomId: sessionForm.roomId || undefined
      };

      const response = await teachersAPI.getTeachersWithAvailability(params);
      const data = response.data || {};
      setTeachersWithAvailability(data.teachers || []);
      setRoomInfo(data.roomInfo || null);
    } catch (error) {
      console.error('Error loading teachers availability:', error);
      setTeachersWithAvailability([]);
      setRoomInfo(null);
    } finally {
      setLoadingTeachersAvailability(false);
    }
  };

  // Load availability when time/day/room changes
  useEffect(() => {
    if (showSessionModal && selectedDay) {
      loadTeachersWithAvailability();
    }
  }, [sessionForm.startTime, sessionForm.endTime, sessionForm.roomId, selectedDay, showSessionModal]);

  const generateDateRange = () => {
    if (!curriculum) return;
    
    const start = parseDate(curriculum.startDate);
    const end = parseDate(curriculum.endDate);
    const dates = [];
    
    if (!start || !end) return;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    
    setDateRange(dates);
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleAddDay = async (date) => {
    try {
      const response = await curriculumAPI.createDay({
        curriculumId: parseInt(curriculumId),
        scheduleDate: formatDate(date),
        topic: `Học ngày ${date.toLocaleDateString('vi-VN')}`,
        description: ''
      });
      
      const newDay = response.data;
      setSelectedDay(newDay);
      setIsEditingSession(false);
      setSessionForm({
        curriculumSessionId: null,
        curriculumDayId: newDay.curriculumDayId,
        sessionNumber: 1,
        startTime: '09:00',
        endTime: '10:00',
        sessionName: 'Buổi 1',
        sessionDescription: '',
        roomId: '',
        teacherId: ''
      });
      
      setShowSessionModal(true);
      loadCurriculum();
    } catch (error) {
      console.error('Error creating day:', error);
      alert('Không thể tạo ngày học. Vui lòng thử lại!');
    }
  };

  const handleAddSession = (day) => {
    if (day.sessionCount >= 3) {
      alert('Mỗi ngày tối đa 3 buổi học!');
      return;
    }
    
    setSelectedDay(day);
    setIsEditingSession(false);
    setSessionForm({
      curriculumSessionId: null,
      curriculumDayId: day.curriculumDayId,
      sessionNumber: day.sessionCount + 1,
      startTime: '09:00',
      endTime: '10:00',
      sessionName: `Buổi ${day.sessionCount + 1}`,
      sessionDescription: '',
      roomId: '',
      teacherId: '',
      documentId: '',
      searchDate: '' // Reset search date
    });
    setShowSessionModal(true);
  };

  const handleEditSession = (day, session) => {
    setSelectedDay(day);
    setIsEditingSession(true);
    setSessionForm({
      curriculumSessionId: session.curriculumSessionId,
      curriculumDayId: day.curriculumDayId,
      sessionNumber: session.sessionNumber,
      startTime: session.startTime,
      endTime: session.endTime,
      sessionName: session.sessionName,
      sessionDescription: session.sessionDescription,
      roomId: session.roomId || '',
      teacherId: session.teacherId || '',
      documentId: session.documentId || '',
      searchDate: '' // Reset search date
    });
    setShowSessionModal(true);
  };

  const handleSubmitSession = async (e) => {
    e.preventDefault();
    
    if (new Date(`2000-01-01 ${sessionForm.startTime}`) >= new Date(`2000-01-01 ${sessionForm.endTime}`)) {
      alert('Giờ bắt đầu phải sớm hơn giờ kết thúc!');
      return;
    }

    const sessionData = {
      curriculumDayId: sessionForm.curriculumDayId,
      sessionNumber: sessionForm.sessionNumber,
      startTime: sessionForm.startTime,
      endTime: sessionForm.endTime,
      sessionName: sessionForm.sessionName,
      sessionDescription: sessionForm.sessionDescription,
      roomId: sessionForm.roomId ? parseInt(sessionForm.roomId) : null,
      teacherId: sessionForm.teacherId ? parseInt(sessionForm.teacherId) : null,
      documentId: sessionForm.documentId ? parseInt(sessionForm.documentId) : null
    };

    try {
      if (isEditingSession) {
        await curriculumAPI.updateSession(sessionForm.curriculumSessionId, sessionData);
      } else {
        await curriculumAPI.createSession(sessionData);
      }
      
      loadCurriculum();
      setShowSessionModal(false);
    } catch (error) {
      console.error('Error saving session:', error);
      alert(error.response?.data?.message || 'Không thể lưu buổi học. Vui lòng thử lại!');
    }
  };

  const handleAddLesson = (session) => {
    setSelectedSession(session);
    setIsEditingLesson(false);
    setSelectedLesson(null);
    setLessonForm({
      curriculumSessionId: session.curriculumSessionId,
      lessonNumber: (session.lessons?.length || 0) + 1,
      lessonTitle: '',
      content: '',
      duration: '01:00',
      resources: '',
      notes: '',
      documentId: ''
    });
    setShowLessonModal(true);
  };

  const handleEditLesson = (lesson) => {
    setIsEditingLesson(true);
    setSelectedLesson(lesson);
    setLessonForm({
      curriculumSessionId: lesson.curriculumSessionId,
      lessonNumber: lesson.lessonNumber,
      lessonTitle: lesson.lessonTitle,
      content: lesson.content,
      duration: lesson.duration,
      resources: lesson.resources || '',
      notes: lesson.notes || '',
      documentId: lesson.documentId || ''
    });
    setShowLessonModal(true);
  };

  const handleSubmitLesson = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditingLesson && selectedLesson) {
        await curriculumAPI.updateLesson(selectedLesson.lessonId, {
          lessonTitle: lessonForm.lessonTitle,
          content: lessonForm.content,
          duration: lessonForm.duration,
          resources: lessonForm.resources,
          notes: lessonForm.notes,
          documentId: lessonForm.documentId ? parseInt(lessonForm.documentId) : null
        });
      } else {
        await curriculumAPI.createLesson({
          curriculumSessionId: lessonForm.curriculumSessionId,
          lessonNumber: lessonForm.lessonNumber,
          lessonTitle: lessonForm.lessonTitle,
          content: lessonForm.content,
          duration: lessonForm.duration,
          resources: lessonForm.resources,
          notes: lessonForm.notes,
          documentId: lessonForm.documentId ? parseInt(lessonForm.documentId) : null
        });
      }
      
      loadCurriculum();
      setShowLessonModal(false);
      setIsEditingLesson(false);
      setSelectedLesson(null);
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert(error.response?.data?.message || 'Không thể lưu tiết học. Vui lòng thử lại!');
    }
  };

  const handleDeleteDay = async (dayId) => {
    if (window.confirm('Xóa ngày học này? Tất cả buổi học sẽ bị xóa theo!')) {
      try {
        await curriculumAPI.deleteDay(dayId);
        loadCurriculum();
      } catch (error) {
        console.error('Error deleting day:', error);
        alert('Không thể xóa ngày học. Vui lòng thử lại!');
      }
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Xóa buổi học này?')) {
      try {
        await curriculumAPI.deleteSession(sessionId);
        loadCurriculum();
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Không thể xóa buổi học. Vui lòng thử lại!');
      }
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Xóa tiết học này?')) {
      try {
        await curriculumAPI.deleteLesson(lessonId);
        loadCurriculum();
      } catch (error) {
        console.error('Error deleting lesson:', error);
        alert('Không thể xóa tiết học. Vui lòng thử lại!');
      }
    }
  };

  if (!curriculum) {
    return <div>Loading...</div>;
  }

  return (
    <div className="curriculum-detail-container">
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => navigate(-1)}
          style={{ background: '#6c757d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <ArrowBack fontSize="small" />
          Quay lại
        </button>
      </div>

      <div className="curriculum-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <h2>{curriculum.curriculumName}</h2>
            <p style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><School fontSize="small" color="primary" /> {curriculum.courses?.map(c => c.courseName).join(', ') || 'Chưa có khóa học'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><EventNote fontSize="small" color="action" /> {new Date(curriculum.startDate).toLocaleDateString()} - {new Date(curriculum.endDate).toLocaleDateString()}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: curriculum.status === 'Active' ? '#d4edda' : '#f8d7da', color: curriculum.status === 'Active' ? '#155724' : '#721c24', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                {curriculum.status === 'Active' ? 'Đang hoạt động' : curriculum.status}
              </span>
            </p>
            {curriculum.description && (
              <div style={{ marginTop: '12px', background: 'white', padding: '10px 15px', borderRadius: '4px', borderLeft: '3px solid #007bff' }}>
                <p className={!showFullDesc ? 'truncate-text' : ''} style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                  {curriculum.description}
                </p>
                {(curriculum.description.length > 200) && (
                  <button className="btn-link" onClick={() => setShowFullDesc(!showFullDesc)}>
                    {showFullDesc ? 'Thu gọn' : 'Xem thêm'}
                  </button>
                )}
              </div>
            )}
          </div>
          <button 
            className="btn btn-success"
            onClick={() => setShowTeacherModal(true)}
            style={{ flexShrink: 0 }}
          >
            <Group />
            Quản lý giáo viên
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ 
        display: 'flex', 
        borderBottom: '2px solid #e5e7eb', 
        marginBottom: '20px' 
      }}>
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'schedule' ? '2px solid #3b82f6' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'schedule' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'schedule' ? '600' : '400',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <EventNote />
          Lịch học
        </button>
        <button
          onClick={() => setActiveTab('students')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'students' ? '2px solid #3b82f6' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'students' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'students' ? '600' : '400',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Person />
          Học viên ({studentCapacity.max ? `${students.length}/${studentCapacity.max}` : students.length})
        </button>
      </div>

      {activeTab === 'schedule' ? (
        <div className="curriculum-timeline">
          <h3>Lịch sắp xếp buổi học</h3>
        {dateRange.map((date, index) => {
          const dateStr = formatDate(date);
          const curriculumDay = curriculum.curriculumDays?.find(
            d => d.scheduleDate.split('T')[0] === dateStr
          );
          
          return (
            <div key={index} className="date-card">
              <div className="date-header">
                <h4>{date.toLocaleDateString('vi-VN', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
              </div>

              {curriculumDay ? (
                <div className="day-content">
                  <p className="topic"><strong>Chủ đề:</strong> {curriculumDay.topic}</p>
                  <p className="description">{curriculumDay.description}</p>
                  
                  <div className="sessions">
                    <div className="sessions-header">
                      <h5>Buổi học ({curriculumDay.sessionCount}/3)</h5>
                      {curriculumDay.sessionCount < 3 && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleAddSession(curriculumDay)}
                        >
                          <Add />
                          Thêm buổi
                        </button>
                      )}
                    </div>

                    {curriculumDay.curriculumSessions?.length > 0 ? (
                      curriculumDay.curriculumSessions?.map((session) => (
                        <div key={session.curriculumSessionId} className="session-card">
                          <div className="session-header">
                            <AccessTime />
                            <strong>Buổi {session.sessionNumber}: {session.sessionName}</strong>
                            <span className="time">{session.startTime} - {session.endTime}</span>
                          </div>
                          <p className="room"><Room />
                          Phòng: {session.roomName || 'Chưa xếp phòng'}</p>
                          <p className="teacher"><Person />
                          Giảng viên: {session.teacherName || 'Chưa phân công'}</p>
                          {session.documentId && (
                            <p className="document" style={{ color: '#2196f3', marginTop: '4px' }}>
                              <span style={{ marginRight: '4px' }}>📄</span>
                              Tài liệu: {session.documentTitle || 'Đang tải...'}
                            </p>
                          )}
                          
                          <div className="lessons">
                            <div className="lessons-header">
                              <strong>Tiết học:</strong>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => handleAddLesson(session)}
                                title="Thêm tiết học vào buổi này"
                              >
                                <MenuBook />
                              Thêm tiết
                              </button>
                            </div>

                            {session.lessons?.length > 0 ? (
                              <ul className="lessons-list">
                                {session.lessons.map((lesson) => (
                                  <li key={lesson.lessonId} className="lesson-item">
                                    <div className="lesson-info">
                                      <span className="lesson-num">Tiết {lesson.lessonNumber}</span>
                                      <span className="lesson-title">{lesson.lessonTitle}</span>
                                      <span className="lesson-duration">({lesson.duration})</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                      <button 
                                        className="btn btn-sm btn-info"
                                        onClick={() => handleEditLesson(lesson)}
                                      >
                                        <Edit />
                                        Sửa
                                      </button>
                                      <button 
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDeleteLesson(lesson.lessonId)}
                                      >
                                        <Delete />
                                        Xóa
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="no-lessons">❌ Chưa có tiết học. Nhấp "Thêm tiết" để thêm</p>
                            )}
                          </div>

                          <div className="session-actions" style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                            <button 
                              className="btn btn-sm btn-info"
                              onClick={() => handleEditSession(curriculumDay, session)}
                            >
                              <Edit />
                              Sửa buổi
                            </button>
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => openSessionStudentModal(session)}
                              title="Quản lý học viên theo buổi"
                            >
                              <People />
                              Học viên ({session.studentCount || 0})
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteSession(session.curriculumSessionId)}
                            >
                              <Delete />
                              Xóa buổi
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-sessions">❌ Chưa có buổi học. Nhấp "Thêm buổi" để bắt đầu</p>
                    )}
                  </div>

                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteDay(curriculumDay.curriculumDayId)}
                  >
                    <Delete />
                    Xóa ngày
                  </button>
                </div>
              ) : (
                <div className="day-empty">
                  <p>❌ Chưa có buổi học</p>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddDay(date)}
                  >
                    <Add />
                          Thêm buổi học
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      ) : (
        // Students Tab
        <div className="students-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0 }}>
                Danh sách học viên ({studentCapacity.max ? `${students.length}/${studentCapacity.max}` : students.length})
              </h3>
              {studentCapacity.max && (
                <small style={{ color: studentCapacity.available <= 3 ? '#dc2626' : '#6b7280' }}>
                  {studentCapacity.available > 0 
                    ? `Còn ${studentCapacity.available} chỗ trống` 
                    : 'Đã đầy'}
                </small>
              )}
            </div>
            <button
              className="btn btn-success"
              onClick={() => {
                loadAvailableStudents();
                setShowStudentSelectModal(true);
              }}
              disabled={studentCapacity.available === 0}
              style={{ opacity: studentCapacity.available === 0 ? 0.5 : 1 }}
            >
              <Add />
              Thêm học viên
            </button>
          </div>
          {studentCapacity.available === 0 && (
            <div style={{ background: '#fee2e2', border: '1px solid #dc2626', borderRadius: '4px', padding: '10px', marginBottom: '15px', color: '#dc2626' }}>
              <strong>⚠️ Phòng học đã đạt sức chứa tối đa ({studentCapacity.max} học viên)</strong>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                Các buổi học sau có phòng nhỏ hơn số học viên hiện tại.
              </p>
              <div style={{ marginTop: '10px', padding: '8px', background: '#fef3c7', borderRadius: '4px', color: '#92400e' }}>
                <strong>💡 Gợi ý:</strong> 
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  <li>Chuyển buổi học sang phòng lớn hơn (Lịch học → Sửa buổi)</li>
                  <li>Hoặc tách thành 2 buổi ở 2 phòng khác nhau</li>
                  <li>Hoặc giới hạn số học viên ở mức {studentCapacity.max}</li>
                </ul>
              </div>
            </div>
          )}
          
          {loadingStudents ? (
            <p>Đang tải...</p>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Chưa có học viên nào trong chương trình học này</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  loadAvailableStudents();
                  setShowStudentSelectModal(true);
                }}
                style={{ marginTop: '10px' }}
              >
                Thêm học viên
              </button>
            </div>
          ) : (
            <div className="students-grid" style={{ display: 'grid', gap: '10px' }}>
              {students.map(student => (
                <div
                  key={student.studentId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{student.fullName}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {student.email} | {student.phoneNumber} | Trình độ: {student.level}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveStudent(student.studentId)}
                  >
                    <Delete />
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student Select Modal */}
      {showStudentSelectModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Thêm học viên vào chương trình</h3>
              <button className="close-btn" onClick={() => setShowStudentSelectModal(false)}>
                <Close />
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <p style={{ margin: 0, color: '#666' }}>Chọn học viên để thêm:</p>
                {availableStudents.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link"
                    onClick={toggleSelectAll}
                    style={{ padding: '5px 10px' }}
                  >
                    {selectedStudentIds.length === availableStudents.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                )}
              </div>
              {availableStudents.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {availableStudents.map(student => (
                    <label
                      key={student.studentId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '10px',
                        padding: '10px',
                        background: '#f8f9fa',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.studentId)}
                        onChange={() => toggleStudentSelection(student.studentId)}
                        style={{ width: 'auto', marginRight: '10px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600' }}>{student.fullName}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {student.email} | Trình độ: {student.level}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999' }}>Không có học viên nào khả dụng</p>
              )}
              {selectedStudentIds.length > 0 && (
                <div style={{ marginTop: '15px', padding: '10px', background: '#e0f2fe', borderRadius: '4px' }}>
                  <strong>Đã chọn: {selectedStudentIds.length} học viên</strong>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowStudentSelectModal(false)}>
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddSelectedStudents}
                disabled={selectedStudentIds.length === 0}
              >
                <Add />
                Thêm {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showTeacherModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Quản lý giáo viên tham gia chương trình</h3>
              <button className="close-btn" onClick={() => setShowTeacherModal(false)}>
                <Close />
              </button>
            </div>
            <div className="teacher-list" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
              <p style={{ marginBottom: '15px', color: '#666' }}>Chọn các giáo viên có thể giảng dạy trong chương trình này:</p>
              {teachers.length > 0 ? (
                teachers.map(teacher => (
                  <div key={teacher.teacherId} style={{ marginBottom: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={selectedTeacherIds.includes(parseInt(teacher.teacherId))}
                        onChange={() => handleTeacherToggle(teacher.teacherId)}
                        style={{ width: 'auto', marginRight: '10px' }}
                      />
                      <Person />
                      <span style={{ marginLeft: '8px' }}>
                        <strong>{teacher.fullName}</strong>
                        <span style={{ color: '#666', fontSize: '13px', marginLeft: '5px' }}> ({teacher.email})</span>
                      </span>
                    </label>
                  </div>
                ))
              ) : (
                <p style={{ color: '#999' }}>Không có giáo viên nào</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTeacherModal(false)}>
                Hủy
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveTeachers}>
                Lưu danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Students Modal */}
      {showSessionStudentModal && selectedSessionForStudents && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Quản lý học viên - {selectedSessionForStudents.sessionName}</h3>
              <button className="close-btn" onClick={() => setShowSessionStudentModal(false)}>
                <Close />
              </button>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {/* Capacity Info */}
              <div style={{ 
                background: sessionStudentCapacity.available === 0 ? '#fee2e2' : '#e0f2fe', 
                borderRadius: '4px', 
                padding: '10px', 
                marginBottom: '15px',
                border: sessionStudentCapacity.available === 0 ? '1px solid #dc2626' : 'none'
              }}>
                <strong>
                  {sessionStudentCapacity.max 
                    ? `Sức chứa: ${sessionStudents.length}/${sessionStudentCapacity.max} học viên` 
                    : `${sessionStudents.length} học viên`}
                </strong>
                {sessionStudentCapacity.available !== null && sessionStudentCapacity.available > 0 && (
                  <span style={{ color: '#16a34a', marginLeft: '10px' }}>
                    (Còn {sessionStudentCapacity.available} chỗ)
                  </span>
                )}
                {sessionStudentCapacity.available === 0 && (
                  <span style={{ color: '#dc2626', marginLeft: '10px' }}>
                    (Đã đầy)
                  </span>
                )}
              </div>

              {/* Current Students */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>Học viên đã đăng ký ({sessionStudents.length})</h4>
                {sessionStudents.length > 0 ? (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {sessionStudents.map(student => (
                      <div 
                        key={student.sessionStudentId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px',
                          background: '#f8f9fa',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600' }}>{student.fullName}</div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            {student.email} | {student.level}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveStudentFromSession(student.studentId)}
                        >
                          <Delete />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>Chưa có học viên nào đăng ký buổi này</p>
                )}
              </div>

              {/* Add Students Section */}
              {sessionStudentCapacity.available !== 0 && availableStudentsForSession.length > 0 && (
                <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>Thêm học viên ({availableStudentsForSession.length} có sẵn)</h4>
                    {availableStudentsForSession.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link"
                        onClick={toggleSelectAllForSession}
                      >
                        {selectedSessionStudentIds.length === availableStudentsForSession.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
                    {availableStudentsForSession.map(student => (
                      <label
                        key={student.studentId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '8px',
                          padding: '8px',
                          background: '#f8f9fa',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSessionStudentIds.includes(student.studentId)}
                          onChange={() => toggleSessionStudentSelection(student.studentId)}
                          style={{ width: 'auto', marginRight: '10px' }}
                        />
                        <div>
                          <div style={{ fontWeight: '600' }}>{student.fullName}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {student.email} | {student.level}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedSessionStudentIds.length > 0 && (
                    <div style={{ marginBottom: '10px', padding: '8px', background: '#e0f2fe', borderRadius: '4px' }}>
                      <strong>Đã chọn: {selectedSessionStudentIds.length} học viên</strong>
                    </div>
                  )}
                </div>
              )}

              {sessionStudentCapacity.available === 0 && (
                <div style={{ background: '#fee2e2', border: '1px solid #dc2626', borderRadius: '4px', padding: '10px', color: '#dc2626' }}>
                  <strong>⚠️ Buổi học đã đầy</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
                    Không thể thêm học viên. Phòng đã đạt sức chứa tối đa.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowSessionStudentModal(false)}
              >
                Đóng
              </button>
              {sessionStudentCapacity.available !== 0 && selectedSessionStudentIds.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddStudentsToSession}
                >
                  <Add />
                  Thêm {selectedSessionStudentIds.length > 0 ? `(${selectedSessionStudentIds.length})` : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditingSession ? 'Sửa buổi học' : 'Thêm buổi học'}</h3>
              <button className="close-btn" onClick={() => setShowSessionModal(false)}>
                <Close />
              </button>
            </div>
            <form onSubmit={handleSubmitSession}>
              <div className="form-group">
                <label>Buổi số *</label>
                <input
                  type="number"
                  value={sessionForm.sessionNumber}
                  onChange={(e) => setSessionForm({...sessionForm, sessionNumber: parseInt(e.target.value)})}
                  min="1"
                  max="3"
                  required
                  disabled={!isEditingSession && true}
                />
              </div>
              <div className="form-group">
                <label>Tên buổi *</label>
                <input
                  type="text"
                  value={sessionForm.sessionName}
                  onChange={(e) => setSessionForm({...sessionForm, sessionName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giờ bắt đầu *</label>
                <input
                  type="time"
                  value={sessionForm.startTime}
                  onChange={(e) => setSessionForm({...sessionForm, startTime: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giờ kết thúc *</label>
                <input
                  type="time"
                  value={sessionForm.endTime}
                  onChange={(e) => setSessionForm({...sessionForm, endTime: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ margin: 0 }}>Phòng học</label>
                  <a href="/rooms" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#007bff' }}>
                    + Quản lý danh sách phòng
                  </a>
                </div>
                <select
                  value={sessionForm.roomId}
                  onChange={(e) => setSessionForm({...sessionForm, roomId: e.target.value})}
                >
                  <option value="">-- Chọn phòng học --</option>
                  {rooms.map(room => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.roomName} (Sức chứa: {room.capacity})
                    </option>
                  ))}
                </select>
                {roomInfo && !roomInfo.isAvailable && (
                  <small style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>
                    ⚠️ {roomInfo.conflictMessage}
                  </small>
                )}
                {/* Room Capacity Warning */}
                {sessionForm.roomId && students.length > 0 && (
                  (() => {
                    const selectedRoom = rooms.find(r => r.roomId === parseInt(sessionForm.roomId));
                    if (selectedRoom && selectedRoom.capacity < students.length) {
                      return (
                        <small style={{ color: '#dc2626', display: 'block', marginTop: '5px', background: '#fee2e2', padding: '8px', borderRadius: '4px' }}>
                          ⚠️ <strong>Cảnh báo:</strong> Phòng {selectedRoom.roomName} chỉ chứa {selectedRoom.capacity} người, nhưng hiện có {students.length} học viên đăng ký. Vui lòng chọn phòng lớn hơn hoặc giảm số học viên.
                        </small>
                      );
                    }
                    if (selectedRoom && students.length > 0) {
                      const remaining = selectedRoom.capacity - students.length;
                      return (
                        <small style={{ color: remaining <= 3 ? '#dc2626' : '#16a34a', display: 'block', marginTop: '5px' }}>
                          ✅ Phòng còn {remaining}/{selectedRoom.capacity} chỗ trống ({students.length} học viên)
                        </small>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
              <div className="form-group">
                <label>Giảng viên</label>
                {loadingTeachersAvailability ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>Đang tải...</p>
                ) : (
                  <select
                    value={sessionForm.teacherId}
                    onChange={(e) => setSessionForm({...sessionForm, teacherId: e.target.value})}
                  >
                    <option value="">-- Chọn giảng viên --</option>
                    {teachersWithAvailability.length > 0 ? (
                      teachersWithAvailability.map(teacher => (
                        <option
                          key={teacher.teacherId}
                          value={teacher.teacherId}
                          disabled={teacher.isBusy}
                          style={teacher.isBusy ? { color: '#999' } : {}}
                        >
                          {teacher.fullName} ({teacher.specialization})
                          {teacher.isBusy ? ' - Đang có lịch' : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        Không có giảng viên nào
                      </option>
                    )}
                  </select>
                )}
                {(() => {
                  const busyCount = teachersWithAvailability.filter(t => t.isBusy).length;
                  const availableCount = teachersWithAvailability.filter(t => !t.isBusy).length;
                  return busyCount > 0 ? (
                    <small style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>
                      ⚠️ {busyCount} giảng viên đang bận, {availableCount} giảng viên có thể chọn
                    </small>
                  ) : null;
                })()}
              </div>
              <div className="form-group">
                <label>Tài liệu</label>
                <select
                  value={sessionForm.documentId}
                  onChange={(e) => setSessionForm({...sessionForm, documentId: e.target.value})}
                >
                  <option value="">-- Không chọn tài liệu --</option>
                  {documents.length > 0 ? (
                    documents.map(doc => (
                      <option key={doc.documentId} value={doc.documentId}>
                        {doc.title} ({doc.type})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Không có tài liệu nào
                    </option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={sessionForm.sessionDescription}
                  onChange={(e) => setSessionForm({...sessionForm, sessionDescription: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSessionModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditingSession ? 'Lưu thay đổi' : 'Thêm buổi học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLessonModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditingLesson ? 'Sửa tiết học' : 'Thêm tiết học'}</h3>
              <button className="close-btn" onClick={() => setShowLessonModal(false)}>
                <Close />
              </button>
            </div>
            <form onSubmit={handleSubmitLesson}>
              <div className="form-group">
                <label>Tiết số *</label>
                <input
                  type="number"
                  value={lessonForm.lessonNumber}
                  onChange={(e) => setLessonForm({...lessonForm, lessonNumber: parseInt(e.target.value)})}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tên tiết *</label>
                <input
                  type="text"
                  value={lessonForm.lessonTitle}
                  onChange={(e) => setLessonForm({...lessonForm, lessonTitle: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nội dung</label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({...lessonForm, content: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Thời lượng (giờ:phút) *</label>
                <input
                  type="time"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tài liệu</label>
                <select
                  value={lessonForm.documentId}
                  onChange={(e) => setLessonForm({...lessonForm, documentId: e.target.value})}
                >
                  <option value="">-- Không chọn tài liệu --</option>
                  {documents.length > 0 ? (
                    documents.map(doc => (
                      <option key={doc.documentId} value={doc.documentId}>
                        {doc.title} ({doc.type})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Không có tài liệu nào
                    </option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={lessonForm.notes}
                  onChange={(e) => setLessonForm({...lessonForm, notes: e.target.value})}
                  rows="2"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLessonModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditingLesson ? 'Lưu thay đổi' : 'Thêm tiết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        /* Global & Scope Scrollbar styles for cleaner UI */
        .curriculum-detail-container {
          padding: 20px;
          height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
        }

        .curriculum-detail-container::-webkit-scrollbar,
        .modal-content::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .curriculum-detail-container::-webkit-scrollbar-track,
        .modal-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .curriculum-detail-container::-webkit-scrollbar-thumb,
        .modal-content::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.4);
          border-radius: 10px;
        }

        .curriculum-detail-container::-webkit-scrollbar-thumb:hover,
        .modal-content::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.6);
        }

        .truncate-text {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-link {
          background: none;
          border: none;
          color: #007bff;
          cursor: pointer;
          padding: 0;
          font-size: 13px;
          margin-top: 5px;
          font-weight: 500;
        }

        .btn-link:hover {
          text-decoration: underline;
        }
        
        .lesson-attachment:hover {
          opacity: 0.8;
          transform: scale(1.1);
          transition: all 0.2s ease;
        }

        .curriculum-detail-header {
          margin-bottom: 20px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .curriculum-detail-header h2 {
          margin: 0 0 10px 0;
        }

        .curriculum-detail-header p {
          margin: 0;
          color: #666;
        }

        .curriculum-timeline h3 {
          margin-bottom: 20px;
        }

        .date-range {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }

        .date-card {
          border: 1px solid #ddd;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .date-header {
          background: #007bff;
          color: white;
          padding: 10px 15px;
        }

        .date-header h4 {
          margin: 0;
        }

        .day-content, .day-empty {
          padding: 15px;
        }

        .day-empty {
          text-align: center;
          color: #999;
        }

        .topic {
          margin: 10px 0;
        }

        .description {
          color: #666;
          font-size: 14px;
          margin: 10px 0;
        }

        .sessions {
          margin: 15px 0;
          padding: 15px;
          border-top: 2px solid #007bff;
          background: #f0f7ff;
          border-radius: 5px;
        }

        .sessions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .sessions h5 {
          margin: 0;
          color: #007bff;
          font-size: 16px;
        }

        .no-sessions {
          padding: 15px;
          background: #fff3cd;
          border-left: 3px solid #ffc107;
          border-radius: 3px;
          color: #856404;
          font-size: 13px;
          margin: 10px 0;
        }

        .session-card {
          background: white;
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 5px;
          border-left: 4px solid #17a2b8;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .session-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .session-header strong {
          color: #0056b3;
          font-size: 14px;
        }

        .time {
          background: #17a2b8;
          color: white;
          padding: 3px 10px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: bold;
        }

        .room {
          font-size: 13px;
          margin: 5px 0;
          color: #666;
          background: #f9f9f9;
          padding: 5px;
          border-radius: 3px;
        }

        .lessons {
          margin: 10px 0;
          padding: 10px;
          background: #fafafa;
          border-radius: 3px;
        }

        .lessons-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .lessons-header strong {
          color: #333;
          font-size: 13px;
        }

        .lessons-list {
          list-style: none;
          padding: 0;
          margin: 8px 0;
        }

        .lesson-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: white;
          border-left: 3px solid #28a745;
          margin-bottom: 6px;
          border-radius: 3px;
          font-size: 13px;
        }

        .lesson-info {
          flex: 1;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .lesson-num {
          background: #28a745;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: bold;
          font-size: 11px;
          min-width: 45px;
          text-align: center;
        }

        .lesson-title {
          color: #333;
          font-weight: 500;
        }

        .lesson-duration {
          color: #999;
          font-size: 12px;
        }

        .no-lessons {
          padding: 10px;
          background: #fff3cd;
          border-left: 3px solid #ffc107;
          border-radius: 3px;
          color: #856404;
          font-size: 12px;
          margin: 8px 0;
        }

        .day-empty {
          text-align: center;
          color: #999;
          padding: 20px;
        }

        .day-empty p {
          margin: 10px 0;
          font-size: 14px;
        }

        .modal {
          display: flex;
          position: fixed;
          z-index: 99999;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.4);
          justify-content: center;
          align-items: center;
        }

        .modal-content {
          background-color: #fefefe;
          padding: 20px;
          border: 1px solid #888;
          border-radius: 5px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
          z-index: 100000;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-success {
          background-color: #28a745;
          color: white;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
          margin-right: 5px;
        }

        .btn svg {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
};

export default CurriculumDetail;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teachersAPI, curriculumAPI } from '../../services/api';

const TeacherSchedule = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatTimeHHmm = (value) => {
    if (value === null || value === undefined) return '--:--';
    const s = value.toString();
    return s.length >= 5 ? s.substring(0, 5) : s;
  };

  useEffect(() => {
    loadSchedule();
  }, [teacherId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      // Load teacher info
      const teacherResponse = await teachersAPI.getById(teacherId);
      const teacherData = teacherResponse.data.data || teacherResponse.data;
      setTeacher(teacherData);

      // Load all curriculums
      const curriculumResponse = await curriculumAPI.getAll();
      const allCurriculums = curriculumResponse.data.data || [];

      console.log('All Curriculums:', allCurriculums); // Debug

      // Filter curriculums where teacher is a participant
      const teacherCurriculums = allCurriculums.filter(c =>
        c.participantTeachers?.some(t => t.teacherId === parseInt(teacherId))
      );

      console.log('Teacher Curriculums:', teacherCurriculums); // Debug

      setCurriculums(teacherCurriculums);

      // Build schedule from curriculum sessions
      const scheduleData = [];
      teacherCurriculums.forEach(curriculum => {
        curriculum.curriculumDays?.forEach(day => {
          day.curriculumSessions?.forEach(session => {
            scheduleData.push({
              curriculumId: curriculum.curriculumId,
              curriculumName: curriculum.curriculumName,
              className: curriculum.className,
              scheduleDate: day.scheduleDate,
              topic: day.topic,
              sessionNumber: session.sessionNumber,
              sessionName: session.sessionName,
              startTime: session.startTime,
              endTime: session.endTime,
              roomName: session.roomName || 'Chưa xếp phòng',
              roomId: session.roomId,
              teacherId: session.teacherId,
              teacherName: session.teacherName,
              sessionDescription: session.sessionDescription,
              lessons: session.lessons || [],
              curriculumSessionId: session.curriculumSessionId
            });
          });
        });
      });

      console.log('Schedule Data:', scheduleData); // Debug

      // Sort by date and time
      scheduleData.sort((a, b) => {
        const dateCompare = new Date(a.scheduleDate) - new Date(b.scheduleDate);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });

      setSchedule(scheduleData);
      setError(null);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setError('Lỗi khi tải lịch giảng dạy');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.split('T')[0] + 'T00:00:00');
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getUpcomingSchedule = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return schedule.filter(s => new Date(s.scheduleDate) >= today);
  };

  const getPastSchedule = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return schedule.filter(s => new Date(s.scheduleDate) < today);
  };

  const groupByDate = (data) => {
    const grouped = {};
    data.forEach(item => {
      const date = item.scheduleDate.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/teachers')}>
          Quay lại danh sách giáo viên
        </button>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="error-container">
        <p>Không tìm thấy thông tin giáo viên</p>
        <button className="btn btn-primary" onClick={() => navigate('/teachers')}>
          Quay lại danh sách giáo viên
        </button>
      </div>
    );
  }

  const upcomingSchedule = getUpcomingSchedule();
  const pastSchedule = getPastSchedule();
  const groupedUpcoming = groupByDate(upcomingSchedule);
  const groupedPast = groupByDate(pastSchedule);

  return (
    <div className="teacher-schedule-container">
      <div className="schedule-header">
        <div>
          <h2>Lịch Giảng Dạy</h2>
          <p className="teacher-info">
            <strong>Giáo viên:</strong> {teacher.fullName} | 
            <strong> Email:</strong> {teacher.email} | 
            <strong> SĐT:</strong> {teacher.phoneNumber}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/teachers')}>
          ← Quay lại
        </button>
      </div>

      {curriculums.length === 0 ? (
        <div className="no-curriculum">
          <p>❌ Bạn chưa được thêm vào chương trình học nào</p>
        </div>
      ) : (
        <>
          <div className="curriculum-summary">
            <h4>Chương trình học ({curriculums.length})</h4>
            <div className="curriculum-list">
              {curriculums.map(c => (
                <div key={c.curriculumId} className="curriculum-tag">
                  <strong>{c.curriculumName}</strong>
                  <span className="class-name">{c.className}</span>
                </div>
              ))}
            </div>
          </div>

          {upcomingSchedule.length === 0 ? (
            <div className="no-schedule">
              <p>❌ Không có buổi giảng dạy sắp tới</p>
            </div>
          ) : (
            <div className="schedule-section">
              <h3>📅 Lịch Sắp Tới</h3>
              {Object.entries(groupedUpcoming).map(([date, sessions]) => (
                <div key={date} className="date-group">
                  <div className="date-header-schedule">
                    <h4>{formatDate(date)}</h4>
                    <span className="session-count">{sessions.length} buổi</span>
                  </div>
                  <div className="sessions-container">
                    {sessions.map((session, index) => (
                      <div key={index} className="schedule-item">
                        <div className="session-time">
                          <div className="time-badge">
                            {formatTimeHHmm(session.startTime)}
                          </div>
                          <div className="time-range">
                            Đến {formatTimeHHmm(session.endTime)}
                          </div>
                        </div>

                        <div className="session-details">
                          <div className="session-title">
                            <strong>Buổi {session.sessionNumber}: {session.sessionName}</strong>
                            <span className="curriculum-name">
                              {session.curriculumName}
                            </span>
                          </div>
                          
                          <div className="session-info">
                            <p>
                              <strong>Lớp:</strong> {session.className}
                            </p>
                            <p>
                              <strong>Chủ đề:</strong> {session.topic}
                            </p>
                            <p>
                              <strong>Phòng:</strong> {session.roomName}
                            </p>
                            <p>
                              <strong>Giảng viên:</strong> {session.teacherName || 'Chưa phân công'}
                            </p>
                            {session.sessionDescription && (
                              <p>
                                <strong>Mô tả:</strong> {session.sessionDescription}
                              </p>
                            )}
                          </div>

                          {session.lessons.length > 0 && (
                            <div className="lessons-section">
                              <strong>📚 Tiết học ({session.lessons.length}):</strong>
                              <ul className="lesson-list">
                                {session.lessons.map(lesson => (
                                  <li key={lesson.lessonId}>
                                    <span className="lesson-num">Tiết {lesson.lessonNumber}:</span>
                                    <span className="lesson-title">{lesson.lessonTitle}</span>
                                    {lesson.duration && (
                                      <span className="lesson-duration">({lesson.duration})</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pastSchedule.length > 0 && (
            <div className="schedule-section past-schedule">
              <h3>📋 Lịch Đã Diễn Ra</h3>
              {Object.entries(groupedPast).map(([date, sessions]) => (
                <div key={date} className="date-group">
                  <div className="date-header-schedule">
                    <h4>{formatDate(date)}</h4>
                    <span className="session-count">{sessions.length} buổi</span>
                  </div>
                  <div className="sessions-container">
                    {sessions.map((session, index) => (
                      <div key={index} className="schedule-item past">
                        <div className="session-time">
                          <div className="time-badge">
                            {formatTimeHHmm(session.startTime)}
                          </div>
                          <div className="time-range">
                            Đến {formatTimeHHmm(session.endTime)}
                          </div>
                        </div>

                        <div className="session-details">
                          <div className="session-title">
                            <strong>Buổi {session.sessionNumber}: {session.sessionName}</strong>
                            <span className="curriculum-name">
                              {session.curriculumName}
                            </span>
                          </div>
                          
                          <div className="session-info">
                            <p>
                              <strong>Lớp:</strong> {session.className}
                            </p>
                            <p>
                              <strong>Chủ đề:</strong> {session.topic}
                            </p>
                            <p>
                              <strong>Phòng:</strong> {session.roomName}
                            </p>
                            <p>
                              <strong>Giảng viên:</strong> {session.teacherName || 'Chưa phân công'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        .teacher-schedule-container {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
        }

        .schedule-header h2 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }

        .teacher-info {
          margin: 0;
          font-size: 14px;
          opacity: 0.95;
        }

        .teacher-info strong {
          font-weight: 600;
          margin-right: 5px;
        }

        .curriculum-summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #007bff;
        }

        .curriculum-summary h4 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .curriculum-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .curriculum-tag {
          background: white;
          padding: 10px 15px;
          border-radius: 6px;
          border: 1px solid #007bff;
          display: flex;
          flex-direction: column;
          min-width: 200px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .curriculum-tag strong {
          color: #007bff;
          margin-bottom: 3px;
        }

        .class-name {
          font-size: 12px;
          color: #666;
        }

        .schedule-section {
          margin-bottom: 40px;
        }

        .schedule-section h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 20px;
          padding: 10px 0;
          border-bottom: 2px solid #007bff;
        }

        .past-schedule {
          opacity: 0.8;
        }

        .date-group {
          margin-bottom: 30px;
        }

        .date-header-schedule {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #e8f4f8;
          padding: 15px 20px;
          border-radius: 6px;
          margin-bottom: 15px;
          border-left: 4px solid #17a2b8;
        }

        .date-header-schedule h4 {
          margin: 0;
          color: #0056b3;
          font-size: 16px;
        }

        .session-count {
          background: #17a2b8;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .sessions-container {
          display: grid;
          gap: 15px;
        }

        .schedule-item {
          display: flex;
          gap: 20px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #28a745;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .schedule-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .schedule-item.past {
          border-left-color: #999;
          background: #f9f9f9;
        }

        .session-time {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 80px;
          text-align: center;
        }

        .time-badge {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 16px;
        }

        .schedule-item.past .time-badge {
          background: linear-gradient(135deg, #999 0%, #666 100%);
        }

        .time-range {
          font-size: 12px;
          color: #666;
        }

        .session-details {
          flex: 1;
        }

        .session-title {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 10px;
        }

        .session-title strong {
          font-size: 15px;
          color: #0056b3;
        }

        .curriculum-name {
          font-size: 13px;
          color: #666;
          background: #f0f7ff;
          padding: 3px 8px;
          border-radius: 4px;
          display: inline-block;
          width: fit-content;
        }

        .session-info {
          font-size: 13px;
          color: #666;
        }

        .session-info p {
          margin: 5px 0;
        }

        .session-info strong {
          color: #333;
        }

        .lessons-section {
          margin-top: 12px;
          padding: 12px;
          background: #f5f9ff;
          border-radius: 4px;
          border-left: 3px solid #ffc107;
        }

        .lessons-section strong {
          display: block;
          margin-bottom: 8px;
          color: #0056b3;
        }

        .lesson-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .lesson-list li {
          padding: 5px 0;
          font-size: 12px;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .lesson-num {
          background: #ffc107;
          color: #333;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 600;
          min-width: 55px;
          text-align: center;
        }

        .lesson-title {
          font-weight: 500;
          color: #333;
          flex: 1;
        }

        .lesson-duration {
          color: #999;
          font-size: 11px;
        }

        .no-curriculum,
        .no-schedule {
          padding: 40px;
          text-align: center;
          background: #fff3cd;
          border-radius: 8px;
          border-left: 4px solid #ffc107;
          color: #856404;
        }

        .no-curriculum p,
        .no-schedule p {
          margin: 0;
          font-size: 16px;
        }

        .error-container {
          padding: 40px;
          text-align: center;
          background: #f8d7da;
          border-radius: 8px;
          border-left: 4px solid #dc3545;
          color: #721c24;
        }

        .loading {
          padding: 40px;
          text-align: center;
          font-size: 16px;
          color: #666;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background-color: #0056b3;
        }

        .btn-secondary {
          background-color: rgba(255,255,255,0.3);
          color: white;
          border: 1px solid white;
        }

        .btn-secondary:hover {
          background-color: rgba(255,255,255,0.5);
        }

        @media (max-width: 768px) {
          .schedule-header {
            flex-direction: column;
            gap: 15px;
          }

          .schedule-item {
            flex-direction: column;
          }

          .session-time {
            flex-direction: row;
            justify-content: flex-start;
            gap: 15px;
          }

          .date-header-schedule {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .session-count {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherSchedule;

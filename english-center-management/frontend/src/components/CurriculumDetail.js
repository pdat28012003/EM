import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const CurriculumDetail = () => {
  const { curriculumId } = useParams();
  const [curriculum, setCurriculum] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  
  const [sessionForm, setSessionForm] = useState({
    curriculumDayId: '',
    sessionNumber: 1,
    startTime: '09:00',
    endTime: '10:00',
    sessionName: '',
    sessionDescription: '',
    room: ''
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

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    loadCurriculum();
  }, [curriculumId]);

  useEffect(() => {
    if (curriculum) {
      generateDateRange();
    }
  }, [curriculum]);

  const loadCurriculum = async () => {
    try {
      const response = await axios.get(`${API_URL}/curriculum/${curriculumId}`);
      setCurriculum(response.data);
    } catch (error) {
      console.error('Error loading curriculum:', error);
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

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
      const response = await axios.post(`${API_URL}/curriculum/day`, {
        curriculumId: parseInt(curriculumId),
        scheduleDate: formatDate(date),
        topic: `Học ngày ${date.toLocaleDateString('vi-VN')}`,
        description: ''
      });
      
      const newDay = response.data;
      setSelectedDay(newDay);
      setSessionForm({
        curriculumDayId: newDay.curriculumDayId,
        sessionNumber: 1,
        startTime: '09:00',
        endTime: '10:00',
        sessionName: 'Buổi 1',
        sessionDescription: '',
        room: ''
      });
      
      setShowSessionModal(true);
      loadCurriculum();
    } catch (error) {
      console.error('Error creating day:', error);
      alert('Lỗi khi khởi tạo ngày học');
    }
  };

  const handleAddSession = (day) => {
    if (day.sessionCount >= 3) {
      alert('Một ngày chỉ có thể sắp xếp tối đa 3 buổi học');
      return;
    }
    
    setSelectedDay(day);
    setSessionForm({
      curriculumDayId: day.curriculumDayId,
      sessionNumber: day.sessionCount + 1,
      startTime: '09:00',
      endTime: '10:00',
      sessionName: `Buổi ${day.sessionCount + 1}`,
      sessionDescription: '',
      room: ''
    });
    setShowSessionModal(true);
  };

  const handleSubmitSession = async (e) => {
    e.preventDefault();
    
    if (new Date(`2000-01-01 ${sessionForm.startTime}`) >= new Date(`2000-01-01 ${sessionForm.endTime}`)) {
      alert('Giờ bắt đầu phải trước giờ kết thúc');
      return;
    }

    try {
      await axios.post(`${API_URL}/curriculum/session`, {
        curriculumDayId: sessionForm.curriculumDayId,
        sessionNumber: sessionForm.sessionNumber,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        sessionName: sessionForm.sessionName,
        sessionDescription: sessionForm.sessionDescription,
        room: sessionForm.room
      });
      
      loadCurriculum();
      setShowSessionModal(false);
    } catch (error) {
      console.error('Error creating session:', error);
      alert(error.response?.data?.message || 'Error creating session');
    }
  };

  const handleAddLesson = (session) => {
    setSelectedSession(session);
    setLessonForm({
      curriculumSessionId: session.curriculumSessionId,
      lessonNumber: (session.lessons?.length || 0) + 1,
      lessonTitle: '',
      content: '',
      duration: '01:00',
      resources: '',
      notes: ''
    });
    setShowLessonModal(true);
  };

  const handleSubmitLesson = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API_URL}/curriculum/lesson`, {
        curriculumSessionId: lessonForm.curriculumSessionId,
        lessonNumber: lessonForm.lessonNumber,
        lessonTitle: lessonForm.lessonTitle,
        content: lessonForm.content,
        duration: lessonForm.duration,
        resources: lessonForm.resources,
        notes: lessonForm.notes
      });
      
      loadCurriculum();
      setShowLessonModal(false);
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Error creating lesson');
    }
  };

  const handleDeleteDay = async (dayId) => {
    if (window.confirm('Bạn chắc chắn muốn xóa ngày này?')) {
      try {
        await axios.delete(`${API_URL}/curriculum/day/${dayId}`);
        loadCurriculum();
      } catch (error) {
        console.error('Error deleting day:', error);
        alert('Error deleting day');
      }
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Bạn chắc chắn muốn xóa buổi học này?')) {
      try {
        await axios.delete(`${API_URL}/curriculum/session/${sessionId}`);
        loadCurriculum();
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Error deleting session');
      }
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Bạn chắc chắn muốn xóa tiết học này?')) {
      try {
        await axios.delete(`${API_URL}/curriculum/lesson/${lessonId}`);
        loadCurriculum();
      } catch (error) {
        console.error('Error deleting lesson:', error);
        alert('Error deleting lesson');
      }
    }
  };

  if (!curriculum) {
    return <div>Loading...</div>;
  }

  return (
    <div className="curriculum-detail-container">
      <div className="curriculum-detail-header">
        <h2>{curriculum.curriculumName}</h2>
        <p>Lớp: {curriculum.className} | {new Date(curriculum.startDate).toLocaleDateString()} - {new Date(curriculum.endDate).toLocaleDateString()}</p>
      </div>

      <div className="curriculum-timeline">
        <h3>Lịch sắp xếp buổi học</h3>
        
        <div className="date-range">
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
                            + Thêm buổi
                          </button>
                        )}
                      </div>

                      {curriculumDay.curriculumSessions?.length > 0 ? (
                        curriculumDay.curriculumSessions?.map((session) => (
                          <div key={session.curriculumSessionId} className="session-card">
                            <div className="session-header">
                              <strong>📚 Buổi {session.sessionNumber}: {session.sessionName}</strong>
                              <span className="time">{session.startTime} - {session.endTime}</span>
                            </div>
                            <p className="room">Phòng: {session.room}</p>
                            
                            <div className="lessons">
                              <div className="lessons-header">
                                <strong>Tiết học:</strong>
                                <button 
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleAddLesson(session)}
                                  title="Thêm tiết học vào buổi này"
                                >
                                  + Thêm tiết
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
                                      <button 
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDeleteLesson(lesson.lessonId)}
                                      >
                                        Xóa
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="no-lessons">❌ Chưa có tiết học. Nhấp "+ Thêm tiết" để thêm</p>
                              )}
                            </div>

                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteSession(session.curriculumSessionId)}
                            >
                              Xóa buổi
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="no-sessions">❌ Chưa có buổi học. Nhấp "+ Thêm buổi" để bắt đầu</p>
                      )}
                    </div>

                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteDay(curriculumDay.curriculumDayId)}
                    >
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
                      + Thêm buổi học
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showSessionModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Thêm buổi học</h3>
              <button className="close-btn" onClick={() => setShowSessionModal(false)}>×</button>
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
                  disabled
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
                <label>Phòng học</label>
                <input
                  type="text"
                  value={sessionForm.room}
                  onChange={(e) => setSessionForm({...sessionForm, room: e.target.value})}
                />
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
                  Thêm
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
              <h3>Thêm tiết học</h3>
              <button className="close-btn" onClick={() => setShowLessonModal(false)}>×</button>
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
                <input
                  type="text"
                  value={lessonForm.resources}
                  onChange={(e) => setLessonForm({...lessonForm, resources: e.target.value})}
                />
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
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .curriculum-detail-container {
          padding: 20px;
        }

        .curriculum-detail-header {
          margin-bottom: 30px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 5px;
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
          z-index: 1;
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
      `}</style>
    </div>
  );
};

export default CurriculumDetail;

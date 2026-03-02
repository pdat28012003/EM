import React, { useState, useEffect } from 'react';
import { curriculumAPI, classesAPI, teachersAPI } from '../services/api';

const Curriculum = () => {
  const [curriculums, setCurriculums] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [selectedCurriculumForTeachers, setSelectedCurriculumForTeachers] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [formData, setFormData] = useState({
    curriculumName: '',
    classId: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  useEffect(() => {
    loadCurriculums();
    loadClasses();
    loadTeachers();
  }, []);

  const loadCurriculums = async () => {
    try {
      const response = await curriculumAPI.getAll();
      console.log('Curriculums Response:', response.data);
      setCurriculums(response.data);
    } catch (error) {
      console.error('Error loading curriculums:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(response.data);
    } catch (error) {
      console.error('Error loading classes:', error);
      alert('Lỗi khi tải dữ liệu lớp học');
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await teachersAPI.getAll({ isActive: true });
      setTeachers(response.data);
    } catch (error) {
      console.error('Error loading teachers:', error);
      alert('Lỗi khi tải dữ liệu giáo viên');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.curriculumName || !formData.classId || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert('Start date must be before end date');
      return;
    }

    try {
      if (editingCurriculum) {
        await curriculumAPI.update(editingCurriculum.curriculumId, {
          CurriculumName: formData.curriculumName,
          StartDate: formData.startDate,
          EndDate: formData.endDate,
          Description: formData.description,
          Status: editingCurriculum.status,
          ParticipantTeacherIds: []
        });
      } else {
        await curriculumAPI.create({
          CurriculumName: formData.curriculumName,
          ClassId: parseInt(formData.classId),
          StartDate: formData.startDate,
          EndDate: formData.endDate,
          Description: formData.description,
          ParticipantTeacherIds: []
        });
      }
      
      loadCurriculums();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving curriculum:', error);
      console.error('Error details:', error.response?.data);
      alert('Error saving curriculum: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (curriculum) => {
    setEditingCurriculum(curriculum);
    setFormData({
      curriculumName: curriculum.curriculumName,
      classId: curriculum.classId,
      startDate: curriculum.startDate.split('T')[0],
      endDate: curriculum.endDate.split('T')[0],
      description: curriculum.description
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this curriculum?')) {
      try {
        await curriculumAPI.delete(id);
        loadCurriculums();
      } catch (error) {
        console.error('Error deleting curriculum:', error);
        alert('Error deleting curriculum');
      }
    }
  };

  const openTeacherModal = (curriculum) => {
    setSelectedCurriculumForTeachers(curriculum);
    const teacherIds = curriculum.participantTeachers?.map(t => parseInt(t.teacherId)) || [];
    setSelectedTeacherIds(teacherIds);
    setShowTeacherModal(true);
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
    if (!selectedCurriculumForTeachers || !selectedCurriculumForTeachers.curriculumId) {
      alert('Lỗi: Không tìm thấy chương trình học');
      return;
    }

    try {
      const curriculumId = selectedCurriculumForTeachers.curriculumId;
      
      // Convert teacher IDs to numbers
      const teacherIds = selectedTeacherIds.map(id => 
        typeof id === 'string' ? parseInt(id) : id
      );

      console.log('Saving Teachers:', {
        curriculumId,
        curriculumName: selectedCurriculumForTeachers.curriculumName,
        startDate: selectedCurriculumForTeachers.startDate,
        endDate: selectedCurriculumForTeachers.endDate,
        description: selectedCurriculumForTeachers.description,
        status: selectedCurriculumForTeachers.status,
        participantTeacherIds: teacherIds
      });

      // Send PascalCase property names to match backend DTO
      await curriculumAPI.update(curriculumId, {
        CurriculumName: selectedCurriculumForTeachers.curriculumName,
        StartDate: selectedCurriculumForTeachers.startDate,
        EndDate: selectedCurriculumForTeachers.endDate,
        Description: selectedCurriculumForTeachers.description,
        Status: selectedCurriculumForTeachers.status,
        ParticipantTeacherIds: teacherIds
      });

      loadCurriculums();
      setShowTeacherModal(false);
      alert('Cập nhật giáo viên thành công');
    } catch (error) {
      console.error('Error saving teachers:', error);
      alert('Lỗi khi cập nhật giáo viên: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      curriculumName: '',
      classId: '',
      startDate: '',
      endDate: '',
      description: ''
    });
    setEditingCurriculum(null);
  };

  return (
    <div className="curriculum-container">
      <div className="curriculum-header">
        <h2>Quản lý Chương trình học</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Tạo chương trình mới
        </button>
      </div>

      <table className="curriculum-table">
        <thead>
          <tr>
            <th>Tên chương trình</th>
            <th>Lớp học</th>
            <th>Ngày bắt đầu</th>
            <th>Ngày kết thúc</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {curriculums.map((curriculum) => (
            <tr key={curriculum.curriculumId}>
              <td>{curriculum.curriculumName}</td>
              <td>{curriculum.className}</td>
              <td>{new Date(curriculum.startDate).toLocaleDateString()}</td>
              <td>{new Date(curriculum.endDate).toLocaleDateString()}</td>
              <td>{curriculum.status}</td>
              <td>
                <button 
                  className="btn btn-sm btn-info"
                  onClick={() => window.location.href = `/curriculum/${curriculum.curriculumId}`}
                >
                  Chi tiết
                </button>
                <button 
                  className="btn btn-sm btn-success"
                  onClick={() => openTeacherModal(curriculum)}
                  title="Quản lý giáo viên"
                >
                  👨‍🏫 Giáo viên
                </button>
                <button 
                  className="btn btn-sm btn-warning"
                  onClick={() => handleEdit(curriculum)}
                >
                  Sửa
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(curriculum.curriculumId)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCurriculum ? 'Chỉnh sửa chương trình' : 'Tạo chương trình mới'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên chương trình *</label>
                <input
                  type="text"
                  name="curriculumName"
                  value={formData.curriculumName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {!editingCurriculum && (
                <div className="form-group">
                  <label>Lớp học *</label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Chọn lớp học</option>
                    {classes.map((c) => (
                      <option key={c.classId} value={c.classId}>
                        {c.className}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Ngày bắt đầu *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ngày kết thúc *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCurriculum ? 'Cập nhật' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeacherModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Quản lý giáo viên - {selectedCurriculumForTeachers?.curriculumName}</h3>
              <button className="close-btn" onClick={() => setShowTeacherModal(false)}>×</button>
            </div>
            <div className="teacher-list">
              <p style={{ marginBottom: '15px', color: '#666' }}>Chọn các giáo viên tham gia chương trình này:</p>
              {teachers.length > 0 ? (
                teachers.map(teacher => (
                  <div key={teacher.teacherId} className="teacher-checkbox-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedTeacherIds.includes(parseInt(teacher.teacherId))}
                        onChange={() => handleTeacherToggle(teacher.teacherId)}
                      />
                      <span className="teacher-name">
                        <strong>{teacher.fullName}</strong>
                        <span className="teacher-email"> ({teacher.email})</span>
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
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .curriculum-container {
          padding: 20px;
        }

        .curriculum-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .curriculum-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .curriculum-table thead {
          background-color: #f8f9fa;
        }

        .curriculum-table th, .curriculum-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }

        .curriculum-table tr:hover {
          background-color: #f5f5f5;
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
          width: 500px;
          max-height: 90vh;
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

        .btn-primary:hover {
          background-color: #0056b3;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-warning {
          background-color: #ffc107;
          color: black;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-info {
          background-color: #17a2b8;
          color: white;
        }

        .btn-success {
          background-color: #28a745;
          color: white;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
          margin-right: 5px;
        }

        .teacher-list {
          max-height: 400px;
          overflow-y: auto;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f9f9f9;
        }

        .teacher-checkbox-item {
          margin-bottom: 12px;
          padding: 10px;
          background-color: white;
          border-radius: 4px;
          border-left: 3px solid #007bff;
        }

        .teacher-checkbox-item label {
          display: flex;
          align-items: center;
          margin: 0;
          cursor: pointer;
        }

        .teacher-checkbox-item input[type="checkbox"] {
          width: auto;
          margin-right: 10px;
          cursor: pointer;
        }

        .teacher-name {
          flex: 1;
        }

        .teacher-email {
          color: #666;
          font-size: 13px;
          margin-left: 5px;
        }
      `}</style>
    </div>
  );
};

export default Curriculum;

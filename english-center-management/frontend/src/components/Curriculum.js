import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Curriculum = () => {
  const [curriculums, setCurriculums] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    curriculumName: '',
    classId: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    loadCurriculums();
    loadClasses();
  }, []);

  const loadCurriculums = async () => {
    try {
      const response = await axios.get(`${API_URL}/curriculum`);
      setCurriculums(response.data);
    } catch (error) {
      console.error('Error loading curriculums:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await axios.get(`${API_URL}/classes`);
      setClasses(response.data);
    } catch (error) {
      console.error('Error loading classes:', error);
      alert('Lỗi khi tải dữ liệu lớp học');
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
        await axios.put(`${API_URL}/curriculum/${editingCurriculum.curriculumId}`, {
          curriculumName: formData.curriculumName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description,
          status: editingCurriculum.status
        });
      } else {
        await axios.post(`${API_URL}/curriculum`, {
          curriculumName: formData.curriculumName,
          classId: parseInt(formData.classId),
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description
        });
      }
      
      loadCurriculums();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving curriculum:', error);
      alert('Error saving curriculum');
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
        await axios.delete(`${API_URL}/curriculum/${id}`);
        loadCurriculums();
      } catch (error) {
        console.error('Error deleting curriculum:', error);
        alert('Error deleting curriculum');
      }
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

        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
          margin-right: 5px;
        }
      `}</style>
    </div>
  );
};

export default Curriculum;

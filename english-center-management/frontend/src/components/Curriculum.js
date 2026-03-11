import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Info, People } from '@mui/icons-material';
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
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
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
  }, [paginationModel]);
  
  const loadCurriculums = async () => {
    try {
      const response = await curriculumAPI.getAll({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });
      console.log('Curriculums Response:', response.data);
      const curriculumData = Array.isArray(response.data?.Data) ? response.data.Data : Array.isArray(response.data?.data) ? response.data.data : [];
      setCurriculums(curriculumData);
      setRowCount(response.data?.TotalCount || response.data?.totalCount || 0);
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
      const teachersData = response.data?.Data || response.data?.data || response.data || [];
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
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
      setPaginationModel(prev => ({ ...prev, page: 0 }));
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
        setPaginationModel(prev => ({ ...prev, page: 0 }));
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
      setPaginationModel(prev => ({ ...prev, page: 0 }));
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

  const columns = [
    { field: 'curriculumId', headerName: 'ID', width: 70 },
    { field: 'curriculumName', headerName: 'Tên chương trình', width: 200 },
    { field: 'className', headerName: 'Lớp học', width: 150 },
    {
      field: 'startDate',
      headerName: 'Ngày bắt đầu',
      width: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN'),
    },
    {
      field: 'endDate',
      headerName: 'Ngày kết thúc',
      width: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN'),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Active' ? 'success' : params.value === 'Draft' ? 'default' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 300,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            color="info"
            onClick={() => window.location.href = `/curriculum/${params.row.curriculumId}`}
            title="Chi tiết"
          >
            <Info />
          </IconButton>
          <IconButton
            size="small"
            color="success"
            onClick={() => openTeacherModal(params.row)}
            title="Quản lý giáo viên"
          >
            <People />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEdit(params.row)}
            title="Sửa"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.curriculumId)}
            title="Xóa"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý Chương trình học
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Tạo chương trình mới
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={curriculums}
          columns={columns}
          getRowId={(row) => row.curriculumId}
          loading={false}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[1, 10, 25, 50]}
          rowCount={rowCount}
          paginationMode="server"
          disableSelectionOnClick
        />
      </Paper>

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

        .btn-secondary {
          background-color: #6c757d;
          color: white;
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
    </Container>
  );
};

export default Curriculum;

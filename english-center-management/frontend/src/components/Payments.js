import React, { useEffect, useState } from 'react';
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
  MenuItem,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add } from '@mui/icons-material';
import { paymentsAPI, studentsAPI } from '../services/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'Cash',
    notes: '',
  });

  const paymentMethods = ['Cash', 'Card', 'Transfer'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, studentsRes] = await Promise.all([
        paymentsAPI.getAll(),
        studentsAPI.getAll({ isActive: true }),
      ]);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setStudents(Array.isArray(studentsRes.data?.data) ? studentsRes.data.data : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      studentId: '',
      amount: '',
      paymentMethod: 'Cash',
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await paymentsAPI.create({
        ...formData,
        studentId: parseInt(formData.studentId),
        amount: parseFloat(formData.amount),
      });
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Có lỗi xảy ra khi lưu thông tin thanh toán');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const columns = [
    { field: 'paymentId', headerName: 'ID', width: 70 },
    { field: 'studentName', headerName: 'Học Viên', width: 200 },
    {
      field: 'amount',
      headerName: 'Số Tiền',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: 'paymentDate',
      headerName: 'Ngày Thanh Toán',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('vi-VN'),
    },
    { field: 'paymentMethod', headerName: 'Phương Thức', width: 130 },
    {
      field: 'status',
      headerName: 'Trạng Thái',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'Completed'
              ? 'success'
              : params.value === 'Pending'
              ? 'warning'
              : 'error'
          }
          size="small"
        />
      ),
    },
    { field: 'notes', headerName: 'Ghi Chú', width: 250 },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản Lý Thanh Toán
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Thêm Thanh Toán
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={payments}
          columns={columns}
          getRowId={(row) => row.paymentId}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Thanh Toán Mới</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="studentId"
              label="Học Viên"
              select
              value={formData.studentId}
              onChange={handleInputChange}
              required
              fullWidth
            >
              {students.map((student) => (
                <MenuItem key={student.studentId} value={student.studentId}>
                  {student.fullName} - {student.email}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="amount"
              label="Số Tiền (VND)"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              name="paymentMethod"
              label="Phương Thức Thanh Toán"
              select
              value={formData.paymentMethod}
              onChange={handleInputChange}
              required
              fullWidth
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="notes"
              label="Ghi Chú"
              value={formData.notes}
              onChange={handleInputChange}
              multiline
              rows={3}
              fullWidth
              placeholder="VD: Thanh toán học phí tháng 1"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            Thêm Mới
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Payments;

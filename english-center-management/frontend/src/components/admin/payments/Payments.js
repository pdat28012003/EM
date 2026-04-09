import React, { useEffect, useState, useMemo } from 'react';
import {
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
  Menu,
  Fade,
  useTheme,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { MoreVert, Receipt, CheckCircle, Print, Add } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { paymentsAPI, studentsAPI } from '../../../services/api';

const Payments = () => {
  const theme = useTheme();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPaymentForMenu, setSelectedPaymentForMenu] = useState(null);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'Cash',
    notes: '',
  });

  const statusStyle = useMemo(() => {
    const active = theme.palette.success.main;
    const activeTextLight = theme.palette.mode === 'light' ? theme.palette.success.dark : active;
    const warning = theme.palette.warning.main;
    const warningTextLight = theme.palette.mode === 'light' ? theme.palette.warning.dark : warning;
    const error = theme.palette.error.main;
    const errorTextLight = theme.palette.mode === 'light' ? theme.palette.error.dark : error;
    return {
      completed: {
        bg: alpha(active, theme.palette.mode === 'dark' ? 0.22 : 0.12),
        text: activeTextLight,
        border: alpha(active, theme.palette.mode === 'dark' ? 0.35 : 0.25),
      },
      pending: {
        bg: alpha(warning, theme.palette.mode === 'dark' ? 0.22 : 0.12),
        text: warningTextLight,
        border: alpha(warning, theme.palette.mode === 'dark' ? 0.35 : 0.25),
      },
      failed: {
        bg: alpha(error, theme.palette.mode === 'dark' ? 0.22 : 0.12),
        text: errorTextLight,
        border: alpha(error, theme.palette.mode === 'dark' ? 0.35 : 0.25),
      },
    };
  }, [theme.palette.mode, theme.palette.success.dark, theme.palette.success.main, theme.palette.warning.dark, theme.palette.warning.main, theme.palette.error.dark, theme.palette.error.main]);

  const paymentMethods = ['Cash', 'Card', 'Transfer'];

  useEffect(() => {
    loadData();
  }, [paginationModel, selectedStatusFilter, selectedMethodFilter, dateFrom, dateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      };
      if (selectedStatusFilter !== 'all') {
        params.status = selectedStatusFilter;
      }
      if (selectedMethodFilter !== 'all') {
        params.paymentMethod = selectedMethodFilter;
      }
      if (dateFrom) {
        params.dateFrom = dateFrom;
      }
      if (dateTo) {
        params.dateTo = dateTo;
      }
      const [paymentsRes, studentsRes] = await Promise.all([
        paymentsAPI.getAll(params),
        studentsAPI.getAll({ isActive: true }),
      ]);
      
      const paymentsData = Array.isArray(paymentsRes.data?.data) ? paymentsRes.data.data : [];
      setPayments(paymentsData);
      setStudents(Array.isArray(studentsRes.data?.data) ? studentsRes.data.data : []);
      setRowCount(paymentsRes.data?.totalCount || paymentsData.length);
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

  const handleOpenMenu = (event, payment) => {
    setAnchorEl(event.currentTarget);
    setSelectedPaymentForMenu(payment);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedPaymentForMenu(null);
  };

  const handleViewDetails = () => {
    // TODO: Implement view details
    alert('Xem chi tiết hóa đơn: ' + selectedPaymentForMenu?.paymentId);
    handleCloseMenu();
  };

  const handleApprovePayment = () => {
    setConfirmApproveOpen(true);
    handleCloseMenu();
  };

  const handleConfirmApprove = () => {
    // TODO: Implement actual approve logic
    alert('Thanh toán đã được phê duyệt: ' + selectedPaymentForMenu?.paymentId);
    setConfirmApproveOpen(false);
  };

  const handleCloseConfirm = () => {
    setConfirmApproveOpen(false);
  };

  const handlePrintReceipt = () => {
    // TODO: Implement print receipt
    alert('In biên lai: ' + selectedPaymentForMenu?.paymentId);
    handleCloseMenu();
  };

  const handleClearFilters = () => {
    setSelectedStatusFilter('all');
    setSelectedMethodFilter('all');
    setDateFrom('');
    setDateTo('');
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleSubmit = async () => {
    try {
      await paymentsAPI.create({
        ...formData,
        studentId: parseInt(formData.studentId),
        amount: parseFloat(formData.amount),
      });
      handleCloseDialog();
      setPaginationModel(prev => ({ ...prev, page: 0 }));
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
    {
      field: 'studentName',
      headerName: 'Học Viên',
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 1 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {params.row.studentName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            ID: {params.row.studentId}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'amount',
      headerName: 'Số Tiền',
      width: 160,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(params.value)}
        </Typography>
      ),
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
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const status = params.value?.toLowerCase();
        const s = status === 'completed' ? statusStyle.completed :
                 status === 'pending' ? statusStyle.pending :
                 statusStyle.failed;
        return (
          <Chip
            label={params.value}
            size="small"
            sx={{
              bgcolor: s.bg,
              color: s.text,
              border: '1px solid',
              borderColor: s.border,
              fontWeight: 800,
              borderRadius: 1.5,
              fontSize: '0.7rem',
              height: 22,
              minWidth: 88,
            }}
          />
        );
      },
    },
    { field: 'notes', headerName: 'Ghi Chú', width: 200 },
    {
      field: 'actions',
      headerName: 'Hành Động',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => handleOpenMenu(e, params.row)}
          sx={{ color: 'text.secondary' }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
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

      <Paper sx={{ p: 1.5, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small" margin="dense">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={selectedStatusFilter}
                label="Trạng thái"
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="completed">Hoàn thành</MenuItem>
                <MenuItem value="pending">Đang chờ</MenuItem>
                <MenuItem value="failed">Thất bại</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small" margin="dense">
              <InputLabel>Phương thức</InputLabel>
              <Select
                value={selectedMethodFilter}
                label="Phương thức"
                onChange={(e) => setSelectedMethodFilter(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {paymentMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Từ ngày"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Đến ngày"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="outlined" fullWidth onClick={handleClearFilters} sx={{ py: 1.2 }}>
              Xóa bộ lọc
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={payments}
          columns={columns}
          getRowId={(row) => row.paymentId}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[1, 10, 25, 50]}
          rowCount={rowCount}
          paginationMode="server"
          disableSelectionOnClick
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={handleViewDetails}>
          <Receipt fontSize="small" sx={{ mr: 1 }} />
          Xem chi tiết
        </MenuItem>
        <MenuItem onClick={handleApprovePayment}>
          <CheckCircle fontSize="small" sx={{ mr: 1 }} />
          Duyệt thanh toán
        </MenuItem>
        <MenuItem onClick={handlePrintReceipt}>
          <Print fontSize="small" sx={{ mr: 1 }} />
          In biên lai
        </MenuItem>
      </Menu>

      <Dialog open={confirmApproveOpen} onClose={handleCloseConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận thanh toán</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xác nhận thanh toán này không?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>Hủy</Button>
          <Button onClick={handleConfirmApprove} variant="contained" color="primary">
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};

export default Payments;

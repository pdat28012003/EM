import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  QrCodeScanner,
  Payment,
  History,
  CheckCircle,
  RadioButtonUnchecked,
  TaskAlt,
} from '@mui/icons-material';
import signalR from '../../../services/signalr';
import { paymentAPI, authAPI } from '../../../services/api';

const StudentPayment = () => {
  const [studentId, setStudentId] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyDialog, setHistoryDialog] = useState(false);

  useEffect(() => {
    // Get studentId from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      let id = parsedUser.studentId;

      // Fallback if studentId is missing
      if (!id) {
        const fetchProfile = async () => {
          try {
            const profileRes = await authAPI.getProfile();
            const profileData = profileRes.data?.data || profileRes.data;
            if (profileData && profileData.studentId) {
              id = profileData.studentId;
              const updatedUser = { ...parsedUser, studentId: id };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setStudentId(id);
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
          }
        };
        fetchProfile();
      } else {
        setStudentId(id);
      }
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      loadEnrolledCourses();
      loadPaymentHistory();
    }
  }, [studentId]);

  const connectionRef = React.useRef(null);

  useEffect(() => {
    // Setup SignalR connection for real-time payment updates
    if (!connectionRef.current) {
      connectionRef.current = signalR.createHubConnection();
    }

    const startConnection = async () => {
      try {
        if (connectionRef.current.state === 'Disconnected') {
          await connectionRef.current.start();
          console.log('Connected to payment hub');
          
          if (currentPayment) {
            await connectionRef.current.invoke('JoinPaymentGroup', currentPayment.paymentId.toString());
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('SignalR connection error:', err);
        }
      }
    };

    startConnection();

    const handleStatusChange = (data) => {
      if (currentPayment && data.paymentId === currentPayment.paymentId) {
        setPaymentStatus(data.status);
        if (data.status === 'Completed' || data.status === 'Complete') {
          setTimeout(() => {
            setQrDialog(false);
            loadEnrolledCourses();
            loadPaymentHistory();
          }, 2000);
        }
      }
    };

    connectionRef.current.on('PaymentStatusChanged', handleStatusChange);

    return () => {
      if (connectionRef.current) {
        connectionRef.current.off('PaymentStatusChanged', handleStatusChange);
      }
    };
  }, [currentPayment]);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getStudentEnrolledCourses(studentId);
      setEnrolledCourses(response.data);
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const response = await paymentAPI.getStudentPaymentHistory(studentId);
      setPaymentHistory(response.data);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const handleCourseSelection = (courseId) => {
    setSelectedCourses(prev => {
      const isSelected = prev.includes(courseId);
      if (isSelected) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const calculateTotal = () => {
    if (!enrolledCourses || !enrolledCourses.courses) return 0;
    return selectedCourses.reduce((total, courseId) => {
      const course = enrolledCourses.courses.find(c => c.courseId === courseId);
      return total + (course ? course.fee : 0);
    }, 0);
  };

  const handlePayment = async () => {
    if (selectedCourses.length === 0) {
      alert('Vui lòng chọn ít nhất một khóa học để thanh toán');
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        studentId: studentId,
        courseIds: selectedCourses,
        amount: calculateTotal(),
        notes: `Thanh toán cho ${selectedCourses.length} khóa học`
      };

      const response = await paymentAPI.createPayment(paymentData);
      setCurrentPayment(response.data);
      setPaymentDialog(false);
      setQrDialog(true);
      setPaymentStatus('Pending');

      // The JoinPaymentGroup is handled in the SignalR useEffect
      // when currentPayment is updated

    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Complete':
        return 'success';
      case 'Pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
      case 'Complete':
        return <CheckCircle color="success" />;
      case 'Pending':
        return <RadioButtonUnchecked color="warning" />;
      default:
        return <TaskAlt />;
    }
  };

  if (loading && !enrolledCourses) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Thanh Toán Học Phí
        </Typography>
        <Button
          variant="outlined"
          startIcon={<History />}
          onClick={() => setHistoryDialog(true)}
        >
          Lịch Sử Thanh Toán
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Các Khóa Học Đã Đăng Ký
        </Typography>

        {!enrolledCourses || enrolledCourses.courses?.length === 0 ? (
          <Alert severity="info">
            Bạn chưa đăng ký khóa học nào.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedCourses.length > 0 &&
                          selectedCourses.length < enrolledCourses?.courses.filter(c => !c.isPaid).length
                        }
                        checked={
                          selectedCourses.length === enrolledCourses?.courses?.filter(c => !c.isPaid).length &&
                          selectedCourses.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCourses(
                              enrolledCourses?.courses?.filter(c => !c.isPaid).map(c => c.courseId) || []
                            );
                          } else {
                            setSelectedCourses([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>Mã Khóa Học</TableCell>
                    <TableCell>Tên Khóa Học</TableCell>
                    <TableCell align="right">Học Phí</TableCell>
                    <TableCell align="center">Trạng Thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enrolledCourses?.courses?.map((course) => (
                    <TableRow
                      key={course.courseId}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        opacity: course.isPaid ? 0.6 : 1
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          disabled={course.isPaid}
                          checked={selectedCourses.includes(course.courseId) || course.isPaid}
                          onChange={() => handleCourseSelection(course.courseId)}
                        />
                      </TableCell>
                      <TableCell>{course.courseCode}</TableCell>
                      <TableCell>{course.courseName}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(course.fee)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {course.isPaid ? (
                          <Chip
                            icon={<CheckCircle />}
                            label="Đã thanh toán"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<RadioButtonUnchecked />}
                            label="Chưa thanh toán"
                            color="default"
                            size="small"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Tổng Cộng: {formatCurrency(calculateTotal())}
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Payment />}
                disabled={selectedCourses.length === 0}
                onClick={() => setPaymentDialog(true)}
              >
                Thanh Toán ({selectedCourses.length} khóa học)
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xác Nhận Thanh Toán</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bạn đang thanh toán cho {selectedCourses.length} khóa học:
          </Typography>
          <Box sx={{ mt: 2, mb: 2 }}>
            {selectedCourses.map(courseId => {
              const course = enrolledCourses?.courses?.find(c => c.courseId === courseId);
              return (
                <Box key={courseId} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography>{course?.courseName}</Typography>
                  <Typography fontWeight="bold">{formatCurrency(course?.fee || 0)}</Typography>
                </Box>
              );
            })}
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 2 }}>
            <Typography variant="h6">Tổng cộng:</Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatCurrency(calculateTotal())}
            </Typography>
          </Box>
          <Alert severity="info">
            Sau khi xác nhận, mã QR sẽ được tạo để bạn quét thanh toán.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Hủy</Button>
          <Button onClick={handlePayment} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Xác Nhận Thanh Toán'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialog} onClose={() => { }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <QrCodeScanner />
            Thanh Toán Qua Mã QR
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentPayment && (
            <Box textAlign="center">
              <Typography variant="body1" gutterBottom>
                Số tiền: {formatCurrency(currentPayment.amount)}
              </Typography>

              {currentPayment.qrCodeUrl && (
                <Box sx={{ my: 3 }}>
                  <img
                    src={currentPayment.qrCodeUrl}
                    alt="Payment QR Code"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </Box>
              )}

              <Alert severity={paymentStatus === 'Completed' ? 'success' : 'info'}>
                <Box display="flex" alignItems="center" gap={1}>
                  {getStatusIcon(paymentStatus)}
                  <Typography>
                    {paymentStatus === 'Completed'
                      ? 'Thanh toán thành công!'
                      : 'Vui lòng quét mã QR để thanh toán. Trang sẽ tự động cập nhật khi thanh toán hoàn tất.'}
                  </Typography>
                </Box>
              </Alert>

              <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                Mã giao dịch: {currentPayment.transactionId || 'Đang tạo...'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialog(false)} disabled={paymentStatus === 'Pending'}>
            {paymentStatus === 'Completed' ? 'Hoàn Thành' : 'Đóng'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Lịch Sử Thanh Toán</DialogTitle>
        <DialogContent>
          {paymentHistory.length === 0 ? (
            <Alert severity="info">
              Bạn chưa có giao dịch thanh toán nào.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ngày Thanh Toán</TableCell>
                    <TableCell>Số Tiền</TableCell>
                    <TableCell>Phương Thức</TableCell>
                    <TableCell>Trạng Thái</TableCell>
                    <TableCell>Ghi Chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.paymentId}>
                      <TableCell>
                        {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentPayment;

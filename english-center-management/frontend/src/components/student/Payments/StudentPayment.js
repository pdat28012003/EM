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
  AccountBalance,
  PhoneAndroid,
  Money,
  CheckCircleOutline,
} from '@mui/icons-material';
import signalRService from '../../../services/signalr';
import { paymentAPI, authAPI, axiosInstance } from '../../../services/api';

const StudentPayment = () => {
  const [studentId, setStudentId] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethodDialog, setPaymentMethodDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  useEffect(() => {
    // Get studentId from localStorage
    const userData = localStorage.getItem('user');
    console.log('User data from localStorage:', userData);

    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('Parsed user data:', parsedUser);
      let id = parsedUser.studentId;
      console.log('Student ID from parsed user:', id);

      // Fallback if studentId is missing
      if (!id) {
        console.log('Student ID is missing, fetching from profile...');
        const fetchProfile = async () => {
          try {
            const profileRes = await authAPI.getProfile();
            const profileData = profileRes.data?.data || profileRes.data;
            console.log('Profile data:', profileData);
            if (profileData && profileData.studentId) {
              id = profileData.studentId;
              const updatedUser = { ...parsedUser, studentId: id };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setStudentId(id);
              console.log('Student ID set from profile:', id);
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
          }
        };
        fetchProfile();
      } else {
        setStudentId(id);
        console.log('Student ID set from localStorage:', id);
      }
    } else {
      console.log('No user data found in localStorage');
    }
  }, []);

  useEffect(() => {
    console.log('useEffect for studentId triggered, studentId:', studentId);
    if (studentId) {
      console.log('Calling load functions for studentId:', studentId);
      loadEnrolledCourses();
      loadPaymentHistory();
    } else {
      console.log('Student ID is null or undefined, not loading courses');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const connectionRef = React.useRef(null);
  const pollingRef = React.useRef(null);

  // Handle successful payment completion
  const handlePaymentSuccess = React.useCallback(async () => {
    // Clear polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Close QR dialog immediately
    setQrDialog(false);

    // Force refresh data with timestamp to bypass cache
    try {
      // Add timestamp to force refresh and bypass cache
      const timestamp = Date.now();
      console.log('Force refreshing data with timestamp:', timestamp);

      await Promise.all([
        loadEnrolledCourses(true), // Force refresh to bypass cache
        loadPaymentHistory(true)   // Force refresh to bypass cache
      ]);

      // Force component re-render by updating a dummy state
      setTimeout(() => {
        console.log('Triggering force re-render after payment success');
        // This will force the component to re-render with new data
        setLoading(false);
        setLoading(true);
        setTimeout(() => setLoading(false), 100);
      }, 500);

      // Clear selected courses after successful data refresh
      setSelectedCourses([]);

      // Show success dialog
      setSuccessDialog(true);

      // Force a re-render by updating a dummy state
      setPaymentStatus('Completed');

      console.log('Payment successful - data refreshed and UI updated');

    } catch (error) {
      console.error('Error refreshing data after payment:', error);
      // Still show success dialog even if data refresh fails
      setSuccessDialog(true);
      setSelectedCourses([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Setup SignalR connection for real-time payment updates
    if (!connectionRef.current) {
      connectionRef.current = signalRService.createHubConnection();
    }

    const startConnection = async () => {
      try {
        if (connectionRef.current.state === 'Disconnected') {
          await connectionRef.current.start();
          console.log('Connected to payment hub');

          // Try to join group immediately after connection if we have current payment
          if (currentPayment) {
            console.log('Joining payment group after connection:', currentPayment.paymentId);
            await connectionRef.current.invoke('JoinPaymentGroup', currentPayment.paymentId.toString());
          }
        } else if (connectionRef.current.state === 'Connected' && currentPayment) {
          // Join group if connection is already established and we have payment
          console.log('Joining payment group (already connected):', currentPayment.paymentId);
          await connectionRef.current.invoke('JoinPaymentGroup', currentPayment.paymentId.toString());
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('SignalR connection error:', err);
        }
      }
    };

    startConnection();

    const handleStatusChange = (data) => {
      console.log('Received payment update via SignalR:', data);

      // Support both event formats and data structures
      const pId = data.paymentId || data.PaymentId;
      const status = data.status || data.Status;

      if (currentPayment && pId === currentPayment.paymentId) {
        setPaymentStatus(status);
        if (status === 'Completed' || status === 'Complete') {
          handlePaymentSuccess();
        }
      }
    };

    connectionRef.current.on('PaymentStatusChanged', handleStatusChange);
    connectionRef.current.on('ReceivePaymentStatus', handleStatusChange);

    return () => {
      if (connectionRef.current) {
        connectionRef.current.off('PaymentStatusChanged', handleStatusChange);
        connectionRef.current.off('ReceivePaymentStatus', handleStatusChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPayment]);

  // Auto-join SignalR group when currentPayment changes
  useEffect(() => {
    if (currentPayment && connectionRef.current && connectionRef.current.state === 'Connected') {
      console.log('Auto-joining payment group for payment:', currentPayment.paymentId);
      connectionRef.current.invoke('JoinPaymentGroup', currentPayment.paymentId.toString())
        .catch(err => console.error('Error joining payment group:', err));
    }
  }, [currentPayment]);

  // Polling fallback: poll payment status every 3s while QR dialog is open
  useEffect(() => {
    if (qrDialog && currentPayment) {
      // Start polling
      pollingRef.current = setInterval(async () => {
        try {
          const res = await paymentAPI.getPaymentStatus(currentPayment.paymentId);
          const status = res.data?.status;
          console.log('Polled payment status:', status);
          if (status === 'Completed' || status === 'Complete') {
            setPaymentStatus(status);
            handlePaymentSuccess();
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
    } else {
      // Clear polling when QR dialog closes
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrDialog, currentPayment]);


  const loadEnrolledCourses = async (forceRefresh = false) => {
    try {
      setLoading(true);
      console.log('Loading enrolled courses for studentId:', studentId, 'forceRefresh:', forceRefresh);

      // Add cache busting parameter if force refresh is requested
      const url = forceRefresh
        ? `/payments/student/${studentId}/enrolled-courses?t=${Date.now()}`
        : `/payments/student/${studentId}/enrolled-courses`;

      const response = await axiosInstance.get(url);
      console.log('Enrolled courses response:', response.data);
      setEnrolledCourses(response.data);
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async (forceRefresh = false) => {
    try {
      console.log('Loading payment history for studentId:', studentId, 'forceRefresh:', forceRefresh);

      // Add cache busting parameter if force refresh is requested
      const url = forceRefresh
        ? `/payments/student/${studentId}/history?t=${Date.now()}`
        : `/payments/student/${studentId}/history`;

      const response = await axiosInstance.get(url);
      console.log('Payment history response:', response.data);
      setPaymentHistory(response.data);
    } catch (error) {
      console.error('Error loading payment history:', error);
      console.error('Error details:', error.response?.data);
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

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentMethodDialog(false);
    setPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (selectedCourses.length === 0) {
      alert('Vui lòng chọn ít nhất một khóa học để thanh toán');
      return;
    }

    try {
      setPaymentProcessing(true);
      const paymentData = {
        studentId: studentId,
        courseIds: selectedCourses,
        amount: calculateTotal(),
        paymentMethod: selectedPaymentMethod,
        notes: `Thanh toán cho ${selectedCourses.length} khóa học bằng ${selectedPaymentMethod}`
      };

      const response = await paymentAPI.createPayment(paymentData);
      setCurrentPayment(response.data);
      setPaymentDialog(false);

      // Show QR dialog for bank transfer, or process immediately for other methods
      if (selectedPaymentMethod === 'bank_transfer') {
        setQrDialog(true);
        setPaymentStatus('Pending');
      } else if (selectedPaymentMethod === 'cash') {
        // Show cash payment instructions
        setPaymentDialog(false);
        // Simulate cash payment confirmation
        setTimeout(() => {
          setPaymentStatus('Completed');
          setSuccessDialog(true);
          // Refresh data
          loadEnrolledCourses();
          loadPaymentHistory();
          setSelectedCourses([]);
        }, 2000);
      } else {
        // Simulate payment processing for mobile money
        setTimeout(() => {
          setPaymentStatus('Completed');
          setSuccessDialog(true);
          // Refresh data
          loadEnrolledCourses();
          loadPaymentHistory();
          setSelectedCourses([]);
        }, 3000);
      }

    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setPaymentProcessing(false);
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
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 3, md: 4 } }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          Thanh Toán Học Phí
        </Typography>
        <Button
          variant="outlined"
          startIcon={<History />}
          onClick={() => setHistoryDialog(true)}
          sx={{
            minWidth: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Lịch Sử Thanh Toán
        </Button>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Các Khóa Học Đã Đăng Ký
        </Typography>

        {!enrolledCourses || enrolledCourses.courses?.length === 0 ? (
          <Alert severity="info">
            Bạn chưa đăng ký khóa học nào.
          </Alert>
        ) : (
          <>
            {/* Mobile Layout - Card View */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              {enrolledCourses?.courses?.map((course) => (
                <Paper
                  key={course.courseId}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: course.isPaid ? '1px solid #e5e7eb' : '1px solid #fb923c',
                    opacity: course.isPaid ? 0.6 : 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Checkbox
                      disabled={course.isPaid}
                      checked={selectedCourses.includes(course.courseId) || course.isPaid}
                      onChange={() => handleCourseSelection(course.courseId)}
                      sx={{ mt: 0.5 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>
                        {course.courseName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Mã khóa: {course.courseCode}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 'bold',
                            color: '#1e293b',
                            fontSize: '1.1rem'
                          }}
                        >
                          {formatCurrency(course.fee)}
                        </Typography>
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
                            sx={{
                              backgroundColor: 'rgba(251, 146, 60, 0.1)',
                              color: '#fb923c',
                              border: '1px solid rgba(251, 146, 60, 0.3)',
                              fontWeight: 500,
                              fontSize: '0.75rem'
                            }}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              ))}

              {/* Mobile Select All */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
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
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" component="span">
                  Chọn tất cả ({enrolledCourses?.courses?.filter(c => !c.isPaid).length} khóa chưa thanh toán)
                </Typography>
              </Box>
            </Box>

            {/* Desktop Layout - Table View */}
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
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
                      <TableCell align="right" sx={{ minWidth: 120 }}>Học Phí</TableCell>
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
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              color: '#1e293b'
                            }}
                          >
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
                              sx={{
                                backgroundColor: 'rgba(251, 146, 60, 0.1)',
                                color: '#fb923c',
                                border: '1px solid rgba(251, 146, 60, 0.3)',
                                fontWeight: 500,
                                fontSize: '0.75rem'
                              }}
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </Paper>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            color: '#dc2626',
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          Tổng Cộng: {formatCurrency(calculateTotal())}
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={paymentProcessing ? <CircularProgress size={20} color="inherit" /> : <Payment />}
          disabled={selectedCourses.length === 0 || paymentProcessing}
          onClick={() => setPaymentMethodDialog(true)}
          sx={{
            minWidth: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            py: { xs: 1.5, sm: 2 },
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            },
            transition: 'all 0.3s ease',
            '&.Mui-disabled': {
              background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
            }
          }}
        >
          {paymentProcessing ? 'Đang xử lý...' : `Thanh Toán (${selectedCourses.length} khóa học)`}
        </Button>
      </Box>

      {/* Payment Method Selection Dialog */}
      <Dialog open={paymentMethodDialog} onClose={() => setPaymentMethodDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography>Chọn Phương Thức Thanh Toán</Typography>
          <IconButton
            onClick={() => setPaymentMethodDialog(false)}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                color: 'text.secondary'
              }
            }}
          >
            ✕
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
            Vui lòng chọn phương thức thanh toán phù hợp:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Bank Transfer */}
            <Paper
              sx={{
                p: 2,
                border: '2px solid #10b981',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(16, 185, 129, 0.05)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}
              onClick={() => handlePaymentMethodSelect('bank_transfer')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalance sx={{ color: '#10b981', fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">Chuyển Khoản Ngân Hàng</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quét mã QR để thanh toán
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Mobile Money */}
            <Paper
              sx={{
                p: 2,
                border: '2px solid #f59e0b',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(245, 158, 11, 0.05)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}
              onClick={() => handlePaymentMethodSelect('mobile_money')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PhoneAndroid sx={{ color: '#f59e0b', fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">Vi Điện Tử</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Momo, ZaloPay, VNPay...
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Cash */}
            <Paper
              sx={{
                p: 2,
                border: '2px solid #8b5cf6',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(139, 92, 246, 0.05)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}
              onClick={() => handlePaymentMethodSelect('cash')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Money sx={{ color: '#8b5cf6', fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">Tiền Mặt</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Thanh toán tại trung tâm (trong 24-48h)
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentMethodDialog(false)}>Hủy</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xác Nhận Thanh Toán</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bạn đang thanh toán {selectedCourses.length} khóa học bằng <strong>{selectedPaymentMethod === 'bank_transfer' ? 'Chuyển Khoản Ngân Hàng' : selectedPaymentMethod === 'mobile_money' ? 'Vi Điện Tử' : 'Tiền Mặt'}</strong>:
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
            {selectedPaymentMethod === 'bank_transfer'
              ? 'Sau khi xác nhận, mã QR sẽ được tạo để bạn quét thanh toán.'
              : selectedPaymentMethod === 'mobile_money'
                ? 'Bạn sẽ được chuyển đến ứng dụng thanh toán.'
                : 'Vui lòng đến trung tâm để thanh toán trong vòng 24-48h để giữ chỗ.'
            }
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Hủy</Button>
          <Button onClick={handlePayment} variant="contained" disabled={paymentProcessing}>
            {paymentProcessing ? <CircularProgress size={24} /> : 'Xác Nhận Thanh Toán'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cash Payment Instructions Dialog */}
      <Dialog open={selectedPaymentMethod === 'cash' && paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Money sx={{ color: '#8b5cf6', fontSize: 28 }} />
            <Typography>Hướng Dẫn Thanh Toán Tiền Mặt</Typography>
          </Box>
          <IconButton
            onClick={() => setPaymentDialog(false)}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                color: 'text.secondary'
              }
            }}
          >
            ✕
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="bold">
                Vui long den trung tm de thanh ton va giu cho khoa hc
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom fontWeight="bold" color="#8b5cf6">
              Dia chi trung tm:
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, pl: 2 }}>
              123 Nguyen Van Linh, Phuong Tan Phong, Quan 7, TP.HCM<br />
              (Doi dien truong Dai hc RMIT Vit Nam)
            </Typography>

            <Typography variant="h6" gutterBottom fontWeight="bold" color="#8b5cf6">
              Thoi gian lm vic:
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, pl: 2 }}>
              Th 2 - Th 6: 8:00 - 20:00<br />
              Th 7: 8:00 - 17:00<br />
              Chu nhat: Ngh
            </Typography>

            <Typography variant="h6" gutterBottom fontWeight="bold" color="#8b5cf6">
              Linh he:
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, pl: 2 }}>
              Hotline: (028) 1234-5678<br />
              Email: support@english-center.edu.vn
            </Typography>

            <Typography variant="h6" gutterBottom fontWeight="bold" color="#8b5cf6">
              Luu y quan trong:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 3 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Vui long mang theo CCCD/CMND va thong tin dang ky
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Thanh ton trong vong 24-48h ke tu thoi diem dang ky de giu cho
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Nhân bien lai thanh ton sau khi hon tat giao dich
              </Typography>
            </Box>

            <Alert severity="success">
              <Typography variant="body2">
                Sau khi thanh ton, trang thai khoa hc se duoc cap nhat tu dong trong vong 1-2 gio lm vic.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Huy</Button>
          <Button
            onClick={handlePayment}
            variant="contained"
            disabled={paymentProcessing}
            sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
          >
            {paymentProcessing ? <CircularProgress size={20} color="inherit" /> : 'Xac Nhn Thanh Ton'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialog} onClose={() => { }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <QrCodeScanner />
            <Typography>Thanh Toán Qua Mã QR</Typography>
          </Box>
          <IconButton
            onClick={() => setQrDialog(false)}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                color: 'text.secondary'
              }
            }}
          >
            ✕
          </IconButton>
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

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                📱 Mở ứng dụng Ngân hàng hoặc Ví điện tử để quét mã
              </Typography>

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

      {/* Success Dialog */}
      <Dialog open={successDialog} onClose={() => setSuccessDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle sx={{ color: '#10b981', fontSize: 28 }} />
            <Typography>Thanh Toán Thành Công!</Typography>
          </Box>
          <IconButton
            onClick={() => setSuccessDialog(false)}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                color: 'text.secondary'
              }
            }}
          >
            ✕
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={3}>
            <Box sx={{
              width: 80,
              height: 80,
              bgcolor: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircleOutline sx={{ fontSize: 48, color: 'white' }} />
            </Box>
            <Typography variant="h5" color="#10b981" gutterBottom fontWeight="bold">
              Thanh Toán Thành Công!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem' }}>
              Chúc mừng giao dịch của bạn đã thành công!
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, color: '#1e293b' }}>
              Số tiền: <strong>{formatCurrency(currentPayment?.amount || calculateTotal())}</strong>
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {selectedPaymentMethod === 'cash'
                  ? 'Vui lòng đến trung tâm trong vòng 24-48h để hoàn tất thủ tục.'
                  : 'Giao dịch đã được xác nhận và khóa học đã được kích hoạt.'
                }
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Trang sẽ tự động cập nhật trong vài giây...
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => {
              setSuccessDialog(false);
              // Reset selection after successful payment
              setSelectedCourses([]);
            }}
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            Hoàn Thành
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cash Payment Instructions Dialog */}
      <Dialog open={selectedPaymentMethod === 'cash' && paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Money sx={{ color: '#8b5cf6', fontSize: 28 }} />
            Hướng Dẫn Thanh Toán Tiền Mặt
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="bold">
                Vui lòng đến trung tâm để thanh toán và giữ chỗ khóa học
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom fontWeight="bold" color="#8b5cf6">
              📍 Địa chỉ trung tâm:
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, pl: 2 }}>
              123 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP.HCM<br />
              (Đối diện trường Đại học RMIT Việt Nam)
            </Typography>

            <Typography variant="h6" gutterBottom fontWeight="bold" color="#8b5cf6">
              ⏰ Thời gian làm việc:
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, pl: 2 }}>
              Thứ 2 - Thứ 6: 8:00 - 20:00<br />
              Thứ 7: 8:00 - 17:00<br />
              Chủ nhật: Nghỉ
            </Typography>

            <Typography variant="h6" gutterBottom fontWeight="bold" color="#8b5cf6">
              📞 Liên hệ:
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, pl: 2 }}>
              Hotline: (028) 1234-5678<br />
              Email: support@english-center.edu.vn
            </Typography>

            <Typography variant="h6" gutterBottom fontWeight="bold" color="#8b5cf6">
              💡 Lưu ý quan trọng:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 3 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Vui lòng mang theo CCCD/CMND và thông tin đăng ký
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Thanh toán trong vòng 24-48h kể từ thời điểm đăng ký để giữ chỗ
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Nhận biên lai thanh toán sau khi hoàn tất giao dịch
              </Typography>
            </Box>

            <Alert severity="success">
              <Typography variant="body2">
                Sau khi thanh toán, trạng thái khóa học sẽ được cập nhật tự động trong vòng 1-2 giờ làm việc.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Hủy</Button>
          <Button
            onClick={handlePayment}
            variant="contained"
            disabled={paymentProcessing}
            sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
          >
            {paymentProcessing ? <CircularProgress size={20} color="inherit" /> : 'Xác Nhận Thanh Toán'}
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

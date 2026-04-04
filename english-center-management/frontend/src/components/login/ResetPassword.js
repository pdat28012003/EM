import React, { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  Avatar,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Lock, ArrowBack, School, MenuBook, Groups, TrendingUp, Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../../services/api";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    otpCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!location.state?.email) {
      // Redirect if no email in state
      navigate("/forgot-password");
    }
  }, [location.state, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.otpCode || !formData.newPassword || !formData.confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({
        email: formData.email,
        otpCode: formData.otpCode,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === "ERR_NETWORK") {
        setError("Không thể kết nối tới máy chủ.");
      } else {
        setError("Đặt lại mật khẩu thất bại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      {/* LEFT - Form */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          p: { xs: 1.5, sm: 2, md: 3 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", sm: "450px", md: "420px" },
            p: { xs: 2.5, sm: 3, md: 4 },
            borderRadius: { xs: 3, sm: 4 },
            backdropFilter: "blur(10px)",
            background: "rgba(255,255,255,0.98)",
            boxShadow: { xs: "0 10px 40px rgba(0,0,0,0.2)", md: "0 20px 60px rgba(0,0,0,0.3)" },
          }}
        >
          {/* Back to Login */}
          <Box sx={{ mb: 2 }}>
            <Link
              href="#"
              underline="hover"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "#667eea",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              <ArrowBack fontSize="small" />
              Quay lại đăng nhập
            </Link>
          </Box>

          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                mx: "auto",
                mb: 2,
                background: "linear-gradient(135deg, #667eea, #764ba2)",
              }}
            >
              <Lock sx={{ fontSize: 28, color: "white" }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} color="#333" sx={{ mb: 1 }}>
              Đặt lại mật khẩu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nhập mã OTP và mật khẩu mới
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              Đặt lại mật khẩu thành công!
            </Alert>
          )}

          {success ? (
            <Button
              fullWidth
              variant="contained"
              sx={{
                py: 1.2,
                fontWeight: 600,
                borderRadius: 2,
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                textTransform: "none",
              }}
              onClick={() => navigate("/login")}
            >
              Đăng nhập ngay
            </Button>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                size="small"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "rgba(0,0,0,0.05)",
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Mã OTP"
                name="otpCode"
                autoFocus
                value={formData.otpCode}
                onChange={handleChange}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                size="small"
                placeholder="Nhập mã OTP từ email"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.9)",
                    "&.Mui-focused fieldset": {
                      borderColor: "#667eea",
                      borderWidth: 2,
                    },
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Mật khẩu mới"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleChange}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        size="small"
                        sx={{ p: 0.5, color: "#667eea" }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.9)",
                    "&.Mui-focused fieldset": {
                      borderColor: "#667eea",
                      borderWidth: 2,
                    },
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        edge="end"
                        size="small"
                        sx={{ p: 0.5, color: "#667eea" }}
                      >
                        {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.9)",
                    "&.Mui-focused fieldset": {
                      borderColor: "#667eea",
                      borderWidth: 2,
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.2,
                  fontWeight: 600,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  boxShadow: "0 4px 15px rgba(102,126,234,0.4)",
                  textTransform: "none",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5a6fd6, #6a4190)",
                    boxShadow: "0 6px 20px rgba(102,126,234,0.6)",
                  },
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Đặt lại mật khẩu"}
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>

      {/* RIGHT - Branding (Desktop only) */}
      <Grid
        item
        xs={false}
        md={6}
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
          color: "white",
          textAlign: "center",
          p: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            top: "10%",
            right: "-100px",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
            bottom: "15%",
            left: "-50px",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 4 }}>
            <Box sx={{ textAlign: "center" }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto", mb: 1, width: 56, height: 56 }}>
                <MenuBook sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.8rem" }}>Học tập</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto", mb: 1, width: 56, height: 56 }}>
                <Groups sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.8rem" }}>Cộng đồng</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto", mb: 1, width: 56, height: 56 }}>
                <TrendingUp sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.8rem" }}>Tiến bộ</Typography>
            </Box>
          </Box>

          <Typography variant="h3" fontWeight={700} sx={{ mb: 2, fontSize: "2.5rem" }}>
            Learn English Smarter
          </Typography>

          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, fontWeight: 400, fontSize: "1.1rem" }}>
            Join thousands of students improving their skills every day
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            position: "absolute",
            bottom: 24,
            opacity: 0.6,
          }}
        >
          © 2024 English Center. All rights reserved.
        </Typography>
      </Grid>
    </Grid>
  );
};

export default ResetPassword;

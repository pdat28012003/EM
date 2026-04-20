import React, { useState, useRef } from "react";
import {
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Avatar,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, School, MenuBook, Groups, TrendingUp } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { authAPI } from "../../services/api";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const recaptchaRef = useRef(null);

  const navigate = useNavigate();

  const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!formData.email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email không hợp lệ.");
      return;
    }
    if (!formData.password.trim()) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (!captchaToken) {
      setError("Vui lòng xác nhận CAPTCHA.");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login({
        ...formData,
        captchaToken,
      });

      const loginData = response.data?.data || response.data;
      const accessToken = loginData?.accessToken;
      const refreshToken = loginData?.refreshToken;
      const user = loginData?.user;

      if (!accessToken || !user) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify(user));

      const role = (user.role || "").toLowerCase();

      const redirectPaths = {
        admin: "/",
        student: "/student/dashboard",
        teacher: "/teacher/dashboard",
      };

      navigate(redirectPaths[role] || "/");
    } catch (err) {
      // API returns PascalCase 'Message', axios might convert to camelCase 'message'
      const errorMsg = err.response?.data?.message || err.response?.data?.Message;
      if (errorMsg) {
        setError(errorMsg);
      } else if (err.code === "ERR_NETWORK") {
        setError("Không thể kết nối tới máy chủ.");
      } else {
        setError("Đăng nhập thất bại.");
      }
      // Reset captcha on error
      recaptchaRef.current?.reset();
      setCaptchaToken("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      {/* LEFT - Login Form */}
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
          {/* Header with Logo */}
          <Box sx={{ textAlign: "center", mb: { xs: 2, sm: 3 } }}>
            <Avatar
              sx={{
                width: { xs: 48, sm: 56, md: 64 },
                height: { xs: 48, sm: 56, md: 64 },
                mx: "auto",
                mb: { xs: 1.5, sm: 2 },
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                boxShadow: "0 4px 15px rgba(102,126,234,0.4)",
              }}
            >
              <School sx={{ fontSize: { xs: 24, sm: 28, md: 36 }, color: "white" }} />
            </Avatar>
            <Typography
              variant="h5"
              fontWeight={700}
              color="#333"
              sx={{ fontSize: { xs: "1.15rem", sm: "1.35rem", md: "1.5rem" } }}
            >
              English Center
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, fontSize: { xs: "0.75rem", sm: "0.85rem" } }}
            >
              Learning Management System
            </Typography>
          </Box>

          <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

          <Typography
            variant="h6"
            sx={{
              mb: { xs: 2, sm: 3 },
              textAlign: "center",
              fontWeight: 600,
              color: "#667eea",
              fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
            }}
          >
            Đăng nhập
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: { xs: 1.5, sm: 2 }, borderRadius: 2, fontSize: { xs: "0.85rem", sm: "0.9rem" } }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Email */}
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                mb: { xs: 1.5, sm: 2 },
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

            {/* Password */}
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mật khẩu"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
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
                mb: 0.5,
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

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: "right", mb: { xs: 1.5, sm: 2 } }}>
              <Link
                href="#"
                underline="hover"
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.85rem" },
                  color: "#667eea",
                  cursor: "pointer",
                  "&:hover": { color: "#764ba2" },
                }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/forgot-password");
                }}
              >
                Quên mật khẩu?
              </Link>
            </Box>

            {/* CAPTCHA */}
            <Box
              sx={{
                mt: { xs: 0.5, sm: 1 },
                mb: { xs: 1, sm: 1.5 },
                display: "flex",
                justifyContent: "center",
                overflow: "visible",
                width: "100%",
                minHeight: { xs: "55px", sm: "70px" },
                "& > div": {
                  transform: { xs: "scale(0.78)", sm: "scale(0.9)", md: "scale(1)" },
                  transformOrigin: "center center",
                },
              }}
            >
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                hl="vi"
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: { xs: 1, sm: 1.5 },
                py: { xs: 1, sm: 1.2 },
                fontWeight: 600,
                fontSize: { xs: "0.9rem", sm: "0.95rem" },
                borderRadius: 2,
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                boxShadow: "0 4px 15px rgba(102,126,234,0.4)",
                textTransform: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, #5a6fd6, #6a4190)",
                  boxShadow: "0 6px 20px rgba(102,126,234,0.6)",
                },
                "&:disabled": {
                  background: "#ccc",
                },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Đăng nhập"}
            </Button>
          </Box>
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
        {/* Decorative circles */}
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
          {/* Feature icons */}
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

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}>
            <Box sx={{ px: 2, py: 1, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>📊 Track Progress</Typography>
            </Box>
            <Box sx={{ px: 2, py: 1, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>🧠 Smart Learning</Typography>
            </Box>
          </Box>
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

export default Login;

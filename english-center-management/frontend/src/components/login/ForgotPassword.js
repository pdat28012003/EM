import React, { useState } from "react";
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
} from "@mui/material";
import { Email, ArrowBack, School, MenuBook, Groups, TrendingUp } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }

    setLoading(true);

    try {
      await authAPI.forgotPassword({ email });
      // Auto navigate to reset password page
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === "ERR_NETWORK") {
        setError("Không thể kết nối tới máy chủ.");
      } else {
        setError("Yêu cầu thất bại.");
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
              <Email sx={{ fontSize: 28, color: "white" }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} color="#333" sx={{ mb: 1 }}>
              Quên mật khẩu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nhập email để nhận mã OTP khôi phục mật khẩu
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
              size="small"
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
              {loading ? <CircularProgress size={22} color="inherit" /> : "Gửi mã OTP"}
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

export default ForgotPassword;

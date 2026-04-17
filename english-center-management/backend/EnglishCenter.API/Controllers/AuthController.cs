using System.Security.Claims;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EnglishCenter.API.Helpers;

namespace EnglishCenter.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ICaptchaService _captchaService;
        private readonly IWebHostEnvironment _environment;

        public AuthController(IAuthService authService, ICaptchaService captchaService, IWebHostEnvironment environment)
        {
            _authService = authService;
            _captchaService = captchaService;
            _environment = environment;
        }

        /// <summary>
        /// Registers a new account. (Admin only)
        /// (Đăng ký tài khoản mới. Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);
            if (!result) return ResponseHelper.BadRequest("Email đã tồn tại hoặc Role không hợp lệ.", "Email already exists or Role is invalid.");
            return ResponseHelper.Success<string>("Đăng ký thành công. Tài khoản đã được tạo và kích hoạt.", "Registration successful. Account created and activated.");
        }

        /// <summary>
        /// Resends the OTP code.
        /// (Gửi lại mã OTP)
        /// </summary>
        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp(string email, string type)
        {
            var result = await _authService.ResendOtpAsync(email, type);
            if (!result) return ResponseHelper.BadRequest("Không thể gửi lại mã OTP.", "Could not resend OTP.");
            return ResponseHelper.Success<string>("Mã OTP mới đã được gửi.", "New OTP code has been sent.");
        }

        /// <summary>
        /// User login.
        /// (Đăng nhập)
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            // Verify CAPTCHA
            if (!string.IsNullOrEmpty(request.CaptchaToken))
            {
                var captchaValid = await _captchaService.VerifyAsync(request.CaptchaToken);
                if (!captchaValid)
                {
                    return ResponseHelper.BadRequest("Xác nhận CAPTCHA không hợp lệ.", "CAPTCHA verification failed.");
                }
            }

            var response = await _authService.LoginAsync(request);
            if (response == null) return ResponseHelper.Unauthorized("Email hoặc mật khẩu không chính xác, hoặc tài khoản chưa được kích hoạt.", "Incorrect email or password, or account strongly not activated.");
            return ResponseHelper.Success("Đăng nhập thành công.", response, "Login successful.");
        }

        /// <summary>
        /// Refreshes the access token.
        /// (Làm mới access token)
        /// </summary>
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken(RefreshTokenRequest request)
        {
            var response = await _authService.RefreshTokenAsync(request);
            if (response == null) return ResponseHelper.Unauthorized("Refresh Token không hợp lệ hoặc đã hết hạn.", "Invalid or expired Refresh Token.");
            return ResponseHelper.Success("Làm mới token thành công.", response, "Token refreshed successfully.");
        }

        /// <summary>
        /// User logout.
        /// (Đăng xuất)
        /// </summary>
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _authService.LogoutAsync(userId);
            return ResponseHelper.Success<object>("Đăng xuất thành công.", null, "Logout successful.");
        }

        /// <summary>
        /// Forgot password.
        /// (Quên mật khẩu)
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
        {
            var result = await _authService.ForgotPasswordAsync(request);
            if (!result) return ResponseHelper.BadRequest("Email không tồn tại trong hệ thống.", "Email does not exist in the system.");
            return ResponseHelper.Success<string>("Mã OTP khôi phục mật khẩu đã được gửi qua email.", "Password recovery OTP has been sent via email.");
        }

        /// <summary>
        /// Resets the password using the OTP code.
        /// (Đặt lại mật khẩu bằng mã OTP)
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
        {
            var result = await _authService.ResetPasswordAsync(request);
            if (!result) return ResponseHelper.BadRequest("Mã OTP không hợp lệ hoặc đã hết hạn.", "Invalid or expired OTP.");
            return ResponseHelper.Success<string>("Mật khẩu đã được đặt lại thành công.", "Password has been reset successfully.");
        }

        /// <summary>
        /// Gets current user information.
        /// (Lấy thông tin người dùng hiện tại)
        /// </summary>
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _authService.GetCurrentUserAsync(userId);
            if (user == null) return ResponseHelper.NotFound("Không tìm thấy người dùng.", "User not found.");
            return ResponseHelper.Success("Lấy thông tin thành công.", user, "Successfully retrieved profile.");
        }

        /// <summary>
        /// Edits user information.
        /// (Chỉnh sửa thông tin người dùng)
        /// </summary>
        [Authorize]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            string? avatarUrl = null;

            // Handle Avatar Upload if provided
            if (request.AvatarFile != null && request.AvatarFile.Length > 0)
            {
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var fileExtension = Path.GetExtension(request.AvatarFile.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(fileExtension))
                {
                    return ResponseHelper.BadRequest("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp).", "Only image files (jpg, jpeg, png, gif, webp) are allowed.");
                }

                if (request.AvatarFile.Length > 5 * 1024 * 1024)
                {
                    return ResponseHelper.BadRequest("Kích thước file không được vượt quá 5MB.", "File size must not exceed 5MB.");
                }

                var webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
                if (!Directory.Exists(webRootPath)) Directory.CreateDirectory(webRootPath);

                var uploadsFolder = Path.Combine(webRootPath, "uploads", "avatars");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = Guid.NewGuid().ToString() + fileExtension;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.AvatarFile.CopyToAsync(stream);
                }

                avatarUrl = $"/uploads/avatars/{uniqueFileName}";
            }
            // If no file but Avatar URL provided (from UploadController)
            else if (!string.IsNullOrEmpty(request.Avatar))
            {
                avatarUrl = request.Avatar;
            }

            var result = await _authService.UpdateProfileAsync(userId, request, avatarUrl);
            if (!result) return ResponseHelper.BadRequest("Không thể cập nhật thông tin.", "Could not update profile.");

            // Return updated user data
            var updatedUser = await _authService.GetCurrentUserAsync(userId);
            return ResponseHelper.Success("Cập nhật thông tin thành công.", updatedUser, "Profile updated successfully.");
        }

        /// <summary>
        /// Changes user password.
        /// (Đổi mật khẩu người dùng)
        /// </summary>
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Validate new password matches confirmation
            if (request.NewPassword != request.ConfirmPassword)
            {
                return ResponseHelper.BadRequest("Mật khẩu mới không khớp với mật khẩu xác nhận.", "New password does not match confirmation.");
            }

            var result = await _authService.ChangePasswordAsync(userId, request);
            if (!result) return ResponseHelper.BadRequest("Mật khẩu hiện tại không chính xác.", "Current password is incorrect.");

            return ResponseHelper.Success<string>("Đổi mật khẩu thành công.", null, "Password changed successfully.");
        }

        /// <summary>
        /// Creates the first admin account (no authorization required - only use once).
        /// (Tạo tài khoản admin đầu tiên - chỉ sử dụng một lần)
        /// </summary>
        [HttpPost("create-first-admin")]
        public async Task<IActionResult> CreateFirstAdmin([FromBody] RegisterRequest request)
        {
            request.Role = "Admin";
            var result = await _authService.RegisterAsync(request);
            if (!result) return ResponseHelper.BadRequest("Không thể tạo admin hoặc admin đã tồn tại.", "Could not create admin or admin already exists.");
            return ResponseHelper.Success<string>("Admin account được tạo thành công.", "Admin account created successfully.");
        }
    }
}

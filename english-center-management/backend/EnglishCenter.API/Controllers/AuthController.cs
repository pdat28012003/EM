using System.Security.Claims;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Starts the registration process for a new account (Gửi mã OTP).
        /// (Bắt đầu quá trình đăng ký tài khoản mới (gửi OTP))
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);
            if (!result) return BadRequest("Email đã tồn tại hoặc Role không hợp lệ.");
            return Ok("Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.");
        }

        /// <summary>
        /// Verifies the OTP to activate the account.
        /// (Xác thực OTP để kích hoạt tài khoản)
        /// </summary>
        [HttpPost("verify-registration")]
        public async Task<IActionResult> VerifyRegistration(VerifyRegistrationRequest request)
        {
            var result = await _authService.VerifyRegistrationAsync(request);
            if (!result) return BadRequest("Mã OTP không hợp lệ hoặc đã hết hạn.");
            return Ok("Xác thực thành công. Tài khoản của bạn đã được kích hoạt.");
        }

        /// <summary>
        /// Resends the OTP code.
        /// (Gửi lại mã OTP)
        /// </summary>
        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp(string email, string type)
        {
            var result = await _authService.ResendOtpAsync(email, type);
            if (!result) return BadRequest("Không thể gửi lại mã OTP.");
            return Ok("Mã OTP mới đã được gửi.");
        }

        /// <summary>
        /// User login.
        /// (Đăng nhập)
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var response = await _authService.LoginAsync(request);
            if (response == null) return Unauthorized("Email hoặc mật khẩu không chính xác, hoặc tài khoản chưa được kích hoạt.");
            return Ok(response);
        }

        /// <summary>
        /// Refreshes the access token.
        /// (Làm mới access token)
        /// </summary>
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken(RefreshTokenRequest request)
        {
            var response = await _authService.RefreshTokenAsync(request);
            if (response == null) return Unauthorized("Refresh Token không hợp lệ hoặc đã hết hạn.");
            return Ok(response);
        }

        /// <summary>
        /// Requests an OTP code to reset the password.
        /// (Yêu cầu mã OTP để đặt lại mật khẩu)
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
        {
            var result = await _authService.ForgotPasswordAsync(request);
            if (!result) return BadRequest("Email không tồn tại trong hệ thống.");
            return Ok("Mã OTP khôi phục mật khẩu đã được gửi qua email.");
        }

        /// <summary>
        /// Resets the password using the OTP code.
        /// (Đặt lại mật khẩu bằng mã OTP)
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
        {
            var result = await _authService.ResetPasswordAsync(request);
            if (!result) return BadRequest("Mã OTP không hợp lệ hoặc đã hết hạn.");
            return Ok("Mật khẩu đã được đặt lại thành công.");
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
            if (user == null) return NotFound();
            return Ok(user);
        }

        /// <summary>
        /// Edits user information.
        /// (Chỉnh sửa thông tin người dùng)
        /// </summary>
        [Authorize]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _authService.UpdateProfileAsync(userId, request);
            if (!result) return BadRequest();
            return Ok("Cập nhật thông tin thành công.");
        }
    }
}

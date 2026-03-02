using EnglishCenter.API.DTOs;
using EnglishCenter.API.Models;

namespace EnglishCenter.API.Services
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(RegisterRequest request);
        Task<bool> VerifyRegistrationAsync(VerifyRegistrationRequest request);
        Task<LoginResponse?> LoginAsync(LoginRequest request);
        Task<LoginResponse?> RefreshTokenAsync(RefreshTokenRequest request);
        Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request);
        Task<bool> ResetPasswordAsync(ResetPasswordRequest request);
        Task<UserDto?> GetCurrentUserAsync(int userId);
        Task<bool> UpdateProfileAsync(int userId, UpdateProfileRequest request);
        Task<bool> ResendOtpAsync(string email, string type);
    }
}

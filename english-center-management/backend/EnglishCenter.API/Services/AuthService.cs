using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using EnglishCenter.API.Data;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EnglishCenter.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;
        private readonly IEmailService _emailService;

        public AuthService(ApplicationDbContext context, IConfiguration configuration, ILogger<AuthService> logger, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _emailService = emailService;
        }

        public async Task<bool> RegisterAsync(RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return false;

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == request.Role);
            if (role == null) return false;

            CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);

            var user = new User
            {
                Email = request.Email,
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                RoleId = role.RoleId,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !user.IsActive || !VerifyPasswordHash(request.Password, user.PasswordHash, user.PasswordSalt))
                return null;

            var accessToken = CreateToken(user);
            var refreshToken = GenerateRefreshToken();

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.UserId,
                ExpiryTime = DateTime.Now.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            user.LastLogin = DateTime.Now;
            await _context.SaveChangesAsync();

            int? studentId = null;
            
            // If user is a Student, get the associated StudentId
            if (user.Role.RoleName == "Student")
            {
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.UserId == user.UserId);
                studentId = student?.StudentId;
            }

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresIn = 3600, // 1 hour
                User = new UserDto
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    FullName = user.FullName,
                    PhoneNumber = user.PhoneNumber,
                    Avatar = user.Avatar,
                    Role = user.Role.RoleName,
                    StudentId = studentId
                }
            };
        }

        public async Task<LoginResponse?> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var storedToken = await _context.RefreshTokens
                .Include(t => t.User)
                .ThenInclude(u => u.Role)
                .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && t.ExpiryTime > DateTime.Now && t.RevokedAt == null);

            if (storedToken == null) return null;

            var user = storedToken.User;
            var newAccessToken = CreateToken(user);
            var newRefreshToken = GenerateRefreshToken();

            storedToken.RevokedAt = DateTime.Now;
            
            var refreshTokenEntity = new RefreshToken
            {
                Token = newRefreshToken,
                UserId = user.UserId,
                ExpiryTime = DateTime.Now.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();

            int? studentId = null;
            
            // If user is a Student, get the associated StudentId
            if (user.Role.RoleName == "Student")
            {
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.UserId == user.UserId);
                studentId = student?.StudentId;
            }

            return new LoginResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresIn = 3600,
                User = new UserDto
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    FullName = user.FullName,
                    PhoneNumber = user.PhoneNumber,
                    Avatar = user.Avatar,
                    Role = user.Role.RoleName,
                    StudentId = studentId
                }
            };
        }

        public async Task<bool> LogoutAsync(int userId)
        {
            // Revoke all valid refresh tokens for this user
            var refreshTokens = await _context.RefreshTokens
                .Where(t => t.UserId == userId && t.ExpiryTime > DateTime.Now && t.RevokedAt == null)
                .ToListAsync();
            
            foreach (var token in refreshTokens)
            {
                token.RevokedAt = DateTime.Now;
            }
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return false;

            await GenerateAndSendOtp(user.Email, "ForgotPassword");
            return true;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
        {
            var otp = await _context.UserOtps
                .Where(o => o.Email == request.Email && o.OtpCode == request.OtpCode && o.Type == "ForgotPassword" && !o.IsUsed && o.ExpiryTime > DateTime.Now)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (otp == null) return false;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return false;

            CreatePasswordHash(request.NewPassword, out byte[] passwordHash, out byte[] passwordSalt);
            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;
            otp.IsUsed = true;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserDto?> GetCurrentUserAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null) return null;

            int? studentId = null;
            int? teacherId = null;
            string? address = null;

            // If user is a Student, get the associated StudentId and Address
            if (user.Role.RoleName == "Student")
            {
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.UserId == userId);
                studentId = student?.StudentId;
                address = student?.Address;
            }
            // If user is a Teacher, get the associated TeacherId and Address
            else if (user.Role.RoleName == "Teacher")
            {
                var teacher = await _context.Teachers
                    .FirstOrDefaultAsync(t => t.UserId == userId);
                teacherId = teacher?.TeacherId;
                address = teacher?.Address ?? string.Empty;
            }

            return new UserDto
            {
                UserId = user.UserId,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Avatar = user.Avatar,
                Role = user.Role.RoleName,
                StudentId = studentId,
                TeacherId = teacherId,
                Address = address
            };
        }

        public async Task<bool> UpdateProfileAsync(int userId, UpdateProfileRequest request, string? avatarUrl = null)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return false;

            if (request.FullName != null) user.FullName = request.FullName;
            if (request.Email != null) user.Email = request.Email;
            if (request.PhoneNumber != null) user.PhoneNumber = request.PhoneNumber;

            if (avatarUrl != null)
            {
                user.Avatar = avatarUrl;
            }

            // If user is a student, also update Student table
            if (user.Role.RoleName == "Student")
            {
                var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
                if (student != null)
                {
                    if (request.FullName != null) student.FullName = request.FullName;
                    if (request.Email != null) student.Email = request.Email;
                    if (request.PhoneNumber != null) student.PhoneNumber = request.PhoneNumber;
                    if (request.Address != null) student.Address = request.Address;
                }
            }
            // If user is a teacher, also update Teacher table
            else if (user.Role.RoleName == "Teacher")
            {
                var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId);
                if (teacher != null)
                {
                    if (request.FullName != null) teacher.FullName = request.FullName;
                    if (request.Email != null) teacher.Email = request.Email;
                    if (request.PhoneNumber != null) teacher.PhoneNumber = request.PhoneNumber;
                    if (request.Address != null) teacher.Address = request.Address;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            // Verify current password
            if (!VerifyPasswordHash(request.CurrentPassword, user.PasswordHash, user.PasswordSalt))
            {
                return false;
            }

            // Verify new password matches confirmation
            if (request.NewPassword != request.ConfirmPassword)
            {
                return false;
            }

            // Update password
            CreatePasswordHash(request.NewPassword, out byte[] passwordHash, out byte[] passwordSalt);
            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ResendOtpAsync(string email, string type)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false;

            await GenerateAndSendOtp(email, type);
            return true;
        }

        // Helper Methods
        private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        private bool VerifyPasswordHash(string password, byte[] passwordHash, byte[] passwordSalt)
        {
            using (var hmac = new HMACSHA512(passwordSalt))
            {
                var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
                return computedHash.SequenceEqual(passwordHash);
            }
        }

        private string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role.RoleName)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration.GetSection("AppSettings:Token").Value!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddHours(1),
                SigningCredentials = creds
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }

        private async Task GenerateAndSendOtp(string email, string type)
        {
            var otpCode = new Random().Next(100000, 999999).ToString();
            var otpEntity = new UserOtp
            {
                Email = email,
                OtpCode = otpCode,
                Type = type,
                ExpiryTime = DateTime.Now.AddMinutes(10),
                IsUsed = false
            };

            _context.UserOtps.Add(otpEntity);
            await _context.SaveChangesAsync();

            // Gửi email thật
            await _emailService.SendOtpEmailAsync(email, otpCode, type);
            
            _logger.LogInformation($"OTP for {email} ({type}) was sent via email.");
        }
    }
}

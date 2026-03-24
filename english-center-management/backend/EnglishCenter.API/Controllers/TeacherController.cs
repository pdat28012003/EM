using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Services;
using Microsoft.AspNetCore.Authorization;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeacherController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordService _passwordService;

        public TeacherController(ApplicationDbContext context, IPasswordService passwordService)
        {
            _context = context;
            _passwordService = passwordService;
        }

        /// <summary>
        /// Gets all teachers. (Lấy danh sách tất cả giáo viên.)
        /// </summary>
        /// <param name="isActive">Status (Trạng thái hoạt động)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Số lượng mỗi trang)</param>
        /// <returns>Paged list of teachers (Danh sách giáo viên có phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<TeacherDto>>> GetTeachers(
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.Teachers.AsQueryable();

            if (isActive.HasValue)
            {
                query = query.Where(t => t.IsActive == isActive.Value);
            }

            var totalCount = await query.CountAsync();

            var teachers = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new TeacherDto
                {
                    TeacherId = t.TeacherId,
                    FullName = t.FullName,
                    Email = t.Email,
                    PhoneNumber = t.PhoneNumber,
                    Specialization = t.Specialization,
                    Qualifications = t.Qualifications,
                    HireDate = t.HireDate,
                    HourlyRate = t.HourlyRate,
                    IsActive = t.IsActive
                })
                .ToListAsync();
            var pagedResult = new PagedResult<TeacherDto>
                {
                    Data = teachers,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

            return Ok(pagedResult);
        }

        /// <summary>
        /// Gets a teacher by ID. (Lấy thông tin chi tiết của giáo viên theo ID.)
        /// </summary>
        /// <param name="id">Teacher ID (ID giáo viên)</param>
        /// <returns>Teacher details (Thông tin giáo viên)</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<TeacherDto>> GetTeacher(int id)
        {
            var teacher = await _context.Teachers
                .Where(t => t.TeacherId == id)
                .Select(t => new TeacherDto
                {
                    TeacherId = t.TeacherId,
                    FullName = t.FullName,
                    Email = t.Email,
                    PhoneNumber = t.PhoneNumber,
                    Specialization = t.Specialization,
                    Qualifications = t.Qualifications,
                    HireDate = t.HireDate,
                    HourlyRate = t.HourlyRate,
                    IsActive = t.IsActive
                })
                .FirstOrDefaultAsync();
                

            if (teacher == null)
            {
                return NotFound(new { message = "Teacher not found" });
            }

            return Ok(teacher);
        }

        /// <summary>
        /// Creates a new teacher. (Thêm giáo viên mới.)
        /// </summary>
        /// <param name="dto">Teacher creation data (Dữ liệu tạo giáo viên)</param>
        /// <returns>Created teacher (Thông tin giáo viên vừa tạo)</returns>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<TeacherDto>> CreateTeacher(CreateTeacherDto dto)
        {
            // Email uniqueness across teachers
            var existingTeacher = await _context.Teachers
                .FirstOrDefaultAsync(t => t.Email == dto.Email && t.IsActive);
            if (existingTeacher != null)
            {
                return Conflict(new { message = "A teacher with this email already exists" });
            }

            // Ensure no existing user with the same email
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existingUser != null)
            {
                return Conflict(new { message = "A user with this email already exists" });
            }

            // Ensure Teacher role exists
            var teacherRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == "Teacher");
            if (teacherRole == null)
            {
                teacherRole = new Role
                {
                    RoleName = "Teacher",
                    Description = "Teacher account"
                };
                _context.Roles.Add(teacherRole);
                await _context.SaveChangesAsync();
            }

            // Create authentication user for this teacher (for login)
            CreatePasswordHash(dto.Password, out byte[] passwordHash, out byte[] passwordSalt);
            var user = new User
            {
                Email = dto.Email,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                RoleId = teacherRole.RoleId,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var teacher = new Teacher
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Password = _passwordService.HashPassword(dto.Password),
                Specialization = dto.Specialization,
                Qualifications = dto.Qualifications,
                HireDate = DateTime.Now,
                HourlyRate = dto.HourlyRate,
                IsActive = true,
                UserId = user.UserId
            };

            _context.Teachers.Add(teacher);
            await _context.SaveChangesAsync();

            var teacherDto = new TeacherDto
            {
                TeacherId = teacher.TeacherId,
                FullName = teacher.FullName,
                Email = teacher.Email,
                PhoneNumber = teacher.PhoneNumber,
                Specialization = teacher.Specialization,
                Qualifications = teacher.Qualifications,
                HireDate = teacher.HireDate,
                HourlyRate = teacher.HourlyRate,
                IsActive = teacher.IsActive
            };

            return CreatedAtAction(nameof(GetTeacher), new { id = teacher.TeacherId }, teacherDto);
        }

        private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        /// <summary>
        /// Gets teacher's schedule based on Curriculum. (Lấy lịch dạy của giáo viên theo Curriculum.)
        /// </summary>
        /// <param name="id">Teacher ID (ID giáo viên)</param>
        /// <param name="date">Filter by specific date (Lọc theo ngày cụ thể)</param>
        /// <param name="startDate">Filter by start date (Lọc từ ngày)</param>
        /// <param name="endDate">Filter by end date (Lọc đến ngày)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paginated list of curriculum sessions (Danh sách buổi học phân trang)</returns>
        [HttpGet("{id}/schedule")]
        public async Task<ActionResult<PagedResult<object>>> GetTeacherSchedule(
            int id, 
            [FromQuery] DateTime? date = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var teacher = await _context.Teachers.FindAsync(id);
                if (teacher == null || !teacher.IsActive)
                {
                    return NotFound(new { message = "Teacher not found or inactive" });
                }

                // Query curriculum sessions assigned to this teacher
                var query = _context.CurriculumSessions
                    .Include(cs => cs.CurriculumDay)
                    .ThenInclude(cd => cd.Curriculum)
                    .ThenInclude(c => c.Course)
                    .Include(cs => cs.AssignedRoom)
                    .Include(cs => cs.Teacher)
                    .Where(cs => cs.TeacherId == id);

                // Filter by specific date if provided
                if (date.HasValue)
                {
                    query = query.Where(cs => cs.CurriculumDay.ScheduleDate.Date == date.Value.Date);
                }
                // Filter by date range if provided
                else if (startDate.HasValue && endDate.HasValue)
                {
                    query = query.Where(cs => cs.CurriculumDay.ScheduleDate.Date >= startDate.Value.Date && 
                                             cs.CurriculumDay.ScheduleDate.Date <= endDate.Value.Date);
                }
                else if (startDate.HasValue)
                {
                    query = query.Where(cs => cs.CurriculumDay.ScheduleDate.Date >= startDate.Value.Date);
                }
                else if (endDate.HasValue)
                {
                    query = query.Where(cs => cs.CurriculumDay.ScheduleDate.Date <= endDate.Value.Date);
                }

                var totalCount = await query.CountAsync();
                
                var sessions = await query
                    .OrderBy(cs => cs.CurriculumDay.ScheduleDate)
                    .ThenBy(cs => cs.StartTime)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var scheduleDtos = sessions.Select(cs => new {
                    SessionId = cs.CurriculumSessionId,
                    TeacherId = id,
                    Date = cs.CurriculumDay.ScheduleDate.ToString("yyyy-MM-dd"),
                    DayOfWeek = cs.CurriculumDay.ScheduleDate.DayOfWeek.ToString(),
                    StartTime = cs.StartTime.ToString(@"hh\:mm"),
                    EndTime = cs.EndTime.ToString(@"hh\:mm"),
                    CourseName = cs.CurriculumDay.Curriculum.Course.CourseName,
                    CurriculumName = cs.CurriculumDay.Curriculum.CurriculumName,
                    SessionName = cs.SessionName,
                    SessionNumber = cs.SessionNumber,
                    Topic = cs.CurriculumDay.Topic,
                    RoomName = cs.AssignedRoom?.RoomName ?? "Not assigned",
                    Status = "Scheduled"
                }).ToList();

                return Ok(new PagedResult<object>
                {
                    Data = scheduleDtos.Cast<object>().ToList(),
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error retrieving teacher schedule" });
            }
        }
    }
}

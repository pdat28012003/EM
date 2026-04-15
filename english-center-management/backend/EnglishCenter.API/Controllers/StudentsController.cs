using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using EnglishCenter.API.Helpers;
using Microsoft.Extensions.Logging;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMappingService _mappingService;
        private readonly IPasswordService _passwordService;
        private readonly ILogger<StudentsController> _logger;

        public StudentsController(
            ApplicationDbContext context,
            IMappingService mappingService,
            IPasswordService passwordService,
            ILogger<StudentsController> logger)
        {
            _context = context;
            _mappingService = mappingService;
            _passwordService = passwordService;
            _logger = logger;
        }

        private async Task<Student?> FindStudent(int id)
        {
            return await _context.Students.FindAsync(id);
        }

        /// <summary>
        /// Gets all students. (Lấy danh sách tất cả học viên.)
        /// </summary>
        /// <param name="search">Search term (Tìm kiếm theo tên, email, số điện thoại)</param>
        /// <param name="level">Student level (Cấp độ học viên)</param>
        /// <param name="isActive">Status (Trạng thái hoạt động)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Số lượng mỗi trang)</param>
        /// <returns>List of students (Danh sách học viên)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<StudentDto>>> GetStudents(
            [FromQuery] string? search = null,
            [FromQuery] string? level = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var query = _context.Students.AsQueryable();

                // Filter by status 
                if (isActive.HasValue)
                {
                    query = query.Where(s => s.IsActive == isActive.Value);
                }

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(s => s.FullName.Contains(search) || 
                                            s.Email.Contains(search) || 
                                            s.PhoneNumber.Contains(search));
                }

                if (!string.IsNullOrEmpty(level))
                {
                    query = query.Where(s => s.Level == level);
                }

                var totalCount = await query.CountAsync();
                var students = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(s => new StudentDto
                    {
                        StudentId = s.StudentId,
                        FullName = s.FullName,
                        Email = s.Email,
                        PhoneNumber = s.PhoneNumber,
                        DateOfBirth = s.DateOfBirth,
                        Address = s.Address,
                        EnrollmentDate = s.EnrollmentDate,
                        Level = s.Level,
                        IsActive = s.IsActive
                    })
                    .ToListAsync();

                var pagedResult = new PagedResult<StudentDto>
                {
                    Data = students,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return ResponseHelper.Success("Lấy danh sách học viên thành công.", pagedResult, "Students retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ResponseHelper.InternalServerError(ex);
            }
        }

        /// <summary>
        /// Gets a student by ID. (Lấy thông tin cá nhân của học viên theo ID.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>Student details (Thông tin chi tiết học viên)</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<StudentDto>> GetStudent(int id)
        {
            try
            {
                var studentDto = await _context.Students
                    .Where(s => s.StudentId == id)
                    .Select(s => new StudentDto
                    {
                        StudentId = s.StudentId,
                        FullName = s.FullName,
                        Email = s.Email,
                        PhoneNumber = s.PhoneNumber,
                        DateOfBirth = s.DateOfBirth,
                        Address = s.Address,
                        EnrollmentDate = s.EnrollmentDate,
                        Level = s.Level,
                        IsActive = s.IsActive
                    })
                    .FirstOrDefaultAsync();

                if (studentDto == null)
                {
                    return ResponseHelper.NotFound("Không tìm thấy học viên.", "Student not found.");
                }

                return ResponseHelper.Success("Lấy chi tiết học viên thành công.", studentDto, "Student details retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ResponseHelper.InternalServerError(ex);
            }
        }

        /// <summary>
        /// Creates a new student. (Thêm học viên mới.)
        /// </summary>
        /// <param name="dto">Student creation data (Dữ liệu tạo học viên)</param>
        /// <returns>Created student (Học viên vừa tạo)</returns>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<StudentDto>> CreateStudent(CreateStudentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Check for existing Active student
                var existingActiveStudent = await _context.Students
                    .FirstOrDefaultAsync(s => s.Email == dto.Email && s.IsActive);
                
                if (existingActiveStudent != null)
                {
                    return Conflict(new { message = "A student with this email already exists and is active." });
                }

                // Find existing User (could be inactive)
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email);
                
                // Find existing Student (could be inactive)
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.Email == dto.Email);

                // Ensure Student role exists
                var studentRole = await _context.Roles
                    .FirstOrDefaultAsync(r => r.RoleName == "Student");
                
                if (studentRole == null)
                {
                    studentRole = new Role { RoleName = "Student", Description = "Student account" };
                    _context.Roles.Add(studentRole);
                    await _context.SaveChangesAsync();
                }

                CreatePasswordHash(dto.Password, out byte[] passwordHash, out byte[] passwordSalt);

                if (user != null)
                {
                    // Reactive and update existing user
                    user.FullName = dto.FullName;
                    user.PhoneNumber = dto.PhoneNumber;
                    user.PasswordHash = passwordHash;
                    user.PasswordSalt = passwordSalt;
                    user.IsActive = true;
                    user.RoleId = studentRole.RoleId; // Ensure role is correct
                }
                else
                {
                    // Create new user
                    user = new User
                    {
                        Email = dto.Email,
                        FullName = dto.FullName,
                        PhoneNumber = dto.PhoneNumber,
                        PasswordHash = passwordHash,
                        PasswordSalt = passwordSalt,
                        RoleId = studentRole.RoleId,
                        IsActive = true,
                        CreatedAt = DateTime.Now
                    };
                    _context.Users.Add(user);
                }

                await _context.SaveChangesAsync();

                if (student != null)
                {
                    // Reactivate and update existing student
                    student.FullName = dto.FullName;
                    student.PhoneNumber = dto.PhoneNumber;
                    student.DateOfBirth = dto.DateOfBirth;
                    student.Address = dto.Address;
                    student.Level = dto.Level;
                    student.IsActive = true;
                    student.Password = _passwordService.HashPassword(dto.Password);
                    student.UserId = user.UserId;
                }
                else
                {
                    // Create new student
                    student = _mappingService.MapToStudent(dto);
                    student.Password = _passwordService.HashPassword(dto.Password);
                    student.UserId = user.UserId;
                    student.IsActive = true;
                    _context.Students.Add(student);
                }

                await _context.SaveChangesAsync();

                var studentDto = _mappingService.MapToStudentDto(student);
                return CreatedAtAction(nameof(GetStudent), new { id = student.StudentId }, studentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating student", details = ex.Message });
            }
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
        /// Updates student information. (Cập nhật thông tin học viên.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <param name="dto">Update data (Dữ liệu cập nhật)</param>
        /// <returns>No Content</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStudent(int id, UpdateStudentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var student = await _context.Students.FindAsync(id);
                if (student == null)
                {
                    return NotFound(new { message = "Student not found" });
                }

                var existingStudent = await _context.Students
                    .FirstOrDefaultAsync(s => s.Email == dto.Email && s.StudentId != id && s.IsActive);
                
                if (existingStudent != null)
                {
                    return Conflict(new { message = "A student with this email already exists" });
                }

                _mappingService.UpdateStudentFromDto(student, dto);
                
                if (!string.IsNullOrEmpty(dto.Password))
                {
                    student.Password = _passwordService.HashPassword(dto.Password);
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error updating student" });
            }
        }

        /// <summary>
        /// Deletes a student (soft delete). (Xóa hồ sơ học viên - xóa mềm.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>No Content</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            try
            {
                var student = await FindStudent(id);
                if (student == null)
                {
                    return NotFound(new { message = "Student not found" });
                }

                student.IsActive = false;
                
                // Also deactivate associated user if exists
                if (student.UserId.HasValue)
                {
                    var user = await _context.Users.FindAsync(student.UserId.Value);
                    if (user != null)
                    {
                        user.IsActive = false;
                    }
                }

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error deleting student" });
            }
        }

        /// <summary>
        /// Gets student's enrollments. (Lấy danh sách các bản ghi đăng ký của học viên.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>List of enrollments (Danh sách đăng ký)</returns>
        [HttpGet("{id}/enrollments")]
        public async Task<ActionResult<IEnumerable<EnrollmentDto>>> GetStudentEnrollments(int id)
        {
            try
            {
                var student = await FindStudent(id);
                if (student == null)
                {
                    return NotFound(new { message = "Student not found" });
                }

                var enrollments = await _context.Enrollments
                    .Include(e => e.Student)
                    .Include(e => e.Curriculum)
                    .Where(e => e.StudentId == id)
                    .Select(e => new EnrollmentDto
                    {
                        EnrollmentId = e.EnrollmentId,
                        StudentId = e.StudentId,
                        StudentName = e.Student.FullName,
                        CurriculumId = e.CurriculumId,
                        CurriculumName = e.Curriculum != null ? e.Curriculum.CurriculumName : "",
                        EnrollmentDate = e.EnrollmentDate,
                        Status = e.Status
                    })
                    .ToListAsync();

                return Ok(enrollments);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error retrieving enrollments" });
            }
        }

        /// <summary>
        /// Gets student's enrolled curriculums with full schedule details. (Lấy danh sách chương trình học của học viên với chi tiết lịch học.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>List of curriculums with nested days and sessions (Danh sách chương trình học với chi tiết ngày và buổi học)</returns>
        [HttpGet("{id}/curriculums")]
        public async Task<ActionResult<IEnumerable<object>>> GetStudentCurriculums(int id)
        {
            try
            {
                var student = await FindStudent(id);
                if (student == null)
                {
                    return NotFound(new { message = "Student not found" });
                }

                // Get all curriculums the student is enrolled in with full nested structure
                var curriculums = await _context.Enrollments
                    .Include(e => e.Curriculum)
                    .ThenInclude(c => c.CurriculumCourses)
                    .ThenInclude(cc => cc.Course)
                    .Include(e => e.Curriculum)
                    .ThenInclude(c => c.CurriculumDays)
                    .ThenInclude(cd => cd.CurriculumSessions)
                    .ThenInclude(cs => cs.Teacher)
                    .Include(e => e.Curriculum)
                    .ThenInclude(c => c.CurriculumDays)
                    .ThenInclude(cd => cd.CurriculumSessions)
                    .ThenInclude(cs => cs.AssignedRoom)
                    .Where(e => e.StudentId == id && e.Curriculum.Status == "Active")
                    .Select(e => new
                    {
                        curriculumId = e.Curriculum.CurriculumId,
                        className = e.Curriculum.CurriculumName,
                        curriculumName = e.Curriculum.CurriculumName,
                        courseName = string.Join(", ", e.Curriculum.CurriculumCourses.Select(cc => cc.Course.CourseName)),
                        startDate = e.Curriculum.StartDate,
                        endDate = e.Curriculum.EndDate,
                        status = e.Curriculum.Status,
                        curriculumDays = e.Curriculum.CurriculumDays
                            .OrderBy(cd => cd.ScheduleDate)
                            .Select(cd => new
                            {
                                curriculumDayId = cd.CurriculumDayId,
                                scheduleDate = cd.ScheduleDate,
                                topic = cd.Topic,
                                curriculumSessions = cd.CurriculumSessions
                                    .OrderBy(cs => cs.StartTime)
                                    .Select(cs => new
                                    {
                                        curriculumSessionId = cs.CurriculumSessionId,
                                        sessionNumber = cs.SessionNumber,
                                        sessionName = cs.SessionName,
                                        startTime = cs.StartTime.ToString(@"hh\:mm"),
                                        endTime = cs.EndTime.ToString(@"hh\:mm"),
                                        roomName = cs.AssignedRoom != null ? cs.AssignedRoom.RoomName : "Chưa phân phòng",
                                        teacherName = cs.Teacher != null ? cs.Teacher.FullName : "Chưa phân giáo viên"
                                    })
                                    .ToList()
                            })
                            .ToList()
                    })
                    .ToListAsync();

                return Ok(curriculums);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving student curriculums");
                return StatusCode(500, new { message = "Error retrieving student classes", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets student's payments. (Lấy lịch sử thanh toán của học viên.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>List of payments (Danh sách thanh toán)</returns>
        [HttpGet("{id}/payments")]
        public async Task<ActionResult<IEnumerable<PaymentDto>>> GetStudentPayments(int id)
        {
            try
            {
                var student = await FindStudent(id);
                if (student == null)
                {
                    return NotFound(new { message = "Student not found" });
                }

                var payments = await _context.Payments
                    .Include(p => p.Student)
                    .Where(p => p.StudentId == id)
                    .Select(p => new PaymentDto
                    {
                        PaymentId = p.PaymentId,
                        StudentId = p.StudentId,
                        StudentName = p.Student.FullName,
                        Amount = p.Amount,
                        PaymentDate = p.PaymentDate,
                        PaymentMethod = p.PaymentMethod,
                        Status = p.Status,
                        Notes = p.Notes
                    })
                    .ToListAsync();

                return Ok(payments);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error retrieving payments" });
            }
        }

        /// <summary>
        /// Gets student's test scores. (Lấy bảng điểm của học viên.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>List of test scores (Danh sách điểm thi)</returns>
        [HttpGet("{id}/testscores")]
        public async Task<ActionResult<IEnumerable<TestScoreDto>>> GetStudentTestScores(int id)
        {
            try
            {
                var student = await FindStudent(id);
                if (student == null)
                {
                    return NotFound(new { message = "Student not found" });
                }

                var testScores = await _context.TestScores
                    .Include(ts => ts.Student)
                    .Include(ts => ts.Curriculum)
                    .Where(ts => ts.StudentId == id)
                    .Select(ts => new TestScoreDto
                    {
                        TestScoreId = ts.TestScoreId,
                        StudentId = ts.StudentId,
                        StudentName = ts.Student.FullName,
                        CurriculumId = ts.CurriculumId,
                        CurriculumName = ts.Curriculum != null ? ts.Curriculum.CurriculumName : "",
                        TestName = ts.TestName,
                        ListeningScore = ts.ListeningScore,
                        ReadingScore = ts.ReadingScore,
                        WritingScore = ts.WritingScore,
                        SpeakingScore = ts.SpeakingScore,
                        TotalScore = ts.TotalScore,
                        TestDate = ts.TestDate,
                        Comments = ts.Comments
                    })
                    .ToListAsync();

                return Ok(testScores);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error retrieving test scores" });
            }
        }

        /// <summary>
        /// Gets student's schedule based on Curriculum. (Lấy thời khóa biểu cá nhân của học viên theo Curriculum.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <param name="date">Filter by specific date (Lọc theo ngày cụ thể)</param>
        /// <param name="startDate">Filter by start date (Lọc từ ngày)</param>
        /// <param name="endDate">Filter by end date (Lọc đến ngày)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paginated list of curriculum sessions (Danh sách buổi học phân trang)</returns>
        [HttpGet("{id}/schedule")]
        public async Task<ActionResult<PagedResult<object>>> GetStudentSchedule(
            int id, 
            [FromQuery] DateTime? date = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var student = await FindStudent(id);
                if (student == null)
                {
                    return NotFound(new { message = "Student not found" });
                }

                // Get active enrollments for this student (regular course enrollment)
                var activeEnrollmentCurriculumIds = await _context.Enrollments
                    .Where(e => e.StudentId == id && e.Status == "Active")
                    .Join(_context.Curriculums,
                          e => e.CurriculumId,
                          c => c.CurriculumId,
                          (e, c) => c)
                    .Where(c => c.Status == "Active")
                    .Select(c => c.CurriculumId)
                    .ToListAsync();

                // Get session IDs where student was directly added (e.g. certification exam prep sessions)
                var directSessionIds = await _context.SessionStudents
                    .Where(ss => ss.StudentId == id)
                    .Select(ss => ss.CurriculumSessionId)
                    .ToListAsync();

                // If student has neither enrollments nor direct session registrations, return empty
                if (!activeEnrollmentCurriculumIds.Any() && !directSessionIds.Any())
                {
                    return Ok(new PagedResult<object>
                    {
                        Data = new List<object>(),
                        TotalCount = 0,
                        Page = page,
                        PageSize = pageSize,
                        TotalPages = 0
                    });
                }

                // Query sessions from BOTH enrollment-based curricula AND direct session registrations
                var query = _context.CurriculumSessions
                    .Include(cs => cs.CurriculumDay)
                    .ThenInclude(cd => cd.Curriculum)
                    .ThenInclude(c => c.CurriculumCourses)
                    .ThenInclude(cc => cc.Course)
                    .Include(cs => cs.AssignedRoom)
                    .Include(cs => cs.Teacher)
                    .Where(cs => activeEnrollmentCurriculumIds.Contains(cs.CurriculumDay.CurriculumId)
                              || directSessionIds.Contains(cs.CurriculumSessionId));

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
                    StudentId = id,
                    Date = cs.CurriculumDay.ScheduleDate.ToString("yyyy-MM-dd"),
                    DayOfWeek = cs.CurriculumDay.ScheduleDate.DayOfWeek.ToString(),
                    StartTime = cs.StartTime.ToString(@"hh\:mm"),
                    EndTime = cs.EndTime.ToString(@"hh\:mm"),
                    CourseName = cs.CurriculumDay.Curriculum?.CurriculumCourses != null && cs.CurriculumDay.Curriculum.CurriculumCourses.Any()
                        ? string.Join(", ", cs.CurriculumDay.Curriculum.CurriculumCourses.Select(cc => cc.Course?.CourseName).Where(n => !string.IsNullOrEmpty(n)))
                        : cs.CurriculumDay.Curriculum?.CurriculumName ?? "Chưa phân loại",
                    CurriculumName = cs.CurriculumDay.Curriculum?.CurriculumName ?? "",
                    SessionName = cs.SessionName ?? "",
                    SessionNumber = cs.SessionNumber,
                    Topic = cs.CurriculumDay?.Topic ?? "",
                    RoomName = cs.AssignedRoom?.RoomName ?? "Chưa phân phòng",
                    TeacherName = cs.Teacher?.FullName ?? "Chưa phân giáo viên",
                    Status = "Scheduled"
                }).ToList();

                _logger.LogInformation("Retrieved {Count} schedule items for student {StudentId} from {StartDate} to {EndDate}",
                    scheduleDtos.Count, id, startDate?.ToString("yyyy-MM-dd"), endDate?.ToString("yyyy-MM-dd"));

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
                return StatusCode(500, new { message = "Error retrieving student schedule" });
            }
        }
    }
}

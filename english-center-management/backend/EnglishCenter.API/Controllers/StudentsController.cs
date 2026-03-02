using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StudentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all students. (Lấy danh sách tất cả học viên.)
        /// </summary>
        /// <param name="search">Search term (Tìm kiếm theo tên, email, số điện thoại)</param>
        /// <param name="level">Student level (Cấp độ học viên)</param>
        /// <param name="isActive">Status (Trạng thái hoạt động)</param>
        /// <returns>List of students (Danh sách học viên)</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StudentDto>>> GetStudents(
            [FromQuery] string? search = null,
            [FromQuery] string? level = null,
            [FromQuery] bool? isActive = null)
        {
            var query = _context.Students.AsQueryable();

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

            if (isActive.HasValue)
            {
                query = query.Where(s => s.IsActive == isActive.Value);
            }

            var students = await query
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

            return Ok(students);
        }

        /// <summary>
        /// Gets a student by ID. (Lấy thông tin cá nhân của học viên theo ID.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>Student details (Thông tin chi tiết học viên)</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<StudentDto>> GetStudent(int id)
        {
            var student = await _context.Students
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

            if (student == null)
            {
                return NotFound(new { message = "Student not found" });
            }

            return Ok(student);
        }

        /// <summary>
        /// Creates a new student. (Thêm học viên mới.)
        /// </summary>
        /// <param name="dto">Student creation data (Dữ liệu tạo học viên)</param>
        /// <returns>Created student (Học viên vừa tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<StudentDto>> CreateStudent(CreateStudentDto dto)
        {
            var student = new Student
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                DateOfBirth = dto.DateOfBirth,
                Address = dto.Address,
                EnrollmentDate = DateTime.Now,
                Level = dto.Level,
                IsActive = true
            };

            _context.Students.Add(student);
            await _context.SaveChangesAsync();

            var studentDto = new StudentDto
            {
                StudentId = student.StudentId,
                FullName = student.FullName,
                Email = student.Email,
                PhoneNumber = student.PhoneNumber,
                DateOfBirth = student.DateOfBirth,
                Address = student.Address,
                EnrollmentDate = student.EnrollmentDate,
                Level = student.Level,
                IsActive = student.IsActive
            };

            return CreatedAtAction(nameof(GetStudent), new { id = student.StudentId }, studentDto);
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
            var student = await _context.Students.FindAsync(id);

            if (student == null)
            {
                return NotFound(new { message = "Student not found" });
            }

            student.FullName = dto.FullName;
            student.Email = dto.Email;
            student.PhoneNumber = dto.PhoneNumber;
            student.DateOfBirth = dto.DateOfBirth;
            student.Address = dto.Address;
            student.Level = dto.Level;
            student.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Deletes a student (soft delete). (Xóa hồ sơ học viên - xóa mềm.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>No Content</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var student = await _context.Students.FindAsync(id);

            if (student == null)
            {
                return NotFound(new { message = "Student not found" });
            }

            // Soft delete
            student.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Gets student's enrollments. (Lấy danh sách các bản ghi đăng ký của học viên.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>List of enrollments (Danh sách đăng ký)</returns>
        [HttpGet("{id}/enrollments")]
        public async Task<ActionResult<IEnumerable<EnrollmentDto>>> GetStudentEnrollments(int id)
        {
            var enrollments = await _context.Enrollments
                .Include(e => e.Class)
                .ThenInclude(c => c.Course)
                .Where(e => e.StudentId == id)
                .Select(e => new EnrollmentDto
                {
                    EnrollmentId = e.EnrollmentId,
                    StudentId = e.StudentId,
                    StudentName = e.Student.FullName,
                    ClassId = e.ClassId,
                    ClassName = e.Class.ClassName,
                    EnrollmentDate = e.EnrollmentDate,
                    Status = e.Status
                })
                .ToListAsync();

            return Ok(enrollments);
        }

        /// <summary>
        /// Gets student's payments. (Lấy lịch sử thanh toán của học viên.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>List of payments (Danh sách thanh toán)</returns>
        [HttpGet("{id}/payments")]
        public async Task<ActionResult<IEnumerable<PaymentDto>>> GetStudentPayments(int id)
        {
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

        /// <summary>
        /// Gets student's test scores. (Lấy bảng điểm của học viên.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>List of test scores (Danh sách điểm thi)</returns>
        [HttpGet("{id}/testscores")]
        public async Task<ActionResult<IEnumerable<TestScoreDto>>> GetStudentTestScores(int id)
        {
            var testScores = await _context.TestScores
                .Include(ts => ts.Student)
                .Include(ts => ts.Class)
                .Where(ts => ts.StudentId == id)
                .Select(ts => new TestScoreDto
                {
                    TestScoreId = ts.TestScoreId,
                    StudentId = ts.StudentId,
                    StudentName = ts.Student.FullName,
                    ClassId = ts.ClassId,
                    ClassName = ts.Class.ClassName,
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

        /// <summary>
        /// Gets student's schedule. (Lấy thời khóa biểu cá nhân của học viên.)
        /// </summary>
        /// <param name="id">Student ID (ID học viên)</param>
        /// <returns>List of curriculums (Danh sách lịch học)</returns>
        [HttpGet("{id}/schedule")]
        public async Task<ActionResult<IEnumerable<CurriculumDto>>> GetStudentSchedule(int id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null)
            {
                return NotFound(new { message = "Student not found" });
            }

            var activeEnrollments = await _context.Enrollments
                .Where(e => e.StudentId == id && e.Status == "Active")
                .Select(e => e.ClassId)
                .ToListAsync();

            var curriculums = await _context.Curriculums
                .Where(c => activeEnrollments.Contains(c.ClassId))
                .Include(c => c.Class)
                .Include(c => c.CurriculumDays)
                    .ThenInclude(cd => cd.CurriculumSessions)
                        .ThenInclude(cs => cs.AssignedRoom)
                .ToListAsync();

            return Ok(curriculums.Select(c => new CurriculumDto
            {
                CurriculumId = c.CurriculumId,
                CurriculumName = c.CurriculumName,
                ClassId = c.ClassId,
                ClassName = c.Class.ClassName,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                Description = c.Description,
                Status = c.Status,
                CurriculumDays = c.CurriculumDays.Select(cd => new CurriculumDayDto
                {
                    CurriculumDayId = cd.CurriculumDayId,
                    CurriculumId = cd.CurriculumId,
                    ScheduleDate = cd.ScheduleDate,
                    Topic = cd.Topic,
                    Description = cd.Description,
                    SessionCount = cd.SessionCount,
                    CurriculumSessions = cd.CurriculumSessions.Select(cs => new CurriculumSessionDto
                    {
                        CurriculumSessionId = cs.CurriculumSessionId,
                        CurriculumDayId = cs.CurriculumDayId,
                        SessionNumber = cs.SessionNumber,
                        StartTime = cs.StartTime,
                        EndTime = cs.EndTime,
                        SessionName = cs.SessionName,
                        SessionDescription = cs.SessionDescription,
                        RoomId = cs.RoomId,
                        RoomName = cs.AssignedRoom?.RoomName ?? "N/A"
                    }).ToList()
                }).ToList()
            }));
        }
    }
}

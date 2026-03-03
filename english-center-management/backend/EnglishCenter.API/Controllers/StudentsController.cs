using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Services;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMappingService _mappingService;
        private readonly IPasswordService _passwordService;

        public StudentsController(
            ApplicationDbContext context,
            IMappingService mappingService,
            IPasswordService passwordService)
        {
            _context = context;
            _mappingService = mappingService;
            _passwordService = passwordService;
        }

        private async Task<Student?> FindStudent(int id)
        {
            return await _context.Students.FindAsync(id);
        }

        // GET: api/students
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

                // Filter by status - mặc định chỉ lấy active students
                if (isActive.HasValue)
                {
                    query = query.Where(s => s.IsActive == isActive.Value);
                }
                else
                {
                    // Mặc định chỉ lấy students đang active
                    query = query.Where(s => s.IsActive);
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
                        Username = s.Username,
                        Avatar = s.Avatar,
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

                return Ok(pagedResult);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error retrieving students" });
            }
        }

        // GET: api/students/5
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
                        Username = s.Username,
                        Avatar = s.Avatar,
                        EnrollmentDate = s.EnrollmentDate,
                        Level = s.Level,
                        IsActive = s.IsActive
                    })
                    .FirstOrDefaultAsync();

                if (studentDto == null)
                {
                    return NotFound(new { message = "Student not found" });
                }

                return Ok(studentDto);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error retrieving student" });
            }
        }

        // POST: api/students
        [HttpPost]
        public async Task<ActionResult<StudentDto>> CreateStudent(CreateStudentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingStudent = await _context.Students
                    .FirstOrDefaultAsync(s => s.Email == dto.Email && s.IsActive);
                
                if (existingStudent != null)
                {
                    return Conflict(new { message = "A student with this email already exists" });
                }

                var student = _mappingService.MapToStudent(dto);
                student.Password = _passwordService.HashPassword(dto.Password);

                _context.Students.Add(student);
                await _context.SaveChangesAsync();

                var studentDto = _mappingService.MapToStudentDto(student);
                return CreatedAtAction(nameof(GetStudent), new { id = student.StudentId }, studentDto);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error creating student" });
            }
        }

        // PUT: api/students/5
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

        // DELETE: api/students/5
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
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error deleting student" });
            }
        }

        // GET: api/students/5/enrollments
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
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error retrieving enrollments" });
            }
        }

        // GET: api/students/5/payments
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

        // GET: api/students/5/testscores
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
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error retrieving test scores" });
            }
        }

        // GET: api/students/5/schedule
        [HttpGet("{id}/schedule")]
        public async Task<ActionResult<IEnumerable<CurriculumDto>>> GetStudentSchedule(int id)
        {
            try
            {
                var student = await FindStudent(id);
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
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error retrieving schedule" });
            }
        }
    }
}

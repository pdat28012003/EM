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

        // GET: api/students
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

        // GET: api/students/5
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

        // POST: api/students
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

        // PUT: api/students/5
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

        // DELETE: api/students/5
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

        // GET: api/students/5/enrollments
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

        // GET: api/students/5/payments
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

        // GET: api/students/5/testscores
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
    }
}

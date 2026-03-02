using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Controllers
{
    // ENROLLMENTS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class EnrollmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EnrollmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all enrollments. (Lấy danh sách các bản ghi đăng ký khóa học.)
        /// </summary>
        /// <returns>List of enrollments (Danh sách đăng ký)</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnrollmentDto>>> GetEnrollments()
        {
            var enrollments = await _context.Enrollments
                .Include(e => e.Student)
                .Include(e => e.Class)
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
        /// Creates a new enrollment. (Đăng ký học viên vào một lớp/khóa học.)
        /// </summary>
        /// <param name="dto">Enrollment creation data (Dữ liệu đăng ký)</param>
        /// <returns>Created enrollment (Thông tin đăng ký vừa tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<EnrollmentDto>> CreateEnrollment(CreateEnrollmentDto dto)
        {
            // Check if student exists
            var student = await _context.Students.FindAsync(dto.StudentId);
            if (student == null)
            {
                return NotFound(new { message = "Student not found" });
            }

            // Check if class exists and has available slots
            var classEntity = await _context.Classes
                .Include(c => c.Enrollments)
                .FirstOrDefaultAsync(c => c.ClassId == dto.ClassId);

            if (classEntity == null)
            {
                return NotFound(new { message = "Class not found" });
            }

            var currentEnrollments = classEntity.Enrollments.Count(e => e.Status == "Active");
            if (currentEnrollments >= classEntity.MaxStudents)
            {
                return BadRequest(new { message = "Class is full" });
            }

            // Check if student is already enrolled
            var existingEnrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == dto.StudentId && 
                                         e.ClassId == dto.ClassId && 
                                         e.Status == "Active");

            if (existingEnrollment != null)
            {
                return BadRequest(new { message = "Student is already enrolled in this class" });
            }

            var enrollment = new Enrollment
            {
                StudentId = dto.StudentId,
                ClassId = dto.ClassId,
                EnrollmentDate = DateTime.Now,
                Status = "Active"
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            var enrollmentDto = await _context.Enrollments
                .Include(e => e.Student)
                .Include(e => e.Class)
                .Where(e => e.EnrollmentId == enrollment.EnrollmentId)
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
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetEnrollments), new { id = enrollment.EnrollmentId }, enrollmentDto);
        }

        /// <summary>
        /// Deletes an enrollment record. (Hủy/Xóa bản ghi đăng ký.)
        /// </summary>
        /// <param name="id">Enrollment ID (ID bản ghi đăng ký)</param>
        /// <returns>No Content</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnrollment(int id)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);

            if (enrollment == null)
            {
                return NotFound(new { message = "Enrollment not found" });
            }

            enrollment.Status = "Dropped";
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // PAYMENTS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PaymentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all payments. (Lấy danh sách các giao dịch thanh toán.)
        /// </summary>
        /// <param name="startDate">Start date filter (Ngày bắt đầu)</param>
        /// <param name="endDate">End date filter (Ngày kết thúc)</param>
        /// <returns>List of payments (Danh sách thanh toán)</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymentDto>>> GetPayments(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var query = _context.Payments
                .Include(p => p.Student)
                .AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate <= endDate.Value);
            }

            var payments = await query
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
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            return Ok(payments);
        }

        /// <summary>
        /// Creates a new payment. (Tạo một phiếu thu/giao dịch thanh toán mới.)
        /// </summary>
        /// <param name="dto">Payment creation data (Dữ liệu thanh toán)</param>
        /// <returns>Created payment (Thông tin thanh toán vừa tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<PaymentDto>> CreatePayment(CreatePaymentDto dto)
        {
            var student = await _context.Students.FindAsync(dto.StudentId);
            if (student == null)
            {
                return NotFound(new { message = "Student not found" });
            }

            var payment = new Payment
            {
                StudentId = dto.StudentId,
                Amount = dto.Amount,
                PaymentDate = DateTime.Now,
                PaymentMethod = dto.PaymentMethod,
                Status = "Completed",
                Notes = dto.Notes
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            var paymentDto = new PaymentDto
            {
                PaymentId = payment.PaymentId,
                StudentId = payment.StudentId,
                StudentName = student.FullName,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status,
                Notes = payment.Notes
            };

            return CreatedAtAction(nameof(GetPayments), new { id = payment.PaymentId }, paymentDto);
        }
    }

    // SCHEDULES CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class SchedulesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SchedulesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all schedules. (Lấy danh sách lịch học tổng thể.)
        /// </summary>
        /// <returns>List of schedules (Danh sách lịch học)</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ScheduleDto>>> GetSchedules()
        {
            var schedules = await _context.Schedules
                .Include(s => s.Class)
                .Include(s => s.Teacher)
                .Select(s => new ScheduleDto
                {
                    ScheduleId = s.ScheduleId,
                    ClassId = s.ClassId,
                    ClassName = s.Class.ClassName,
                    TeacherId = s.TeacherId,
                    TeacherName = s.Teacher.FullName,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    Room = s.Room
                })
                .ToListAsync();

            return Ok(schedules);
        }

        /// <summary>
        /// Creates a new schedule. (Tạo lịch học mới.)
        /// </summary>
        /// <param name="dto">Schedule creation data (Dữ liệu tạo lịch học)</param>
        /// <returns>Created schedule (Thông tin lịch học vừa tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<ScheduleDto>> CreateSchedule(CreateScheduleDto dto)
        {
            var schedule = new Schedule
            {
                ClassId = dto.ClassId,
                TeacherId = dto.TeacherId,
                DayOfWeek = dto.DayOfWeek,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Room = dto.Room
            };

            _context.Schedules.Add(schedule);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSchedules), new { id = schedule.ScheduleId }, schedule);
        }

        /// <summary>
        /// Deletes a schedule. (Xóa một lịch học cụ thể.)
        /// </summary>
        /// <param name="id">Schedule ID (ID lịch học)</param>
        /// <returns>No Content</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSchedule(int id)
        {
            var schedule = await _context.Schedules.FindAsync(id);

            if (schedule == null)
            {
                return NotFound(new { message = "Schedule not found" });
            }

            _context.Schedules.Remove(schedule);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // TEST SCORES CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class TestScoresController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestScoresController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all test scores. (Lấy danh sách điểm số.)
        /// </summary>
        /// <returns>List of test scores (Danh sách điểm thi)</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TestScoreDto>>> GetTestScores()
        {
            var testScores = await _context.TestScores
                .Include(ts => ts.Student)
                .Include(ts => ts.Class)
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
                .OrderByDescending(ts => ts.TestDate)
                .ToListAsync();

            return Ok(testScores);
        }

        /// <summary>
        /// Creates a new test score. (Nhập điểm thi/kiểm tra mới.)
        /// </summary>
        /// <param name="dto">Test score creation data (Dữ liệu điểm thi)</param>
        /// <returns>Created test score (Thông tin điểm thi vừa tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<TestScoreDto>> CreateTestScore(CreateTestScoreDto dto)
        {
            var totalScore = (dto.ListeningScore + dto.ReadingScore + 
                            dto.WritingScore + dto.SpeakingScore) / 4;

            var testScore = new TestScore
            {
                StudentId = dto.StudentId,
                ClassId = dto.ClassId,
                TestName = dto.TestName,
                ListeningScore = dto.ListeningScore,
                ReadingScore = dto.ReadingScore,
                WritingScore = dto.WritingScore,
                SpeakingScore = dto.SpeakingScore,
                TotalScore = totalScore,
                TestDate = DateTime.Now,
                Comments = dto.Comments
            };

            _context.TestScores.Add(testScore);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTestScores), new { id = testScore.TestScoreId }, testScore);
        }
    }

    // DASHBOARD CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets dashboard statistic statistics. (Lấy các số liệu thống kê tổng quan cho hệ thống.)
        /// </summary>
        /// <returns>Dashboard stats (Số liệu thống kê)</returns>
        [HttpGet("stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
        {
            var totalStudents = await _context.Students.CountAsync();
            var activeStudents = await _context.Students.CountAsync(s => s.IsActive);
            var totalTeachers = await _context.Teachers.CountAsync(t => t.IsActive);
            var totalClasses = await _context.Classes.CountAsync();
            var activeClasses = await _context.Classes.CountAsync(c => c.Status == "Active");
            var totalRevenue = await _context.Payments
                .Where(p => p.Status == "Completed")
                .SumAsync(p => p.Amount);
            
            var currentMonth = DateTime.Now.Month;
            var currentYear = DateTime.Now.Year;
            var monthlyRevenue = await _context.Payments
                .Where(p => p.Status == "Completed" && 
                           p.PaymentDate.Month == currentMonth && 
                           p.PaymentDate.Year == currentYear)
                .SumAsync(p => p.Amount);

            var stats = new DashboardStatsDto
            {
                TotalStudents = totalStudents,
                ActiveStudents = activeStudents,
                TotalTeachers = totalTeachers,
                TotalClasses = totalClasses,
                ActiveClasses = activeClasses,
                TotalRevenue = totalRevenue,
                MonthlyRevenue = monthlyRevenue
            };

            return Ok(stats);
        }
    }
}

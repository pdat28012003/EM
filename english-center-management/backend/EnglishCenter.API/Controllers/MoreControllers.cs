using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Controllers
{
    // TEACHER SCHEDULE CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class TeacherScheduleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TeacherScheduleController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets schedule by teacher ID. (Lấy lịch dạy theo ID giáo viên.)
        /// </summary>
        /// <param name="teacherId">Teacher ID (ID giáo viên)</param>
        /// <returns>Teacher's schedule (Lịch dạy của giáo viên)</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeacherScheduleDto>>> GetTeacherSchedule([FromQuery] int teacherId)
        {
            var schedules = await _context.CurriculumSessions
                .Where(s => s.TeacherId == teacherId)
                .Include(s => s.CurriculumDay)
                .ThenInclude(cd => cd.Curriculum)
                .ThenInclude(c => c.Course)
                .Include(s => s.AssignedRoom)
                .ToListAsync();

            var scheduleDtos = schedules.Select(s => new TeacherScheduleDto
                {
                    ScheduleId = s.CurriculumSessionId,
                    ClassId = s.CurriculumDay.Curriculum.CourseId,
                    ClassName = s.CurriculumDay.Curriculum.Course.CourseName,
                    TeacherId = s.TeacherId ?? 0,
                    TeacherName = s.Teacher != null ? s.Teacher.FullName : "",
                    DayOfWeek = s.CurriculumDay.ScheduleDate.DayOfWeek.ToString(),
                    Date = s.CurriculumDay.ScheduleDate,
                    StartTime = s.StartTime.ToString(@"hh\:mm\:ss"),
                    EndTime = s.EndTime.ToString(@"hh\:mm\:ss"),
                    Room = s.AssignedRoom != null ? s.AssignedRoom.RoomName : "",
                    Status = "Scheduled"
                })
                .OrderBy(dto => dto.Date)
                .ThenBy(dto => dto.StartTime)
                .ToList();

            return Ok(scheduleDtos);
        }
    }

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

            // Create notification for the teacher of the class
            var classEntityWithTeacher = await _context.Classes
                .FirstOrDefaultAsync(c => c.ClassId == dto.ClassId);
            
            if (classEntityWithTeacher?.TeacherId != null)
            {
                var notification = new Notification
                {
                    TeacherId = classEntityWithTeacher.TeacherId,
                    Title = "Học viên mới được thêm vào lớp",
                    Message = $"Học viên {student.FullName} vừa được thêm vào lớp {classEntityWithTeacher.ClassName}",
                    Type = "NewEnrollment",
                    RelatedId = enrollment.EnrollmentId,
                    RelatedType = "Enrollment",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);

                // CREATE ACTIVITY LOG for teacher
                var teacherActivity = new ActivityLog
                {
                    TeacherId = classEntityWithTeacher.TeacherId,
                    Action = "ENROLL_STUDENT",
                    Title = "Học viên mới được thêm vào lớp",
                    Description = $"Học viên {student.FullName} vừa được thêm vào lớp {classEntityWithTeacher.ClassName}",
                    IconType = "group_add",
                    Color = "success",
                    TargetId = enrollment.EnrollmentId,
                    TargetType = "Enrollment",
                    CreatedAt = DateTime.UtcNow
                };
                _context.ActivityLogs.Add(teacherActivity);

                // CREATE ACTIVITY LOG for student
                var studentActivity = new ActivityLog
                {
                    StudentId = dto.StudentId,
                    Action = "ENROLL_CLASS",
                    Title = "Đã tham gia lớp học",
                    Description = $"Bạn đã được thêm vào lớp {classEntityWithTeacher.ClassName}",
                    IconType = "group_add",
                    Color = "success",
                    TargetId = enrollment.EnrollmentId,
                    TargetType = "Enrollment",
                    CreatedAt = DateTime.UtcNow
                };
                _context.ActivityLogs.Add(studentActivity);

                await _context.SaveChangesAsync();
            }

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
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paginated list of payments (Danh sách thanh toán phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<PaymentDto>>> GetPayments(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
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

            var totalCount = await query.CountAsync();
            
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
                    Notes = p.Notes,
                    TransactionId = p.TransactionId,
                    QRCodeUrl = p.QRCodeUrl,
                    Gateway = p.Gateway,
                    PaymentCompletedDate = p.PaymentCompletedDate,
                    Courses = new List<CourseForPaymentDto>() // Empty list for manual payments
                })
                .OrderByDescending(p => p.PaymentDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new PagedResult<PaymentDto>
            {
                Data = payments,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
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
                PaymentMethod = "Cash", // Default payment method for manual creation
                Status = "Completed",
                Notes = dto.Notes ?? ""
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
                Notes = payment.Notes ?? "",
                TransactionId = payment.TransactionId,
                QRCodeUrl = payment.QRCodeUrl,
                Gateway = payment.Gateway,
                PaymentCompletedDate = payment.PaymentCompletedDate,
                Courses = new List<CourseForPaymentDto>() // Empty list for manual payments
            };

            return CreatedAtAction(nameof(GetPayments), new { id = payment.PaymentId }, paymentDto);
        }
    }

    // ROOMS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class RoomsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RoomsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all rooms. (Lấy danh sách phòng học.)
        /// </summary>
        /// <returns>List of rooms (Danh sách phòng học)</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomDto>>> GetRooms()
        {
            var rooms = await _context.Rooms
                .Where(r => r.IsActive)
                .Select(r => new RoomDto
                {
                    RoomId = r.RoomId,
                    RoomName = r.RoomName,
                    Description = r.Description,
                    Capacity = r.Capacity,
                    AvailableStartTime = r.AvailableStartTime,
                    AvailableEndTime = r.AvailableEndTime,
                    IsActive = r.IsActive
                })
                .ToListAsync();

            return Ok(rooms);
        }

        /// <summary>
        /// Creates a new room. (Tạo phòng học mới.)
        /// </summary>
        /// <param name="dto">Room creation data (Dữ liệu tạo phòng học)</param>
        /// <returns>Created room (Thông tin phòng học vừa tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<RoomDto>> CreateRoom(CreateRoomDto dto)
        {
            var room = new Room
            {
                RoomName = dto.RoomName,
                Description = dto.Description,
                Capacity = dto.Capacity,
                AvailableStartTime = dto.AvailableStartTime,
                AvailableEndTime = dto.AvailableEndTime,
                IsActive = true
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            var roomDto = new RoomDto
            {
                RoomId = room.RoomId,
                RoomName = room.RoomName,
                Description = room.Description,
                Capacity = room.Capacity,
                AvailableStartTime = room.AvailableStartTime,
                AvailableEndTime = room.AvailableEndTime,
                IsActive = room.IsActive
            };

            return CreatedAtAction(nameof(GetRooms), new { id = room.RoomId }, roomDto);
        }

        /// <summary>
        /// Gets room availability for a specific date. (Kiểm tra tình trạng phòng học theo ngày.)
        /// </summary>
        /// <param name="roomId">Room ID (ID phòng học)</param>
        /// <param name="date">Date to check (Ngày cần kiểm tra)</param>
        /// <returns>Room availability (Tình trạng phòng học)</returns>
        [HttpGet("{roomId}/availability")]
        public async Task<ActionResult<object>> GetRoomAvailability(int roomId, DateTime date)
        {
            var room = await _context.Rooms.FindAsync(roomId);
            if (room == null || !room.IsActive)
            {
                return NotFound(new { message = "Room not found or inactive" });
            }

            var dayOfWeek = date.DayOfWeek.ToString();
            var schedules = await _context.CurriculumSessions
                .Include(cs => cs.CurriculumDay)
                .ThenInclude(cd => cd.Curriculum)
                .ThenInclude(c => c.Course)
                .Include(cs => cs.Teacher)
                .Where(cs => cs.RoomId == roomId 
                           && cs.CurriculumDay.ScheduleDate.Date == date.Date)
                .ToListAsync();

            var scheduleDtos = schedules.Select(cs => new
                {
                    cs.CurriculumSessionId,
                    cs.StartTime,
                    cs.EndTime,
                    ClassName = cs.CurriculumDay.Curriculum.Course.CourseName,
                    TeacherName = cs.Teacher != null ? cs.Teacher.FullName : ""
                })
                .OrderBy(cs => cs.StartTime)
                .ToList();

            return Ok(new
            {
                RoomId = room.RoomId,
                RoomName = room.RoomName,
                Date = date.ToString("yyyy-MM-dd"),
                DayOfWeek = dayOfWeek,
                AvailableStartTime = room.AvailableStartTime,
                AvailableEndTime = room.AvailableEndTime,
                Capacity = room.Capacity,
                Schedules = scheduleDtos
            });
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
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paginated list of test scores (Danh sách điểm thi phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<TestScoreDto>>> GetTestScores(
            [FromQuery] int? classId = null,
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10)
        {
            try
            {
                Console.WriteLine($"DEBUG: GetTestScores called with classId: {classId}");
                
                var query = _context.TestScores
                    .Include(ts => ts.Student)
                    .Include(ts => ts.Class)
                    .AsQueryable();

                Console.WriteLine($"DEBUG: Before filter - Total records: {await query.CountAsync()}");

                if (classId.HasValue)
                {
                    Console.WriteLine($"DEBUG: Filtering by ClassId: {classId.Value}");
                    query = query.Where(ts => ts.ClassId == classId.Value);
                    
                    var filteredCount = await query.CountAsync();
                    Console.WriteLine($"DEBUG: After filter - Filtered records: {filteredCount}");
                }

                var totalCount = await query.CountAsync();
                Console.WriteLine($"DEBUG: Final totalCount: {totalCount}");
                
                var testScores = await query
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
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new PagedResult<TestScoreDto>
            {
                Data = testScores,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR in GetTestScores: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets a test score by ID. (Lấy điểm thi theo ID.)
        /// </summary>
        /// <param name="id">Test score ID (ID điểm thi)</param>
        /// <returns>Test score details (Chi tiết điểm thi)</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<TestScoreDto>> GetTestScore(int id)
        {
            var testScore = await _context.TestScores
                .Include(ts => ts.Student)
                .Include(ts => ts.Class)
                .Where(ts => ts.TestScoreId == id)
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
                .FirstOrDefaultAsync();

            if (testScore == null)
            {
                return NotFound(new { message = "Test score not found" });
            }

            return Ok(testScore);
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

            // Create notification for the student
            if (dto.StudentId > 0)
            {
                var notification = new Notification
                {
                    StudentId = dto.StudentId,
                    Title = "Điểm thi mới",
                    Message = $"Bạn vừa có điểm {dto.TestName}: {totalScore:F1}/10",
                    Type = "TestScore",
                    RelatedId = testScore.TestScoreId,
                    RelatedType = "TestScore",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetTestScores), new { id = testScore.TestScoreId }, testScore);
        }

        /// <summary>
        /// Updates a test score. (Cập nhật điểm thi.)
        /// </summary>
        /// <param name="id">Test score ID (ID điểm thi)</param>
        /// <param name="dto">Test score update data (Dữ liệu cập nhật điểm thi)</param>
        /// <returns>Updated test score (Thông tin điểm thi đã cập nhật)</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<TestScoreDto>> UpdateTestScore(int id, UpdateTestScoreDto dto)
        {
            var testScore = await _context.TestScores.FindAsync(id);
            if (testScore == null)
            {
                return NotFound(new { message = "Test score not found" });
            }

            testScore.ListeningScore = dto.ListeningScore;
            testScore.ReadingScore = dto.ReadingScore;
            testScore.WritingScore = dto.WritingScore;
            testScore.SpeakingScore = dto.SpeakingScore;
            testScore.TotalScore = (dto.ListeningScore + dto.ReadingScore + dto.WritingScore + dto.SpeakingScore) / 4;
            testScore.Comments = dto.Comments;

            await _context.SaveChangesAsync();

            var updatedTestScore = await _context.TestScores
                .Include(ts => ts.Student)
                .Include(ts => ts.Class)
                .Where(ts => ts.TestScoreId == id)
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
                .FirstOrDefaultAsync();

            return Ok(updatedTestScore);
        }

        /// <summary>
        /// Deletes a test score. (Xóa điểm thi.)
        /// </summary>
        /// <param name="id">Test score ID (ID điểm thi)</param>
        /// <returns>No content (Không có nội dung)</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTestScore(int id)
        {
            var testScore = await _context.TestScores.FindAsync(id);
            if (testScore == null)
            {
                return NotFound(new { message = "Test score not found" });
            }

            _context.TestScores.Remove(testScore);
            await _context.SaveChangesAsync();

            return NoContent();
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

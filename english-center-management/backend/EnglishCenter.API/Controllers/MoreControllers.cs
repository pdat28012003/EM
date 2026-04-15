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
                .ThenInclude(c => c.CurriculumCourses)
                .ThenInclude(cc => cc.Course)
                .Include(s => s.AssignedRoom)
                .ToListAsync();

            var scheduleDtos = schedules.Select(s => new TeacherScheduleDto
                {
                    ScheduleId = s.CurriculumSessionId,
                    ClassId = s.CurriculumDay.Curriculum.CurriculumCourses.FirstOrDefault()?.CourseId ?? 0,  // Keep for backward compatibility
                    CurriculumId = s.CurriculumDay.Curriculum.CurriculumId,
                    ClassName = string.Join(", ", s.CurriculumDay.Curriculum.CurriculumCourses.Select(cc => cc.Course.CourseName)),
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
                .Include(e => e.Curriculum)
                .Select(e => new EnrollmentDto
                {
                    EnrollmentId = e.EnrollmentId,
                    StudentId = e.StudentId,
                    StudentName = e.Student.FullName,
                    CurriculumId = e.CurriculumId,
                    CurriculumName = e.Curriculum.CurriculumName,
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

            // Check if curriculum exists
            var curriculum = await _context.Curriculums
                .Include(c => c.Enrollments)
                .FirstOrDefaultAsync(c => c.CurriculumId == dto.CurriculumId);

            if (curriculum == null)
            {
                return NotFound(new { message = "Curriculum not found" });
            }

            // Check capacity if defined
            var currentEnrollments = curriculum.Enrollments.Count(e => e.Status == "Active");
            var maxStudents = curriculum.ParticipantStudents?.Count ?? 50; // Default capacity
            if (currentEnrollments >= maxStudents)
            {
                return BadRequest(new { message = "Curriculum is full" });
            }

            // Check if student is already enrolled
            var existingEnrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == dto.StudentId && 
                                         e.CurriculumId == dto.CurriculumId && 
                                         e.Status == "Active");

            if (existingEnrollment != null)
            {
                return BadRequest(new { message = "Student is already enrolled in this curriculum" });
            }

            var enrollment = new Enrollment
            {
                StudentId = dto.StudentId,
                CurriculumId = dto.CurriculumId,
                EnrollmentDate = DateTime.Now,
                Status = "Active"
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            // Create notification for curriculum teachers
            var curriculumTeachers = await _context.Curriculums
                .Where(c => c.CurriculumId == dto.CurriculumId)
                .SelectMany(c => c.ParticipantTeachers)
                .ToListAsync();
            
            foreach (var teacher in curriculumTeachers)
            {
                var notification = new Notification
                {
                    TeacherId = teacher.TeacherId,
                    Title = "Học viên mới đăng ký",
                    Message = $"Học viên {student.FullName} vừa đăng ký khóa {curriculum.CurriculumName}",
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
                    TeacherId = teacher.TeacherId,
                    Action = "ENROLL_STUDENT",
                    Title = "Học viên mới đăng ký",
                    Description = $"Học viên {student.FullName} vừa đăng ký khóa {curriculum.CurriculumName}",
                    IconType = "group_add",
                    Color = "success",
                    TargetId = enrollment.EnrollmentId,
                    TargetType = "Enrollment",
                    CreatedAt = DateTime.UtcNow
                };
                _context.ActivityLogs.Add(teacherActivity);
            }
            
            // CREATE ACTIVITY LOG for student
            var studentActivity = new ActivityLog
            {
                StudentId = dto.StudentId,
                Action = "ENROLL_CURRICULUM",
                Title = "Đã tham gia khóa học",
                Description = $"Bạn đã đăng ký khóa {curriculum.CurriculumName}",
                IconType = "group_add",
                Color = "success",
                TargetId = enrollment.EnrollmentId,
                TargetType = "Enrollment",
                CreatedAt = DateTime.UtcNow
            };
            _context.ActivityLogs.Add(studentActivity);

            await _context.SaveChangesAsync();

            var enrollmentDto = await _context.Enrollments
                .Include(e => e.Student)
                .Include(e => e.Curriculum)
                .Where(e => e.EnrollmentId == enrollment.EnrollmentId)
                .Select(e => new EnrollmentDto
                {
                    EnrollmentId = e.EnrollmentId,
                    StudentId = e.StudentId,
                    StudentName = e.Student.FullName,
                    CurriculumId = e.CurriculumId,
                    CurriculumName = e.Curriculum.CurriculumName,
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
                .ThenInclude(c => c.CurriculumCourses)
                .ThenInclude(cc => cc.Course)
                .Include(cs => cs.Teacher)
                .Where(cs => cs.RoomId == roomId 
                           && cs.CurriculumDay.ScheduleDate.Date == date.Date)
                .ToListAsync();

            var scheduleDtos = schedules.Select(cs => new
                {
                    cs.CurriculumSessionId,
                    cs.StartTime,
                    cs.EndTime,
                    ClassName = string.Join(", ", cs.CurriculumDay.Curriculum.CurriculumCourses.Select(cc => cc.Course.CourseName)),
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
                Capacity = room.Capacity,
                Schedules = scheduleDtos
            });
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
            var totalCurriculums = await _context.Curriculums.CountAsync();
            var activeCurriculums = await _context.Curriculums.CountAsync(c => c.Status == "Active");
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
                TotalCurriculums = totalCurriculums,
                ActiveCurriculums = activeCurriculums,
                TotalRevenue = totalRevenue,
                MonthlyRevenue = monthlyRevenue
            };

            return Ok(stats);
        }

        /// <summary>
        /// Gets revenue trend for the last 6 months. (Lấy xu hướng doanh thu 6 tháng gần nhất.)
        /// </summary>
        /// <returns>Revenue trend data (Dữ liệu xu hướng doanh thu)</returns>
        [HttpGet("revenue-trend")]
        public async Task<ActionResult<RevenueTrendDto>> GetRevenueTrend()
        {
            var monthlyData = new List<RevenueTrendItemDto>();
            var today = DateTime.Now;

            // Get last 6 months data
            for (int i = 5; i >= 0; i--)
            {
                var date = today.AddMonths(-i);
                var monthName = $"T{date.Month}";

                var monthRevenue = await _context.Payments
                    .Where(p => p.Status == "Completed" &&
                               p.PaymentDate.Month == date.Month &&
                               p.PaymentDate.Year == date.Year)
                    .SumAsync(p => (decimal?)p.Amount) ?? 0;

                monthlyData.Add(new RevenueTrendItemDto
                {
                    Month = monthName,
                    Revenue = monthRevenue
                });
            }

            var trend = new RevenueTrendDto
            {
                MonthlyData = monthlyData
            };

            return Ok(trend);
        }
    }
}

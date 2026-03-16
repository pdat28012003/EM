using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Controllers
{
    // COURSES CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CoursesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all courses. (Lấy danh sách tất cả các khóa học.)
        /// </summary>
        /// <param name="level">Course level filter (Lọc theo cấp độ)</param>
        /// <param name="isActive">Status filter (Lọc theo trạng thái hoạt động)</param>
        /// <returns>List of courses (Danh sách khóa học)</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetCourses(
            [FromQuery] string? level = null,
            [FromQuery] bool? isActive = null)
        {
            var query = _context.Courses.AsQueryable();

            if (!string.IsNullOrEmpty(level))
            {
                query = query.Where(c => c.Level == level);
            }

            if (isActive.HasValue)
            {
                query = query.Where(c => c.IsActive == isActive.Value);
            }

            var courses = await query
                .Select(c => new CourseDto
                {
                    CourseId = c.CourseId,
                    CourseName = c.CourseName,
                    CourseCode = c.CourseCode,
                    Description = c.Description,
                    Level = c.Level,
                    DurationInWeeks = c.DurationInWeeks,
                    TotalHours = c.TotalHours,
                    Fee = c.Fee,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            return Ok(courses);
        }

        /// <summary>
        /// Gets a course by ID. (Lấy thông tin chi tiết của một khóa học theo ID.)
        /// </summary>
        /// <param name="id">Course ID (ID khóa học)</param>
        /// <returns>Course details (Thông tin khóa học)</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDto>> GetCourse(int id)
        {
            var course = await _context.Courses
                .Where(c => c.CourseId == id)
                .Select(c => new CourseDto
                {
                    CourseId = c.CourseId,
                    CourseName = c.CourseName,
                    CourseCode = c.CourseCode,
                    Description = c.Description,
                    Level = c.Level,
                    DurationInWeeks = c.DurationInWeeks,
                    TotalHours = c.TotalHours,
                    Fee = c.Fee,
                    IsActive = c.IsActive
                })
                .FirstOrDefaultAsync();

            if (course == null)
            {
                return NotFound(new { message = "Course not found" });
            }

            return Ok(course);
        }

        /// <summary>
        /// Creates a new course. (Tạo một khóa học mới.)
        /// </summary>
        /// <param name="dto">Course creation data (Dữ liệu tạo khóa học)</param>
        /// <returns>Created course (Thông tin khóa học vừa tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<CourseDto>> CreateCourse(CreateCourseDto dto)
        {
            var course = new Course
            {
                CourseName = dto.CourseName,
                CourseCode = dto.CourseCode,
                Description = dto.Description,
                Level = dto.Level,
                DurationInWeeks = dto.DurationInWeeks,
                TotalHours = dto.TotalHours,
                Fee = dto.Fee,
                IsActive = true
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            var courseDto = new CourseDto
            {
                CourseId = course.CourseId,
                CourseName = course.CourseName,
                CourseCode = course.CourseCode,
                Description = course.Description,
                Level = course.Level,
                DurationInWeeks = course.DurationInWeeks,
                TotalHours = course.TotalHours,
                Fee = course.Fee,
                IsActive = course.IsActive
            };

            return CreatedAtAction(nameof(GetCourse), new { id = course.CourseId }, courseDto);
        }
    }

    // CLASSES CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class ClassesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClassesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all classes. (Lấy danh sách tất cả các lớp học.)
        /// </summary>
        /// <param name="status">Class status filter (Lọc theo trạng thái lớp học)</param>
        /// <param name="teacherId">Teacher ID filter (Lọc theo giáo viên)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Số lượng mỗi trang)</param>
        /// <returns>Paged list of classes (Danh sách lớp học có phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<ClassDto>>> GetClasses(
            [FromQuery] string? status = null,
            [FromQuery] int? teacherId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.Classes
                .Include(c => c.Course)
                .Include(c => c.Teacher)
                .Include(c => c.Enrollments)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status == status);
            }

            if (teacherId.HasValue)
            {
                query = query.Where(c => c.TeacherId == teacherId.Value);
            }

            var totalCount = await query.CountAsync();

            var classes = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new ClassDto
                {
                    ClassId = c.ClassId,
                    ClassName = c.ClassName,
                    CourseId = c.CourseId,
                    CourseName = c.Course.CourseName,
                    TeacherId = c.TeacherId,
                    TeacherName = c.Teacher.FullName,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    MaxStudents = c.MaxStudents,
                    CurrentStudents = c.Enrollments.Count(e => e.Status == "Active"),
                    Room = c.Room,
                    Status = c.Status
                })
                .ToListAsync();

            var pagedResult = new PagedResult<ClassDto>
            {
                Data = classes,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(pagedResult);
        }

        /// <summary>
        /// Gets a class by ID. (Lấy thông tin chi tiết của một lớp học theo ID.)
        /// </summary>
        /// <param name="id">Class ID (ID lớp học)</param>
        /// <returns>Class details (Thông tin lớp học)</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<ClassDto>> GetClass(int id)
        {
            var classDto = await _context.Classes
                .Include(c => c.Course)
                .Include(c => c.Teacher)
                .Include(c => c.Enrollments)
                .Where(c => c.ClassId == id)
                .Select(c => new ClassDto
                {
                    ClassId = c.ClassId,
                    ClassName = c.ClassName,
                    CourseId = c.CourseId,
                    CourseName = c.Course.CourseName,
                    TeacherId = c.TeacherId,
                    TeacherName = c.Teacher.FullName,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    MaxStudents = c.MaxStudents,
                    CurrentStudents = c.Enrollments.Count(e => e.Status == "Active"),
                    Room = c.Room,
                    Status = c.Status
                })
                .FirstOrDefaultAsync();

            if (classDto == null)
            {
                return NotFound(new { message = "Class not found" });
            }

            return Ok(classDto);
        }

        /// <summary>
        /// Creates a new class. (Tạo một lớp học mới.)
        /// </summary>
        /// <param name="dto">Class creation data (Dữ liệu tạo lớp học)</param>
        /// <returns>Created class (Thông tin lớp học vừa tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<ClassDto>> CreateClass(CreateClassDto dto)
        {
            var classEntity = new Class
            {
                ClassName = dto.ClassName,
                CourseId = dto.CourseId,
                TeacherId = dto.TeacherId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                MaxStudents = dto.MaxStudents,
                Room = dto.Room,
                Status = "Active"
            };

            _context.Classes.Add(classEntity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClass), new { id = classEntity.ClassId }, classEntity);
        }

        /// <summary>
        /// Gets students in a class. (Lấy danh sách học viên trong một lớp học cụ thể.)
        /// </summary>
        /// <param name="id">Class ID (ID lớp học)</param>
        /// <returns>List of students (Danh sách học viên)</returns>
        [HttpGet("{id}/students")]
        public async Task<ActionResult<IEnumerable<StudentDto>>> GetClassStudents(int id)
        {
            var students = await _context.Enrollments
                .Include(e => e.Student)
                .Where(e => e.ClassId == id && e.Status == "Active")
                .Select(e => new StudentDto
                {
                    StudentId = e.Student.StudentId,
                    FullName = e.Student.FullName,
                    Email = e.Student.Email,
                    PhoneNumber = e.Student.PhoneNumber,
                    DateOfBirth = e.Student.DateOfBirth,
                    Address = e.Student.Address,
                    EnrollmentDate = e.Student.EnrollmentDate,
                    Level = e.Student.Level,
                    IsActive = e.Student.IsActive
                })
                .ToListAsync();

            return Ok(students);
        }
    }

    // STATISTICS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class StatisticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StatisticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets teacher dashboard statistics with week-over-week comparison. (Lấy thống kê dashboard giảng viên với so sánh tuần qua.)
        /// </summary>
        /// <param name="teacherId">Teacher ID (ID giảng viên)</param>
        /// <returns>Teacher dashboard statistics (Thống kê dashboard giảng viên)</returns>
        [HttpGet("teacher-dashboard/{teacherId}")]
        public async Task<ActionResult<DashboardStatisticsDto>> GetTeacherDashboardStatistics(int teacherId)
        {
            var now = DateTime.Now;
            var startOfThisWeek = StartOfWeek(now);
            var startOfLastWeek = startOfThisWeek.AddDays(-7);
            var endOfLastWeek = startOfThisWeek.AddSeconds(-1);

            // Get teacher's classes
            var teacherClasses = await _context.Classes
                .Where(c => c.TeacherId == teacherId)
                .ToListAsync();

            var teacherClassIds = teacherClasses.Select(c => c.ClassId).ToList();

            // Total Classes for this teacher (using StartDate as creation proxy)
            var totalClassesThisWeek = teacherClasses
                .Where(c => c.StartDate >= startOfThisWeek && c.StartDate <= now)
                .Count();
            var totalClassesLastWeek = teacherClasses
                .Where(c => c.StartDate >= startOfLastWeek && c.StartDate <= endOfLastWeek)
                .Count();

            // Total Students in teacher's classes (via enrollments)
            var totalStudentsThisWeek = await _context.Enrollments
                .Where(e => teacherClassIds.Contains(e.ClassId) && 
                           e.Status == "Active" && 
                           e.EnrollmentDate >= startOfThisWeek && 
                           e.EnrollmentDate <= now)
                .Select(e => e.StudentId)
                .Distinct()
                .CountAsync();

            var totalStudentsLastWeek = await _context.Enrollments
                .Where(e => teacherClassIds.Contains(e.ClassId) && 
                           e.Status == "Active" && 
                           e.EnrollmentDate >= startOfLastWeek && 
                           e.EnrollmentDate <= endOfLastWeek)
                .Select(e => e.StudentId)
                .Distinct()
                .CountAsync();

            // Total current students in all teacher's classes
            var totalCurrentStudents = await _context.Enrollments
                .Where(e => teacherClassIds.Contains(e.ClassId) && e.Status == "Active")
                .Select(e => e.StudentId)
                .Distinct()
                .CountAsync();

            // Pending Assignments for this teacher (placeholder - would need assignment table with teacher filter)
            var pendingAssignments = 8;
            var pendingAssignmentsLastWeek = 11;

            // Weekly Schedule for this teacher
            var weeklyScheduleThisWeek = await _context.Schedules
                .Include(s => s.Class)
                .Where(s => s.TeacherId == teacherId && s.Class.Status == "Active")
                .CountAsync();
            var weeklyScheduleLastWeek = weeklyScheduleThisWeek; // Same schedules as last week for now

            var statistics = new DashboardStatisticsDto
            {
                TotalClasses = new StatisticItem
                {
                    CurrentValue = totalClassesThisWeek,
                    ChangeFromLastWeek = totalClassesThisWeek - totalClassesLastWeek,
                    ChangeType = totalClassesThisWeek >= totalClassesLastWeek ? "increase" : "decrease"
                },
                TotalStudents = new StatisticItem
                {
                    CurrentValue = totalCurrentStudents, // Use total current students instead of weekly new students
                    ChangeFromLastWeek = totalStudentsThisWeek - totalStudentsLastWeek,
                    ChangeType = totalStudentsThisWeek >= totalStudentsLastWeek ? "increase" : "decrease"
                },
                PendingAssignments = new StatisticItem
                {
                    CurrentValue = pendingAssignments,
                    ChangeFromLastWeek = pendingAssignments - pendingAssignmentsLastWeek,
                    ChangeType = pendingAssignments >= pendingAssignmentsLastWeek ? "increase" : "decrease"
                },
                WeeklySchedule = new StatisticItem
                {
                    CurrentValue = weeklyScheduleThisWeek,
                    ChangeFromLastWeek = weeklyScheduleThisWeek - weeklyScheduleLastWeek,
                    ChangeType = weeklyScheduleThisWeek >= weeklyScheduleLastWeek ? "increase" : "decrease"
                }
            };

            return Ok(statistics);
        }

        private DateTime StartOfWeek(DateTime date)
        {
            // Assuming week starts on Monday
            var diff = date.DayOfWeek - DayOfWeek.Monday;
            if (diff < 0) diff += 7;
            return date.AddDays(-diff).Date;
        }
    }
}

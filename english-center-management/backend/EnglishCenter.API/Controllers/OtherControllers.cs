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
        /// Gets all courses with pagination. (Lấy danh sách khóa học có phân trang.)
        /// </summary>
        /// <param name="level">Course level filter (Lọc theo cấp độ)</param>
        /// <param name="isActive">Status filter (Lọc theo trạng thái hoạt động)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Số lượng mỗi trang)</param>
        /// <returns>Paged list of courses (Danh sách khóa học có phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<CourseDto>>> GetCourses(
            [FromQuery] string? level = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 10;

            var query = _context.Courses.AsQueryable();

            if (!string.IsNullOrEmpty(level))
            {
                query = query.Where(c => c.Level == level);
            }

            if (isActive.HasValue)
            {
                query = query.Where(c => c.IsActive == isActive.Value);
            }

            var totalCount = await query.CountAsync();

            var courses = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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

            var pagedResult = new PagedResult<CourseDto>
            {
                Data = courses,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(pagedResult);
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

        /// <summary>
        /// Updates an existing course. (Cập nhật thông tin khóa học.)
        /// </summary>
        /// <param name="id">Course ID (ID khóa học)</param>
        /// <param name="dto">Course update data (Dữ liệu cập nhật khóa học)</param>
        /// <returns>Updated course (Thông tin khóa học đã cập nhật)</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<CourseDto>> UpdateCourse(int id, UpdateCourseDto dto)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
            {
                return NotFound(new { message = "Course not found" });
            }

            course.CourseName = dto.CourseName;
            course.CourseCode = dto.CourseCode;
            course.Description = dto.Description;
            course.Level = dto.Level;
            course.DurationInWeeks = dto.DurationInWeeks;
            course.TotalHours = dto.TotalHours;
            course.Fee = dto.Fee;
            course.IsActive = dto.IsActive;

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

            return Ok(courseDto);
        }

        /// <summary>
        /// Deletes a course. (Xóa một khóa học.)
        /// </summary>
        /// <param name="id">Course ID (ID khóa học)</param>
        /// <returns>No Content</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
            {
                return NotFound(new { message = "Course not found" });
            }

            // Check if course has active classes
            var activeClasses = await _context.Classes
                .AnyAsync(c => c.CourseId == id && c.Status == "Active");
            
            if (activeClasses)
            {
                return BadRequest(new { message = "Cannot delete course with active classes" });
            }

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            return NoContent();
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
                .Include(c => c.Room)
                .Include(c => c.Curriculum)
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
                    CurriculumId = c.CurriculumId,
                    CurriculumName = c.Curriculum != null ? c.Curriculum.CurriculumName : string.Empty,
                    TeacherId = c.TeacherId,
                    TeacherName = c.Teacher.FullName,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    MaxStudents = c.MaxStudents,
                    CurrentStudents = c.Enrollments.Count(e => e.Status == "Active"),
                    RoomId = c.RoomId,
                    RoomName = c.Room != null ? c.Room.RoomName : string.Empty,
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
                .Include(c => c.Room)
                .Include(c => c.Curriculum)
                .Include(c => c.Enrollments)
                .Where(c => c.ClassId == id)
                .Select(c => new ClassDto
                {
                    ClassId = c.ClassId,
                    ClassName = c.ClassName,
                    CourseId = c.CourseId,
                    CourseName = c.Course.CourseName,
                    CurriculumId = c.CurriculumId,
                    CurriculumName = c.Curriculum != null ? c.Curriculum.CurriculumName : string.Empty,
                    TeacherId = c.TeacherId,
                    TeacherName = c.Teacher.FullName,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    MaxStudents = c.MaxStudents,
                    CurrentStudents = c.Enrollments.Count(e => e.Status == "Active"),
                    RoomId = c.RoomId,
                    RoomName = c.Room != null ? c.Room.RoomName : string.Empty,
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
                CurriculumId = dto.CurriculumId,
                TeacherId = dto.TeacherId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                MaxStudents = dto.MaxStudents,
                RoomId = dto.RoomId,
                Status = "Active"
            };

            _context.Classes.Add(classEntity);
            await _context.SaveChangesAsync();

            // Create notification for the assigned teacher
            if (dto.TeacherId.HasValue)
            {
                var course = await _context.Courses.FindAsync(dto.CourseId);
                
                var notification = new Notification
                {
                    TeacherId = dto.TeacherId.Value,
                    Title = "Bạn được phân công giảng dạy lớp mới",
                    Message = $"Bạn đã được phân công giảng dạy lớp {dto.ClassName} - {course?.CourseName}",
                    Type = "ClassAssignment",
                    RelatedId = classEntity.ClassId,
                    RelatedType = "Class",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
            }

            // Return created class with full details
            var createdClass = await _context.Classes
                .Include(c => c.Course)
                .Include(c => c.Teacher)
                .Include(c => c.Room)
                .Include(c => c.Curriculum)
                .Include(c => c.Enrollments)
                .Where(c => c.ClassId == classEntity.ClassId)
                .Select(c => new ClassDto
                {
                    ClassId = c.ClassId,
                    ClassName = c.ClassName,
                    CourseId = c.CourseId,
                    CourseName = c.Course.CourseName,
                    CurriculumId = c.CurriculumId,
                    CurriculumName = c.Curriculum != null ? c.Curriculum.CurriculumName : string.Empty,
                    TeacherId = c.TeacherId,
                    TeacherName = c.Teacher != null ? c.Teacher.FullName : string.Empty,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    MaxStudents = c.MaxStudents,
                    CurrentStudents = c.Enrollments.Count(e => e.Status == "Active"),
                    RoomId = c.RoomId,
                    RoomName = c.Room != null ? c.Room.RoomName : string.Empty,
                    Status = c.Status
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetClass), new { id = classEntity.ClassId }, createdClass);
        }

        /// <summary>
        /// Gets students in a class. (Lấy danh sách học viên trong một lớp học cụ thể.)
        /// </summary>
        /// <param name="id">Class ID (ID lớp học)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paginated list of students (Danh sách học viên phân trang)</returns>
        [HttpGet("{id}/students")]
        public async Task<ActionResult<PagedResult<StudentDto>>> GetClassStudents(
            int id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var query = _context.Enrollments
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
                    });

                var totalCount = await query.CountAsync();
                var students = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a class. (Xóa một lớp học.)
        /// </summary>
        /// <param name="id">Class ID (ID lớp học)</param>
        /// <returns>No content (Không có nội dung)</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClass(int id)
        {
            try
            {
                var classEntity = await _context.Classes
                    .Include(c => c.Enrollments)
                    .Include(c => c.Assignments)
                    .FirstOrDefaultAsync(c => c.ClassId == id);

                if (classEntity == null)
                {
                    return NotFound(new { message = "Class not found" });
                }

                // Remove related records first
                _context.Assignments.RemoveRange(classEntity.Assignments);
                _context.Enrollments.RemoveRange(classEntity.Enrollments);
                
                // Then remove the class
                _context.Classes.Remove(classEntity);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
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
            var weeklyScheduleThisWeek = await _context.CurriculumSessions
                .Include(cs => cs.CurriculumDay)
                .ThenInclude(cd => cd.Curriculum)
                .ThenInclude(c => c.Course)
                .Where(cs => cs.TeacherId == teacherId)
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

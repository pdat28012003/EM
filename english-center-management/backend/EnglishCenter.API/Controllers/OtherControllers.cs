using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Services;

namespace EnglishCenter.API.Controllers
{
    // TEACHERS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class TeachersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordService _passwordService;

        public TeachersController(ApplicationDbContext context, IPasswordService passwordService)
        {
            _context = context;
            _passwordService = passwordService;
        }

        /// <summary>
        /// Gets all teachers. (Lấy danh sách tất cả giáo viên.)

        /// </summary>
        /// <param name="isActive">Status (Trạng thái hoạt động)</param>
        /// <param name="pageNumber">Page number (Số trang)</param>
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
                    Username = t.Username,
                    Avatar = t.Avatar,
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
                    Username = t.Username,
                    Avatar = t.Avatar,
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
        [HttpPost]
        public async Task<ActionResult<TeacherDto>> CreateTeacher(CreateTeacherDto dto)
        {
            var teacher = new Teacher
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Username = dto.Username,
                Password = _passwordService.HashPassword(dto.Password),
                Avatar = dto.Avatar,
                Specialization = dto.Specialization,
                Qualifications = dto.Qualifications,
                HireDate = DateTime.Now,
                HourlyRate = dto.HourlyRate,
                IsActive = true
            };

            _context.Teachers.Add(teacher);
            await _context.SaveChangesAsync();

            var teacherDto = new TeacherDto
            {
                TeacherId = teacher.TeacherId,
                FullName = teacher.FullName,
                Email = teacher.Email,
                PhoneNumber = teacher.PhoneNumber,
                Username= teacher.Username,
                Avatar = teacher.Avatar,
                Specialization = teacher.Specialization,
                Qualifications = teacher.Qualifications,
                HireDate = teacher.HireDate,
                HourlyRate = teacher.HourlyRate,
                IsActive = teacher.IsActive
            };

            return CreatedAtAction(nameof(GetTeacher), new { id = teacher.TeacherId }, teacherDto);
        }

        /// <summary>
        /// Gets teacher's schedule. (Lấy lịch dạy của giáo viên.)
        /// </summary>
        /// <param name="id">Teacher ID (ID giáo viên)</param>
        /// <returns>Teacher's schedule (Lịch dạy của giáo viên)</returns>
        [HttpGet("{id}/schedule")]
        public async Task<ActionResult<IEnumerable<ScheduleDto>>> GetTeacherSchedule(int id)
        {
            var schedules = await _context.Schedules
                .Include(s => s.Class)
                .Include(s => s.Teacher)
                .Where(s => s.TeacherId == id)
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
    }

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
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Số lượng mỗi trang)</param>
        /// <returns>Paged list of classes (Danh sách lớp học có phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<ClassDto>>> GetClasses(
            [FromQuery] string? status = null,
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
}

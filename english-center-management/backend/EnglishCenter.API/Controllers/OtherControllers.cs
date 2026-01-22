using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Controllers
{
    // TEACHERS CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class TeachersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TeachersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeacherDto>>> GetTeachers([FromQuery] bool? isActive = null)
        {
            var query = _context.Teachers.AsQueryable();

            if (isActive.HasValue)
            {
                query = query.Where(t => t.IsActive == isActive.Value);
            }

            var teachers = await query
                .Select(t => new TeacherDto
                {
                    TeacherId = t.TeacherId,
                    FullName = t.FullName,
                    Email = t.Email,
                    PhoneNumber = t.PhoneNumber,
                    Specialization = t.Specialization,
                    Qualifications = t.Qualifications,
                    HireDate = t.HireDate,
                    HourlyRate = t.HourlyRate,
                    IsActive = t.IsActive
                })
                .ToListAsync();

            return Ok(teachers);
        }

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

        [HttpPost]
        public async Task<ActionResult<TeacherDto>> CreateTeacher(CreateTeacherDto dto)
        {
            var teacher = new Teacher
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
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
                Specialization = teacher.Specialization,
                Qualifications = teacher.Qualifications,
                HireDate = teacher.HireDate,
                HourlyRate = teacher.HourlyRate,
                IsActive = teacher.IsActive
            };

            return CreatedAtAction(nameof(GetTeacher), new { id = teacher.TeacherId }, teacherDto);
        }

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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClassDto>>> GetClasses([FromQuery] string? status = null)
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

            var classes = await query
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

            return Ok(classes);
        }

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

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AttendanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets a list of attendance information. Can be filtered by student, lesson, or date. (Lấy danh sách thông tin điểm danh. Có thể lọc theo học viên, buổi học, hoặc ngày.)
        /// </summary>
        /// <param name="studentId">Student ID</param>
        /// <param name="lessonId">Lesson ID</param>
        /// <param name="date">Attendance date</param>
        /// <returns>List of attendance records</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AttendanceDto>>> GetAttendances(
            [FromQuery] int? studentId = null,
            [FromQuery] int? lessonId = null,
            [FromQuery] DateTime? date = null)
        {
            var query = _context.Attendances
                .Include(a => a.Student)
                .Include(a => a.Lesson)
                .AsQueryable();

            if (studentId.HasValue)
            {
                query = query.Where(a => a.StudentId == studentId.Value);
            }

            if (lessonId.HasValue)
            {
                query = query.Where(a => a.LessonId == lessonId.Value);
            }

            if (date.HasValue)
            {
                query = query.Where(a => a.AttendanceDate.Date == date.Value.Date);
            }

            var attendances = await query
                .OrderByDescending(a => a.AttendanceDate)
                .ThenBy(a => a.Student.FullName)
                .ToListAsync();

            return Ok(attendances.Select(MapAttendanceToDto));
        }

        /// <summary>
        /// Gets attendance by ID. (Lấy thông tin điểm danh chi tiết theo ID.)
        /// </summary>
        /// <param name="id">Attendance ID (ID của bản ghi điểm danh)</param>
        /// <returns>Attendance record (Thông tin điểm danh)</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<AttendanceDto>> GetAttendance(int id)
        {
            var attendance = await _context.Attendances
                .Include(a => a.Student)
                .Include(a => a.Lesson)
                .FirstOrDefaultAsync(a => a.AttendanceId == id);

            if (attendance == null)
            {
                return NotFound();
            }

            return Ok(MapAttendanceToDto(attendance));
        }

        /// <summary>
        /// Creates a new attendance record for a student in a lesson. (Tạo bản ghi điểm danh mới cho học viên trong một buổi học.)
        /// </summary>
        /// <param name="dto">Attendance creation data</param>
        /// <returns>The created attendance information</returns>
        [HttpPost]
        public async Task<ActionResult<AttendanceDto>> CreateAttendance(CreateAttendanceDto dto)
        {
            // Check if student exists
            var student = await _context.Students.FindAsync(dto.StudentId);
            if (student == null)
            {
                return BadRequest("Student not found");
            }

            // Check if lesson exists
            var lesson = await _context.Lessons.FindAsync(dto.LessonId);
            if (lesson == null)
            {
                return BadRequest("Lesson not found");
            }

            // Check if attendance already exists for this student and lesson on this date
            var existingAttendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.StudentId == dto.StudentId &&
                                         a.LessonId == dto.LessonId &&
                                         a.AttendanceDate.Date == dto.AttendanceDate.Date);

            if (existingAttendance != null)
            {
                return BadRequest("Attendance already exists for this student, lesson, and date");
            }

            var attendance = new Attendance
            {
                StudentId = dto.StudentId,
                LessonId = dto.LessonId,
                AttendanceDate = dto.AttendanceDate,
                Status = dto.Status,
                Notes = dto.Notes
            };

            _context.Attendances.Add(attendance);
            await _context.SaveChangesAsync();

            var createdAttendance = await _context.Attendances
                .Include(a => a.Student)
                .Include(a => a.Lesson)
                .FirstAsync(a => a.AttendanceId == attendance.AttendanceId);

            return CreatedAtAction(nameof(GetAttendance), new { id = attendance.AttendanceId }, MapAttendanceToDto(createdAttendance));
        }

        /// <summary>
        /// Updates an attendance record. (Cập nhật thông tin điểm danh.)
        /// </summary>
        /// <param name="id">Attendance ID (ID điểm danh)</param>
        /// <param name="dto">Update data (Dữ liệu cập nhật)</param>
        /// <returns>No Content</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAttendance(int id, UpdateAttendanceDto dto)
        {
            var attendance = await _context.Attendances.FindAsync(id);
            if (attendance == null)
            {
                return NotFound();
            }

            attendance.Status = dto.Status;
            attendance.Notes = dto.Notes;
            attendance.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Deletes an attendance record. (Xóa bản ghi điểm danh.)
        /// </summary>
        /// <param name="id">Attendance ID (ID điểm danh)</param>
        /// <returns>No Content</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttendance(int id)
        {
            var attendance = await _context.Attendances.FindAsync(id);
            if (attendance == null)
            {
                return NotFound();
            }

            _context.Attendances.Remove(attendance);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Gets attendances for a specific lesson. (Lấy danh sách điểm danh của một buổi học cụ thể.)
        /// </summary>
        /// <param name="lessonId">Lesson ID (ID buổi học)</param>
        /// <param name="classId">Class ID (ID lớp học)</param>
        /// <returns>List of attendance records (Danh sách các bản ghi điểm danh)</returns>
        [HttpGet("lesson/{lessonId}")]
        public async Task<ActionResult<IEnumerable<AttendanceDto>>> GetAttendancesByLesson(int lessonId, [FromQuery] int classId)
        {
            var lesson = await _context.Lessons
                .Include(l => l.CurriculumSession)
                    .ThenInclude(cs => cs.CurriculumDay)
                .FirstOrDefaultAsync(l => l.LessonId == lessonId);

            if (lesson == null)
            {
                return NotFound("Lesson not found");
            }

            if (lesson.CurriculumSession == null || lesson.CurriculumSession.CurriculumDay == null)
            {
                return BadRequest("Lesson is not properly associated with curriculum");
            }

            // Get class and enrolled students
            var classEntity = await _context.Classes
                .Include(c => c.Enrollments)
                    .ThenInclude(e => e.Student)
                .FirstOrDefaultAsync(c => c.ClassId == classId);

            if (classEntity == null)
            {
                return NotFound("Class not found");
            }

            var enrolledStudents = classEntity.Enrollments
                .Where(e => e.Student.IsActive)
                .Where(e => (e.Status ?? string.Empty).ToLower() == "active")
                .Select(e => e.Student)
                .DistinctBy(s => s.StudentId)
                .ToList();

            var attendances = await _context.Attendances
                .Where(a => a.LessonId == lessonId)
                .Include(a => a.Student)
                .ToListAsync();

            var attendanceDtos = new List<AttendanceDto>();

            foreach (var student in enrolledStudents)
            {
                var attendance = attendances.FirstOrDefault(a => a.StudentId == student.StudentId);
                if (attendance != null)
                {
                    attendanceDtos.Add(MapAttendanceToDto(attendance));
                }
                else
                {
                    // Create default attendance record
                    attendanceDtos.Add(new AttendanceDto
                    {
                        AttendanceId = 0,
                        StudentId = student.StudentId,
                        StudentName = student.FullName,
                        LessonId = lessonId,
                        LessonTitle = lesson.LessonTitle,
                        AttendanceDate = lesson.CurriculumSession.CurriculumDay.ScheduleDate,
                        Status = "Not Marked",
                        Notes = "",
                        CreatedDate = DateTime.Now
                    });
                }
            }

            return Ok(attendanceDtos.OrderBy(a => a.StudentName));
        }

        private static AttendanceDto MapAttendanceToDto(Attendance attendance)
        {
            return new AttendanceDto
            {
                AttendanceId = attendance.AttendanceId,
                StudentId = attendance.StudentId,
                StudentName = attendance.Student.FullName,
                LessonId = attendance.LessonId,
                LessonTitle = attendance.Lesson.LessonTitle,
                AttendanceDate = attendance.AttendanceDate,
                Status = attendance.Status,
                Notes = attendance.Notes,
                CreatedDate = attendance.CreatedDate,
                ModifiedDate = attendance.ModifiedDate
            };
        }
    }
}
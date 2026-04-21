using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SessionAttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SessionAttendanceController> _logger;

        public SessionAttendanceController(ApplicationDbContext context, ILogger<SessionAttendanceController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Gets a list of session attendance records. Can be filtered by session, student, or date. (Lấy danh sách điểm danh buổi học. Có thể lọc theo buổi học, học sinh, hoặc ngày)
        /// </summary>
        /// <param name="sessionId">Session ID (ID buổi học)</param>
        /// <param name="studentId">Student ID (ID học sinh)</param>
        /// <param name="date">Attendance date (Ngày điểm danh)</param>
        /// <returns>List of session attendances (Danh sách điểm danh buổi học)</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SessionAttendanceDto>>> GetSessionAttendances(
            [FromQuery] int? sessionId = null,
            [FromQuery] int? studentId = null,
            [FromQuery] DateTime? date = null)
        {
            try
            {
                var query = _context.SessionAttendances
                    .Include(sa => sa.Student)
                    .Include(sa => sa.CurriculumSession)
                        .ThenInclude(cs => cs.CurriculumDay)
                    .AsQueryable();

                if (sessionId.HasValue)
                {
                    query = query.Where(sa => sa.CurriculumSessionId == sessionId.Value);
                }

                if (studentId.HasValue)
                {
                    query = query.Where(sa => sa.StudentId == studentId.Value);
                }

                if (date.HasValue)
                {
                    query = query.Where(sa => sa.AttendanceDate.Date == date.Value.Date);
                }

                var attendances = await query
                    .OrderByDescending(sa => sa.AttendanceDate)
                    .ThenBy(sa => sa.Student.FullName)
                    .ToListAsync();

                return Ok(attendances.Select(MapSessionAttendanceToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting session attendances");
                return StatusCode(500, new { message = "Error retrieving session attendances", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets session attendance by ID. (Lấy điểm danh buổi học theo ID)
        /// </summary>
        /// <param name="id">Session Attendance ID (ID điểm danh buổi học)</param>
        /// <returns>Session attendance details (Chi tiết điểm danh buổi học)</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<SessionAttendanceDto>> GetSessionAttendance(int id)
        {
            try
            {
                var attendance = await _context.SessionAttendances
                    .Include(sa => sa.Student)
                    .Include(sa => sa.CurriculumSession)
                        .ThenInclude(cs => cs.CurriculumDay)
                    .FirstOrDefaultAsync(sa => sa.SessionAttendanceId == id);

                if (attendance == null)
                {
                    return NotFound();
                }

                return Ok(MapSessionAttendanceToDto(attendance));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting session attendance {id}");
                return StatusCode(500, new { message = "Error retrieving session attendance", error = ex.Message });
            }
        }

        /// <summary>
        /// Creates a new session attendance record. (Tạo bản ghi điểm danh buổi học mới)
        /// </summary>
        /// <param name="dto">Session attendance data (Dữ liệu điểm danh buổi học)</param>
        /// <returns>Created session attendance (Điểm danh buổi học đã tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<SessionAttendanceDto>> CreateSessionAttendance(CreateSessionAttendanceDto dto)
        {
            try
            {
                // Check if student exists
                var student = await _context.Students.FindAsync(dto.StudentId);
                if (student == null)
                {
                    return BadRequest(new { message = "Student not found" });
                }

                // Check if session exists
                var session = await _context.CurriculumSessions.FindAsync(dto.SessionId);
                if (session == null)
                {
                    return BadRequest(new { message = "Session not found" });
                }

                // Check if attendance already exists for this student, session and date
                var existingAttendance = await _context.SessionAttendances
                    .FirstOrDefaultAsync(sa => sa.StudentId == dto.StudentId &&
                                               sa.CurriculumSessionId == dto.SessionId &&
                                               sa.AttendanceDate.Date == dto.Date.Date);

                if (existingAttendance != null)
                {
                    // Update existing attendance instead of creating new
                    existingAttendance.Status = dto.Status;
                    existingAttendance.Notes = dto.Notes ?? existingAttendance.Notes;
                    await _context.SaveChangesAsync();
                    
                    var updated = await _context.SessionAttendances
                        .Include(sa => sa.Student)
                        .Include(sa => sa.CurriculumSession)
                            .ThenInclude(cs => cs.CurriculumDay)
                        .FirstAsync(sa => sa.SessionAttendanceId == existingAttendance.SessionAttendanceId);
                    
                    return Ok(MapSessionAttendanceToDto(updated));
                }

                var attendance = new SessionAttendance
                {
                    CurriculumSessionId = dto.SessionId,
                    StudentId = dto.StudentId,
                    AttendanceDate = dto.Date,
                    Status = dto.Status,
                    Notes = dto.Notes ?? string.Empty
                };

                _context.SessionAttendances.Add(attendance);
                await _context.SaveChangesAsync();

                var createdAttendance = await _context.SessionAttendances
                    .Include(sa => sa.Student)
                    .Include(sa => sa.CurriculumSession)
                        .ThenInclude(cs => cs.CurriculumDay)
                    .FirstAsync(sa => sa.SessionAttendanceId == attendance.SessionAttendanceId);

                return CreatedAtAction(nameof(GetSessionAttendance), 
                    new { id = attendance.SessionAttendanceId }, 
                    MapSessionAttendanceToDto(createdAttendance));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating session attendance");
                return StatusCode(500, new { message = "Error creating session attendance", error = ex.Message });
            }
        }

        /// <summary>
        /// Creates or updates multiple session attendance records in bulk. 
        /// (Tạo hoặc cập nhật nhiều bản ghi điểm danh cùng lúc)
        /// </summary>
        /// <param name="dtos">List of session attendance data (Danh sách dữ liệu điểm danh)</param>
        /// <returns>Result of bulk operation (Kết quả thao tác hàng loạt)</returns>
        [HttpPost("bulk")]
        public async Task<ActionResult<BulkAttendanceResult>> CreateBulkSessionAttendances(List<CreateSessionAttendanceDto> dtos)
        {
            try
            {
                if (dtos == null || dtos.Count == 0)
                {
                    return BadRequest(new { message = "No attendance data provided" });
                }

                var result = new BulkAttendanceResult
                {
                    Total = dtos.Count,
                    Created = 0,
                    Updated = 0,
                    Failed = 0
                };

                // Process each attendance record
                foreach (var dto in dtos)
                {
                    try
                    {
                        // Check if attendance already exists
                        var existingAttendance = await _context.SessionAttendances
                            .FirstOrDefaultAsync(sa => sa.StudentId == dto.StudentId &&
                                                       sa.CurriculumSessionId == dto.SessionId &&
                                                       sa.AttendanceDate.Date == dto.Date.Date);

                        if (existingAttendance != null)
                        {
                            // Update existing
                            existingAttendance.Status = dto.Status;
                            existingAttendance.Notes = dto.Notes ?? existingAttendance.Notes;
                            result.Updated++;
                        }
                        else
                        {
                            // Create new
                            var attendance = new SessionAttendance
                            {
                                CurriculumSessionId = dto.SessionId,
                                StudentId = dto.StudentId,
                                AttendanceDate = dto.Date,
                                Status = dto.Status,
                                Notes = dto.Notes ?? string.Empty
                            };
                            _context.SessionAttendances.Add(attendance);
                            result.Created++;
                        }
                    }
                    catch (Exception itemEx)
                    {
                        _logger.LogWarning(itemEx, "Failed to process attendance for student {StudentId}", dto.StudentId);
                        result.Failed++;
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Bulk attendance completed: {Created} created, {Updated} updated, {Failed} failed", 
                    result.Created, result.Updated, result.Failed);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating bulk session attendances");
                return StatusCode(500, new { message = "Error creating bulk attendances", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates a session attendance record. (Cập nhật bản ghi điểm danh buổi học)
        /// </summary>
        /// <param name="id">Session Attendance ID (ID điểm danh buổi học)</param>
        /// <param name="dto">Update data (Dữ liệu cập nhật)</param>
        /// <returns>No Content (Không có nội dung)</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSessionAttendance(int id, UpdateSessionAttendanceDto dto)
        {
            try
            {
                var attendance = await _context.SessionAttendances.FindAsync(id);
                if (attendance == null)
                {
                    return NotFound();
                }

                attendance.Status = dto.Status;
                attendance.Notes = dto.Notes ?? string.Empty;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating session attendance {id}");
                return StatusCode(500, new { message = "Error updating session attendance", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a session attendance record. (Xóa bản ghi điểm danh buổi học)
        /// </summary>
        /// <param name="id">Session Attendance ID (ID điểm danh buổi học)</param>
        /// <returns>No Content (Không có nội dung)</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSessionAttendance(int id)
        {
            try
            {
                var attendance = await _context.SessionAttendances.FindAsync(id);
                if (attendance == null)
                {
                    return NotFound();
                }

                _context.SessionAttendances.Remove(attendance);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting session attendance {id}");
                return StatusCode(500, new { message = "Error deleting session attendance", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets attendance statistics for a session on a specific date. (Lấy thống kê điểm danh cho một buổi học vào ngày cụ thể)
        /// </summary>
        /// <param name="sessionId">Session ID (ID buổi học)</param>
        /// <param name="date">Date to check (Ngày cần kiểm tra)</param>
        /// <returns>Attendance statistics (Thống kê điểm danh)</returns>
        [HttpGet("stats/{sessionId}")]
        public async Task<ActionResult<object>> GetSessionAttendanceStats(int sessionId, [FromQuery] DateTime date)
        {
            try
            {
                var attendances = await _context.SessionAttendances
                    .Where(sa => sa.CurriculumSessionId == sessionId && sa.AttendanceDate.Date == date.Date)
                    .ToListAsync();

                var total = attendances.Count;
                var present = attendances.Count(a => a.Status == "Present");
                var absent = attendances.Count(a => a.Status == "Absent");
                var late = attendances.Count(a => a.Status == "Late");
                var rate = total > 0 ? Math.Round((double)(present + late) / total * 100, 2) : 0;

                return Ok(new { total, present, absent, late, rate });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting session attendance stats for session {sessionId}");
                return StatusCode(500, new { message = "Error retrieving attendance stats", error = ex.Message });
            }
        }

        private static SessionAttendanceDto MapSessionAttendanceToDto(SessionAttendance attendance)
        {
            return new SessionAttendanceDto
            {
                SessionAttendanceId = attendance.SessionAttendanceId,
                CurriculumSessionId = attendance.CurriculumSessionId,
                StudentId = attendance.StudentId,
                StudentName = attendance.Student?.FullName ?? "Unknown",
                AttendanceDate = attendance.AttendanceDate,
                Status = attendance.Status,
                Notes = attendance.Notes
            };
        }
    }
}

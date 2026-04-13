using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SessionAttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SessionAttendanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SessionAttendance>>> GetAttendances(
            [FromQuery] int? sessionId = null,
            [FromQuery] int? studentId = null,
            [FromQuery] DateTime? date = null)
        {
            var query = _context.SessionAttendances
                .Include(a => a.Student)
                .Include(a => a.CurriculumSession)
                .AsQueryable();

            if (sessionId.HasValue)
                query = query.Where(a => a.CurriculumSessionId == sessionId.Value);

            if (studentId.HasValue)
                query = query.Where(a => a.StudentId == studentId.Value);

            if (date.HasValue)
                query = query.Where(a => a.AttendanceDate.Date == date.Value.Date);

            return Ok(await query.OrderByDescending(a => a.AttendanceDate).ToListAsync());
        }

        [HttpPost]
        public async Task<ActionResult<SessionAttendance>> CreateAttendance([FromBody] CreateSessionAttendanceDto dto)
        {
            var existing = await _context.SessionAttendances
                .FirstOrDefaultAsync(a => a.CurriculumSessionId == dto.SessionId 
                    && a.StudentId == dto.StudentId 
                    && a.AttendanceDate.Date == dto.Date.Date);

            if (existing != null)
            {
                existing.Status = dto.Status;
                existing.Notes = dto.Notes ?? existing.Notes;
                await _context.SaveChangesAsync();
                return Ok(existing);
            }

            var attendance = new SessionAttendance
            {
                CurriculumSessionId = dto.SessionId,
                StudentId = dto.StudentId,
                AttendanceDate = dto.Date,
                Status = dto.Status,
                Notes = dto.Notes ?? ""
            };

            _context.SessionAttendances.Add(attendance);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAttendances), new { id = attendance.SessionAttendanceId }, attendance);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAttendance(int id, [FromBody] UpdateSessionAttendanceDto dto)
        {
            var attendance = await _context.SessionAttendances.FindAsync(id);
            if (attendance == null) return NotFound();

            attendance.Status = dto.Status ?? attendance.Status;
            attendance.Notes = dto.Notes ?? attendance.Notes;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttendance(int id)
        {
            var attendance = await _context.SessionAttendances.FindAsync(id);
            if (attendance == null) return NotFound();

            _context.SessionAttendances.Remove(attendance);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class CreateSessionAttendanceDto
    {
        public int SessionId { get; set; }
        public int StudentId { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
        public string Status { get; set; } = "Present";
        public string? Notes { get; set; }
    }

    public class UpdateSessionAttendanceDto
    {
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }
}

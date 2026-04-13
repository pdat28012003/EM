using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;

namespace EnglishCenter.API.Controllers
{
    /// <summary>
    /// Activity Logs Controller - Quản lý timeline hoạt động học tập
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ActivityLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ActivityLogsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets recent activities for the current user (timeline hoạt động)
        /// </summary>
        [HttpGet("my-activities")]
        public async Task<ActionResult<IEnumerable<ActivityLogDto>>> GetMyActivities(
            [FromQuery] int limit = 20,
            [FromQuery] string? actionType = null)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            // Get TeacherId and StudentId for this user
            var teacherId = await _context.Teachers
                .Where(t => t.UserId == userId)
                .Select(t => t.TeacherId)
                .FirstOrDefaultAsync();
            
            var studentId = await _context.Students
                .Where(s => s.UserId == userId)
                .Select(s => s.StudentId)
                .FirstOrDefaultAsync();

            var query = _context.ActivityLogs
                .Where(a => a.UserId == userId || a.TeacherId == teacherId || a.StudentId == studentId)
                .OrderByDescending(a => a.CreatedAt);

            if (!string.IsNullOrEmpty(actionType))
                query = (IOrderedQueryable<ActivityLog>)query.Where(a => a.Action == actionType);

            var activities = await query
                .Take(limit)
                .Select(a => new ActivityLogDto
                {
                    ActivityId = a.ActivityId,
                    Action = a.Action,
                    Title = a.Title,
                    Description = a.Description,
                    IconType = a.IconType,
                    Color = a.Color,
                    TargetId = a.TargetId,
                    TargetType = a.TargetType,
                    CreatedAt = a.CreatedAt,
                    Metadata = a.Metadata
                })
                .ToListAsync();

            return Ok(activities);
        }

        /// <summary>
        /// Gets recent activities for a specific teacher
        /// </summary>
        [HttpGet("teacher/{teacherId}")]
        public async Task<ActionResult<IEnumerable<ActivityLogDto>>> GetTeacherActivities(
            int teacherId,
            [FromQuery] int limit = 20)
        {
            var activities = await _context.ActivityLogs
                .Where(a => a.TeacherId == teacherId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .Select(a => new ActivityLogDto
                {
                    ActivityId = a.ActivityId,
                    Action = a.Action,
                    Title = a.Title,
                    Description = a.Description,
                    IconType = a.IconType,
                    Color = a.Color,
                    TargetId = a.TargetId,
                    TargetType = a.TargetType,
                    CreatedAt = a.CreatedAt,
                    Metadata = a.Metadata
                })
                .ToListAsync();

            return Ok(activities);
        }

        /// <summary>
        /// Gets recent activities for a specific student
        /// </summary>
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<ActivityLogDto>>> GetStudentActivities(
            int studentId,
            [FromQuery] int limit = 20)
        {
            var activities = await _context.ActivityLogs
                .Where(a => a.StudentId == studentId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .Select(a => new ActivityLogDto
                {
                    ActivityId = a.ActivityId,
                    Action = a.Action,
                    Title = a.Title,
                    Description = a.Description,
                    IconType = a.IconType,
                    Color = a.Color,
                    TargetId = a.TargetId,
                    TargetType = a.TargetType,
                    CreatedAt = a.CreatedAt,
                    Metadata = a.Metadata
                })
                .ToListAsync();

            return Ok(activities);
        }

        /// <summary>
        /// Creates a new activity log entry
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult<ActivityLogDto>> CreateActivity(CreateActivityLogDto dto)
        {
            var activity = new ActivityLog
            {
                UserId = dto.UserId,
                TeacherId = dto.TeacherId,
                StudentId = dto.StudentId,
                Action = dto.Action,
                Title = dto.Title,
                Description = dto.Description,
                IconType = dto.IconType ?? GetDefaultIcon(dto.Action),
                Color = dto.Color ?? GetDefaultColor(dto.Action),
                TargetId = dto.TargetId,
                TargetType = dto.TargetType,
                Metadata = dto.Metadata,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                CreatedAt = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(activity);
            await _context.SaveChangesAsync();

            return Ok(new ActivityLogDto
            {
                ActivityId = activity.ActivityId,
                Action = activity.Action,
                Title = activity.Title,
                Description = activity.Description,
                IconType = activity.IconType,
                Color = activity.Color,
                TargetId = activity.TargetId,
                TargetType = activity.TargetType,
                CreatedAt = activity.CreatedAt,
                Metadata = activity.Metadata
            });
        }

        /// <summary>
        /// Deletes an old activity log (cleanup)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteActivity(int id)
        {
            var activity = await _context.ActivityLogs.FindAsync(id);
            if (activity == null)
                return NotFound();

            _context.ActivityLogs.Remove(activity);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private string GetDefaultIcon(string action)
        {
            return action?.ToLower() switch
            {
                "create_assignment" => "assignment",
                "submit_assignment" => "assignment_turned_in",
                "grade_submission" => "grading",
                "take_test" => "quiz",
                "view_lesson" => "menu_book",
                "enroll_class" => "group_add",
                "attendance" => "check_circle",
                "payment" => "payment",
                _ => "default"
            };
        }

        private string GetDefaultColor(string action)
        {
            return action?.ToLower() switch
            {
                "create_assignment" => "success",
                "submit_assignment" => "info",
                "grade_submission" => "warning",
                "take_test" => "secondary",
                "view_lesson" => "primary",
                "enroll_class" => "success",
                "attendance" => "info",
                "payment" => "success",
                _ => "default"
            };
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value
                ?? User.FindFirst("id")?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userIdClaim, out int userId))
                return userId;

            var nameClaim = User.Identity?.Name;
            if (!string.IsNullOrEmpty(nameClaim) && int.TryParse(nameClaim, out int nameId))
                return nameId;

            return null;
        }
    }

    // DTOs
    public class ActivityLogDto
    {
        public int ActivityId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string IconType { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int? TargetId { get; set; }
        public string? TargetType { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Metadata { get; set; }
    }

    public class CreateActivityLogDto
    {
        public int? UserId { get; set; }
        public int? TeacherId { get; set; }
        public int? StudentId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? IconType { get; set; }
        public string? Color { get; set; }
        public int? TargetId { get; set; }
        public string? TargetType { get; set; }
        public string? Metadata { get; set; }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.API.Controllers
{
    /// <summary>
    /// Activity Logs Controller - Quản lý timeline hoạt động học tập (Refactored v2.0)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ActivityLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ActivityLogsController> _logger;

        public ActivityLogsController(ApplicationDbContext context, ILogger<ActivityLogsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Gets recent activities for the current user with pagination and advanced filtering (v2.0). (Lấy các hoạt động gần đây cho người dùng hiện tại với phân trang và lọc nâng cao)
        /// </summary>
        /// <param name="queryParams">Query parameters for filtering (Tham số truy vấn để lọc)</param>
        /// <returns>Paged list of activities (Danh sách hoạt động có phân trang)</returns>
        [HttpGet("my-activities")]
        public async Task<ActionResult<PagedResult<ActivityLogDto>>> GetMyActivities(
            [FromQuery] ActivityLogQueryParams queryParams)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            try
            {
                // Get TeacherId and StudentId for this user (optimized with single query)
                var userRoles = await _context.Users
                    .Where(u => u.UserId == userId)
                    .Select(u => new {
                        TeacherId = _context.Teachers
                            .Where(t => t.UserId == userId)
                            .Select(t => t.TeacherId)
                            .FirstOrDefault(),
                        StudentId = _context.Students
                            .Where(s => s.UserId == userId)
                            .Select(s => s.StudentId)
                            .FirstOrDefault()
                    })
                    .FirstOrDefaultAsync();

                var baseQuery = _context.ActivityLogs
                    .Where(a => a.UserId == userId || (userRoles != null && a.TeacherId == userRoles.TeacherId) || (userRoles != null && a.StudentId == userRoles.StudentId));

                // Apply filters
                if (!string.IsNullOrEmpty(queryParams.ActionType))
                    baseQuery = baseQuery.Where(a => a.Action == queryParams.ActionType);

                if (!string.IsNullOrEmpty(queryParams.TargetType))
                    baseQuery = baseQuery.Where(a => a.TargetType == queryParams.TargetType);

                if (queryParams.TargetId.HasValue)
                    baseQuery = baseQuery.Where(a => a.TargetId == queryParams.TargetId.Value);

                if (queryParams.StartDate.HasValue)
                    baseQuery = baseQuery.Where(a => a.CreatedAt >= queryParams.StartDate.Value);

                if (queryParams.EndDate.HasValue)
                    baseQuery = baseQuery.Where(a => a.CreatedAt <= queryParams.EndDate.Value);

                // Get total count for pagination
                var totalCount = await baseQuery.CountAsync();

                // Apply pagination and ordering
                var activities = await baseQuery
                    .OrderByDescending(a => a.CreatedAt)
                    .Skip((queryParams.Page - 1) * queryParams.PageSize)
                    .Take(queryParams.PageSize)
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
                    .AsNoTracking() // Performance optimization
                    .ToListAsync();

                var pagedResult = new PagedResult<ActivityLogDto>
                {
                    Data = activities,
                    TotalCount = totalCount,
                    Page = queryParams.Page,
                    PageSize = queryParams.PageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / queryParams.PageSize)
                };

                return Ok(pagedResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting activities for user {UserId}", userId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        
        
        /// <summary>
        /// Creates a new activity log entry. (Tạo bản ghi hoạt động mới)
        /// </summary>
        /// <param name="dto">Activity log data (Dữ liệu hoạt động)</param>
        /// <returns>Created activity log (Bản ghi hoạt động đã tạo)</returns>
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
        /// Deletes an old activity log (cleanup). (Xóa bản ghi hoạt động cũ - dọn dẹp)
        /// </summary>
        /// <param name="id">Activity Log ID (ID hoạt động)</param>
        /// <returns>No Content (Không có nội dung)</returns>
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

        /// <summary>
        /// Auto-cleanup old activity logs (v2.0). (Tự động dọn dẹp các hoạt động cũ)
        /// </summary>
        /// <param name="request">Cleanup parameters (Tham số dọn dẹp)</param>
        /// <returns>Cleanup result (Kết quả dọn dẹp)</returns>
        [HttpPost("cleanup")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CleanupResultDto>> CleanupOldActivityLogs([FromBody] CleanupActivityLogsDto request)
        {
            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-request.DaysToKeep);
                
                var query = _context.ActivityLogs
                    .Where(a => a.CreatedAt < cutoffDate);

                // Keep certain action types if specified
                if (request.ActionTypesToKeep?.Any() == true)
                {
                    query = query.Where(a => !request.ActionTypesToKeep.Contains(a.Action));
                }

                var activitiesToDelete = await query.ToListAsync();
                var deletedCount = activitiesToDelete.Count;

                if (deletedCount > 0)
                {
                    _context.ActivityLogs.RemoveRange(activitiesToDelete);
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Cleaned up {Count} old activity logs older than {Days} days", 
                        deletedCount, request.DaysToKeep);
                }

                return Ok(new CleanupResultDto
                {
                    DeletedCount = deletedCount,
                    CutoffDate = cutoffDate,
                    DaysToKeep = request.DaysToKeep
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during activity log cleanup");
                return StatusCode(500, new { message = "Internal server error during cleanup" });
            }
        }

        /// <summary>
        /// Gets activities with enhanced filtering for teacher (v2.0). (Lấy hoạt động với lọc nâng cao cho giáo viên)
        /// </summary>
        /// <param name="teacherId">Teacher ID (ID giáo viên)</param>
        /// <param name="queryParams">Query parameters for filtering (Tham số truy vấn để lọc)</param>
        /// <returns>Paged list of activities (Danh sách hoạt động có phân trang)</returns>
        [HttpGet("teacher/{teacherId}")]
        public async Task<ActionResult<PagedResult<ActivityLogDto>>> GetTeacherActivities(
            int teacherId,
            [FromQuery] ActivityLogQueryParams queryParams)
        {
            try
            {
                var baseQuery = _context.ActivityLogs
                    .Where(a => a.TeacherId == teacherId);

                // Apply filters
                if (!string.IsNullOrEmpty(queryParams.ActionType))
                    baseQuery = baseQuery.Where(a => a.Action == queryParams.ActionType);

                if (!string.IsNullOrEmpty(queryParams.TargetType))
                    baseQuery = baseQuery.Where(a => a.TargetType == queryParams.TargetType);

                if (queryParams.TargetId.HasValue)
                    baseQuery = baseQuery.Where(a => a.TargetId == queryParams.TargetId.Value);

                if (queryParams.StartDate.HasValue)
                    baseQuery = baseQuery.Where(a => a.CreatedAt >= queryParams.StartDate.Value);

                if (queryParams.EndDate.HasValue)
                    baseQuery = baseQuery.Where(a => a.CreatedAt <= queryParams.EndDate.Value);

                var totalCount = await baseQuery.CountAsync();

                var activities = await baseQuery
                    .OrderByDescending(a => a.CreatedAt)
                    .Skip((queryParams.Page - 1) * queryParams.PageSize)
                    .Take(queryParams.PageSize)
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
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(new PagedResult<ActivityLogDto>
                {
                    Data = activities,
                    TotalCount = totalCount,
                    Page = queryParams.Page,
                    PageSize = queryParams.PageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / queryParams.PageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting activities for teacher {TeacherId}", teacherId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Gets activities with enhanced filtering for student (v2.0). (Lấy hoạt động với lọc nâng cao cho học sinh)
        /// </summary>
        /// <param name="studentId">Student ID (ID học sinh)</param>
        /// <param name="queryParams">Query parameters for filtering (Tham số truy vấn để lọc)</param>
        /// <returns>Paged list of activities (Danh sách hoạt động có phân trang)</returns>
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<PagedResult<ActivityLogDto>>> GetStudentActivities(
            int studentId,
            [FromQuery] ActivityLogQueryParams queryParams)
        {
            try
            {
                var baseQuery = _context.ActivityLogs
                    .Where(a => a.StudentId == studentId);

                // Apply filters
                if (!string.IsNullOrEmpty(queryParams.ActionType))
                    baseQuery = baseQuery.Where(a => a.Action == queryParams.ActionType);

                if (!string.IsNullOrEmpty(queryParams.TargetType))
                    baseQuery = baseQuery.Where(a => a.TargetType == queryParams.TargetType);

                if (queryParams.TargetId.HasValue)
                    baseQuery = baseQuery.Where(a => a.TargetId == queryParams.TargetId.Value);

                if (queryParams.StartDate.HasValue)
                    baseQuery = baseQuery.Where(a => a.CreatedAt >= queryParams.StartDate.Value);

                if (queryParams.EndDate.HasValue)
                    baseQuery = baseQuery.Where(a => a.CreatedAt <= queryParams.EndDate.Value);

                var totalCount = await baseQuery.CountAsync();

                var activities = await baseQuery
                    .OrderByDescending(a => a.CreatedAt)
                    .Skip((queryParams.Page - 1) * queryParams.PageSize)
                    .Take(queryParams.PageSize)
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
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(new PagedResult<ActivityLogDto>
                {
                    Data = activities,
                    TotalCount = totalCount,
                    Page = queryParams.Page,
                    PageSize = queryParams.PageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / queryParams.PageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting activities for student {StudentId}", studentId);
                return StatusCode(500, new { message = "Internal server error" });
            }
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

        [Required(ErrorMessage = "Action is required")]
        [StringLength(50, ErrorMessage = "Action cannot exceed 50 characters")]
        public string Action { get; set; } = string.Empty;

        [Required(ErrorMessage = "Title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string Description { get; set; } = string.Empty;

        [StringLength(50, ErrorMessage = "IconType cannot exceed 50 characters")]
        public string? IconType { get; set; }

        [StringLength(20, ErrorMessage = "Color cannot exceed 20 characters")]
        public string? Color { get; set; }

        public int? TargetId { get; set; }

        [StringLength(50, ErrorMessage = "TargetType cannot exceed 50 characters")]
        public string? TargetType { get; set; }

        [StringLength(2000, ErrorMessage = "Metadata cannot exceed 2000 characters")]
        public string? Metadata { get; set; }
    }

    /// <summary>
    /// Query parameters for activity logs with pagination and filtering (v2.0)
    /// </summary>
    public class ActivityLogQueryParams
    {
        [Range(1, int.MaxValue, ErrorMessage = "Page must be greater than 0")]
        public int Page { get; set; } = 1;

        [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
        public int PageSize { get; set; } = 20;

        public string? ActionType { get; set; }
        public string? TargetType { get; set; }
        public int? TargetId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    /// <summary>
    /// Activity statistics for dashboard (v2.0)
    /// </summary>
    public class ActivityStatsDto
    {
        public int TotalActivities { get; set; }
        public List<ActivityActionStats> ActionStats { get; set; } = new();
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }

    /// <summary>
    /// Statistics for each action type (v2.0)
    /// </summary>
    public class ActivityActionStats
    {
        public string Action { get; set; } = string.Empty;
        public int Count { get; set; }
        public DateTime LastActivity { get; set; }
    }

    /// <summary>
    /// Auto-cleanup request for old activity logs (v2.0)
    /// </summary>
    public class CleanupActivityLogsDto
    {
        [Range(1, 365, ErrorMessage = "Days to keep must be between 1 and 365")]
        public int DaysToKeep { get; set; } = 90;

        public List<string>? ActionTypesToKeep { get; set; }
    }

    /// <summary>
    /// Cleanup result for activity logs (v2.0)
    /// </summary>
    public class CleanupResultDto
    {
        public int DeletedCount { get; set; }
        public DateTime CutoffDate { get; set; }
        public int DaysToKeep { get; set; }
    }
}

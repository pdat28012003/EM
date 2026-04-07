using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Runtime.CompilerServices;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Data;
using EnglishCenter.API.Services;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public NotificationController(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        /// <summary>
        /// SSE stream for real-time notifications
        /// </summary>
        [HttpGet("stream")]
        [AllowAnonymous] // Token checked manually
        public async Task StreamNotifications(
            [EnumeratorCancellation] CancellationToken cancellationToken,
            [FromQuery] string? token = null)
        {
            // Validate token
            var userId = ValidateToken(token);
            if (userId == null)
            {
                Response.StatusCode = 401;
                await Response.Body.WriteAsync(System.Text.Encoding.UTF8.GetBytes("event: error\ndata: Unauthorized\n\n"), cancellationToken);
                return;
            }

            // Set SSE headers
            Response.StatusCode = 200;
            Response.ContentType = "text/event-stream";
            Response.Headers.CacheControl = "no-cache";
            Response.Headers.Connection = "keep-alive";

            // Get teacher/student ids
            var (teacherId, studentId) = await GetTeacherAndStudentIdAsync(userId.Value);
            
            Console.WriteLine($"[SSE] UserId: {userId}, TeacherId: {teacherId}, StudentId: {studentId}");

            // Send initial unread count
            var unreadCount = await _context.Notifications
                .CountAsync(n => (n.UserId == userId || n.TeacherId == teacherId || n.StudentId == studentId) && !n.IsRead, cancellationToken);
            
            Console.WriteLine($"[SSE] Unread count: {unreadCount}");
            
            var initialMessage = $"event: unread-count\ndata: {{\"count\": {unreadCount}}}\n\n";
            await Response.Body.WriteAsync(System.Text.Encoding.UTF8.GetBytes(initialMessage), cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);

            // Subscribe to new notifications
            var channel = _notificationService.Subscribe(userId.Value, teacherId, studentId);
            
            try
            {
                await foreach (var message in channel.Reader.ReadAllAsync(cancellationToken))
                {
                    await Response.Body.WriteAsync(System.Text.Encoding.UTF8.GetBytes(message), cancellationToken);
                    await Response.Body.FlushAsync(cancellationToken);
                }
            }
            catch (OperationCanceledException)
            {
                // Client disconnected
            }
        }

        private int? ValidateToken(string? token)
        {
            if (string.IsNullOrEmpty(token)) return null;
            
            try
            {
                // Parse JWT token to get userId
                var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                var userIdClaim = jwtToken.Claims.FirstOrDefault(c => 
                    c.Type == "userId" || c.Type == "id" || c.Type == "sub" || c.Type == "nameid")?.Value;
                
                if (int.TryParse(userIdClaim, out int userId))
                    return userId;
            }
            catch { }
            
            return null;
        }

        /// <summary>
        /// Gets notifications for current user
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetMyNotifications(
            [FromQuery] bool unreadOnly = false,
            [FromQuery] int limit = 20)
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
            
            // Convert 0 to null for consistent query behavior
            var teacherIdNull = teacherId == 0 ? (int?)null : teacherId;
            var studentIdNull = studentId == 0 ? (int?)null : studentId;

            var query = _context.Notifications
                .Where(n => n.UserId == userId || n.TeacherId == teacherIdNull || n.StudentId == studentIdNull)
                .OrderByDescending(n => n.CreatedAt);

            if (unreadOnly)
                query = (IOrderedQueryable<Notification>)query.Where(n => !n.IsRead);

            var notifications = await query
                .Take(limit)
                .Select(n => new NotificationDto
                {
                    NotificationId = n.NotificationId,
                    UserId = n.UserId,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    ReadAt = n.ReadAt,
                    RelatedId = n.RelatedId,
                    RelatedType = n.RelatedType
                })
                .ToListAsync();

            return Ok(notifications);
        }

        /// <summary>
        /// Gets unread notification count
        /// </summary>
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
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
            
            // Convert 0 to null for consistent query behavior
            var teacherIdNull = teacherId == 0 ? (int?)null : teacherId;
            var studentIdNull = studentId == 0 ? (int?)null : studentId;

            var count = await _context.Notifications
                .CountAsync(n => (n.UserId == userId || n.TeacherId == teacherIdNull || n.StudentId == studentIdNull) && !n.IsRead);
            
            Console.WriteLine($"[API] UserId: {userId}, TeacherId: {teacherId}, StudentId: {studentId}");
            Console.WriteLine($"[API] Unread count: {count}");

            return Ok(count);
        }

        /// <summary>
        /// Creates a new notification
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult<NotificationDto>> CreateNotification(CreateNotificationDto dto)
        {
            var notification = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Message = dto.Message,
                Type = dto.Type,
                RelatedId = dto.RelatedId,
                RelatedType = dto.RelatedType,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new NotificationDto
            {
                NotificationId = notification.NotificationId,
                UserId = notification.UserId,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
                RelatedId = notification.RelatedId,
                RelatedType = notification.RelatedType
            });
        }

        /// <summary>
        /// Marks a notification as read
        /// </summary>
        [HttpPut("{id}/read")]
        public async Task<ActionResult> MarkAsRead(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var (teacherId, studentId) = await GetTeacherAndStudentIdAsync(userId.Value);

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == id && 
                    (n.UserId == userId || n.TeacherId == teacherId || n.StudentId == studentId));

            if (notification == null)
                return NotFound();

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Marks multiple notifications as read
        /// </summary>
        [HttpPut("mark-read")]
        public async Task<ActionResult> MarkMultipleAsRead(MarkAsReadDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var (teacherId, studentId) = await GetTeacherAndStudentIdAsync(userId.Value);

            var notifications = await _context.Notifications
                .Where(n => dto.NotificationIds.Contains(n.NotificationId) && 
                    (n.UserId == userId || n.TeacherId == teacherId || n.StudentId == studentId))
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// Marks all notifications as read for current user
        /// </summary>
        [HttpPut("mark-all-read")]
        public async Task<ActionResult> MarkAllAsRead()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var (teacherId, studentId) = await GetTeacherAndStudentIdAsync(userId.Value);

            var notifications = await _context.Notifications
                .Where(n => (n.UserId == userId || n.TeacherId == teacherId || n.StudentId == studentId) && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// Marks a notification as unread
        /// </summary>
        [HttpPut("{id}/unread")]
        public async Task<ActionResult> MarkAsUnread(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var (teacherId, studentId) = await GetTeacherAndStudentIdAsync(userId.Value);

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == id && 
                    (n.UserId == userId || n.TeacherId == teacherId || n.StudentId == studentId));

            if (notification == null)
                return NotFound();

            notification.IsRead = false;
            notification.ReadAt = null;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// Deletes a notification
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteNotification(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var (teacherId, studentId) = await GetTeacherAndStudentIdAsync(userId.Value);

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == id && 
                    (n.UserId == userId || n.TeacherId == teacherId || n.StudentId == studentId));

            if (notification == null)
                return NotFound();

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<(int? teacherId, int? studentId)> GetTeacherAndStudentIdAsync(int userId)
        {
            var teacherId = await _context.Teachers
                .Where(t => t.UserId == userId)
                .Select(t => t.TeacherId)
                .FirstOrDefaultAsync();
            
            var studentId = await _context.Students
                .Where(s => s.UserId == userId)
                .Select(s => s.StudentId)
                .FirstOrDefaultAsync();

            return (teacherId == 0 ? null : teacherId, studentId == 0 ? null : studentId);
        }

        private int? GetCurrentUserId()
        {
            // Try multiple claim types
            var userIdClaim = User.FindFirst("userId")?.Value
                ?? User.FindFirst("id")?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userIdClaim, out int userId))
                return userId;

            // Try parsing from Name if other claims fail
            var nameClaim = User.Identity?.Name;
            if (!string.IsNullOrEmpty(nameClaim) && int.TryParse(nameClaim, out int nameId))
                return nameId;

            return null;
        }
    }
}

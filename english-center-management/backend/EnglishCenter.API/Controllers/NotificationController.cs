using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Data;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationController(ApplicationDbContext context)
        {
            _context = context;
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

            var query = _context.Notifications
                .Where(n => n.UserId == userId || n.TeacherId == teacherId || n.StudentId == studentId)
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

            var count = await _context.Notifications
                .CountAsync(n => (n.UserId == userId || n.TeacherId == teacherId || n.StudentId == studentId) && !n.IsRead);

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

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    /// <summary>
    /// Activity Log - Ghi lại mọi hành vi/hoạt động của người dùng
    /// Khác với Notification: Activity là timeline học tập, Notification là thông báo quan trọng
    /// </summary>
    public class ActivityLog
    {
        [Key]
        public int ActivityId { get; set; }

        // Who did the action
        public int? UserId { get; set; }
        public int? TeacherId { get; set; }
        public int? StudentId { get; set; }

        // Action type - defines what happened
        [Required]
        [StringLength(50)]
        public string Action { get; set; } = string.Empty;

        // Display title for the activity
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        // Detailed description
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        // Icon type for UI display
        [StringLength(50)]
        public string IconType { get; set; } = "default";

        // Color for UI display
        [StringLength(20)]
        public string Color { get; set; } = "primary";

        // Related entity info
        public int? TargetId { get; set; }
        
        [StringLength(50)]
        public string? TargetType { get; set; } // Assignment, Class, Lesson, Test, etc.

        // Metadata (JSON string for flexible data)
        [StringLength(1000)]
        public string? Metadata { get; set; }

        // IP Address and User Agent for tracking
        [StringLength(50)]
        public string? IpAddress { get; set; }

        [StringLength(500)]
        public string? UserAgent { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [ForeignKey("TeacherId")]
        public Teacher? Teacher { get; set; }

        [ForeignKey("StudentId")]
        public Student? Student { get; set; }
    }
}

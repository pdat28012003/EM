using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    public class Notification
    {
        [Key]
        public int NotificationId { get; set; }

        public int? UserId { get; set; }

        public int? TeacherId { get; set; }

        public int? StudentId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Message { get; set; } = string.Empty;

        [StringLength(50)]
        public string Type { get; set; } = "Info"; // Info, Success, Warning, Error

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReadAt { get; set; }

        // Related entity info (optional)
        public int? RelatedId { get; set; }

        [StringLength(50)]
        public string? RelatedType { get; set; } // Grade, Assignment, Submission, etc.

        // Navigation properties
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [ForeignKey("TeacherId")]
        public Teacher? Teacher { get; set; }

        [ForeignKey("StudentId")]
        public Student? Student { get; set; }
    }
}

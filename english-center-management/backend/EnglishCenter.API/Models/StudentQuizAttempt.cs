using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    public class StudentQuizAttempt
    {
        [Key]
        public int AttemptId { get; set; }

        [Required]
        public int AssignmentId { get; set; }

        [ForeignKey("AssignmentId")]
        public virtual Assignment Assignment { get; set; } = null!;

        [Required]
        public int StudentId { get; set; }

        [ForeignKey("StudentId")]
        public virtual Student Student { get; set; } = null!;

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;

        public DateTime? SubmittedAt { get; set; }

        public int? TimeSpentSeconds { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Score { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "InProgress"; // InProgress, Completed, TimedOut

        // Navigation properties
        public virtual ICollection<StudentQuizAnswer> StudentAnswers { get; set; } = new List<StudentQuizAnswer>();
    }
}

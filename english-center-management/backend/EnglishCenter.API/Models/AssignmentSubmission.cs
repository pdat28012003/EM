using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    public class AssignmentSubmission
    {
        [Key]
        public int SubmissionId { get; set; }

        [Required]
        public int AssignmentId { get; set; }

        [ForeignKey("AssignmentId")]
        public virtual Assignment? Assignment { get; set; }

        [Required]
        public int StudentId { get; set; }

        [ForeignKey("StudentId")]
        public virtual Student? Student { get; set; }

        public string? Content { get; set; } // Text submission

        public string? AttachmentUrl { get; set; } // File submission

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        public string Status { get; set; } = "Submitted"; // Submitted, Graded, Returned

        public decimal? Score { get; set; }

        public string? Feedback { get; set; }

        public DateTime? GradedAt { get; set; }

        public int? GradedBy { get; set; } // Teacher ID who graded

        [ForeignKey("GradedBy")]
        public virtual Teacher? Grader { get; set; }
    }
}

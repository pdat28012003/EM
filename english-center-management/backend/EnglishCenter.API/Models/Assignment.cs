using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    public class Assignment
    {
        public int AssignmentId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // Homework, Quiz, Project, Exam

        public int? CurriculumId { get; set; }

        [ForeignKey("CurriculumId")]
        public virtual Curriculum? Curriculum { get; set; }

        [Required]
        public int TeacherId { get; set; }

        [ForeignKey("TeacherId")]
        public virtual Teacher? Teacher { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string Status { get; set; } = "Published"; // Draft, Published, Closed

        [Required]
        public int MaxScore { get; set; } = 100;

        public string? AttachmentUrl { get; set; }

        public int? SkillId { get; set; }

        [ForeignKey("SkillId")]
        public virtual Skill? Skill { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<AssignmentSubmission> Submissions { get; set; } = new List<AssignmentSubmission>();
        public virtual ICollection<AssignmentSkill> AssignmentSkills { get; set; } = new List<AssignmentSkill>();
        public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();
    }
}

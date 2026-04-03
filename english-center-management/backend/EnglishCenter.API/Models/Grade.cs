using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    public class Grade
    {
        [Key]
        public int GradeId { get; set; }

        [Required]
        public int StudentId { get; set; }

        public int? AssignmentId { get; set; }

        [Required]
        public int SkillId { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal Score { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal MaxScore { get; set; } = 10.00m;

        [MaxLength(500)]
        public string? Comments { get; set; }

        public DateTime? GradedAt { get; set; }

        public int? GradedBy { get; set; } // TeacherId

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("StudentId")]
        public Student Student { get; set; } = null!;

        [ForeignKey("AssignmentId")]
        public Assignment? Assignment { get; set; }

        [ForeignKey("SkillId")]
        public Skill Skill { get; set; } = null!;
    }
}

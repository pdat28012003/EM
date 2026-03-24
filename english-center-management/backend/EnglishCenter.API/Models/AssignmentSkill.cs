using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    public class AssignmentSkill
    {
        [Key]
        [Column(Order = 0)]
        public int AssignmentId { get; set; }

        [Key]
        [Column(Order = 1)]
        public int SkillId { get; set; }

        [Column(TypeName = "decimal(3,2)")]
        public decimal Weight { get; set; } = 1.00m; // Trọng số (0.1 - 1.0)

        [Column(TypeName = "decimal(5,2)")]
        public decimal MaxScore { get; set; } = 10.00m; // Điểm tối đa

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("AssignmentId")]
        public Assignment Assignment { get; set; } = null!;

        [ForeignKey("SkillId")]
        public Skill Skill { get; set; } = null!;

        // Collection of grades for this assignment-skill combination
        public ICollection<Grade> Grades { get; set; } = new List<Grade>();
    }
}

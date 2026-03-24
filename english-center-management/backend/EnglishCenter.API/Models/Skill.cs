using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    public class Skill
    {
        [Key]
        public int SkillId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<AssignmentSkill> AssignmentSkills { get; set; } = new List<AssignmentSkill>();
        public ICollection<Grade> Grades { get; set; } = new List<Grade>();
    }
}

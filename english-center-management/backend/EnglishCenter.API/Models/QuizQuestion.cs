using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    public class QuizQuestion
    {
        [Key]
        public int QuestionId { get; set; }

        [Required]
        public int AssignmentId { get; set; }

        [ForeignKey("AssignmentId")]
        public virtual Assignment Assignment { get; set; } = null!;

        [Required]
        [StringLength(500)]
        public string QuestionText { get; set; } = string.Empty;

        [StringLength(50)]
        public string QuestionType { get; set; } = "MultipleChoice"; // MultipleChoice, TrueFalse, FillBlank

        public int OrderIndex { get; set; } = 0;

        [Column(TypeName = "decimal(5,2)")]
        public decimal Points { get; set; } = 1.00m;

        public string? Explanation { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<QuizAnswer> Answers { get; set; } = new List<QuizAnswer>();
    }
}

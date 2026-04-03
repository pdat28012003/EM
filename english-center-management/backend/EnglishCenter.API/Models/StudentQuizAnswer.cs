using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    public class StudentQuizAnswer
    {
        [Key]
        public int StudentAnswerId { get; set; }

        [Required]
        public int AttemptId { get; set; }

        [ForeignKey("AttemptId")]
        public virtual StudentQuizAttempt Attempt { get; set; } = null!;

        [Required]
        public int QuestionId { get; set; }

        [ForeignKey("QuestionId")]
        public virtual QuizQuestion Question { get; set; } = null!;

        public int? SelectedAnswerId { get; set; }

        [ForeignKey("SelectedAnswerId")]
        public virtual QuizAnswer? SelectedAnswer { get; set; }

        public string? TextAnswer { get; set; }

        public bool IsCorrect { get; set; } = false;

        [Column(TypeName = "decimal(5,2)")]
        public decimal PointsEarned { get; set; } = 0;

        public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;
    }
}

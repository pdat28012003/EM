using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.API.DTOs
{
    public class SkillDto
    {
        public int SkillId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateSkillDto
    {
        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;

        [StringLength(200)]
        public string Description { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }

    public class AssignmentSkillDto
    {
        public int AssignmentId { get; set; }
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public decimal MaxScore { get; set; }
        public string? Description { get; set; }
    }

    public class CreateAssignmentSkillDto
    {
        [Required]
        public int SkillId { get; set; }

        [Range(0.1, 1.0)]
        public decimal Weight { get; set; } = 1.00m;

        [Range(0, 100)]
        public decimal MaxScore { get; set; } = 10.00m;

        [StringLength(500)]
        public string? Description { get; set; }
    }

    public class GradeDto
    {
        public int GradeId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int AssignmentId { get; set; }
        public string AssignmentTitle { get; set; } = string.Empty;
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public decimal MaxScore { get; set; }
        public string? Comments { get; set; }
        public DateTime? GradedAt { get; set; }
        public int? GradedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateGradeDto
    {
        [Required]
        public int StudentId { get; set; }

        [Required]
        public int AssignmentId { get; set; }

        [Required]
        public int SkillId { get; set; }

        [Range(0, 100)]
        public decimal Score { get; set; }

        [Range(0, 100)]
        public decimal MaxScore { get; set; } = 10.00m;

        [StringLength(500)]
        public string? Comments { get; set; }
    }

    public class UpdateGradeDto
    {
        [Range(0, 100)]
        public decimal Score { get; set; }

        [StringLength(500)]
        public string? Comments { get; set; }
    }

    public class GradeStatisticsDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public decimal AssignmentScore { get; set; }
        public decimal ExamScore { get; set; }
        public decimal FinalScore { get; set; }
        public string GradeClassification { get; set; } = string.Empty;
        public int TotalGrades { get; set; }
        public decimal AverageScore { get; set; }
        public List<SkillBreakdownDto> SkillBreakdown { get; set; } = new();
    }

    public class SkillBreakdownDto
    {
        public string SkillName { get; set; } = string.Empty;
        public decimal AverageScore { get; set; }
        public int GradeCount { get; set; }
    }
}

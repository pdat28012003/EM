using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.API.DTOs
{
    public class AssignmentDto
    {
        public int AssignmentId { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string Type { get; set; } = null!; // Essay, Quiz, Presentation, etc.
        public int? CurriculumId { get; set; }
        public int TeacherId { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string Status { get; set; } = "Active"; // Active, Completed, Cancelled
        public decimal? MaxScore { get; set; }
        public string? AttachmentUrl { get; set; }
        public int? SkillId { get; set; }
        public string? SkillName { get; set; }
        public string? CurriculumName { get; set; }
        public string? ClassName { get; set; }
        public string? TeacherName { get; set; }
        public int SubmissionsCount { get; set; }
        public int GradedCount { get; set; }
        public decimal? StudentScore { get; set; }
        public string? StudentStatus { get; set; }
        public int? TimeSpentSeconds { get; set; }
        public bool AllowLateSubmission { get; set; }
    }

    public class CreateAssignmentDto
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = null!;

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Type is required")]
        [RegularExpression("^(Essay|Quiz|Presentation|Project|Exam)$", ErrorMessage = "Type must be one of: Essay, Quiz, Presentation, Project, Exam")]
        public string Type { get; set; } = "Essay";

        public int? CurriculumId { get; set; }

        [Required(ErrorMessage = "TeacherId is required")]
        public int TeacherId { get; set; }

        public DateTime? DueDate { get; set; }

        [Range(0, 1000, ErrorMessage = "MaxScore must be between 0 and 1000")]
        public decimal? MaxScore { get; set; }

        [StringLength(500, ErrorMessage = "AttachmentUrl cannot exceed 500 characters")]
        public string? AttachmentUrl { get; set; }

        public int? SkillId { get; set; }

        public bool AllowLateSubmission { get; set; } = false;
    }

    public class UpdateAssignmentDto
    {
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string? Title { get; set; }

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }

        [RegularExpression("^(Essay|Quiz|Presentation|Project|Exam)$", ErrorMessage = "Type must be one of: Essay, Quiz, Presentation, Project, Exam")]
        public string? Type { get; set; }

        public DateTime? DueDate { get; set; }

        [RegularExpression("^(Active|Completed|Cancelled)$", ErrorMessage = "Status must be one of: Active, Completed, Cancelled")]
        public string? Status { get; set; }

        [Range(0, 1000, ErrorMessage = "MaxScore must be between 0 and 1000")]
        public decimal? MaxScore { get; set; }

        [StringLength(500, ErrorMessage = "AttachmentUrl cannot exceed 500 characters")]
        public string? AttachmentUrl { get; set; }

        public int? SkillId { get; set; }

        public bool? AllowLateSubmission { get; set; }
    }

    public class AssignmentSubmissionDto
    {
        public int SubmissionId { get; set; }
        public int AssignmentId { get; set; }
        public int StudentId { get; set; }
        public string? StudentName { get; set; }
        public string? Content { get; set; }
        public string? AttachmentUrl { get; set; }
        public string? OriginalFileName { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string Status { get; set; } = "Submitted";
        public decimal? Score { get; set; }
        public string? Feedback { get; set; }
        public DateTime? GradedAt { get; set; }
        public int? GradedBy { get; set; }
        public string? AssignmentTitle { get; set; }
    }

    public class SubmitAssignmentDto
    {
        [Required(ErrorMessage = "AssignmentId is required")]
        public int AssignmentId { get; set; }

        [Required(ErrorMessage = "StudentId is required")]
        public int StudentId { get; set; }

        [StringLength(5000, ErrorMessage = "Content cannot exceed 5000 characters")]
        public string? Content { get; set; }

        [StringLength(500, ErrorMessage = "AttachmentUrl cannot exceed 500 characters")]
        public string? AttachmentUrl { get; set; }
    }

    public class GradeSubmissionDto
    {
        [Range(0, 1000, ErrorMessage = "Score must be between 0 and 1000")]
        public decimal Score { get; set; }

        [StringLength(2000, ErrorMessage = "Feedback cannot exceed 2000 characters")]
        public string? Feedback { get; set; }
    }

    public class StudentAssignmentResultDto
    {
        public int StudentId { get; set; }
        public string? StudentName { get; set; }
        public string? Email { get; set; }
        public int? SubmissionId { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal? Score { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public string? Note { get; set; }
    }
}

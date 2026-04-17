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
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string Type { get; set; } = "Essay";
        public int? CurriculumId { get; set; }
        public int TeacherId { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal? MaxScore { get; set; }
        public string? AttachmentUrl { get; set; }
        public int? SkillId { get; set; }
        public bool AllowLateSubmission { get; set; } = false;
    }

    public class UpdateAssignmentDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Type { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Status { get; set; }
        public decimal? MaxScore { get; set; }
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
        public int AssignmentId { get; set; }
        public int StudentId { get; set; }
        public string? Content { get; set; }
        public string? AttachmentUrl { get; set; }
    }

    public class GradeSubmissionDto
    {
        public decimal Score { get; set; }
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

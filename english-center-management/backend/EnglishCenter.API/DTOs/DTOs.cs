using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.API.DTOs
{
    // Teacher Schedule DTO
    public class TeacherScheduleDto
    {
        public int ScheduleId { get; set; }
        public int ClassId { get; set; }  // Deprecated, use CurriculumId
        public int CurriculumId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public int TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public string DayOfWeek { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Room { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    // Pagination result class
    public class PagedResult<T>
    {
        public List<T> Data { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage => Page > 1;
        public bool HasNextPage => Page < TotalPages;
    }

    // Student DTOs
    public class StudentDto
    {
        public int StudentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Address { get; set; } = string.Empty;
        public DateTime EnrollmentDate { get; set; }
        public string Level { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class CreateStudentDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string PhoneNumber { get; set; } = string.Empty; 

        [Required(ErrorMessage = "Date of birth is required")]
        public DateTime DateOfBirth { get; set; }

        [MaxLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
        public string Address { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        [MaxLength(30, ErrorMessage = "Password cannot exceed 30 characters")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Level is required")]
        [RegularExpression("^(Beginner|Elementary|Intermediate|Advanced)$", ErrorMessage = "Level must be one of: Beginner, Elementary, Intermediate, Advanced")]
        public string Level { get; set; } = string.Empty;
    }

    public class UpdateStudentDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(50, ErrorMessage = "Full name cannot exceed 50 characters")]
        [MinLength(2, ErrorMessage = "Full name must be at least 2 characters")]
        [RegularExpression(@"^[\p{L}\s]+$", ErrorMessage = "Full name cannot contain numbers or special characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string PhoneNumber { get; set; } = string.Empty; 

        [Required(ErrorMessage = "Date of birth is required")]
        public DateTime DateOfBirth { get; set; }

        [MaxLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
        public string Address { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Password cannot exceed 500 characters")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Level is required")]
        [RegularExpression("^(Beginner|Elementary|Intermediate|Advanced)$", ErrorMessage = "Level must be one of: Beginner, Elementary, Intermediate, Advanced")]
        public string Level { get; set; } = string.Empty;

        public bool IsActive { get; set; }
    }

    // Teacher DTOs
    public class TeacherDto
    {
        
        public int TeacherId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string Qualifications { get; set; } = string.Empty;
        public DateTime HireDate { get; set; }
        public decimal HourlyRate { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateTeacherDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(50, ErrorMessage = "Full name cannot exceed 50 characters")]
        [MinLength(2, ErrorMessage = "Full name must be at least 2 characters")]
        [RegularExpression(@"^[\p{L}\s]+$", ErrorMessage = "Full name cannot contain numbers or special characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string PhoneNumber { get; set; } = string.Empty; 
        [MaxLength(500, ErrorMessage = "Password cannot exceed 500 characters")]
        public string Password { get; set; } = string.Empty;

        public string Specialization { get; set; } = string.Empty;
        public string Qualifications { get; set; } = string.Empty;
        public decimal HourlyRate { get; set; }
    }

    public class UpdateTeacherDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(50, ErrorMessage = "Full name cannot exceed 50 characters")]
        [MinLength(2, ErrorMessage = "Full name must be at least 2 characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string PhoneNumber { get; set; } = string.Empty;

        public string Specialization { get; set; } = string.Empty;
        public string Qualifications { get; set; } = string.Empty;
        public decimal HourlyRate { get; set; }
        public bool IsActive { get; set; }
    }

    // Course DTOs
    public class CourseDto
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public int DurationInWeeks { get; set; }
        public int TotalHours { get; set; }
        public decimal Fee { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateCourseDto
    {
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public int DurationInWeeks { get; set; }
        public int TotalHours { get; set; }
        public decimal Fee { get; set; }
    }

    public class UpdateCourseDto
    {
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public int DurationInWeeks { get; set; }
        public int TotalHours { get; set; }
        public decimal Fee { get; set; }
        public bool IsActive { get; set; }
    }

    // Class DTOs
    public class ClassDto
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public int? CurriculumId { get; set; }
        public string CurriculumName { get; set; } = string.Empty;
        public int? TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int MaxStudents { get; set; }
        public int CurrentStudents { get; set; }
        public int? RoomId { get; set; }
        public string RoomName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class CreateClassDto
    {
        public string ClassName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public int? CurriculumId { get; set; }
        public int? TeacherId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int MaxStudents { get; set; }
        public int? RoomId { get; set; }
    }

    // Enrollment DTOs
    public class EnrollmentDto
    {
        public int EnrollmentId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int? ClassId { get; set; }  // Deprecated
        public string? ClassName { get; set; }
        public int CurriculumId { get; set; }
        public string CurriculumName { get; set; } = string.Empty;
        public DateTime EnrollmentDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CreateEnrollmentDto
    {
        public int StudentId { get; set; }
        public int CurriculumId { get; set; }
    }

    
    // Test Score DTOs
    public class TestScoreDto
    {
        public int TestScoreId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int CurriculumId { get; set; }
        public string CurriculumName { get; set; } = string.Empty;
        public string TestName { get; set; } = string.Empty;
        public decimal ListeningScore { get; set; }
        public decimal ReadingScore { get; set; }
        public decimal WritingScore { get; set; }
        public decimal SpeakingScore { get; set; }
        public decimal TotalScore { get; set; }
        public DateTime TestDate { get; set; }
        public string Comments { get; set; } = string.Empty;
    }

    public class CreateTestScoreDto
    {
        public int StudentId { get; set; }
        public int CurriculumId { get; set; }
        public string TestName { get; set; } = string.Empty;
        public decimal ListeningScore { get; set; }
        public decimal ReadingScore { get; set; }
        public decimal WritingScore { get; set; }
        public decimal SpeakingScore { get; set; }
        public string Comments { get; set; } = string.Empty;
    }

    public class UpdateTestScoreDto
    {
        public decimal ListeningScore { get; set; }
        public decimal ReadingScore { get; set; }
        public decimal WritingScore { get; set; }
        public decimal SpeakingScore { get; set; }
        public string Comments { get; set; } = string.Empty;
    }

    // Room DTOs
    public class RoomDto
    {
        public int RoomId { get; set; }
        public string RoomName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateRoomDto
    {
        public string RoomName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Capacity { get; set; }
    }

    // Curriculum DTOs
    public class CurriculumDto
    {
        public int CurriculumId { get; set; }
        public string CurriculumName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<CurriculumDayDto> CurriculumDays { get; set; } = new List<CurriculumDayDto>();
        public List<TeacherDto> ParticipantTeachers { get; set; } = new List<TeacherDto>();
    }

    public class CreateCurriculumDto
    {
        public string CurriculumName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public List<int> ParticipantTeacherIds { get; set; } = new List<int>();
    }

    public class UpdateCurriculumDto
    {
        public string CurriculumName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public List<int> ParticipantTeacherIds { get; set; } = new List<int>();
    }

    public class AddStudentToCurriculumDto
    {
        public int StudentId { get; set; }
    }

    public class AddStudentToSessionDto
    {
        public int StudentId { get; set; }
        public string? Notes { get; set; }
    }

    public class CurriculumDayDto
    {
        public int CurriculumDayId { get; set; }
        public int CurriculumId { get; set; }
        public DateTime ScheduleDate { get; set; }
        public string Topic { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int SessionCount { get; set; }
        public List<CurriculumSessionDto> CurriculumSessions { get; set; } = new List<CurriculumSessionDto>();
    }

    public class CreateCurriculumDayDto
    {
        public int CurriculumId { get; set; }
        public DateTime ScheduleDate { get; set; }
        public string Topic { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class UpdateCurriculumDayDto
    {
        public string Topic { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class CurriculumSessionDto
    {
        public int CurriculumSessionId { get; set; }
        public int CurriculumDayId { get; set; }
        public int SessionNumber { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string SessionName { get; set; } = string.Empty;
        public string SessionDescription { get; set; } = string.Empty;
        public int? RoomId { get; set; }
        public string RoomName { get; set; } = string.Empty;
        public int? TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public int? DocumentId { get; set; }
        public string? DocumentTitle { get; set; }
        public List<LessonDto> Lessons { get; set; } = new List<LessonDto>();
        public int StudentCount { get; set; }
    }

    public class CreateCurriculumSessionDto
    {
        public int CurriculumDayId { get; set; }
        public int SessionNumber { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string SessionName { get; set; } = string.Empty;
        public string SessionDescription { get; set; } = string.Empty;
        public int? RoomId { get; set; }
        public int? TeacherId { get; set; }
        public int? DocumentId { get; set; }
    }

    public class UpdateCurriculumSessionDto
    {
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string SessionName { get; set; } = string.Empty;
        public string SessionDescription { get; set; } = string.Empty;
        public int? RoomId { get; set; }
        public int? TeacherId { get; set; }
        public int? DocumentId { get; set; }
    }

    public class LessonDto
    {
        public int LessonId { get; set; }
        public int CurriculumSessionId { get; set; }
        public int LessonNumber { get; set; }
        public string LessonTitle { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public TimeSpan Duration { get; set; }
        public string Resources { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    public class CreateLessonDto
    {
        public int CurriculumSessionId { get; set; }
        public int LessonNumber { get; set; }
        public string LessonTitle { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public TimeSpan Duration { get; set; }
        public string Resources { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    public class UpdateLessonDto
    {
        public string LessonTitle { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public TimeSpan Duration { get; set; }
        public string Resources { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    // Attendance DTOs
    public class AttendanceDto
    {
        public int AttendanceId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int LessonId { get; set; }
        public string LessonTitle { get; set; } = string.Empty;
        public DateTime AttendanceDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }

    public class CreateAttendanceDto
    {
        public int StudentId { get; set; }
        public int LessonId { get; set; }
        public DateTime AttendanceDate { get; set; }
        public string Status { get; set; } = "Present";
        public string Notes { get; set; } = string.Empty;
    }

    public class UpdateAttendanceDto
    {
        public string Status { get; set; } = "Present";
        public string Notes { get; set; } = string.Empty;
    }

    // Dashboard DTOs
    public class DashboardStatsDto
    {
        public int TotalStudents { get; set; }
        public int ActiveStudents { get; set; }
        public int TotalTeachers { get; set; }
        public int TotalCurriculums { get; set; }
        public int ActiveCurriculums { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
    }

    // Dashboard Statistics with week-over-week comparison
    public class DashboardStatisticsDto
    {
        public StatisticItem TotalCurriculums { get; set; } = new StatisticItem();
        public StatisticItem TotalStudents { get; set; } = new StatisticItem();
        public StatisticItem PendingAssignments { get; set; } = new StatisticItem();
        public StatisticItem WeeklySchedule { get; set; } = new StatisticItem();
    }

    public class StatisticItem
    {
        public int CurrentValue { get; set; }
        public int ChangeFromLastWeek { get; set; }
        public string ChangeType { get; set; } = "increase"; // "increase" or "decrease"
    }

    // Quiz DTOs
    public class QuizQuestionDto
    {
        public int QuestionId { get; set; }
        public int AssignmentId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string QuestionType { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
        public decimal Points { get; set; }
        public string? Explanation { get; set; }
        public List<QuizAnswerDto> Answers { get; set; } = new List<QuizAnswerDto>();
    }

    public class QuizAnswerDto
    {
        public int AnswerId { get; set; }
        public int QuestionId { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int OrderIndex { get; set; }
    }

    public class CreateQuizQuestionDto
    {
        [Required]
        [StringLength(500)]
        public string QuestionText { get; set; } = string.Empty;

        [StringLength(50)]
        public string QuestionType { get; set; } = "MultipleChoice";

        public int OrderIndex { get; set; } = 0;

        [Range(0.01, 100)]
        public decimal Points { get; set; } = 1.00m;

        public string? Explanation { get; set; }

        [Required]
        [MinLength(2)]
        public List<CreateQuizAnswerDto> Answers { get; set; } = new List<CreateQuizAnswerDto>();
    }

    public class CreateQuizAnswerDto
    {
        [Required]
        [StringLength(500)]
        public string AnswerText { get; set; } = string.Empty;

        public bool IsCorrect { get; set; } = false;

        public int OrderIndex { get; set; } = 0;
    }

    public class UpdateQuizQuestionDto
    {
        [StringLength(500)]
        public string? QuestionText { get; set; }

        [StringLength(50)]
        public string? QuestionType { get; set; }

        public int? OrderIndex { get; set; }

        [Range(0.01, 100)]
        public decimal? Points { get; set; }

        public string? Explanation { get; set; }

        public List<UpdateQuizAnswerDto>? Answers { get; set; }
    }

    public class UpdateQuizAnswerDto
    {
        public int? AnswerId { get; set; }

        [StringLength(500)]
        public string? AnswerText { get; set; }

        public bool? IsCorrect { get; set; }

        public int? OrderIndex { get; set; }
    }

    public class QuizSubmissionDto
    {
        [Required]
        public int AssignmentId { get; set; }

        [Required]
        public List<QuizAnswerSubmissionDto> Answers { get; set; } = new List<QuizAnswerSubmissionDto>();

        public int? TimeSpentSeconds { get; set; }
    }

    public class QuizAnswerSubmissionDto
    {
        [Required]
        public int QuestionId { get; set; }

        public int? SelectedAnswerId { get; set; }

        public string? TextAnswer { get; set; }
    }

    public class SubmitQuizDto
    {
        [Required]
        public int StudentId { get; set; }

        [Required]
        [MinLength(1)]
        public List<QuizAnswerSubmissionDto> Answers { get; set; } = new List<QuizAnswerSubmissionDto>();

        public int? TimeSpentSeconds { get; set; }
        public string? Note { get; set; }
    }

    public class QuizResultDto
    {
        public int AttemptId { get; set; }
        public int AssignmentId { get; set; }
        public string AssignmentTitle { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public decimal MaxScore { get; set; }
        public decimal Percentage { get; set; }
        public int TotalQuestions { get; set; }
        public int CorrectAnswers { get; set; }
        public int TimeSpentSeconds { get; set; }
        public DateTime SubmittedAt { get; set; }
        public List<QuizQuestionResultDto> QuestionResults { get; set; } = new List<QuizQuestionResultDto>();
    }

    public class QuizQuestionResultDto
    {
        public int QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public decimal Points { get; set; }
        public decimal PointsEarned { get; set; }
        public bool IsCorrect { get; set; }
        public string? Explanation { get; set; }
        public List<QuizAnswerResultDto> AllAnswers { get; set; } = new List<QuizAnswerResultDto>();
        public int? SelectedAnswerId { get; set; }
        public int? CorrectAnswerId { get; set; }
    }

    public class QuizAnswerResultDto
    {
        public int AnswerId { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }

    // Submission DTOs
    public class CreateSubmissionDto
    {
        [Required]
        public int StudentId { get; set; }

        public string? Content { get; set; }

        [JsonPropertyName("attachmentUrl")]
        public string? AttachmentUrl { get; set; }

        [JsonPropertyName("originalFileName")]
        public string? OriginalFileName { get; set; }
    }

    // Payment DTOs
    public class CourseForPaymentDto
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public decimal Fee { get; set; }
        public bool IsSelected { get; set; } = false;
        public bool IsPaid { get; set; } = false;
    }

    public class StudentEnrolledCoursesDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public List<CourseForPaymentDto> Courses { get; set; } = new List<CourseForPaymentDto>();
        public decimal TotalSelectedAmount { get; set; } = 0;
    }

    public class CreatePaymentDto
    {
        [Required]
        public int StudentId { get; set; }

        [Required]
        public List<int> CourseIds { get; set; } = new List<int>();

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        public string? Notes { get; set; }
    }

    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? TransactionId { get; set; }
        public string? QRCodeUrl { get; set; }
        public string? Gateway { get; set; }
        public DateTime? PaymentCompletedDate { get; set; }
        public List<CourseForPaymentDto> Courses { get; set; } = new List<CourseForPaymentDto>();
    }

    public class SePayWebhookDto
    {
        public object? id { get; set; }
        public string? transactionDate { get; set; }
        public string? accountNumber { get; set; }
        public string? code { get; set; }
        public string? content { get; set; }
        public string? transferType { get; set; }
        public string? amount { get; set; }
        public string? referenceCode { get; set; }
        public object? accumulated { get; set; }
        public string? subAccount { get; set; }
        public string? gateway { get; set; }
    }

    public class SePayQRRequestDto
    {
        public string? accountNumber { get; set; }
        public string? accountName { get; set; }
        public string? acqId { get; set; }
        public string? addInfo { get; set; }
        public string? amount { get; set; }
        public string? template { get; set; }
    }

    public class SePayQRResponseDto
    {
        public string? qrCode { get; set; }
        public string? qrData { get; set; }
        public string? img { get; set; }
    }

    public class SePayResponse<T>
    {
        public int status { get; set; }
        public string? error { get; set; }
        public List<string> messages { get; set; } = new List<string>();
        public T? data { get; set; }
    }
}

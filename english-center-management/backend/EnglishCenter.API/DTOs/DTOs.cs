using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.API.DTOs
{
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
        public string Username { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
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

        [Required(ErrorMessage = "Username is required")]
        [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
        [MaxLength(30, ErrorMessage = "Username cannot exceed 30 characters")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        [MaxLength(30, ErrorMessage = "Password cannot exceed 30 characters")]
        public string Password { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Avatar URL cannot exceed 500 characters")]
        public string Avatar { get; set; } = string.Empty;

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

        [Required(ErrorMessage = "Username is required")]
        [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
        [MaxLength(30, ErrorMessage = "Username cannot exceed 30 characters")]
        public string Username { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Password cannot exceed 500 characters")]
        public string Password { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Avatar URL cannot exceed 500 characters")]
        public string Avatar { get; set; } = string.Empty;

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
        public string Specialization { get; set; } = string.Empty;
        public string Qualifications { get; set; } = string.Empty;
        public DateTime HireDate { get; set; }
        public decimal HourlyRate { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateTeacherDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string Qualifications { get; set; } = string.Empty;
        public decimal HourlyRate { get; set; }
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

    // Class DTOs
    public class ClassDto
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public int TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int MaxStudents { get; set; }
        public int CurrentStudents { get; set; }
        public string Room { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class CreateClassDto
    {
        public string ClassName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public int TeacherId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int MaxStudents { get; set; }
        public string Room { get; set; } = string.Empty;
    }

    // Enrollment DTOs
    public class EnrollmentDto
    {
        public int EnrollmentId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public DateTime EnrollmentDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CreateEnrollmentDto
    {
        public int StudentId { get; set; }
        public int ClassId { get; set; }
    }

    // Schedule DTOs
    public class ScheduleDto
    {
        public int ScheduleId { get; set; }
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public int TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public string DayOfWeek { get; set; } = string.Empty;
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Room { get; set; } = string.Empty;
    }

    public class CreateScheduleDto
    {
        public int ClassId { get; set; }
        public int TeacherId { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Room { get; set; } = string.Empty;
    }

    // Payment DTOs
    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    public class CreatePaymentDto
    {
        public int StudentId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    // TestScore DTOs
    public class TestScoreDto
    {
        public int TestScoreId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
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
        public int ClassId { get; set; }
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
        public TimeSpan AvailableStartTime { get; set; }
        public TimeSpan AvailableEndTime { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateRoomDto
    {
        public string RoomName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public TimeSpan AvailableStartTime { get; set; }
        public TimeSpan AvailableEndTime { get; set; }
    }

    // Curriculum DTOs
    public class CurriculumDto
    {
        public int CurriculumId { get; set; }
        public string CurriculumName { get; set; } = string.Empty;
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
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
        public int ClassId { get; set; }
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
        public List<LessonDto> Lessons { get; set; } = new List<LessonDto>();
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
    }

    public class UpdateCurriculumSessionDto
    {
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string SessionName { get; set; } = string.Empty;
        public string SessionDescription { get; set; } = string.Empty;
        public int? RoomId { get; set; }
        public int? TeacherId { get; set; }
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
        public int TotalClasses { get; set; }
        public int ActiveClasses { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
    }
}

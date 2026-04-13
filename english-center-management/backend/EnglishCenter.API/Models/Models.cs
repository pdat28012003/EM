using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EnglishCenter.API.Models
{
    public class Student
    {
        [Key]
        public int StudentId { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        public DateTime DateOfBirth { get; set; }

        [MaxLength(500)]
        public string Address { get; set; } = string.Empty;
        [MaxLength(500)]
        public string Password { get; set; } = string.Empty;

        public DateTime EnrollmentDate { get; set; }

        [MaxLength(50)]
        public string Level { get; set; } = string.Empty; // Beginner, Elementary, Intermediate, Advanced

        public bool IsActive { get; set; } = true;

        // Link to authentication user
        public int? UserId { get; set; }

        // Navigation properties
        [ForeignKey("UserId")]
        public User? User { get; set; }
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public ICollection<TestScore> TestScores { get; set; } = new List<TestScore>();
        public ICollection<AssignmentSubmission> Submissions { get; set; } = new List<AssignmentSubmission>();
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public ICollection<Curriculum> Curriculums { get; set; } = new List<Curriculum>();
        public ICollection<SessionStudent> SessionStudents { get; set; } = new List<SessionStudent>();
    }

    public class Teacher
    {
        [Key]
        public int TeacherId { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Password { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Specialization { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Qualifications { get; set; } = string.Empty;

        public DateTime HireDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal HourlyRate { get; set; }

        public bool IsActive { get; set; } = true;

        // Link to authentication user
        public int? UserId { get; set; }

        // Navigation properties
        [ForeignKey("UserId")]
        public User? User { get; set; }
        public ICollection<Class> Classes { get; set; } = new List<Class>();
        public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public ICollection<Curriculum> ParticipatedCurriculums { get; set; } = new List<Curriculum>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }

    public class Course
    {
        [Key]
        public int CourseId { get; set; }

        [Required]
        [MaxLength(200)]
        public string CourseName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string CourseCode { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Level { get; set; } = string.Empty; // Beginner, Elementary, Intermediate, Advanced

        public int DurationInWeeks { get; set; }

        public int TotalHours { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Fee { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<Class> Classes { get; set; } = new List<Class>();
        public ICollection<Curriculum> Curriculums { get; set; } = new List<Curriculum>();
        public ICollection<PaymentCourse> PaymentCourses { get; set; } = new List<PaymentCourse>();
    }

    public class Class
    {
        [Key]
        public int ClassId { get; set; }

        [Required]
        [MaxLength(100)]
        public string ClassName { get; set; } = string.Empty;

        [Required]
        public int CourseId { get; set; }

        public int? TeacherId { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public int MaxStudents { get; set; } = 20;

        public int? RoomId { get; set; }

        public int? CurriculumId { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Active"; // Active, Completed, Cancelled

        // Navigation properties
        [ForeignKey("CourseId")]
        public Course Course { get; set; } = null!;

        [ForeignKey("TeacherId")]
        public Teacher? Teacher { get; set; }

        [ForeignKey("RoomId")]
        public Room? Room { get; set; }

        [ForeignKey("CurriculumId")]
        public Curriculum? Curriculum { get; set; }

        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }

    public class Enrollment
    {
        [Key]
        public int EnrollmentId { get; set; }

        [Required]
        public int StudentId { get; set; }

        [Required]
        public int ClassId { get; set; }

        public DateTime EnrollmentDate { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Active"; // Active, Completed, Dropped

        // Navigation properties
        [ForeignKey("StudentId")]
        public Student Student { get; set; } = null!;

        [ForeignKey("ClassId")]
        public Class Class { get; set; } = null!;
    }

    public class Payment
    {
        [Key]
        public int PaymentId { get; set; }

        [Required]
        public int StudentId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime PaymentDate { get; set; }

        [MaxLength(50)]
        public string PaymentMethod { get; set; } = string.Empty; // Cash, Card, Transfer, SePay

        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Completed, Pending, Cancelled

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        // SePay fields
        [MaxLength(100)]
        public string? TransactionId { get; set; } // SePay transaction ID

        [MaxLength(500)]
        public string? QRCodeUrl { get; set; } // URL của mã QR

        [MaxLength(50)]
        public string? Gateway { get; set; } // Payment gateway (MBBank, etc.)

        public DateTime? PaymentCompletedDate { get; set; } // Thời gian thanh toán hoàn tất

        // Navigation properties
        [ForeignKey("StudentId")]
        public Student Student { get; set; } = null!;

        // Many-to-many relationship with courses
        public ICollection<PaymentCourse> PaymentCourses { get; set; } = new List<PaymentCourse>();
    }

    public class PaymentCourse
    {
        [Key]
        public int PaymentCourseId { get; set; }

        [Required]
        public int PaymentId { get; set; }

        [Required]
        public int CourseId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CourseFee { get; set; } // Lưu lại học phí tại thời điểm thanh toán

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("PaymentId")]
        public Payment Payment { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course Course { get; set; } = null!;
    }

    public class TestScore
    {
        [Key]
        public int TestScoreId { get; set; }

        [Required]
        public int StudentId { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required]
        [MaxLength(100)]
        public string TestName { get; set; } = string.Empty;

        [Column(TypeName = "decimal(5,2)")]
        public decimal ListeningScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal ReadingScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal WritingScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal SpeakingScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal TotalScore { get; set; }

        public DateTime TestDate { get; set; }

        [MaxLength(500)]
        public string Comments { get; set; } = string.Empty;

        // Navigation properties
        [ForeignKey("StudentId")]
        public Student Student { get; set; } = null!;

        [ForeignKey("ClassId")]
        public Class Class { get; set; } = null!;
    }

    public class Room
    {
        [Key]
        public int RoomId { get; set; }

        [Required]
        [MaxLength(100)]
        public string RoomName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public int Capacity { get; set; }

        public TimeSpan AvailableStartTime { get; set; }

        public TimeSpan AvailableEndTime { get; set; }

        public bool IsActive { get; set; } = true;
    }

    // Curriculum Models
    public class Curriculum
    {
        [Key]
        public int CurriculumId { get; set; }

        [Required]
        [MaxLength(200)]
        public string CurriculumName { get; set; } = string.Empty;

        [Required]
        public int CourseId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? ModifiedDate { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Active"; // Active, Completed, Draft

        // Navigation properties
        [ForeignKey("CourseId")]
        public Course Course { get; set; } = null!;

        public ICollection<Class> Classes { get; set; } = new List<Class>();
        public ICollection<CurriculumDay> CurriculumDays { get; set; } = new List<CurriculumDay>();
        public ICollection<Teacher> ParticipantTeachers { get; set; } = new List<Teacher>();
        public ICollection<Student> ParticipantStudents { get; set; } = new List<Student>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }

    public class CurriculumDay
    {
        [Key]
        public int CurriculumDayId { get; set; }

        [Required]
        public int CurriculumId { get; set; }

        [Required]
        public DateTime ScheduleDate { get; set; }

        [MaxLength(500)]
        public string Topic { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public int SessionCount { get; set; } = 0; // Maximum 3 sessions per day

        // Navigation properties
        [ForeignKey("CurriculumId")]
        public Curriculum Curriculum { get; set; } = null!;

        public ICollection<CurriculumSession> CurriculumSessions { get; set; } = new List<CurriculumSession>();
    }

    public class CurriculumSession
    {
        [Key]
        public int CurriculumSessionId { get; set; }

        [Required]
        public int CurriculumDayId { get; set; }

        [Required]
        public int SessionNumber { get; set; } // 1, 2, or 3

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        [MaxLength(500)]
        public string SessionName { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string SessionDescription { get; set; } = string.Empty;

        public int? RoomId { get; set; }

        public int? TeacherId { get; set; }

        public int? DocumentId { get; set; }

        // Navigation properties
        [ForeignKey("CurriculumDayId")]
        public CurriculumDay CurriculumDay { get; set; } = null!;

        [ForeignKey("DocumentId")]
        public Document? Document { get; set; }

        [ForeignKey("RoomId")]
        public Room? AssignedRoom { get; set; }

        [ForeignKey("TeacherId")]
        public Teacher? Teacher { get; set; }

        public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();

        public ICollection<SessionStudent> SessionStudents { get; set; } = new List<SessionStudent>();
    }

    public class Lesson
    {
        [Key]
        public int LessonId { get; set; }

        [Required]
        public int CurriculumSessionId { get; set; }

        [Required]
        public int LessonNumber { get; set; }

        [Required]
        [MaxLength(200)]
        public string LessonTitle { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;

        public TimeSpan Duration { get; set; }

        [MaxLength(500)]
        public string Resources { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Notes { get; set; } = string.Empty;

        // Navigation properties
        [ForeignKey("CurriculumSessionId")]
        public CurriculumSession CurriculumSession { get; set; } = null!;

        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    }

    public class Attendance
    {
        [Key]
        public int AttendanceId { get; set; }

        [Required]
        public int StudentId { get; set; }

        [Required]
        public int LessonId { get; set; }

        [Required]
        public DateTime AttendanceDate { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Present"; // Present, Absent, Late, Excused

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? ModifiedDate { get; set; }

        // Navigation properties
        [ForeignKey("StudentId")]
        public Student Student { get; set; } = null!;

        [ForeignKey("LessonId")]
        public Lesson Lesson { get; set; } = null!;
    }

    // Authentication Models
    public class Role
    {
        [Key]
        public int RoleId { get; set; }

        [Required]
        [MaxLength(50)]
        public string RoleName { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Description { get; set; }

        public ICollection<User> Users { get; set; } = new List<User>();
    }

    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public byte[] PasswordHash { get; set; } = Array.Empty<byte>();

        [Required]
        public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(1000)]
        public string? Avatar { get; set; }

        [Required]
        public int RoleId { get; set; }

        public bool IsActive { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? LastLogin { get; set; }

        [ForeignKey("RoleId")]
        public Role Role { get; set; } = null!;

        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }

    public class UserOtp
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string OtpCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Type { get; set; } = string.Empty; // Registration, ForgotPassword

        [Required]
        public DateTime ExpiryTime { get; set; }

        public bool IsUsed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public int UserId { get; set; }

        [Required]
        public DateTime ExpiryTime { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? RevokedAt { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
    }

    public class Document
    {
        [Key]
        public int DocumentId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty; // material, exercise, presentation, audio, video

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty; // Unique filename on server

        [Required]
        [MaxLength(255)]
        public string OriginalFileName { get; set; } = string.Empty; // Original filename

        [Required]
        public long FileSize { get; set; }

        [Required]
        [MaxLength(500)]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        public DateTime UploadDate { get; set; }

        [Required]
        public int DownloadCount { get; set; } = 0;

        // Associate with Curriculum (optional - null means standalone)
        public int? CurriculumId { get; set; }

        [ForeignKey("CurriculumId")]
        public Curriculum? Curriculum { get; set; }
    }

    /// <summary>
    /// Teacher Availability - Lịch rảnh của giảng viên
    /// </summary>
    public class TeacherAvailability
    {
        [Key]
        public int AvailabilityId { get; set; }

        [Required]
        public int TeacherId { get; set; }

        [Required]
        public DayOfWeek DayOfWeek { get; set; } // Monday = 1, Tuesday = 2, ... Sunday = 0

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        public bool IsRecurring { get; set; } = true; // Lặp lại hàng tuần

        public DateTime? SpecificDate { get; set; } // Ngày cụ thể nếu không lặp lại

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        // Navigation properties
        [ForeignKey("TeacherId")]
        public Teacher Teacher { get; set; } = null!;
    }

    // SessionStudent - Register students to specific sessions
    public class SessionStudent
    {
        [Key]
        public int SessionStudentId { get; set; }

        [Required]
        public int CurriculumSessionId { get; set; }

        [Required]
        public int StudentId { get; set; }

        public DateTime RegistrationDate { get; set; } = DateTime.Now;

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        // Navigation properties
        [ForeignKey("CurriculumSessionId")]
        public CurriculumSession CurriculumSession { get; set; } = null!;

        [ForeignKey("StudentId")]
        public Student Student { get; set; } = null!;
    }

    public class SessionAttendance
    {
        [Key]
        public int SessionAttendanceId { get; set; }

        [Required]
        public int CurriculumSessionId { get; set; }

        [Required]
        public int StudentId { get; set; }

        [Required]
        public DateTime AttendanceDate { get; set; } = DateTime.Now;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Present"; // Present, Absent, Late

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        // Navigation properties
        [ForeignKey("CurriculumSessionId")]
        public CurriculumSession CurriculumSession { get; set; } = null!;

        [ForeignKey("StudentId")]
        public Student Student { get; set; } = null!;
    }
}

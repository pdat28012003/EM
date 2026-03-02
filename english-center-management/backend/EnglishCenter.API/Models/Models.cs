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

        public DateTime EnrollmentDate { get; set; }

        [MaxLength(50)]
        public string Level { get; set; } = string.Empty; // Beginner, Elementary, Intermediate, Advanced

        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public ICollection<TestScore> TestScores { get; set; } = new List<TestScore>();
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
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
        public string Specialization { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Qualifications { get; set; } = string.Empty;

        public DateTime HireDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal HourlyRate { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<Class> Classes { get; set; } = new List<Class>();
        public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
        public ICollection<Curriculum> ParticipatedCurriculums { get; set; } = new List<Curriculum>();
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

        [Required]
        public int TeacherId { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public int MaxStudents { get; set; } = 20;

        [MaxLength(100)]
        public string Room { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Status { get; set; } = "Active"; // Active, Completed, Cancelled

        // Navigation properties
        [ForeignKey("CourseId")]
        public Course Course { get; set; } = null!;

        [ForeignKey("TeacherId")]
        public Teacher Teacher { get; set; } = null!;

        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
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

    public class Schedule
    {
        [Key]
        public int ScheduleId { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required]
        public int TeacherId { get; set; }

        [Required]
        [MaxLength(20)]
        public string DayOfWeek { get; set; } = string.Empty; // Monday, Tuesday, etc.

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        [MaxLength(100)]
        public string Room { get; set; } = string.Empty;

        // Navigation properties
        [ForeignKey("ClassId")]
        public Class Class { get; set; } = null!;

        [ForeignKey("TeacherId")]
        public Teacher Teacher { get; set; } = null!;
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
        public string PaymentMethod { get; set; } = string.Empty; // Cash, Card, Transfer

        [MaxLength(50)]
        public string Status { get; set; } = "Completed"; // Completed, Pending, Cancelled

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        // Navigation properties
        [ForeignKey("StudentId")]
        public Student Student { get; set; } = null!;
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
        public int ClassId { get; set; }

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
        [ForeignKey("ClassId")]
        public Class Class { get; set; } = null!;

        public ICollection<CurriculumDay> CurriculumDays { get; set; } = new List<CurriculumDay>();
        public ICollection<Teacher> ParticipantTeachers { get; set; } = new List<Teacher>();
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

        // Navigation properties
        [ForeignKey("CurriculumDayId")]
        public CurriculumDay CurriculumDay { get; set; } = null!;

        [ForeignKey("RoomId")]
        public Room? AssignedRoom { get; set; }

        [ForeignKey("TeacherId")]
        public Teacher? Teacher { get; set; }

        public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
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
}

using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Models;

namespace EnglishCenter.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Student> Students { get; set; }
        public DbSet<Teacher> Teachers { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<TestScore> TestScores { get; set; }
        public DbSet<Curriculum> Curriculums { get; set; }
        public DbSet<CurriculumDay> CurriculumDays { get; set; }
        public DbSet<CurriculumSession> CurriculumSessions { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
    public DbSet<AssignmentSubmission> AssignmentSubmissions { get; set; }
    public DbSet<AssignmentSkill> AssignmentSkills { get; set; }
    public DbSet<Skill> Skills { get; set; }
    public DbSet<Grade> Grades { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserOtp> UserOtps { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Document> Documents { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure composite key for AssignmentSkill
            modelBuilder.Entity<AssignmentSkill>()
                .HasKey(asg => new { asg.AssignmentId, asg.SkillId });

            // Configure relationships
            modelBuilder.Entity<Class>()
                .HasOne(c => c.Course)
                .WithMany(co => co.Classes)
                .HasForeignKey(c => c.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Class>()
                .HasOne(c => c.Teacher)
                .WithMany(t => t.Classes)
                .HasForeignKey(c => c.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Class>()
                .HasOne(c => c.Room)
                .WithMany()
                .HasForeignKey(c => c.RoomId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Class>()
                .HasOne(c => c.Curriculum)
                .WithMany(cur => cur.Classes)
                .HasForeignKey(c => c.CurriculumId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Student)
                .WithMany(s => s.Enrollments)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Class)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.ClassId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Student)
                .WithMany(s => s.Payments)
                .HasForeignKey(p => p.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TestScore>()
                .HasOne(ts => ts.Student)
                .WithMany(s => s.TestScores)
                .HasForeignKey(ts => ts.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Assignment>()
                .HasOne(a => a.Class)
                .WithMany(c => c.Assignments)
                .HasForeignKey(a => a.ClassId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Assignment>()
                .HasOne(a => a.Teacher)
                .WithMany(t => t.Assignments)
                .HasForeignKey(a => a.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AssignmentSubmission>()
                .HasOne(asub => asub.Assignment)
                .WithMany(a => a.Submissions)
                .HasForeignKey(asub => asub.AssignmentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AssignmentSubmission>()
                .HasOne(asub => asub.Student)
                .WithMany(s => s.Submissions)
                .HasForeignKey(asub => asub.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AssignmentSubmission>()
                .HasOne(asub => asub.Grader)
                .WithMany()
                .HasForeignKey(asub => asub.GradedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Curriculum>()
                .HasOne(c => c.Course)
                .WithMany(co => co.Curriculums)
                .HasForeignKey(c => c.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CurriculumDay>()
                .HasOne(cd => cd.Curriculum)
                .WithMany(c => c.CurriculumDays)
                .HasForeignKey(cd => cd.CurriculumId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CurriculumSession>()
                .HasOne(cs => cs.CurriculumDay)
                .WithMany(cd => cd.CurriculumSessions)
                .HasForeignKey(cs => cs.CurriculumDayId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Lesson>()
                .HasOne(l => l.CurriculumSession)
                .WithMany(cs => cs.Lessons)
                .HasForeignKey(l => l.CurriculumSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Student)
                .WithMany(s => s.Attendances)
                .HasForeignKey(a => a.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Lesson)
                .WithMany(l => l.Attendances)
                .HasForeignKey(a => a.LessonId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure many-to-many relationship between Teacher and Curriculum
            modelBuilder.Entity<Curriculum>()
                .HasMany(c => c.ParticipantTeachers)
                .WithMany(t => t.ParticipatedCurriculums)
                .UsingEntity(j => j.ToTable("CurriculumTeacher"));

            // Configure Document relationships
            modelBuilder.Entity<Document>()
                .HasOne(d => d.Teacher)
                .WithMany(t => t.Documents)
                .HasForeignKey(d => d.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Document>()
                .HasOne(d => d.Class)
                .WithMany(c => c.Documents)
                .HasForeignKey(d => d.ClassId)
                .OnDelete(DeleteBehavior.SetNull);

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Roles
            modelBuilder.Entity<Role>().HasData(
                new Role { RoleId = 1, RoleName = "Admin", Description = "System Administrator" },
                new Role { RoleId = 2, RoleName = "Teacher", Description = "Center Teacher" },
                new Role { RoleId = 3, RoleName = "Student", Description = "Center Student" }
            );

            // Seed Courses
            modelBuilder.Entity<Course>().HasData(
                new Course
                {
                    CourseId = 1,
                    CourseName = "English for Beginners",
                    CourseCode = "ENG101",
                    Description = "Basic English course for absolute beginners",
                    Level = "Beginner",
                    DurationInWeeks = 12,
                    TotalHours = 48,
                    Fee = 2000000,
                    IsActive = true
                },
                new Course
                {
                    CourseId = 2,
                    CourseName = "Elementary English",
                    CourseCode = "ENG102",
                    Description = "English course for elementary level students",
                    Level = "Elementary",
                    DurationInWeeks = 12,
                    TotalHours = 48,
                    Fee = 2500000,
                    IsActive = true
                },
                new Course
                {
                    CourseId = 3,
                    CourseName = "Intermediate English",
                    CourseCode = "ENG201",
                    Description = "English course for intermediate level students",
                    Level = "Intermediate",
                    DurationInWeeks = 16,
                    TotalHours = 64,
                    Fee = 3000000,
                    IsActive = true
                },
                new Course
                {
                    CourseId = 4,
                    CourseName = "Advanced English",
                    CourseCode = "ENG301",
                    Description = "Advanced English course for fluent speakers",
                    Level = "Advanced",
                    DurationInWeeks = 16,
                    TotalHours = 64,
                    Fee = 3500000,
                    IsActive = true
                },
                new Course
                {
                    CourseId = 5,
                    CourseName = "IELTS Preparation",
                    CourseCode = "IELTS01",
                    Description = "Intensive IELTS exam preparation course",
                    Level = "Intermediate",
                    DurationInWeeks = 20,
                    TotalHours = 80,
                    Fee = 5000000,
                    IsActive = true
                }
            );

            // Seed Teachers
            modelBuilder.Entity<Teacher>().HasData(
                new Teacher
                {
                    TeacherId = 1,
                    FullName = "Nguyễn Văn An",
                    Email = "an.nguyen@englishcenter.com",
                    PhoneNumber = "0901234567",
                    Specialization = "General English, IELTS",
                    Qualifications = "TESOL Certificate, MA in English Education",
                    HireDate = new DateTime(2020, 1, 15),
                    HourlyRate = 200000,
                    IsActive = true
                },
                new Teacher
                {
                    TeacherId = 2,
                    FullName = "Trần Thị Bình",
                    Email = "binh.tran@englishcenter.com",
                    PhoneNumber = "0902345678",
                    Specialization = "Business English, Communication",
                    Qualifications = "CELTA Certificate, BA in English Literature",
                    HireDate = new DateTime(2021, 3, 20),
                    HourlyRate = 180000,
                    IsActive = true
                }
            );

            // Seed Classes
            modelBuilder.Entity<Class>().HasData(
                new Class
                {
                    ClassId = 1,
                    ClassName = "test",
                    CourseId = 1,
                    TeacherId = 1,
                    StartDate = new DateTime(2024, 3, 1),
                    EndDate = new DateTime(2024, 5, 31),
                    MaxStudents = 20,
                    RoomId = 1,
                    Status = "Active"
                },
                new Class
                {
                    ClassId = 2,
                    ClassName = "ENG101-A2",
                    CourseId = 1,
                    TeacherId = 2,
                    StartDate = new DateTime(2024, 3, 15),
                    EndDate = new DateTime(2024, 6, 15),
                    MaxStudents = 15,
                    RoomId = 2,
                    Status = "Active"
                }
            );

            // Seed Students
            modelBuilder.Entity<Student>().HasData(
                new Student
                {
                    StudentId = 1,
                    FullName = "Nguyễn Văn A",
                    Email = "a.nguyen@email.com",
                    PhoneNumber = "0901234567",
                    DateOfBirth = new DateTime(1995, 5, 15),
                    Address = "123 Nguyễn Huệ, Q1, TP.HCM",
                    Level = "Beginner",
                    IsActive = true,
                    EnrollmentDate = new DateTime(2024, 2, 28)
                },
                new Student
                {
                    StudentId = 2,
                    FullName = "Trần Thị B",
                    Email = "b.tran@email.com",
                    PhoneNumber = "0902345678",
                    DateOfBirth = new DateTime(1998, 8, 20),
                    Address = "456 Lê Lợi, Q3, TP.HCM",
                    Level = "Elementary",
                    IsActive = true,
                    EnrollmentDate = new DateTime(2024, 3, 1)
                },
                new Student
                {
                    StudentId = 3,
                    FullName = "Lê Văn C",
                    Email = "c.le@email.com",
                    PhoneNumber = "0903456789",
                    DateOfBirth = new DateTime(2000, 12, 10),
                    Address = "789 Đồng Khởi, Q5, TP.HCM",
                    Level = "Pre-Intermediate",
                    IsActive = true,
                    EnrollmentDate = new DateTime(2024, 3, 5)
                }
            );

            // Seed Enrollments
            modelBuilder.Entity<Enrollment>().HasData(
                new Enrollment
                {
                    EnrollmentId = 1,
                    StudentId = 1,
                    ClassId = 1,
                    EnrollmentDate = new DateTime(2024, 2, 28),
                    Status = "Active"
                },
                new Enrollment
                {
                    EnrollmentId = 2,
                    StudentId = 2,
                    ClassId = 1,
                    EnrollmentDate = new DateTime(2024, 3, 1),
                    Status = "Active"
                },
                new Enrollment
                {
                    EnrollmentId = 3,
                    StudentId = 3,
                    ClassId = 1,
                    EnrollmentDate = new DateTime(2024, 3, 5),
                    Status = "Active"
                }
            );

            // Seed Test Scores
            modelBuilder.Entity<TestScore>().HasData(
                new TestScore
                {
                    TestScoreId = 1,
                    StudentId = 1,
                    ClassId = 1,
                    TestName = "Midterm Exam - Unit 1",
                    ListeningScore = 8.5m,
                    ReadingScore = 7.8m,
                    WritingScore = 8.2m,
                    SpeakingScore = 7.5m,
                    TotalScore = 8.0m,
                    TestDate = new DateTime(2024, 3, 15),
                    Comments = "Good performance in listening and writing. Need more practice in speaking."
                },
                new TestScore
                {
                    TestScoreId = 2,
                    StudentId = 1,
                    ClassId = 1,
                    TestName = "Final Exam - Unit 1",
                    ListeningScore = 9.0m,
                    ReadingScore = 8.5m,
                    WritingScore = 8.8m,
                    SpeakingScore = 8.2m,
                    TotalScore = 8.6m,
                    TestDate = new DateTime(2024, 4, 20),
                    Comments = "Excellent improvement in all skills. Keep up the good work!"
                },
                new TestScore
                {
                    TestScoreId = 3,
                    StudentId = 2,
                    ClassId = 1,
                    TestName = "Midterm Exam - Unit 1",
                    ListeningScore = 6.5m,
                    ReadingScore = 7.0m,
                    WritingScore = 6.8m,
                    SpeakingScore = 7.2m,
                    TotalScore = 6.9m,
                    TestDate = new DateTime(2024, 3, 15),
                    Comments = "Average performance. Should focus more on listening comprehension."
                },
                new TestScore
                {
                    TestScoreId = 4,
                    StudentId = 2,
                    ClassId = 1,
                    TestName = "Quiz - Grammar & Vocabulary",
                    ListeningScore = 7.2m,
                    ReadingScore = 8.0m,
                    WritingScore = 7.5m,
                    SpeakingScore = 7.8m,
                    TotalScore = 7.6m,
                    TestDate = new DateTime(2024, 3, 25),
                    Comments = "Good understanding of grammar. Vocabulary needs improvement."
                },
                new TestScore
                {
                    TestScoreId = 5,
                    StudentId = 1,
                    ClassId = 1,
                    TestName = "Quiz - Conversation Skills",
                    ListeningScore = 8.8m,
                    ReadingScore = 8.2m,
                    WritingScore = 8.5m,
                    SpeakingScore = 9.2m,
                    TotalScore = 8.7m,
                    TestDate = new DateTime(2024, 4, 5),
                    Comments = "Outstanding speaking skills! Very fluent and confident."
                },
                new TestScore
                {
                    TestScoreId = 6,
                    StudentId = 3,
                    ClassId = 1,
                    TestName = "Midterm Exam - Unit 1",
                    ListeningScore = 5.5m,
                    ReadingScore = 6.0m,
                    WritingScore = 5.8m,
                    SpeakingScore = 6.2m,
                    TotalScore = 5.9m,
                    TestDate = new DateTime(2024, 3, 15),
                    Comments = "Below average performance. Requires additional support and practice."
                },
                new TestScore
                {
                    TestScoreId = 7,
                    StudentId = 3,
                    ClassId = 1,
                    TestName = "Assignment - Writing Practice",
                    ListeningScore = 6.0m,
                    ReadingScore = 6.5m,
                    WritingScore = 6.8m,
                    SpeakingScore = 6.0m,
                    TotalScore = 6.3m,
                    TestDate = new DateTime(2024, 3, 28),
                    Comments = "Writing has improved. Still needs work on basic grammar."
                },
                new TestScore
                {
                    TestScoreId = 8,
                    StudentId = 1,
                    ClassId = 1,
                    TestName = "Final Exam - Unit 2",
                    ListeningScore = 9.2m,
                    ReadingScore = 8.8m,
                    WritingScore = 9.0m,
                    SpeakingScore = 8.5m,
                    TotalScore = 8.9m,
                    TestDate = new DateTime(2024, 5, 15),
                    Comments = "Consistent high performance. Ready for advanced level."
                }
            );

            // Seed Payments
            modelBuilder.Entity<Payment>().HasData(
                new Payment
                {
                    PaymentId = 1,
                    StudentId = 1,
                    Amount = 2000000m,
                    PaymentDate = new DateTime(2024, 2, 28),
                    PaymentMethod = "Bank Transfer",
                    Status = "Completed",
                    Notes = "Full payment for English for Beginners course"
                },
                new Payment
                {
                    PaymentId = 2,
                    StudentId = 2,
                    Amount = 2000000m,
                    PaymentDate = new DateTime(2024, 3, 1),
                    PaymentMethod = "Cash",
                    Status = "Completed",
                    Notes = "Full payment for English for Beginners course"
                },
                new Payment
                {
                    PaymentId = 3,
                    StudentId = 3,
                    Amount = 2000000m,
                    PaymentDate = new DateTime(2024, 3, 5),
                    PaymentMethod = "Credit Card",
                    Status = "Completed",
                    Notes = "Full payment for English for Beginners course"
                },
                new Payment
                {
                    PaymentId = 4,
                    StudentId = 1,
                    Amount = 500000m,
                    PaymentDate = new DateTime(2024, 4, 10),
                    PaymentMethod = "Bank Transfer",
                    Status = "Completed",
                    Notes = "Partial payment for additional materials"
                },
                new Payment
                {
                    PaymentId = 5,
                    StudentId = 2,
                    Amount = 300000m,
                    PaymentDate = new DateTime(2024, 4, 15),
                    PaymentMethod = "Cash",
                    Status = "Completed",
                    Notes = "Late fee payment"
                }
            );

            // Seed Skills data
            modelBuilder.Entity<Skill>().HasData(
                new Skill
                {
                    SkillId = 1,
                    Name = "Listening",
                    Description = "Kỹ năng nghe hiểu tiếng Anh",
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1),
                    UpdatedAt = new DateTime(2024, 1, 1)
                },
                new Skill
                {
                    SkillId = 2,
                    Name = "Speaking",
                    Description = "Kỹ năng nói tiếng Anh",
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1),
                    UpdatedAt = new DateTime(2024, 1, 1)
                },
                new Skill
                {
                    SkillId = 3,
                    Name = "Reading",
                    Description = "Kỹ năng đọc hiểu tiếng Anh",
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1),
                    UpdatedAt = new DateTime(2024, 1, 1)
                },
                new Skill
                {
                    SkillId = 4,
                    Name = "Writing",
                    Description = "Kỹ năng viết tiếng Anh",
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1),
                    UpdatedAt = new DateTime(2024, 1, 1)
                },
                new Skill
                {
                    SkillId = 5,
                    Name = "Grammar",
                    Description = "Ngữ pháp tiếng Anh",
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1),
                    UpdatedAt = new DateTime(2024, 1, 1)
                },
                new Skill
                {
                    SkillId = 6,
                    Name = "Vocabulary",
                    Description = "Từ vựng tiếng Anh",
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1),
                    UpdatedAt = new DateTime(2024, 1, 1)
                }
            );
        }
    }
}

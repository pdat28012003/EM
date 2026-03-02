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
        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<TestScore> TestScores { get; set; }
        public DbSet<Curriculum> Curriculums { get; set; }
        public DbSet<CurriculumDay> CurriculumDays { get; set; }
        public DbSet<CurriculumSession> CurriculumSessions { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserOtp> UserOtps { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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

            modelBuilder.Entity<Schedule>()
                .HasOne(s => s.Class)
                .WithMany(c => c.Schedules)
                .HasForeignKey(s => s.ClassId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Schedule>()
                .HasOne(s => s.Teacher)
                .WithMany(t => t.Schedules)
                .HasForeignKey(s => s.TeacherId)
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

            modelBuilder.Entity<Curriculum>()
                .HasOne(c => c.Class)
                .WithMany()
                .HasForeignKey(c => c.ClassId)
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

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
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
        }
    }
}

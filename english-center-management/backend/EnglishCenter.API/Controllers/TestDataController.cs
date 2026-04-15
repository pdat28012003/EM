using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Models;
using EnglishCenter.API.Data;
using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestDataController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Create test grade data
        /// </summary>
        [HttpPost("create-grades")]
        public async Task<ActionResult> CreateTestGrades()
        {
            try
            {
                // Kiểm tra xem đã có dữ liệu chưa
                if (await _context.Grades.AnyAsync())
                {
                    return Ok(new { message = "Grade data already exists" });
                }

                // Lấy dữ liệu mẫu (giả sử có sẵn)
                var students = await _context.Students.Take(3).ToListAsync();
                var assignments = await _context.Assignments.Take(2).ToListAsync();
                var skills = await _context.Skills.Take(2).ToListAsync();

                if (students.Count == 0 || assignments.Count == 0 || skills.Count == 0)
                {
                    return BadRequest(new { message = "Missing required data (students, assignments, or skills)" });
                }

                var grades = new List<Grade>();

                // Tạo điểm số cho mỗi sinh viên
                for (int i = 0; i < students.Count; i++)
                {
                    for (int j = 0; j < assignments.Count; j++)
                    {
                        for (int k = 0; k < skills.Count; k++)
                        {
                            var random = new Random();
                            var score = random.NextDouble() * 5 + 5; // Random score between 5-10

                            grades.Add(new Grade
                            {
                                StudentId = students[i].StudentId,
                                AssignmentId = assignments[j].AssignmentId,
                                SkillId = skills[k].SkillId,
                                Score = (decimal)Math.Round(score, 1),
                                MaxScore = 10.0m,
                                Comments = k == 0 ? "Good performance!" : "Needs improvement",
                                GradedAt = DateTime.UtcNow,
                                GradedBy = 1,
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }

                _context.Grades.AddRange(grades);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = $"Created {grades.Count} test grade records",
                    gradesCount = grades.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating test data", error = ex.Message });
            }
        }

        /// <summary>
        /// Get current data status
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult> GetDataStatus()
        {
            var studentsCount = await _context.Students.CountAsync();
            var assignmentsCount = await _context.Assignments.CountAsync();
            var skillsCount = await _context.Skills.CountAsync();
            var gradesCount = await _context.Grades.CountAsync();

            return Ok(new
            {
                studentsCount,
                assignmentsCount,
                skillsCount,
                gradesCount,
                hasGrades = gradesCount > 0
            });
        }

        /// <summary>
        /// Debug grades data
        /// </summary>
        [HttpGet("debug-grades")]
        public async Task<ActionResult> DebugGrades()
        {
            var grades = await _context.Grades
                .Include(g => g.Student)
                .Include(g => g.Assignment)
                .Include(g => g.Skill)
                .Take(10)
                .Select(g => new
                {
                    g.GradeId,
                    StudentId = g.StudentId,
                    StudentName = g.Student != null ? g.Student.FullName : "NULL",
                    AssignmentId = g.AssignmentId,
                    AssignmentTitle = g.Assignment != null ? g.Assignment.Title : "NULL",
                    SkillId = g.SkillId,
                    SkillName = g.Skill != null ? g.Skill.Name : "NULL",
                    g.Score,
                    g.MaxScore,
                    g.Comments,
                    g.GradedAt
                })
                .ToListAsync();

            var enrollments = await _context.Enrollments
                .Include(e => e.Student)
                .Include(e => e.Curriculum)
                .Take(10)
                .Select(e => new
                {
                    e.EnrollmentId,
                    e.StudentId,
                    StudentName = e.Student != null ? e.Student.FullName : "NULL",
                    e.CurriculumId,
                    ClassName = e.Curriculum != null ? e.Curriculum.CurriculumName : "NULL",
                    e.Status
                })
                .ToListAsync();

            return Ok(new
            {
                gradesCount = grades.Count,
                enrollmentsCount = enrollments.Count,
                grades,
                enrollments
            });
        }

        /// <summary>
        /// Test GetGradesByCurriculum logic
        /// </summary>
        [HttpGet("test-grades-by-curriculum/{curriculumId}")]
        public async Task<ActionResult> TestGradesByCurriculum(int curriculumId)
        {
            // Test the exact same logic as GetGradesByCurriculum
            var grades = await _context.Grades
                .Include(g => g.Student)
                .Include(g => g.Assignment)
                .Include(g => g.Skill)
                .Where(g => g.Student != null && _context.Enrollments
                    .Any(e => e.StudentId == g.StudentId && e.CurriculumId == curriculumId && e.Status == "Active"))
                .Select(g => new GradeDto
                {
                    GradeId = g.GradeId,
                    StudentId = g.StudentId,
                    StudentName = g.Student != null ? g.Student.FullName : string.Empty,
                    AssignmentId = g.AssignmentId,
                    AssignmentTitle = g.Assignment != null ? g.Assignment.Title : null,
                    SkillId = g.SkillId,
                    SkillName = g.Skill != null ? g.Skill.Name : string.Empty,
                    Score = g.Score,
                    MaxScore = g.MaxScore,
                    Comments = g.Comments,
                    GradedAt = g.GradedAt,
                    GradedBy = g.GradedBy,
                    CreatedAt = g.CreatedAt
                })
                .OrderByDescending(g => g.CreatedAt)
                .ToListAsync();

            return Ok(new
            {
                curriculumId,
                gradesCount = grades.Count,
                grades
            });
        }

        /// <summary>
        /// Debug assignment and curriculum relationship
        /// </summary>
        [HttpGet("debug-assignments")]
        public async Task<ActionResult> DebugAssignments()
        {
            var assignments = await _context.Assignments
                .Include(a => a.Curriculum)
                .Take(10)
                .Select(a => new
                {
                    a.AssignmentId,
                    a.Title,
                    a.CurriculumId,
                    CurriculumName = a.Curriculum != null ? a.Curriculum.CurriculumName : "NULL"
                })
                .ToListAsync();

            var grades = await _context.Grades
                .Include(g => g.Assignment)
#pragma warning disable CS8602
                    .ThenInclude(a => a.Curriculum!)
#pragma warning restore CS8602
                .Include(g => g.Student)
                .Take(10)
                .Select(g => new
                {
                    g.GradeId,
                    g.StudentId,
                    StudentName = g.Student != null ? g.Student.FullName : "NULL",
                    g.AssignmentId,
                    AssignmentTitle = g.Assignment != null ? g.Assignment.Title : "NULL",
                    CurriculumId = g.Assignment != null && g.Assignment.Curriculum != null ? g.Assignment.Curriculum.CurriculumId : (int?)null,
                    CurriculumName = g.Assignment != null && g.Assignment.Curriculum != null ? g.Assignment.Curriculum.CurriculumName : "NULL",
                    g.Score
                })
                .ToListAsync();

            return Ok(new
            {
                assignmentsCount = assignments.Count,
                gradesCount = grades.Count,
                assignments,
                grades
            });
        }

        /// <summary>
        /// Debug enrollment for students with grades
        /// </summary>
        [HttpGet("debug-enrollments")]
        public async Task<ActionResult> DebugEnrollments()
        {
            var studentsWithGrades = await _context.Grades
                .Select(g => g.StudentId)
                .Distinct()
                .ToListAsync();

            var enrollments = await _context.Enrollments
                .Where(e => studentsWithGrades.Contains(e.StudentId))
                .Include(e => e.Student)
                .Include(e => e.Curriculum)
                .Select(e => new
                {
                    e.EnrollmentId,
                    e.StudentId,
                    StudentName = e.Student != null ? e.Student.FullName : "NULL",
                    e.CurriculumId,
                    CurriculumName = e.Curriculum != null ? e.Curriculum.CurriculumName : "NULL",
                    e.Status
                })
                .ToListAsync();

            return Ok(new
            {
                studentsWithGradesCount = studentsWithGrades.Count,
                enrollmentsCount = enrollments.Count,
                studentsWithGrades,
                enrollments
            });
        }

        /// <summary>
        /// Debug specific student enrollment
        /// </summary>
        [HttpGet("debug-student/{studentId}")]
        public async Task<ActionResult> DebugStudent(int studentId)
        {
            var student = await _context.Students.FindAsync(studentId);
            
            var enrollments = await _context.Enrollments
                .Where(e => e.StudentId == studentId)
                .Include(e => e.Student)
                .Include(e => e.Curriculum)
                .Select(e => new
                {
                    e.EnrollmentId,
                    e.StudentId,
                    StudentName = e.Student != null ? e.Student.FullName : "NULL",
                    e.CurriculumId,
                    CurriculumName = e.Curriculum != null ? e.Curriculum.CurriculumName : "NULL",
                    e.Status,
                    e.EnrollmentDate
                })
                .ToListAsync();

            var grades = await _context.Grades
                .Where(g => g.StudentId == studentId)
                .Include(g => g.Student)
                .Include(g => g.Assignment)
                .Include(g => g.Skill)
                .Select(g => new
                {
                    g.GradeId,
                    g.StudentId,
                    StudentName = g.Student != null ? g.Student.FullName : "NULL",
                    g.AssignmentId,
                    AssignmentTitle = g.Assignment != null ? g.Assignment.Title : "NULL",
                    g.SkillId,
                    SkillName = g.Skill != null ? g.Skill.Name : "NULL",
                    g.Score,
                    g.MaxScore,
                    g.Comments,
                    g.GradedAt
                })
                .ToListAsync();

            return Ok(new
            {
                studentId,
                student = student != null ? new { student.StudentId, student.FullName, student.Email } : null,
                enrollmentsCount = enrollments.Count,
                gradesCount = grades.Count,
                enrollments,
                grades
            });
        }
    }
}

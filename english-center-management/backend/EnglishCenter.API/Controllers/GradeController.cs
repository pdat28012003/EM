using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Data;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GradeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GradeController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets grades by assignment. (Lấy điểm theo bài tập)
        /// </summary>
        [HttpGet("assignment/{assignmentId}")]
        public async Task<ActionResult<IEnumerable<GradeDto>>> GetGradesByAssignment(int assignmentId)
        {
            var grades = await _context.Grades
                .Include(g => g.Student)
                .Include(g => g.Assignment)
                .Include(g => g.Skill)
                .Where(g => g.AssignmentId == assignmentId)
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

            return Ok(grades);
        }

        /// <summary>
        /// Gets grades by student. (Lấy điểm theo học viên)
        /// </summary>
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<GradeDto>>> GetGradesByStudent(int studentId)
        {
            var grades = await _context.Grades
                .Include(g => g.Student)
                .Include(g => g.Assignment)
                .Include(g => g.Skill)
                .Where(g => g.StudentId == studentId)
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

            return Ok(grades);
        }

        /// <summary>
        /// Gets filtered grades with search and filter options.
        /// </summary>
        [HttpGet("filter/{curriculumId}")]
        public async Task<ActionResult<IEnumerable<GradeDto>>> GetGradesFiltered(
            int curriculumId,
            [FromQuery] string? studentName = null,
            [FromQuery] string? assignmentType = null,
            [FromQuery] int? skillId = null,
            [FromQuery] decimal? minScore = null,
            [FromQuery] decimal? maxScore = null)
        {
            var courseIds = await _context.CurriculumCourses
                .Where(cc => cc.CurriculumId == curriculumId)
                .Select(cc => cc.CourseId)
                .ToListAsync();

            var studentIds = await _context.CourseEnrollments
                .Where(ce => courseIds.Contains(ce.CourseId) && ce.Status == "Active")
                .Select(ce => ce.StudentId)
                .Distinct()
                .ToListAsync();

            var query = _context.Grades
                .Include(g => g.Student)
                .Include(g => g.Assignment)
                .Include(g => g.Skill)
                .Where(g => g.Student != null && 
                           studentIds.Contains(g.StudentId) &&
                           g.Assignment != null && 
                           g.Assignment.CurriculumId == curriculumId);

            // Filter by student name
            if (!string.IsNullOrWhiteSpace(studentName))
            {
                var searchLower = studentName.ToLower();
                query = query.Where(g => g.Student != null && 
                    (g.Student.FullName.ToLower().Contains(searchLower) ||
                     g.Student.StudentId.ToString().Contains(searchLower)));
            }

            // Filter by assignment type
            if (!string.IsNullOrWhiteSpace(assignmentType) && assignmentType != "all")
            {
                var typeLower = assignmentType.ToLower();
                query = query.Where(g => g.Assignment != null && 
                    (g.Assignment.Type.ToLower() == typeLower ||
                     g.Assignment.Type.ToLower().Contains(typeLower)));
            }

            // Filter by skill
            if (skillId.HasValue)
            {
                query = query.Where(g => g.SkillId == skillId.Value);
            }

            // Filter by score range
            if (minScore.HasValue)
            {
                query = query.Where(g => g.Score >= minScore.Value);
            }
            if (maxScore.HasValue)
            {
                query = query.Where(g => g.Score <= maxScore.Value);
            }

            var grades = await query
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

            return Ok(grades);
        }

        /// <summary>
        /// Gets grades by curriculum. (Lây theo chuong trnh)
        /// </summary>
        /// <param name="curriculumId">Curriculum ID (ID chương trình học)</param>
        /// <returns>List of grades (Danh sách điểm số)</returns>
        [HttpGet("curriculum/{curriculumId}")]
        public async Task<ActionResult<IEnumerable<GradeDto>>> GetGradesByCurriculum(int curriculumId)
        {
            // Get courseIds from curriculum
            var courseIds = await _context.CurriculumCourses
                .Where(cc => cc.CurriculumId == curriculumId)
                .Select(cc => cc.CourseId)
                .ToListAsync();

            // Get studentIds from CourseEnrollments
            var studentIds = await _context.CourseEnrollments
                .Where(ce => courseIds.Contains(ce.CourseId) && ce.Status == "Active")
                .Select(ce => ce.StudentId)
                .Distinct()
                .ToListAsync();

            var grades = await _context.Grades
                .Include(g => g.Student)
                .Include(g => g.Assignment)
                .Include(g => g.Skill)
                .Where(g => g.Student != null && 
                           studentIds.Contains(g.StudentId) &&
                           g.Assignment != null && 
                           g.Assignment.CurriculumId == curriculumId)
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

            return Ok(grades);
        }

        /// <summary>
        /// Creates a new grade. (Tạo điểm mới)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<GradeDto>> CreateGrade(CreateGradeDto dto)
        {
            try
            {
                var grade = new Grade
                {
                    StudentId = dto.StudentId,
                    AssignmentId = dto.AssignmentId,
                    SkillId = dto.SkillId,
                    Score = dto.Score,
                    MaxScore = dto.MaxScore,
                    Comments = dto.Comments,
                    GradedAt = DateTime.UtcNow,
                    GradedBy = 1, // TODO: Get from authenticated user
                    CreatedAt = DateTime.UtcNow
                };

                _context.Grades.Add(grade);
                await _context.SaveChangesAsync();

                // Create notification for the student
                var student = await _context.Students.FindAsync(dto.StudentId);
                var skill = await _context.Skills.FindAsync(dto.SkillId);
                var assignment = dto.AssignmentId.HasValue 
                    ? await _context.Assignments.FindAsync(dto.AssignmentId.Value) 
                    : null;

                if (student != null)
                {
                    var assignmentName = assignment?.Title ?? "Bài tập";
                    var skillName = skill?.Name ?? "";
                    var notification = new Notification
                    {
                        StudentId = dto.StudentId,
                        Title = "Điểm mới",
                        Message = $"Bạn vừa có điểm {skillName} {assignmentName}: {dto.Score}/{dto.MaxScore}",
                        Type = "NewGrade",
                        RelatedId = grade.GradeId,
                        RelatedType = "Grade",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();
                }

                // Return created grade with full details
                var createdGrade = await _context.Grades
                    .Include(g => g.Student)
                    .Include(g => g.Assignment)
                    .Include(g => g.Skill)
                    .Where(g => g.GradeId == grade.GradeId)
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
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetGradesByStudent), new { studentId = createdGrade?.StudentId }, createdGrade);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates a grade. (Cập nhật điểm)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<GradeDto>> UpdateGrade(int id, UpdateGradeDto dto)
        {
            try
            {
                var grade = await _context.Grades.FindAsync(id);
                if (grade == null)
                {
                    return NotFound(new { message = "Grade not found" });
                }

                grade.Score = dto.Score;
                grade.Comments = dto.Comments;
                grade.GradedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Return updated grade with full details
                var updatedGrade = await _context.Grades
                    .Include(g => g.Student)
                    .Include(g => g.Assignment)
                    .Include(g => g.Skill)
                    .Where(g => g.GradeId == id)
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
                    .FirstOrDefaultAsync();

                return Ok(updatedGrade);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a grade. (Xóa điểm)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteGrade(int id)
        {
            try
            {
                var grade = await _context.Grades.FindAsync(id);
                if (grade == null)
                {
                    return NotFound(new { message = "Grade not found" });
                }

                _context.Grades.Remove(grade);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}

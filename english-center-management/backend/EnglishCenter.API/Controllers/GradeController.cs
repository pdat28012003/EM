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
                    StudentName = g.Student.FullName,
                    AssignmentId = g.AssignmentId,
                    AssignmentTitle = g.Assignment.Title,
                    SkillId = g.SkillId,
                    SkillName = g.Skill.Name,
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
                    StudentName = g.Student.FullName,
                    AssignmentId = g.AssignmentId,
                    AssignmentTitle = g.Assignment.Title,
                    SkillId = g.SkillId,
                    SkillName = g.Skill.Name,
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
        /// Gets grades by class. (Lấy điểm theo lớp)
        /// </summary>
        [HttpGet("class/{classId}")]
        public async Task<ActionResult<IEnumerable<GradeDto>>> GetGradesByClass(int classId)
        {
            var grades = await _context.Grades
                .Include(g => g.Student)
                .Include(g => g.Assignment)
                .Include(g => g.Skill)
                .Where(g => g.Assignment.ClassId == classId)
                .Select(g => new GradeDto
                {
                    GradeId = g.GradeId,
                    StudentId = g.StudentId,
                    StudentName = g.Student.FullName,
                    AssignmentId = g.AssignmentId,
                    AssignmentTitle = g.Assignment.Title,
                    SkillId = g.SkillId,
                    SkillName = g.Skill.Name,
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
                        StudentName = g.Student.FullName,
                        AssignmentId = g.AssignmentId,
                        AssignmentTitle = g.Assignment.Title,
                        SkillId = g.SkillId,
                        SkillName = g.Skill.Name,
                        Score = g.Score,
                        MaxScore = g.MaxScore,
                        Comments = g.Comments,
                        GradedAt = g.GradedAt,
                        GradedBy = g.GradedBy,
                        CreatedAt = g.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetGradesByAssignment), new { assignmentId = createdGrade.AssignmentId }, createdGrade);
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
                        StudentName = g.Student.FullName,
                        AssignmentId = g.AssignmentId,
                        AssignmentTitle = g.Assignment.Title,
                        SkillId = g.SkillId,
                        SkillName = g.Skill.Name,
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

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AssignmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AssignmentController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets assignments for a class with pagination. (Lấy danh sách bài tập của một lớp học với phân trang.)
        /// </summary>
        /// <param name="classId">Class ID (ID lớp học)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <param name="status">Assignment status (Trạng thái bài tập)</param>
        /// <returns>Paginated list of assignments (Danh sách bài tập phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<AssignmentDto>>> GetAssignments(
            [FromQuery] int? classId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var query = _context.Assignments
                    .Include(a => a.Class)
                    .Include(a => a.Teacher)
                    .AsQueryable();

                if (classId.HasValue)
                {
                    query = query.Where(a => a.ClassId == classId.Value);
                }

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(a => a.Status == status);
                }

                var totalCount = await query.CountAsync();
                var assignments = await query
                    .OrderByDescending(a => a.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => new AssignmentDto
                    {
                        AssignmentId = a.AssignmentId,
                        Title = a.Title,
                        Description = a.Description,
                        Type = a.Type,
                        ClassId = a.ClassId,
                        TeacherId = a.TeacherId,
                        DueDate = a.DueDate,
                        CreatedAt = a.CreatedAt,
                        Status = a.Status,
                        MaxScore = a.MaxScore,
                        AttachmentUrl = a.AttachmentUrl,
                        UpdatedAt = a.UpdatedAt,
                        ClassName = a.Class.ClassName,
                        TeacherName = a.Teacher.FullName,
                        SubmissionsCount = a.Submissions.Count,
                        GradedCount = a.Submissions.Count(s => s.Status == "Graded")
                    })
                    .ToListAsync();

                var pagedResult = new PagedResult<AssignmentDto>
                {
                    Data = assignments,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return Ok(pagedResult);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets assignment by ID. (Lấy thông tin bài tập theo ID.)
        /// </summary>
        /// <param name="id">Assignment ID (ID bài tập)</param>
        /// <returns>Assignment details (Chi tiết bài tập)</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<AssignmentDto>> GetAssignment(int id)
        {
            try
            {
                var assignment = await _context.Assignments
                    .Include(a => a.Class)
                    .Include(a => a.Teacher)
                    .Where(a => a.AssignmentId == id)
                    .Select(a => new AssignmentDto
                    {
                        AssignmentId = a.AssignmentId,
                        Title = a.Title,
                        Description = a.Description,
                        Type = a.Type,
                        ClassId = a.ClassId,
                        TeacherId = a.TeacherId,
                        DueDate = a.DueDate,
                        CreatedAt = a.CreatedAt,
                        Status = a.Status,
                        MaxScore = a.MaxScore,
                        AttachmentUrl = a.AttachmentUrl,
                        UpdatedAt = a.UpdatedAt,
                        ClassName = a.Class.ClassName,
                        TeacherName = a.Teacher.FullName,
                        SubmissionsCount = a.Submissions.Count,
                        GradedCount = a.Submissions.Count(s => s.Status == "Graded")
                    })
                    .FirstOrDefaultAsync();

                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                return Ok(assignment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Creates a new assignment. (Tạo bài tập mới.)
        /// </summary>
        /// <param name="createDto">Assignment data (Dữ liệu bài tập)</param>
        /// <returns>Created assignment (Bài tập đã tạo)</returns>
        [HttpPost]
        public async Task<ActionResult<AssignmentDto>> CreateAssignment(CreateAssignmentDto createDto)
        {
            try
            {
                var classExists = await _context.Classes.AnyAsync(c => c.ClassId == createDto.ClassId);
                if (!classExists)
                {
                    return BadRequest(new { message = "Class not found" });
                }

                var assignment = new Assignment
                {
                    Title = createDto.Title,
                    Description = createDto.Description,
                    Type = createDto.Type,
                    ClassId = createDto.ClassId,
                    TeacherId = 1, // TODO: Get from authenticated user
                    DueDate = createDto.DueDate,
                    Status = "Published",
                    MaxScore = createDto.MaxScore,
                    AttachmentUrl = createDto.AttachmentUrl,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Assignments.Add(assignment);
                await _context.SaveChangesAsync();

                var assignmentDto = new AssignmentDto
                {
                    AssignmentId = assignment.AssignmentId,
                    Title = assignment.Title,
                    Description = assignment.Description,
                    Type = assignment.Type,
                    ClassId = assignment.ClassId,
                    TeacherId = assignment.TeacherId,
                    DueDate = assignment.DueDate,
                    CreatedAt = assignment.CreatedAt,
                    Status = assignment.Status,
                    MaxScore = assignment.MaxScore,
                    AttachmentUrl = assignment.AttachmentUrl,
                    UpdatedAt = assignment.UpdatedAt
                };

                return CreatedAtAction(nameof(GetAssignment), new { id = assignment.AssignmentId }, assignmentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates an assignment. (Cập nhật bài tập.)
        /// </summary>
        /// <param name="id">Assignment ID (ID bài tập)</param>
        /// <param name="updateDto">Update data (Dữ liệu cập nhật)</param>
        /// <returns>Updated assignment (Bài tập đã cập nhật)</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<AssignmentDto>> UpdateAssignment(int id, UpdateAssignmentDto updateDto)
        {
            try
            {
                var assignment = await _context.Assignments.FindAsync(id);
                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                if (!string.IsNullOrEmpty(updateDto.Title))
                    assignment.Title = updateDto.Title;

                if (!string.IsNullOrEmpty(updateDto.Description))
                    assignment.Description = updateDto.Description;

                if (!string.IsNullOrEmpty(updateDto.Type))
                    assignment.Type = updateDto.Type;

                if (updateDto.DueDate.HasValue)
                    assignment.DueDate = updateDto.DueDate.Value;

                if (updateDto.MaxScore.HasValue)
                    assignment.MaxScore = updateDto.MaxScore.Value;

                if (!string.IsNullOrEmpty(updateDto.AttachmentUrl))
                    assignment.AttachmentUrl = updateDto.AttachmentUrl;

                if (!string.IsNullOrEmpty(updateDto.Status))
                    assignment.Status = updateDto.Status;

                assignment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var assignmentDto = new AssignmentDto
                {
                    AssignmentId = assignment.AssignmentId,
                    Title = assignment.Title,
                    Description = assignment.Description,
                    Type = assignment.Type,
                    ClassId = assignment.ClassId,
                    TeacherId = assignment.TeacherId,
                    DueDate = assignment.DueDate,
                    CreatedAt = assignment.CreatedAt,
                    Status = assignment.Status,
                    MaxScore = assignment.MaxScore,
                    AttachmentUrl = assignment.AttachmentUrl,
                    UpdatedAt = assignment.UpdatedAt
                };

                return Ok(assignmentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes an assignment. (Xóa bài tập.)
        /// </summary>
        /// <param name="id">Assignment ID (ID bài tập)</param>
        /// <returns>Delete result (Kết quả xóa)</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteAssignment(int id)
        {
            try
            {
                var assignment = await _context.Assignments.FindAsync(id);
                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                _context.Assignments.Remove(assignment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Assignment deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets assignment submissions. (Lấy danh sách bài nộp của bài tập.)
        /// </summary>
        /// <param name="assignmentId">Assignment ID (ID bài tập)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <param name="status">Submission status (Trạng thái bài nộp)</param>
        /// <returns>Paginated list of submissions (Danh sách bài nộp phân trang)</returns>
        [HttpGet("{assignmentId}/submissions")]
        public async Task<ActionResult<PagedResult<AssignmentSubmissionDto>>> GetSubmissions(
            int assignmentId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var query = _context.AssignmentSubmissions
                    .Include(s => s.Assignment)
                    .Include(s => s.Student)
                    .Include(s => s.Grader)
                    .Where(s => s.AssignmentId == assignmentId)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(s => s.Status == status);
                }

                var totalCount = await query.CountAsync();
                var submissions = await query
                    .OrderByDescending(s => s.SubmittedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(s => new AssignmentSubmissionDto
                    {
                        SubmissionId = s.SubmissionId,
                        AssignmentId = s.AssignmentId,
                        StudentId = s.StudentId,
                        Content = s.Content,
                        AttachmentUrl = s.AttachmentUrl,
                        SubmittedAt = s.SubmittedAt,
                        UpdatedAt = s.UpdatedAt,
                        Status = s.Status,
                        Score = s.Score,
                        Feedback = s.Feedback,
                        GradedAt = s.GradedAt,
                        GradedBy = s.GradedBy,
                        StudentName = s.Student.FullName,
                        AssignmentTitle = s.Assignment.Title
                    })
                    .ToListAsync();

                var pagedResult = new PagedResult<AssignmentSubmissionDto>
                {
                    Data = submissions,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return Ok(pagedResult);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Grades a submission. (Chấm điểm bài nộp.)
        /// </summary>
        /// <param name="submissionId">Submission ID (ID bài nộp)</param>
        /// <param name="gradeDto">Grading data (Dữ liệu chấm điểm)</param>
        /// <returns>Graded submission (Bài nộp đã chấm điểm)</returns>
        [HttpPut("submissions/{submissionId}/grade")]
        public async Task<ActionResult<AssignmentSubmissionDto>> GradeSubmission(int submissionId, GradeSubmissionDto gradeDto)
        {
            try
            {
                var submission = await _context.AssignmentSubmissions
                    .Include(s => s.Assignment)
                    .Include(s => s.Student)
                    .Where(s => s.SubmissionId == submissionId)
                    .FirstOrDefaultAsync();

                if (submission == null)
                {
                    return NotFound(new { message = "Submission not found" });
                }

                if (gradeDto.Score > submission.Assignment.MaxScore)
                {
                    return BadRequest(new { message = $"Score cannot exceed maximum score of {submission.Assignment.MaxScore}" });
                }

                submission.Score = gradeDto.Score;
                submission.Feedback = gradeDto.Feedback;
                submission.Status = "Graded";
                submission.GradedAt = DateTime.UtcNow;
                submission.GradedBy = 1; // TODO: Get from authenticated user
                submission.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var submissionDto = new AssignmentSubmissionDto
                {
                    SubmissionId = submission.SubmissionId,
                    AssignmentId = submission.AssignmentId,
                    StudentId = submission.StudentId,
                    Content = submission.Content,
                    AttachmentUrl = submission.AttachmentUrl,
                    SubmittedAt = submission.SubmittedAt,
                    UpdatedAt = submission.UpdatedAt,
                    Status = submission.Status,
                    Score = submission.Score,
                    Feedback = submission.Feedback,
                    GradedAt = submission.GradedAt,
                    GradedBy = submission.GradedBy,
                    StudentName = submission.Student.FullName,
                    AssignmentTitle = submission.Assignment.Title
                };

                return Ok(submissionDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}

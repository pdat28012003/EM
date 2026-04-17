using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Models;
using EnglishCenter.API.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Hosting;
using System.Text.Json;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AssignmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IActivityLogService _activityLogService;

        public AssignmentController(ApplicationDbContext context, IWebHostEnvironment environment, IActivityLogService activityLogService)
        {
            _context = context;
            _environment = environment;
            _activityLogService = activityLogService;
        }

        /// <summary>
        /// Gets assignments for a curriculum with pagination. (Lấy danh sách bài tập của một khóa học với phân trang.)
        /// </summary>
        /// <param name="curriculumId">Curriculum ID (ID khóa học)</param>
        /// <param name="studentId">Student ID (ID học viên)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <param name="status">Assignment status (Trạng thái bài tập)</param>
        /// <returns>Paginated list of assignments (Danh sách bài tập phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<AssignmentDto>>> GetAssignments(
            [FromQuery] int? curriculumId = null,
            [FromQuery] int? studentId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var query = _context.Assignments
                    .Include(a => a.Curriculum)
                    .Include(a => a.Teacher)
                    .Include(a => a.Skill)
                    .AsQueryable();

                if (curriculumId.HasValue)
                {
                    query = query.Where(a => a.CurriculumId == curriculumId.Value);
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
                        CurriculumId = a.CurriculumId,
                        TeacherId = a.TeacherId,
                        DueDate = a.DueDate,
                        CreatedAt = a.CreatedAt,
                        Status = a.Status,
                        MaxScore = a.MaxScore,
                        AttachmentUrl = a.AttachmentUrl,
                        SkillId = a.SkillId,
                        SkillName = a.Skill != null ? a.Skill.Name : null,
                        UpdatedAt = a.UpdatedAt,
                        CurriculumName = a.Curriculum != null ? a.Curriculum.CurriculumName : null,
                        TeacherName = a.Teacher != null ? a.Teacher.FullName : null,
                        SubmissionsCount = a.Submissions.Count,
                        GradedCount = a.Submissions.Count(s => s.Status == "Graded"),
                        StudentScore = studentId.HasValue 
                            ? a.Submissions.Where(s => s.StudentId == studentId.Value).OrderByDescending(s => s.SubmittedAt).Select(s => s.Score).FirstOrDefault()
                            : null,
                        StudentStatus = studentId.HasValue
                            ? a.Submissions.Where(s => s.StudentId == studentId.Value).OrderByDescending(s => s.SubmittedAt).Select(s => s.Status).FirstOrDefault()
                            : null,
                        AllowLateSubmission = a.AllowLateSubmission
                    })
                    .ToListAsync();

                // If studentId provided, also fetch TimeSpentSeconds from StudentQuizAttempts for Quizzes
                if (studentId.HasValue)
                {
                    var quizIds = assignments.Where(a => a.Type == "Quiz").Select(a => a.AssignmentId).ToList();
                    if (quizIds.Any())
                    {
                        var attempts = await _context.StudentQuizAttempts
                            .Where(qa => qa.StudentId == studentId.Value && quizIds.Contains(qa.AssignmentId))
                            .GroupBy(qa => qa.AssignmentId)
                            .ToDictionaryAsync(g => g.Key, g => g.OrderByDescending(x => x.SubmittedAt).Select(x => x.TimeSpentSeconds).FirstOrDefault());

                        foreach (var a in assignments.Where(a => a.Type == "Quiz"))
                        {
                            if (attempts.ContainsKey(a.AssignmentId))
                            {
                                a.TimeSpentSeconds = attempts[a.AssignmentId];
                            }
                        }
                    }
                }

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
                    .Include(a => a.Curriculum)
                    .Include(a => a.Teacher)
                    .Include(a => a.Skill)
                    .Where(a => a.AssignmentId == id)
                    .Select(a => new AssignmentDto
                    {
                        AssignmentId = a.AssignmentId,
                        Title = a.Title,
                        Description = a.Description,
                        Type = a.Type,
                        CurriculumId = a.CurriculumId,
                        TeacherId = a.TeacherId,
                        DueDate = a.DueDate,
                        CreatedAt = a.CreatedAt,
                        Status = a.Status,
                        MaxScore = a.MaxScore,
                        AttachmentUrl = a.AttachmentUrl,
                        SkillId = a.SkillId,
                        SkillName = a.Skill != null ? a.Skill.Name : null,
                        UpdatedAt = a.UpdatedAt,
                        CurriculumName = a.Curriculum != null ? a.Curriculum.CurriculumName : null,
                        TeacherName = a.Teacher != null ? a.Teacher.FullName : null,
                        SubmissionsCount = a.Submissions.Count,
                        GradedCount = a.Submissions.Count(s => s.Status == "Graded"),
                        AllowLateSubmission = a.AllowLateSubmission
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
                if (!createDto.CurriculumId.HasValue)
                {
                    return BadRequest(new { message = "Curriculum is required" });
                }

                var curriculum = await _context.Curriculums.FindAsync(createDto.CurriculumId);
                if (curriculum == null)
                {
                    return BadRequest(new { message = "Curriculum not found" });
                }

                // Get current user ID and TeacherId
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                var teacherId = await _context.Teachers
                    .Where(t => t.UserId == userId)
                    .Select(t => t.TeacherId)
                    .FirstOrDefaultAsync();

                if (teacherId == 0)
                    return BadRequest(new { message = "Teacher profile not found" });

                var assignment = new Assignment
                {
                    Title = createDto.Title,
                    Description = createDto.Description ?? string.Empty,
                    Type = createDto.Type,
                    CurriculumId = createDto.CurriculumId,
                    TeacherId = teacherId,
                    DueDate = createDto.DueDate.HasValue ? createDto.DueDate.Value : DateTime.UtcNow.AddDays(7),
                    Status = "Published",
                    MaxScore = createDto.MaxScore.HasValue ? Convert.ToInt32(createDto.MaxScore.Value) : 100,
                    AttachmentUrl = createDto.AttachmentUrl,
                    SkillId = createDto.SkillId,
                    CreatedAt = DateTime.UtcNow,
                    AllowLateSubmission = createDto.AllowLateSubmission
                };

                _context.Assignments.Add(assignment);
                await _context.SaveChangesAsync();

                // Create notifications for all students in the curriculum
                var studentsInCurriculum = await _context.Curriculums
                    .Where(c => c.CurriculumId == createDto.CurriculumId)
                    .SelectMany(c => c.ParticipantStudents)
                    .ToListAsync();

                foreach (var student in studentsInCurriculum)
                {
                    if (student.UserId.HasValue)
                    {
                        var notification = new Notification
                        {
                            UserId = student.UserId.Value,
                            Title = "Bài tập mới",
                            Message = $"Bạn có bài tập mới '{assignment.Title}' trong khóa {curriculum.CurriculumName}",
                            Type = "NewAssignment",
                            RelatedId = assignment.AssignmentId,
                            RelatedType = "Assignment",
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Notifications.Add(notification);
                    }
                }

                // Create notification for teacher (their own activity)
                var teacher = await _context.Teachers.FindAsync(assignment.TeacherId);
                if (teacher?.UserId != null)
                {
                    var teacherNotification = new Notification
                    {
                        UserId = teacher.UserId.Value,
                        Title = "Đã tạo bài tập mới",
                        Message = $"Bạn đã tạo bài tập '{assignment.Title}' trong khóa {curriculum.CurriculumName}",
                        Type = "TeacherCreatedAssignment",
                        RelatedId = assignment.AssignmentId,
                        RelatedType = "Assignment",
                        IsRead = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(teacherNotification);
                }

                // CREATE ACTIVITY LOG for teacher using service (always log regardless of UserId)
                if (teacher != null)
                {
                    await _activityLogService.LogAssignmentCreatedAsync(
                        teacherId: teacher.TeacherId,
                        assignmentId: assignment.AssignmentId,
                        assignmentTitle: assignment.Title
                    );
                }

                await _context.SaveChangesAsync();

                var assignmentDto = new AssignmentDto
                {
                    AssignmentId = assignment.AssignmentId,
                    Title = assignment.Title,
                    Description = assignment.Description,
                    Type = assignment.Type,
                    CurriculumId = assignment.CurriculumId,
                    TeacherId = assignment.TeacherId,
                    DueDate = assignment.DueDate,
                    CreatedAt = assignment.CreatedAt,
                    Status = assignment.Status,
                    MaxScore = assignment.MaxScore,
                    AttachmentUrl = assignment.AttachmentUrl,
                    SkillId = assignment.SkillId,
                    UpdatedAt = assignment.UpdatedAt,
                    AllowLateSubmission = assignment.AllowLateSubmission
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
                    assignment.MaxScore = Convert.ToInt32(updateDto.MaxScore.Value);

                if (!string.IsNullOrEmpty(updateDto.AttachmentUrl))
                    assignment.AttachmentUrl = updateDto.AttachmentUrl;

                if (updateDto.SkillId.HasValue)
                    assignment.SkillId = updateDto.SkillId.Value;

                if (!string.IsNullOrEmpty(updateDto.Status))
                    assignment.Status = updateDto.Status;

                if (updateDto.AllowLateSubmission.HasValue)
                    assignment.AllowLateSubmission = updateDto.AllowLateSubmission.Value;

                assignment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var assignmentDto = new AssignmentDto
                {
                    AssignmentId = assignment.AssignmentId,
                    Title = assignment.Title,
                    Description = assignment.Description,
                    Type = assignment.Type,
                    CurriculumId = assignment.CurriculumId,
                    TeacherId = assignment.TeacherId,
                    DueDate = assignment.DueDate,
                    CreatedAt = assignment.CreatedAt,
                    Status = assignment.Status,
                    MaxScore = assignment.MaxScore,
                    AttachmentUrl = assignment.AttachmentUrl,
                    SkillId = assignment.SkillId,
                    UpdatedAt = assignment.UpdatedAt,
                    AllowLateSubmission = assignment.AllowLateSubmission
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

                // Delete all submissions
                var submissions = await _context.AssignmentSubmissions
                    .Where(s => s.AssignmentId == id)
                    .ToListAsync();
                if (submissions.Any())
                {
                    _context.AssignmentSubmissions.RemoveRange(submissions);
                }

                // Delete all quiz questions and their answers
                var questions = await _context.QuizQuestions
                    .Where(q => q.AssignmentId == id)
                    .Include(q => q.Answers)
                    .ToListAsync();
                if (questions.Any())
                {
                    foreach (var question in questions)
                    {
                        if (question.Answers?.Any() == true)
                        {
                            _context.QuizAnswers.RemoveRange(question.Answers);
                        }
                    }
                    _context.QuizQuestions.RemoveRange(questions);
                }

                // Delete all quiz attempts and their answers
                var attempts = await _context.StudentQuizAttempts
                    .Where(a => a.AssignmentId == id)
                    .ToListAsync();
                if (attempts.Any())
                {
                    var attemptIds = attempts.Select(a => a.AttemptId).ToList();
                    var quizAnswers = await _context.StudentQuizAnswers
                        .Where(qa => attemptIds.Contains(qa.AttemptId))
                        .ToListAsync();
                    if (quizAnswers.Any())
                    {
                        _context.StudentQuizAnswers.RemoveRange(quizAnswers);
                    }
                    _context.StudentQuizAttempts.RemoveRange(attempts);
                }

                // Delete the assignment
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
        /// Reopens a closed assignment. (Mở lại bài tập đã đóng.)
        /// </summary>
        /// <param name="id">Assignment ID (ID bài tập)</param>
        /// <returns>Reopened assignment (Bài tập đã mở lại)</returns>
        [HttpPut("{id}/reopen")]
        public async Task<ActionResult<AssignmentDto>> ReopenAssignment(int id)
        {
            try
            {
                var assignment = await _context.Assignments
                    .Include(a => a.Curriculum)
                    .Include(a => a.Teacher)
                    .Include(a => a.Skill)
                    .FirstOrDefaultAsync(a => a.AssignmentId == id);

                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                // Only allow reopening if currently Closed
                if (assignment.Status != "Closed")
                {
                    return BadRequest(new { message = $"Cannot reopen assignment with status '{assignment.Status}'. Only 'Closed' assignments can be reopened." });
                }

                assignment.Status = "Published";
                assignment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var assignmentDto = new AssignmentDto
                {
                    AssignmentId = assignment.AssignmentId,
                    Title = assignment.Title,
                    Description = assignment.Description,
                    Type = assignment.Type,
                    CurriculumId = assignment.CurriculumId,
                    TeacherId = assignment.TeacherId,
                    DueDate = assignment.DueDate,
                    CreatedAt = assignment.CreatedAt,
                    Status = assignment.Status,
                    MaxScore = assignment.MaxScore,
                    AttachmentUrl = assignment.AttachmentUrl,
                    SkillId = assignment.SkillId,
                    SkillName = assignment.Skill != null ? assignment.Skill.Name : null,
                    UpdatedAt = assignment.UpdatedAt,
                    CurriculumName = assignment.Curriculum != null ? assignment.Curriculum.CurriculumName : null,
                    TeacherName = assignment.Teacher != null ? assignment.Teacher.FullName : null
                };

                return Ok(assignmentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Closes an assignment. (Đóng bài tập.)
        /// </summary>
        /// <param name="id">Assignment ID (ID bài tập)</param>
        /// <returns>Closed assignment (Bài tập đã đóng)</returns>
        [HttpPut("{id}/close")]
        public async Task<ActionResult<AssignmentDto>> CloseAssignment(int id)
        {
            try
            {
                var assignment = await _context.Assignments
                    .Include(a => a.Curriculum)
                    .Include(a => a.Teacher)
                    .Include(a => a.Skill)
                    .FirstOrDefaultAsync(a => a.AssignmentId == id);

                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                // Only allow closing if currently Published
                if (assignment.Status != "Published" && assignment.Status != "Draft")
                {
                    return BadRequest(new { message = $"Cannot close assignment with status '{assignment.Status}'." });
                }

                assignment.Status = "Closed";
                assignment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var assignmentDto = new AssignmentDto
                {
                    AssignmentId = assignment.AssignmentId,
                    Title = assignment.Title,
                    Description = assignment.Description,
                    Type = assignment.Type,
                    CurriculumId = assignment.CurriculumId,
                    TeacherId = assignment.TeacherId,
                    DueDate = assignment.DueDate,
                    CreatedAt = assignment.CreatedAt,
                    Status = assignment.Status,
                    MaxScore = assignment.MaxScore,
                    AttachmentUrl = assignment.AttachmentUrl,
                    SkillId = assignment.SkillId,
                    SkillName = assignment.Skill != null ? assignment.Skill.Name : null,
                    UpdatedAt = assignment.UpdatedAt,
                    CurriculumName = assignment.Curriculum != null ? assignment.Curriculum.CurriculumName : null,
                    TeacherName = assignment.Teacher != null ? assignment.Teacher.FullName : null
                };

                return Ok(assignmentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Creates a new submission for an assignment. (Học viên nộp bài tập.)
        /// </summary>
        /// <param name="assignmentId">Assignment ID (ID bài tập)</param>
        /// <param name="dto">Submission data (Dữ liệu bài nộp)</param>
        /// <returns>Created submission (Bài nộp đã tạo)</returns>
        [HttpPost("{assignmentId}/submissions")]
        public async Task<ActionResult<AssignmentSubmissionDto>> CreateSubmission(int assignmentId, CreateSubmissionDto dto)
        {
            try
            {
                // DEBUG: Log the incoming DTO
                Console.WriteLine($"[DEBUG] CreateSubmission called for assignmentId={assignmentId}");
                Console.WriteLine($"[DEBUG] dto.StudentId={dto.StudentId}");
                Console.WriteLine($"[DEBUG] dto.Content={dto.Content}");
                Console.WriteLine($"[DEBUG] dto.AttachmentUrl={dto.AttachmentUrl}");
                Console.WriteLine($"[DEBUG] dto.OriginalFileName={dto.OriginalFileName}");
                
                var assignment = await _context.Assignments
                    .Include(a => a.Curriculum)
                    .ThenInclude(c => c!.CurriculumDays!.Where(cd => cd.CurriculumSessions.Any(cs => cs.TeacherId != null)).Take(1))
                    .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                // Check deadline - không cho nộp nếu đã hết hạn và không cho phép nộp trễ
                var now = DateTime.UtcNow;
                if (now > assignment.DueDate && !assignment.AllowLateSubmission)
                {
                    return BadRequest(new { message = "Đã quá hạn nộp bài" });
                }

                // Check if student already submitted
                var existingSubmission = await _context.AssignmentSubmissions
                    .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == dto.StudentId);

                if (existingSubmission != null)
                {
                    return BadRequest(new { message = "You have already submitted this assignment" });
                }

                var submission = new AssignmentSubmission
                {
                    AssignmentId = assignmentId,
                    StudentId = dto.StudentId,
                    Content = dto.Content,
                    AttachmentUrl = dto.AttachmentUrl,
                    OriginalFileName = dto.OriginalFileName,
                    SubmittedAt = DateTime.UtcNow,
                    Status = "Submitted"
                };

                _context.AssignmentSubmissions.Add(submission);
                await _context.SaveChangesAsync();

                // Create notification for the teacher to grade
                if (assignment.TeacherId > 0)
                {
                    var student = await _context.Students.FindAsync(dto.StudentId);
                    var notification = new Notification
                    {
                        TeacherId = assignment.TeacherId,
                        Title = "Có bài tập cần chấm điểm",
                        Message = $"Học viên {student?.FullName} vừa nộp bài '{assignment.Title}'",
                        Type = "SubmissionPending",
                        RelatedId = submission.SubmissionId,
                        RelatedType = "Submission",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();

                    // CREATE ACTIVITY LOG for student using service
                    await _activityLogService.LogAssignmentSubmittedAsync(
                        studentId: dto.StudentId,
                        submissionId: submission.SubmissionId,
                        assignmentTitle: assignment.Title
                    );
                    await _context.SaveChangesAsync();
                }

                var submissionDto = new AssignmentSubmissionDto
                {
                    SubmissionId = submission.SubmissionId,
                    AssignmentId = submission.AssignmentId,
                    OriginalFileName = submission.OriginalFileName,
                    StudentId = submission.StudentId,
                    Content = submission.Content,
                    AttachmentUrl = submission.AttachmentUrl,
                    SubmittedAt = submission.SubmittedAt,
                    Status = submission.Status
                };

                return CreatedAtAction(nameof(GetSubmissions), new { assignmentId }, submissionDto);
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
                        OriginalFileName = s.OriginalFileName,
                        SubmittedAt = s.SubmittedAt,
                        UpdatedAt = s.UpdatedAt,
                        Status = s.Status,
                        Score = s.Score,
                        Feedback = s.Feedback,
                        GradedAt = s.GradedAt,
                        GradedBy = s.GradedBy,
                        StudentName = s.Student != null ? s.Student.FullName : null,
                        AssignmentTitle = s.Assignment != null ? s.Assignment.Title : null
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
        /// Gets the current student's submission for an assignment.
        /// (Lấy bài nộp của học viên hiện tại cho một bài tập.)
        /// </summary>
        /// <param name="assignmentId">Assignment ID (ID bài tập)</param>
        /// <param name="studentId">Student ID (ID học viên)</param>
        /// <returns>Student's submission or 404 if not submitted (Bài nộp của học viên hoặc 404 nếu chưa nộp)</returns>
        [HttpGet("{assignmentId}/my-submission")]
        public async Task<ActionResult<AssignmentSubmissionDto>> GetMySubmission(int assignmentId, [FromQuery] int studentId)
        {
            try
            {
                var submission = await _context.AssignmentSubmissions
                    .Include(s => s.Assignment)
                    .Include(s => s.Student)
                    .Include(s => s.Grader)
                    .Where(s => s.AssignmentId == assignmentId && s.StudentId == studentId)
                    .OrderByDescending(s => s.SubmittedAt)
                    .Select(s => new AssignmentSubmissionDto
                    {
                        SubmissionId = s.SubmissionId,
                        AssignmentId = s.AssignmentId,
                        StudentId = s.StudentId,
                        Content = s.Content,
                        AttachmentUrl = s.AttachmentUrl,
                        OriginalFileName = s.OriginalFileName,
                        SubmittedAt = s.SubmittedAt,
                        UpdatedAt = s.UpdatedAt,
                        Status = s.Status,
                        Score = s.Score,
                        Feedback = s.Feedback,
                        GradedAt = s.GradedAt,
                        GradedBy = s.GradedBy,
                        StudentName = s.Student != null ? s.Student.FullName : null,
                        AssignmentTitle = s.Assignment != null ? s.Assignment.Title : null
                    })
                    .FirstOrDefaultAsync();

                if (submission == null)
                {
                    return NotFound(new { message = "No submission found for this assignment" });
                }

                return Ok(submission);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets all student results for a specific assignment, including those who haven't submitted yet.
        /// (Lấy tất cả kết quả của sinh viên cho một bài tập cụ thể, bao gồm cả những người chưa nộp.)
        /// </summary>
        /// <param name="assignmentId">Assignment ID (ID bài tập)</param>
        /// <returns>List of results for all students in the class (Danh sách kết quả của tất cả sinh viên trong lớp)</returns>
        [HttpGet("{assignmentId}/all-results")]
        public async Task<ActionResult<IEnumerable<StudentAssignmentResultDto>>> GetAllStudentResults(int assignmentId)
        {
            try
            {
                var assignment = await _context.Assignments
                    .Include(a => a.Curriculum)
                        .ThenInclude(c => c!.ParticipantStudents)
                    .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                var submissions = await _context.AssignmentSubmissions
                    .Where(s => s.AssignmentId == assignmentId)
                    .ToDictionaryAsync(s => s.StudentId);

                var activeStudents = assignment.Curriculum?.ParticipantStudents?.ToList() ?? new List<Student>();

                var isOverdue = DateTime.UtcNow > assignment.DueDate;

                var results = activeStudents.Select(s =>
                {
                    var submission = submissions.ContainsKey(s.StudentId) ? submissions[s.StudentId] : null;
                    
                    string status;
                    decimal? score = null;
                    string? note = null;

                    if (submission != null)
                    {
                        status = submission.Status;
                        score = submission.Score;
                        note = submission.Feedback; // We use Feedback to store the system/teacher note
                    }
                    else if (isOverdue)
                    {
                        status = "Overdue";
                        score = 0;
                        note = "Không nộp bài do quá hạn";
                    }
                    else
                    {
                        status = "Pending";
                    }

                    return new StudentAssignmentResultDto
                    {
                        StudentId = s.StudentId,
                        StudentName = s.FullName,
                        Email = s.Email,
                        SubmissionId = submission?.SubmissionId,
                        Status = status,
                        Score = score,
                        SubmittedAt = submission?.SubmittedAt,
                        Note = note
                    };
                }).OrderBy(r => r.StudentName).ToList();

                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Resets a student's submission and quiz attempts for an assignment. 
        /// (Reset lại bài làm và các lần thử quiz của sinh viên đối với mộ bài tập.)
        /// </summary>
        [HttpDelete("{assignmentId}/students/{studentId}/reset-submission")]
        public async Task<IActionResult> ResetStudentSubmission(int assignmentId, int studentId)
        {
            try
            {
                var submission = await _context.AssignmentSubmissions
                    .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId);

                if (submission != null)
                {
                    _context.AssignmentSubmissions.Remove(submission);
                }

                var attempts = await _context.StudentQuizAttempts
                    .Where(a => a.AssignmentId == assignmentId && a.StudentId == studentId)
                    .ToListAsync();

                if (attempts.Any())
                {
                    var attemptIds = attempts.Select(a => a.AttemptId).ToList();
                    var quizAnswers = await _context.StudentQuizAnswers
                        .Where(qa => attemptIds.Contains(qa.AttemptId))
                        .ToListAsync();
                    
                    if (quizAnswers.Any())
                    {
                        _context.StudentQuizAnswers.RemoveRange(quizAnswers);
                    }
                    
                    _context.StudentQuizAttempts.RemoveRange(attempts);
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Reset successful" });
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

                if (gradeDto.Score > submission.Assignment!.MaxScore)
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

                // AUTO CREATE/UPDATE GRADE RECORD
                // Check if assignment has skills
                int? skillIdToUse = submission.Assignment.SkillId;
                
                // If no direct SkillId, check AssignmentSkills
                if (!skillIdToUse.HasValue)
                {
                    var assignmentSkill = await _context.AssignmentSkills
                        .Where(ask => ask.AssignmentId == submission.AssignmentId)
                        .FirstOrDefaultAsync();
                    skillIdToUse = assignmentSkill?.SkillId;
                }

                // Only create Grade if we have a skill
                if (skillIdToUse.HasValue)
                {
                    // Check if grade already exists for this student-assignment-skill
                    var existingGrade = await _context.Grades
                        .Where(g => g.StudentId == submission.StudentId 
                                 && g.AssignmentId == submission.AssignmentId
                                 && g.SkillId == skillIdToUse.Value)
                        .FirstOrDefaultAsync();

                    if (existingGrade != null)
                    {
                        // Update existing grade
                        existingGrade.Score = (decimal)gradeDto.Score;
                        existingGrade.Comments = gradeDto.Feedback;
                        existingGrade.GradedAt = DateTime.UtcNow;
                        existingGrade.GradedBy = submission.GradedBy;
                        existingGrade.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        // Create new grade
                        var newGrade = new Grade
                        {
                            StudentId = submission.StudentId,
                            AssignmentId = submission.AssignmentId,
                            SkillId = skillIdToUse.Value,
                            Score = (decimal)gradeDto.Score,
                            MaxScore = submission.Assignment.MaxScore,
                            Comments = gradeDto.Feedback,
                            GradedAt = DateTime.UtcNow,
                            GradedBy = submission.GradedBy,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Grades.Add(newGrade);
                    }
                    await _context.SaveChangesAsync();
                }

                // Create notification for the student when graded
                var notification = new Notification
                {
                    StudentId = submission.StudentId,
                    Title = "Bài tập đã được chấm điểm",
                    Message = $"Bài '{submission.Assignment.Title}' của bạn đã được chấm điểm: {gradeDto.Score}/{submission.Assignment.MaxScore}",
                    Type = "AssignmentGraded",
                    RelatedId = submission.SubmissionId,
                    RelatedType = "Submission",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // CREATE ACTIVITY LOGS using service
                await _activityLogService.LogAssignmentGradedAsync(
                    teacherId: submission.GradedBy ?? 1, // Default to teacher ID 1 if null
                    studentId: submission.StudentId,
                    submissionId: submission.SubmissionId,
                    assignmentTitle: submission.Assignment!.Title,
                    score: gradeDto.Score
                );

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
                    StudentName = submission.Student != null ? submission.Student.FullName : string.Empty,
                    AssignmentTitle = submission.Assignment != null ? submission.Assignment.Title : string.Empty
                };

                return Ok(submissionDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets quiz questions for an assignment. (Lấy danh sách câu hỏi quiz của bài tập.)
        /// </summary>
        /// <param name="assignmentId">Assignment ID (ID bài tập)</param>
        /// <returns>List of quiz questions (Danh sách câu hỏi)</returns>
        [HttpGet("{assignmentId}/questions")]
        public async Task<ActionResult<List<QuizQuestionDto>>> GetQuizQuestions(int assignmentId)
        {
            try
            {
                var assignment = await _context.Assignments.FindAsync(assignmentId);
                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                var questions = await _context.QuizQuestions
                    .Where(q => q.AssignmentId == assignmentId)
                    .OrderBy(q => q.OrderIndex)
                    .Select(q => new QuizQuestionDto
                    {
                        QuestionId = q.QuestionId,
                        AssignmentId = q.AssignmentId,
                        QuestionText = q.QuestionText,
                        QuestionType = q.QuestionType,
                        OrderIndex = q.OrderIndex,
                        Points = q.Points,
                        Explanation = q.Explanation,
                        Answers = q.Answers.OrderBy(a => a.OrderIndex).Select(a => new QuizAnswerDto
                        {
                            AnswerId = a.AnswerId,
                            QuestionId = a.QuestionId,
                            AnswerText = a.AnswerText,
                            IsCorrect = a.IsCorrect,
                            OrderIndex = a.OrderIndex
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(questions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Creates a quiz question for an assignment. (Tạo câu hỏi quiz mới.)
        /// </summary>
        /// <param name="assignmentId">Assignment ID (ID bài tập)</param>
        /// <param name="createDto">Question data (Dữ liệu câu hỏi)</param>
        /// <returns>Created question (Câu hỏi đã tạo)</returns>
        [HttpPost("{assignmentId}/questions")]
        public async Task<ActionResult<QuizQuestionDto>> CreateQuizQuestion(int assignmentId, CreateQuizQuestionDto createDto)
        {
            try
            {
                var assignment = await _context.Assignments.FindAsync(assignmentId);
                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                // Validate that at least one answer is correct
                if (!createDto.Answers.Any(a => a.IsCorrect))
                {
                    return BadRequest(new { message = "At least one answer must be marked as correct" });
                }

                var question = new QuizQuestion
                {
                    AssignmentId = assignmentId,
                    QuestionText = createDto.QuestionText,
                    QuestionType = createDto.QuestionType,
                    OrderIndex = createDto.OrderIndex,
                    Points = createDto.Points,
                    Explanation = createDto.Explanation,
                    CreatedAt = DateTime.UtcNow
                };

                _context.QuizQuestions.Add(question);
                await _context.SaveChangesAsync();

                // Create answers
                foreach (var answerDto in createDto.Answers)
                {
                    var answer = new QuizAnswer
                    {
                        QuestionId = question.QuestionId,
                        AnswerText = answerDto.AnswerText,
                        IsCorrect = answerDto.IsCorrect,
                        OrderIndex = answerDto.OrderIndex,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.QuizAnswers.Add(answer);
                }

                await _context.SaveChangesAsync();

                // Update assignment MaxScore
                await UpdateAssignmentMaxScore(assignmentId);

                // Return created question with answers
                var questionDto = new QuizQuestionDto
                {
                    QuestionId = question.QuestionId,
                    AssignmentId = question.AssignmentId,
                    QuestionText = question.QuestionText,
                    QuestionType = question.QuestionType,
                    OrderIndex = question.OrderIndex,
                    Points = question.Points,
                    Explanation = question.Explanation,
                    Answers = await _context.QuizAnswers
                        .Where(a => a.QuestionId == question.QuestionId)
                        .OrderBy(a => a.OrderIndex)
                        .Select(a => new QuizAnswerDto
                        {
                            AnswerId = a.AnswerId,
                            QuestionId = a.QuestionId,
                            AnswerText = a.AnswerText,
                            IsCorrect = a.IsCorrect,
                            OrderIndex = a.OrderIndex
                        })
                        .ToListAsync()
                };

                return CreatedAtAction(nameof(GetQuizQuestions), new { assignmentId }, questionDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates a quiz question. (Cập nhật câu hỏi quiz.)
        /// </summary>
        /// <param name="questionId">Question ID (ID câu hỏi)</param>
        /// <param name="updateDto">Update data (Dữ liệu cập nhật)</param>
        /// <returns>Updated question (Câu hỏi đã cập nhật)</returns>
        [HttpPut("questions/{questionId}")]
        public async Task<ActionResult<QuizQuestionDto>> UpdateQuizQuestion(int questionId, UpdateQuizQuestionDto updateDto)
        {
            try
            {
                var question = await _context.QuizQuestions
                    .Include(q => q.Answers)
                    .FirstOrDefaultAsync(q => q.QuestionId == questionId);

                if (question == null)
                {
                    return NotFound(new { message = "Question not found" });
                }

                // Update question fields
                if (!string.IsNullOrEmpty(updateDto.QuestionText))
                    question.QuestionText = updateDto.QuestionText;

                if (!string.IsNullOrEmpty(updateDto.QuestionType))
                    question.QuestionType = updateDto.QuestionType;

                if (updateDto.OrderIndex.HasValue)
                    question.OrderIndex = updateDto.OrderIndex.Value;

                if (updateDto.Points.HasValue)
                    question.Points = updateDto.Points.Value;

                if (updateDto.Explanation != null)
                    question.Explanation = updateDto.Explanation;

                question.UpdatedAt = DateTime.UtcNow;

                // Update answers if provided
                if (updateDto.Answers != null && updateDto.Answers.Any())
                {
                    // Validate at least one correct answer
                    if (!updateDto.Answers.Any(a => a.IsCorrect == true))
                    {
                        return BadRequest(new { message = "At least one answer must be marked as correct" });
                    }

                    foreach (var answerDto in updateDto.Answers)
                    {
                        if (answerDto.AnswerId.HasValue)
                        {
                            // Update existing answer
                            var existingAnswer = question.Answers.FirstOrDefault(a => a.AnswerId == answerDto.AnswerId.Value);
                            if (existingAnswer != null)
                            {
                                if (!string.IsNullOrEmpty(answerDto.AnswerText))
                                    existingAnswer.AnswerText = answerDto.AnswerText;
                                if (answerDto.IsCorrect.HasValue)
                                    existingAnswer.IsCorrect = answerDto.IsCorrect.Value;
                                if (answerDto.OrderIndex.HasValue)
                                    existingAnswer.OrderIndex = answerDto.OrderIndex.Value;
                            }
                        }
                        else
                        {
                            // Create new answer
                            var newAnswer = new QuizAnswer
                            {
                                QuestionId = questionId,
                                AnswerText = answerDto.AnswerText ?? string.Empty,
                                IsCorrect = answerDto.IsCorrect ?? false,
                                OrderIndex = answerDto.OrderIndex ?? 0,
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.QuizAnswers.Add(newAnswer);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                // Update assignment MaxScore
                await UpdateAssignmentMaxScore(question.AssignmentId);

                // Return updated question
                var questionDto = new QuizQuestionDto
                {
                    QuestionId = question.QuestionId,
                    AssignmentId = question.AssignmentId,
                    QuestionText = question.QuestionText,
                    QuestionType = question.QuestionType,
                    OrderIndex = question.OrderIndex,
                    Points = question.Points,
                    Explanation = question.Explanation,
                    Answers = question.Answers.OrderBy(a => a.OrderIndex).Select(a => new QuizAnswerDto
                    {
                        AnswerId = a.AnswerId,
                        QuestionId = a.QuestionId,
                        AnswerText = a.AnswerText,
                        IsCorrect = a.IsCorrect,
                        OrderIndex = a.OrderIndex
                    }).ToList()
                };

                return Ok(questionDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates the MaxScore of an assignment based on total points of all questions.
        /// </summary>
        private async Task UpdateAssignmentMaxScore(int assignmentId)
        {
            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment != null && assignment.Type == "Quiz")
            {
                var totalPoints = await _context.QuizQuestions
                    .Where(q => q.AssignmentId == assignmentId)
                    .SumAsync(q => q.Points);
                
                assignment.MaxScore = (int)Math.Ceiling(totalPoints);
                await _context.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Submits a quiz and auto-grades it. (Nộp Quiz và tự động chấm điểm.)
        /// </summary>
        /// <param name="assignmentId">Assignment ID</param>
        /// <param name="dto">Student answers</param>
        /// <returns>Quiz result</returns>
        [HttpPost("{assignmentId}/submit-quiz")]
        public async Task<ActionResult<QuizResultDto>> SubmitQuiz(int assignmentId, SubmitQuizDto dto)
        {
            try
            {
                var assignment = await _context.Assignments
                    .Include(a => a.Curriculum)
                    .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);

                if (assignment == null)
                    return NotFound(new { message = "Assignment not found" });

                if (!string.Equals(assignment.Type, "Quiz", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { message = "This assignment is not a Quiz" });

                // Check deadline - không cho nộp nếu đã hết hạn và không cho phép nộp trễ
                var now = DateTime.UtcNow;
                if (now > assignment.DueDate && !assignment.AllowLateSubmission)
                {
                    return BadRequest(new { message = "Đã quá hạn nộp bài" });
                }

                var studentExists = await _context.Students.AnyAsync(s => s.StudentId == dto.StudentId);
                if (!studentExists)
                    return BadRequest(new { message = "Student not found" });

                // Ensure student is enrolled in the curriculum (basic guard)
                var enrolled = await _context.Curriculums
                    .Where(c => c.CurriculumId == assignment.CurriculumId)
                    .SelectMany(c => c.ParticipantStudents)
                    .AnyAsync(s => s.StudentId == dto.StudentId);
                if (!enrolled)
                    return Forbid();

                // Prevent duplicate submissions
                var existingSubmission = await _context.AssignmentSubmissions
                    .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == dto.StudentId);
                if (existingSubmission != null)
                {
                    var existingAttempt = await _context.StudentQuizAttempts
                        .Where(a => a.AssignmentId == assignmentId && a.StudentId == dto.StudentId && a.Status == "Completed")
                        .OrderByDescending(a => a.AttemptId)
                        .FirstOrDefaultAsync();

                    if (existingAttempt != null)
                    {
                        var existingResult = await BuildQuizResult(existingAttempt.AttemptId);
                        return Ok(existingResult);
                    }

                    return Conflict(new { message = "You have already submitted this quiz" });
                }

                // Load questions + answers
                var quizQuestions = await _context.QuizQuestions
                    .Include(q => q.Answers)
                    .Where(q => q.AssignmentId == assignmentId)
                    .OrderBy(q => q.OrderIndex)
                    .ToListAsync();

                if (quizQuestions.Count == 0)
                    return BadRequest(new { message = "Quiz has no questions" });

                // Create attempt
                var attempt = new StudentQuizAttempt
                {
                    AssignmentId = assignmentId,
                    StudentId = dto.StudentId,
                    StartedAt = dto.TimeSpentSeconds.HasValue ? now.AddSeconds(-dto.TimeSpentSeconds.Value) : now,
                    SubmittedAt = now,
                    TimeSpentSeconds = dto.TimeSpentSeconds,
                    Status = "Completed"
                };
                _context.StudentQuizAttempts.Add(attempt);
                await _context.SaveChangesAsync();

                // Grade
                var answerByQuestionId = dto.Answers
                    .GroupBy(a => a.QuestionId)
                    .ToDictionary(g => g.Key, g => g.First());

                decimal totalScore = 0;
                decimal maxScore = quizQuestions.Sum(q => q.Points);
                int correctCount = 0;

                var questionResults = new List<QuizQuestionResultDto>();

                foreach (var q in quizQuestions)
                {
                    answerByQuestionId.TryGetValue(q.QuestionId, out var submitted);
                    var selectedAnswerId = submitted?.SelectedAnswerId;

                    var correctAnswer = q.Answers.FirstOrDefault(a => a.IsCorrect);
                    var isCorrect = selectedAnswerId.HasValue && correctAnswer != null && correctAnswer.AnswerId == selectedAnswerId.Value;
                    var pointsEarned = isCorrect ? q.Points : 0;

                    if (isCorrect) correctCount++;
                    totalScore += pointsEarned;

                    _context.StudentQuizAnswers.Add(new StudentQuizAnswer
                    {
                        AttemptId = attempt.AttemptId,
                        QuestionId = q.QuestionId,
                        SelectedAnswerId = selectedAnswerId,
                        TextAnswer = submitted?.TextAnswer,
                        IsCorrect = isCorrect,
                        PointsEarned = pointsEarned,
                        AnsweredAt = DateTime.UtcNow
                    });

                    questionResults.Add(new QuizQuestionResultDto
                    {
                        QuestionId = q.QuestionId,
                        QuestionText = q.QuestionText,
                        Points = q.Points,
                        PointsEarned = pointsEarned,
                        IsCorrect = isCorrect,
                        Explanation = q.Explanation,
                        SelectedAnswerId = selectedAnswerId,
                        CorrectAnswerId = correctAnswer?.AnswerId,
                        AllAnswers = q.Answers
                            .OrderBy(a => a.OrderIndex)
                            .Select(a => new QuizAnswerResultDto
                            {
                                AnswerId = a.AnswerId,
                                AnswerText = a.AnswerText,
                                IsCorrect = a.IsCorrect
                            })
                            .ToList()
                    });
                }

                attempt.Score = totalScore;
                await _context.SaveChangesAsync();

                // Also create a submission record (so teacher dashboard/counts work)
                var submissionPayload = new
                {
                    attemptId = attempt.AttemptId,
                    assignmentId,
                    studentId = dto.StudentId,
                    answers = dto.Answers,
                    timeSpentSeconds = dto.TimeSpentSeconds
                };

                var submission = new AssignmentSubmission
                {
                    AssignmentId = assignmentId,
                    StudentId = dto.StudentId,
                    Content = JsonSerializer.Serialize(submissionPayload),
                    SubmittedAt = DateTime.UtcNow,
                    Status = "Graded",
                    Score = totalScore,
                    Feedback = dto.Note, // Store the reason/note here
                    GradedAt = DateTime.UtcNow,
                    GradedBy = assignment.TeacherId
                };
                _context.AssignmentSubmissions.Add(submission);

                // Activity log for student using service
                await _activityLogService.LogQuizSubmittedAsync(
                    studentId: dto.StudentId,
                    assignmentId: assignmentId,
                    quizTitle: assignment.Title
                );

                await _context.SaveChangesAsync();

                var result = new QuizResultDto
                {
                    AttemptId = attempt.AttemptId,
                    AssignmentId = assignmentId,
                    AssignmentTitle = assignment.Title,
                    Score = totalScore,
                    MaxScore = maxScore,
                    Percentage = maxScore <= 0 ? 0 : Math.Round((totalScore / maxScore) * 100, 2),
                    TotalQuestions = quizQuestions.Count,
                    CorrectAnswers = correctCount,
                    TimeSpentSeconds = attempt.TimeSpentSeconds ?? 0,
                    SubmittedAt = attempt.SubmittedAt ?? DateTime.UtcNow,
                    QuestionResults = questionResults
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets the latest quiz result for a student. (Lấy kết quả Quiz gần nhất của học viên.)
        /// </summary>
        [HttpGet("{assignmentId}/quiz-result")]
        public async Task<ActionResult<QuizResultDto>> GetQuizResult(int assignmentId, [FromQuery] int studentId)
        {
            try
            {
                var assignment = await _context.Assignments.FindAsync(assignmentId);
                if (assignment == null)
                    return NotFound(new { message = "Assignment not found" });

                if (!string.Equals(assignment.Type, "Quiz", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { message = "This assignment is not a Quiz" });

                var attempt = await _context.StudentQuizAttempts
                    .Where(a => a.AssignmentId == assignmentId && a.StudentId == studentId && a.Status == "Completed")
                    .OrderByDescending(a => a.AttemptId)
                    .FirstOrDefaultAsync();

                if (attempt == null)
                    return NotFound(new { message = "Quiz result not found" });

                var result = await BuildQuizResult(attempt.AttemptId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        private async Task<QuizResultDto> BuildQuizResult(int attemptId)
        {
            var attempt = await _context.StudentQuizAttempts
                .Include(a => a.Assignment)
                .FirstAsync(a => a.AttemptId == attemptId);

            var questions = await _context.QuizQuestions
                .Include(q => q.Answers)
                .Where(q => q.AssignmentId == attempt.AssignmentId)
                .OrderBy(q => q.OrderIndex)
                .ToListAsync();

            var studentAnswers = await _context.StudentQuizAnswers
                .Where(sa => sa.AttemptId == attemptId)
                .ToListAsync();

            var answerMap = studentAnswers.ToDictionary(a => a.QuestionId, a => a);

            decimal maxScore = questions.Sum(q => q.Points);
            int correctCount = studentAnswers.Count(a => a.IsCorrect);

            var questionResults = new List<QuizQuestionResultDto>();
            foreach (var q in questions)
            {
                answerMap.TryGetValue(q.QuestionId, out var sa);
                var correctAnswer = q.Answers.FirstOrDefault(a => a.IsCorrect);

                questionResults.Add(new QuizQuestionResultDto
                {
                    QuestionId = q.QuestionId,
                    QuestionText = q.QuestionText,
                    Points = q.Points,
                    PointsEarned = sa?.PointsEarned ?? 0,
                    IsCorrect = sa?.IsCorrect ?? false,
                    Explanation = q.Explanation,
                    SelectedAnswerId = sa?.SelectedAnswerId,
                    CorrectAnswerId = correctAnswer?.AnswerId,
                    AllAnswers = q.Answers
                        .OrderBy(a => a.OrderIndex)
                        .Select(a => new QuizAnswerResultDto
                        {
                            AnswerId = a.AnswerId,
                            AnswerText = a.AnswerText,
                            IsCorrect = a.IsCorrect
                        })
                        .ToList()
                });
            }

            var score = attempt.Score ?? studentAnswers.Sum(a => a.PointsEarned);

            return new QuizResultDto
            {
                AttemptId = attempt.AttemptId,
                AssignmentId = attempt.AssignmentId,
                AssignmentTitle = attempt.Assignment?.Title ?? string.Empty,
                Score = score,
                MaxScore = maxScore,
                Percentage = maxScore <= 0 ? 0 : Math.Round((score / maxScore) * 100, 2),
                TotalQuestions = questions.Count,
                CorrectAnswers = correctCount,
                TimeSpentSeconds = attempt.TimeSpentSeconds ?? 0,
                SubmittedAt = attempt.SubmittedAt ?? DateTime.UtcNow,
                QuestionResults = questionResults
            };
        }

        /// <summary>
        /// Deletes a quiz question. (Xóa câu hỏi quiz.)
        /// </summary>
        /// <param name="questionId">Question ID (ID câu hỏi)</param>
        /// <returns>Delete result (Kết quả xóa)</returns>
        [HttpDelete("questions/{questionId}")]
        public async Task<ActionResult> DeleteQuizQuestion(int questionId)
        {
            try
            {
                var question = await _context.QuizQuestions.FindAsync(questionId);
                if (question == null)
                {
                    return NotFound(new { message = "Question not found" });
                }

                _context.QuizQuestions.Remove(question);
                await _context.SaveChangesAsync();

                // Update assignment MaxScore
                await UpdateAssignmentMaxScore(question.AssignmentId);

                return Ok(new { message = "Question deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a quiz answer. (Xóa đáp án.)
        /// </summary>
        /// <param name="answerId">Answer ID (ID đáp án)</param>
        /// <returns>Delete result (Kết quả xóa)</returns>
        [HttpDelete("answers/{answerId}")]
        public async Task<ActionResult> DeleteQuizAnswer(int answerId)
        {
            try
            {
                var answer = await _context.QuizAnswers.FindAsync(answerId);
                if (answer == null)
                {
                    return NotFound(new { message = "Answer not found" });
                }

                _context.QuizAnswers.Remove(answer);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Answer deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Downloads a submission file.
        /// (Tải xuống file bài nộp.)
        /// </summary>
        /// <param name="submissionId">Submission ID (ID bài nộp)</param>
        /// <returns>File content (Nội dung file)</returns>
        [HttpGet("submissions/{submissionId}/download")]
        public async Task<IActionResult> DownloadSubmissionFile(int submissionId)
        {
            try
            {
                var submission = await _context.AssignmentSubmissions
                    .FirstOrDefaultAsync(s => s.SubmissionId == submissionId);

                if (submission == null || string.IsNullOrEmpty(submission.AttachmentUrl))
                {
                    return NotFound(new { message = "File not found" });
                }

                var filePath = Path.Combine(_environment.WebRootPath, submission.AttachmentUrl.TrimStart('/'));
                
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { message = "File not found on server" });
                }

                var mimeType = GetMimeType(filePath);
                var fileName = submission.OriginalFileName ?? Path.GetFileName(filePath);

                return PhysicalFile(filePath, mimeType, fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error downloading file", error = ex.Message });
            }
        }

        private string GetMimeType(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".txt" => "text/plain",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".mp3" => "audio/mpeg",
                ".mp4" => "video/mp4",
                _ => "application/octet-stream"
            };
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value
                ?? User.FindFirst("id")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                return userId;

            return null;
        }
    }
}

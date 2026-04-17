using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.API.Services
{
    /// <summary>
    /// Service for managing activity logs - Centralized activity tracking implementation
    /// </summary>
    public class ActivityLogService : IActivityLogService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ActivityLogService> _logger;

        public ActivityLogService(ApplicationDbContext context, ILogger<ActivityLogService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogActivityAsync(int? userId, int? teacherId, int? studentId, string action, 
            string title, string description, int? targetId = null, string? targetType = null, 
            string? metadata = null)
        {
            try
            {
                var activityLog = new ActivityLog
                {
                    UserId = userId,
                    TeacherId = teacherId,
                    StudentId = studentId,
                    Action = action,
                    Title = title,
                    Description = description,
                    IconType = GetDefaultIcon(action),
                    Color = GetDefaultColor(action),
                    TargetId = targetId,
                    TargetType = targetType,
                    Metadata = metadata,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();

                _logger.LogDebug("Activity logged: {Action} by {UserId}/{TeacherId}/{StudentId}", 
                    action, userId, teacherId, studentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log activity: {Action} for {UserId}/{TeacherId}/{StudentId}", 
                    action, userId, teacherId, studentId);
            }
        }

        public async Task LogAssignmentCreatedAsync(int teacherId, int assignmentId, string assignmentTitle)
        {
            await LogActivityAsync(
                userId: null,
                teacherId: teacherId,
                studentId: null,
                action: "CREATE_ASSIGNMENT",
                title: "Tạo bài tập mới",
                description: $"Đã tạo bài tập: {assignmentTitle}",
                targetId: assignmentId,
                targetType: "Assignment"
            );
        }

        public async Task LogAssignmentSubmittedAsync(int studentId, int submissionId, string assignmentTitle)
        {
            await LogActivityAsync(
                userId: null,
                teacherId: null,
                studentId: studentId,
                action: "SUBMIT_ASSIGNMENT",
                title: "Nộp bài tập",
                description: $"Đã nộp bài tập: {assignmentTitle}",
                targetId: submissionId,
                targetType: "Submission"
            );
        }

        public async Task LogAssignmentGradedAsync(int teacherId, int studentId, int submissionId, string assignmentTitle, decimal score)
        {
            // Log for teacher
            await LogActivityAsync(
                userId: null,
                teacherId: teacherId,
                studentId: null,
                action: "GRADE_SUBMISSION",
                title: "Chấm điểm bài tập",
                description: $"Đã chấm điểm bài tập {assignmentTitle} với điểm {score}",
                targetId: submissionId,
                targetType: "Submission"
            );

            // Log for student
            await LogActivityAsync(
                userId: null,
                teacherId: null,
                studentId: studentId,
                action: "ASSIGNMENT_GRADED",
                title: "Nhận điểm bài tập",
                description: $"Nhận điểm {score} cho bài tập {assignmentTitle}",
                targetId: submissionId,
                targetType: "Submission"
            );
        }

        public async Task LogQuizSubmittedAsync(int studentId, int assignmentId, string quizTitle)
        {
            await LogActivityAsync(
                userId: null,
                teacherId: null,
                studentId: studentId,
                action: "SUBMIT_QUIZ",
                title: "Làm bài kiểm tra",
                description: $"Đã hoàn thành bài kiểm tra: {quizTitle}",
                targetId: assignmentId,
                targetType: "Assignment"
            );
        }

        public async Task LogStudentEnrolledAsync(int studentId, int curriculumId, string curriculumName)
        {
            await LogActivityAsync(
                userId: null,
                teacherId: null,
                studentId: studentId,
                action: "ENROLL_CLASS",
                title: "Ghi danh lớp học",
                description: $"Đã ghi danh vào lớp: {curriculumName}",
                targetId: curriculumId,
                targetType: "Curriculum"
            );
        }

        public async Task LogPaymentCompletedAsync(int studentId, int paymentId, decimal amount)
        {
            await LogActivityAsync(
                userId: null,
                teacherId: null,
                studentId: studentId,
                action: "PAYMENT",
                title: "Thanh toán học phí",
                description: $"Đã thanh toán học phí: {amount:N0} VND",
                targetId: paymentId,
                targetType: "Payment"
            );
        }

        public async Task LogDocumentUploadedAsync(int teacherId, int documentId, string documentTitle)
        {
            await LogActivityAsync(
                userId: null,
                teacherId: teacherId,
                studentId: null,
                action: "UPLOAD_DOCUMENT",
                title: "Tải lên tài liệu",
                description: $"Đã tải lên tài liệu: {documentTitle}",
                targetId: documentId,
                targetType: "Document"
            );
        }

        public async Task LogDocumentDownloadedAsync(int userId, int documentId, string documentTitle)
        {
            await LogActivityAsync(
                userId: userId,
                teacherId: null,
                studentId: null,
                action: "DOWNLOAD_DOCUMENT",
                title: "Tải tài liệu",
                description: $"Đã tải tài liệu: {documentTitle}",
                targetId: documentId,
                targetType: "Document"
            );
        }

        public async Task LogAttendanceRecordedAsync(int teacherId, int studentId, int sessionId, string sessionName)
        {
            // Log for teacher
            await LogActivityAsync(
                userId: null,
                teacherId: teacherId,
                studentId: null,
                action: "RECORD_ATTENDANCE",
                title: "Điểm danh",
                description: $"Đã điểm danh cho buổi học: {sessionName}",
                targetId: sessionId,
                targetType: "Session"
            );

            // Log for student
            await LogActivityAsync(
                userId: null,
                teacherId: null,
                studentId: studentId,
                action: "ATTENDANCE",
                title: "Có mặt",
                description: $"Đã điểm danh buổi học: {sessionName}",
                targetId: sessionId,
                targetType: "Session"
            );
        }

        private string GetDefaultIcon(string action)
        {
            return action?.ToLower() switch
            {
                "create_assignment" => "assignment",
                "submit_assignment" => "assignment_turned_in",
                "grade_submission" or "assignment_graded" => "grading",
                "submit_quiz" => "quiz",
                "enroll_class" => "group_add",
                "payment" => "payments",
                "upload_document" => "upload_file",
                "download_document" => "download",
                "record_attendance" or "attendance" => "check_circle",
                "view_lesson" => "menu_book",
                _ => "default"
            };
        }

        private string GetDefaultColor(string action)
        {
            return action?.ToLower() switch
            {
                "create_assignment" => "success",
                "submit_assignment" => "info",
                "grade_submission" or "assignment_graded" => "warning",
                "submit_quiz" => "secondary",
                "enroll_class" => "success",
                "payment" => "success",
                "upload_document" => "primary",
                "download_document" => "info",
                "record_attendance" or "attendance" => "info",
                "view_lesson" => "primary",
                _ => "default"
            };
        }
    }
}

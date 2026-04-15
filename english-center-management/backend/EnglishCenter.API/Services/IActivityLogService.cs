using EnglishCenter.API.Models;

namespace EnglishCenter.API.Services
{
    /// <summary>
    /// Service for managing activity logs - Centralized activity tracking
    /// </summary>
    public interface IActivityLogService
    {
        /// <summary>
        /// Log an activity for a user
        /// </summary>
        Task LogActivityAsync(int? userId, int? teacherId, int? studentId, string action, 
            string title, string description, int? targetId = null, string? targetType = null, 
            string? metadata = null);

        /// <summary>
        /// Log assignment creation
        /// </summary>
        Task LogAssignmentCreatedAsync(int teacherId, int assignmentId, string assignmentTitle);

        /// <summary>
        /// Log assignment submission
        /// </summary>
        Task LogAssignmentSubmittedAsync(int studentId, int submissionId, string assignmentTitle);

        /// <summary>
        /// Log assignment grading
        /// </summary>
        Task LogAssignmentGradedAsync(int teacherId, int studentId, int submissionId, string assignmentTitle, decimal score);

        /// <summary>
        /// Log quiz submission
        /// </summary>
        Task LogQuizSubmittedAsync(int studentId, int assignmentId, string quizTitle);

        /// <summary>
        /// Log student enrollment
        /// </summary>
        Task LogStudentEnrolledAsync(int studentId, int curriculumId, string curriculumName);

        /// <summary>
        /// Log payment completion
        /// </summary>
        Task LogPaymentCompletedAsync(int studentId, int paymentId, decimal amount);

        /// <summary>
        /// Log document upload
        /// </summary>
        Task LogDocumentUploadedAsync(int teacherId, int documentId, string documentTitle);

        /// <summary>
        /// Log document download
        /// </summary>
        Task LogDocumentDownloadedAsync(int userId, int documentId, string documentTitle);

        /// <summary>
        /// Log attendance
        /// </summary>
        Task LogAttendanceRecordedAsync(int teacherId, int studentId, int sessionId, string sessionName);
    }
}

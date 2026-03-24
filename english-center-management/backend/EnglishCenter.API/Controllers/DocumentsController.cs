using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Services;
using System.Security.Claims;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<DocumentsController> _logger;
        private readonly IAuthService _authService;

        public DocumentsController(
            ApplicationDbContext context,
            IWebHostEnvironment environment,
            ILogger<DocumentsController> logger,
            IAuthService authService)
        {
            _context = context;
            _environment = environment;
            _logger = logger;
            _authService = authService;
        }

        /// <summary>
        /// Gets all documents (Admin only). (Lấy tất cả tài liệu - Admin.)
        /// </summary>
        /// <param name="search">Search term (Tìm kiếm)</param>
        /// <param name="type">Document type (Loại tài liệu)</param>
        /// <param name="teacherId">Teacher ID (ID giáo viên)</param>
        /// <param name="classId">Class ID (ID lớp học)</param>
        /// <param name="date">Upload date (Ngày tải lên)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paged list of documents (Danh sách tài liệu phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<DocumentDto>>> GetAllDocuments(
            [FromQuery] string? search = null,
            [FromQuery] string? type = null,
            [FromQuery] int? teacherId = null,
            [FromQuery] int? classId = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Check if user is admin
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var currentUser = await _authService.GetCurrentUserAsync(userId);
                if (currentUser == null || currentUser.Role?.ToLower() != "admin")
                {
                    return Forbid("Chỉ admin mới có thể xem tất cả tài liệu hệ thống");
                }

                var query = _context.Documents.AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(d => d.Title.Contains(search) || d.Description.Contains(search));
                }

                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(d => d.Type == type);
                }

                if (teacherId.HasValue)
                {
                    query = query.Where(d => d.TeacherId == teacherId.Value);
                }

                if (classId.HasValue)
                {
                    query = query.Where(d => d.ClassId == classId.Value);
                }

                if (date.HasValue)
                {
                    query = query.Where(d => d.UploadDate.Date == date.Value.Date);
                }

                var totalCount = await query.CountAsync();

                var documents = await query
                    .Include(d => d.Class)
                    .Include(d => d.Teacher)
                    .OrderByDescending(d => d.UploadDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new DocumentDto
                    {
                        DocumentId = d.DocumentId,
                        Title = d.Title,
                        Description = d.Description,
                        Type = d.Type,
                        FileName = d.FileName,
                        OriginalFileName = d.OriginalFileName,
                        FileSize = d.FileSize,
                        FilePath = d.FilePath,
                        UploadDate = d.UploadDate,
                        DownloadCount = d.DownloadCount,
                        TeacherId = d.TeacherId,
                        ClassId = d.ClassId,
                        ClassName = d.Class != null ? d.Class.ClassName : null,
                        TeacherName = d.Teacher != null ? d.Teacher.FullName : null
                    })
                    .ToListAsync();

                return Ok(new PagedResult<DocumentDto>
                {
                    Data = documents,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all documents");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tải danh sách tài liệu" });
            }
        }

        /// <summary>
        /// Gets all documents for a student. (Lấy tất cả tài liệu của sinh viên.)
        /// </summary>
        /// <param name="studentId">Student ID (ID sinh viên)</param>
        /// <param name="search">Search term (Tìm kiếm)</param>
        /// <param name="type">Document type (Loại tài liệu)</param>
        /// <param name="classId">Class ID (ID lớp học)</param>
        /// <param name="date">Upload date (Ngày tải lên)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paged list of documents (Danh sách tài liệu phân trang)</returns>
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<PagedResult<DocumentDto>>> GetStudentDocuments(
            int studentId,
            [FromQuery] string? search = null,
            [FromQuery] string? type = null,
            [FromQuery] int? classId = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Get active enrollments for this student
                var activeEnrollments = await _context.Enrollments
                    .Where(e => e.StudentId == studentId && e.Status == "Active")
                    .Select(e => e.ClassId)
                    .ToListAsync();

                if (!activeEnrollments.Any())
                {
                    return Ok(new PagedResult<DocumentDto>
                    {
                        Data = new List<DocumentDto>(),
                        TotalCount = 0,
                        Page = page,
                        PageSize = pageSize,
                        TotalPages = 0
                    });
                }

                var query = _context.Documents
                    .Include(d => d.Class)
                    .Include(d => d.Teacher)
                    .Where(d => activeEnrollments.Contains(d.ClassId.Value));

                // Apply filters
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(d => d.Title.Contains(search) || d.Description.Contains(search));
                }

                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(d => d.Type == type);
                }

                if (classId.HasValue)
                {
                    query = query.Where(d => d.ClassId == classId.Value);
                }

                if (date.HasValue)
                {
                    query = query.Where(d => d.UploadDate.Date == date.Value.Date);
                }

                var totalCount = await query.CountAsync();

                var documents = await query
                    .OrderByDescending(d => d.UploadDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new DocumentDto
                    {
                        DocumentId = d.DocumentId,
                        Title = d.Title,
                        Description = d.Description,
                        Type = d.Type,
                        FileName = d.FileName,
                        OriginalFileName = d.OriginalFileName,
                        FileSize = d.FileSize,
                        FilePath = d.FilePath,
                        UploadDate = d.UploadDate,
                        DownloadCount = d.DownloadCount,
                        TeacherId = d.TeacherId,
                        ClassId = d.ClassId,
                        ClassName = d.Class != null ? d.Class.ClassName : null,
                        TeacherName = d.Teacher != null ? d.Teacher.FullName : null
                    })
                    .ToListAsync();

                return Ok(new PagedResult<DocumentDto>
                {
                    Data = documents,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving student documents");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tải danh sách tài liệu" });
            }
        }

        /// <summary>
        /// Gets all documents for a teacher. (Lấy tất cả tài liệu của giáo viên.)
        /// </summary>
        /// <param name="teacherId">Teacher ID (ID giáo viên)</param>
        /// <param name="search">Search term (Tìm kiếm)</param>
        /// <param name="type">Document type (Loại tài liệu)</param>
        /// <param name="classId">Class ID (ID lớp học)</param>
        /// <param name="date">Upload date (Ngày tải lên)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paged list of documents (Danh sách tài liệu phân trang)</returns>
        [HttpGet("teacher/{teacherId}")]
        public async Task<ActionResult<PagedResult<DocumentDto>>> GetTeacherDocuments(
            int teacherId,
            [FromQuery] string? search = null,
            [FromQuery] string? type = null,
            [FromQuery] int? classId = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.Documents.AsQueryable();

                // Filter by teacher ID - assuming there's a TeacherId field in Document
                query = query.Where(d => d.TeacherId == teacherId);

                // Apply filters
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(d => d.Title.Contains(search) || d.Description.Contains(search));
                }

                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(d => d.Type == type);
                }

                if (classId.HasValue)
                {
                    query = query.Where(d => d.ClassId == classId.Value);
                }

                if (date.HasValue)
                {
                    query = query.Where(d => d.UploadDate.Date == date.Value.Date);
                }

                var totalCount = await query.CountAsync();

                var documents = await query
                    .Include(d => d.Class)
                    .OrderByDescending(d => d.UploadDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new DocumentDto
                    {
                        DocumentId = d.DocumentId,
                        Title = d.Title,
                        Description = d.Description,
                        Type = d.Type,
                        FileName = d.FileName,
                        OriginalFileName = d.OriginalFileName,
                        FileSize = d.FileSize,
                        FilePath = d.FilePath,
                        UploadDate = d.UploadDate,
                        DownloadCount = d.DownloadCount,
                        TeacherId = d.TeacherId,
                        ClassId = d.ClassId,
                        ClassName = d.Class != null ? d.Class.ClassName : null
                    })
                    .ToListAsync();

                return Ok(new PagedResult<DocumentDto>
                {
                    Data = documents,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving teacher documents");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tải danh sách tài liệu" });
            }
        }

        /// <summary>
        /// Uploads a new document. (Tải lên tài liệu mới.)
        /// </summary>
        /// <param name="file">File to upload (File cần tải)</param>
        /// <param name="title">Document title (Tiêu đề tài liệu)</param>
        /// <param name="description">Document description (Mô tả tài liệu)</param>
        /// <param name="type">Document type (Loại tài liệu)</param>
        /// <param name="classId">Class ID (ID lớp học)</param>
        /// <param name="teacherId">Teacher ID (ID giáo viên - optional for admin)</param>
        /// <returns>Uploaded document info (Thông tin tài liệu đã tải)</returns>
        [HttpPost("upload")]
        public async Task<ActionResult<DocumentDto>> UploadDocument(
            [FromForm] IFormFile file,
            [FromForm] string title,
            [FromForm] string description,
            [FromForm] string type,
            [FromForm] int? classId = null,
            [FromForm] int? teacherId = null)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "Không có file được chọn" });
                }

                if (string.IsNullOrEmpty(title))
                {
                    return BadRequest(new { message = "Tiêu đề tài liệu không được để trống" });
                }

                // Get current user from token
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var currentUser = await _authService.GetCurrentUserAsync(userId);
                if (currentUser == null)
                {
                    return Unauthorized(new { message = "Không xác định được người dùng" });
                }

                // Determine teacherId based on user role
                int finalTeacherId;
                if (currentUser.Role?.ToLower() == "admin")
                {
                    // Admin can upload for any teacher, or if not specified, assign to first teacher or leave null
                    if (teacherId.HasValue)
                    {
                        // Validate the specified teacher exists
                        var teacher = await _context.Teachers.FindAsync(teacherId.Value);
                        if (teacher == null)
                        {
                            return BadRequest(new { message = "Giáo viên không tồn tại" });
                        }
                        finalTeacherId = teacherId.Value;
                    }
                    else
                    {
                        // For admin uploads without teacherId, assign to a default teacher or leave null
                        // Let's assign to the first active teacher, or if none exists, return error
                        var firstTeacher = await _context.Teachers.FirstOrDefaultAsync(t => t.IsActive);
                        if (firstTeacher == null)
                        {
                            return BadRequest(new { message = "Không có giáo viên nào trong hệ thống để gán tài liệu" });
                        }
                        finalTeacherId = firstTeacher.TeacherId;
                    }
                }
                else
                {
                    // Non-admin users can only upload for themselves
                    if (teacherId.HasValue && teacherId.Value != currentUser.UserId)
                    {
                        return Forbid("Bạn chỉ có thể upload tài liệu cho chính mình");
                    }
                    
                    // Use teacherId from form if provided and valid, otherwise look up by UserId
                    if (teacherId.HasValue)
                    {
                        // Validate the specified teacher exists
                        var teacher = await _context.Teachers.FindAsync(teacherId.Value);
                        if (teacher == null)
                        {
                            return BadRequest(new { message = "Giáo viên không tồn tại" });
                        }
                        finalTeacherId = teacherId.Value;
                    }
                    else
                    {
                        // Get teacher record for this user
                        var userTeacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);
                        if (userTeacher == null)
                        {
                            return BadRequest(new { message = "Không tìm thấy thông tin giáo viên cho người dùng này" });
                        }
                        finalTeacherId = userTeacher.TeacherId;
                    }
                }

                // Validate class exists if provided
                if (classId.HasValue)
                {
                    var cls = await _context.Classes.FindAsync(classId.Value);
                    if (cls == null)
                    {
                        return BadRequest(new { message = "Lớp học không tồn tại" });
                    }
                }

                // Validate file type
                var allowedExtensions = new[] { ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".mp3", ".mp4", ".avi", ".jpg", ".jpeg", ".png", ".gif" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { message = "Loại file không được hỗ trợ. Chỉ chấp nhận: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, MP3, MP4, AVI, JPG, JPEG, PNG, GIF" });
                }

                // Validate file size (max 50MB)
                if (file.Length > 50 * 1024 * 1024)
                {
                    return BadRequest(new { message = "Kích thước file không được vượt quá 50MB" });
                }

                // Create uploads directory if it doesn't exist
                var webRootPath = _environment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
                    if (!Directory.Exists(webRootPath))
                    {
                        Directory.CreateDirectory(webRootPath);
                    }
                }
                
                var uploadsFolder = Path.Combine(webRootPath, "uploads", "documents");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate unique filename
                var uniqueFileName = Guid.NewGuid().ToString() + fileExtension;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Create document record
                var document = new Document
                {
                    Title = title,
                    Description = description,
                    Type = type,
                    FileName = uniqueFileName,
                    OriginalFileName = file.FileName,
                    FileSize = file.Length,
                    FilePath = $"/uploads/documents/{uniqueFileName}",
                    UploadDate = DateTime.Now,
                    DownloadCount = 0,
                    TeacherId = finalTeacherId,
                    ClassId = classId
                };

                _context.Documents.Add(document);
                await _context.SaveChangesAsync();

                // Return document info
                var documentDto = new DocumentDto
                {
                    DocumentId = document.DocumentId,
                    Title = document.Title,
                    Description = document.Description,
                    Type = document.Type,
                    FileName = document.FileName,
                    OriginalFileName = document.OriginalFileName,
                    FileSize = document.FileSize,
                    FilePath = document.FilePath,
                    UploadDate = document.UploadDate,
                    DownloadCount = document.DownloadCount,
                    TeacherId = document.TeacherId,
                    ClassId = document.ClassId
                };

                _logger.LogInformation($"Document uploaded successfully: {document.DocumentId} - {document.Title} by User {currentUser.UserId} for Teacher {finalTeacherId}");

                return Ok(documentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading document");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tải lên tài liệu" });
            }
        }

        /// <summary>
        /// Downloads a document. (Tải xuống tài liệu.)
        /// </summary>
        /// <param name="id">Document ID (ID tài liệu)</param>
        /// <returns>File content (Nội dung file)</returns>
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            try
            {
                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                {
                    return NotFound(new { message = "Không tìm thấy tài liệu" });
                }

                var webRootPath = _environment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
                }

                var filePath = Path.Combine(webRootPath, "uploads", "documents", document.FileName);
                
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { message = "File không tồn tại trên server" });
                }

                // Update download count
                document.DownloadCount++;
                await _context.SaveChangesAsync();

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var contentType = GetContentType(document.FileName);

                Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{document.OriginalFileName}\"");
                
                return File(fileBytes, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading document");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tải xuống tài liệu" });
            }
        }

        /// <summary>
        /// Updates a document. (Cập nhật tài liệu.)
        /// </summary>
        /// <param name="id">Document ID (ID tài liệu)</param>
        /// <param name="request">Update request (Yêu cầu cập nhật)</param>
        /// <returns>Updated document info (Thông tin tài liệu đã cập nhật)</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<DocumentDto>> UpdateDocument(int id, [FromBody] UpdateDocumentDto request)
        {
            try
            {
                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                {
                    return NotFound(new { message = "Không tìm thấy tài liệu" });
                }

                // Get current user from token
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var currentUser = await _authService.GetCurrentUserAsync(userId);
                if (currentUser == null)
                {
                    return Unauthorized(new { message = "Không xác định được người dùng" });
                }

                // Check permission: only admin or the owner teacher can update
                if (currentUser.Role?.ToLower() != "admin" && document.TeacherId != currentUser.UserId)
                {
                    var userTeacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);
                    if (userTeacher == null || document.TeacherId != userTeacher.TeacherId)
                    {
                        return Forbid("Bạn không có quyền cập nhật tài liệu này");
                    }
                }

                // Update fields
                if (!string.IsNullOrEmpty(request.Title))
                {
                    document.Title = request.Title;
                }

                if (!string.IsNullOrEmpty(request.Description))
                {
                    document.Description = request.Description;
                }

                if (!string.IsNullOrEmpty(request.Type))
                {
                    document.Type = request.Type;
                }

                if (request.ClassId.HasValue)
                {
                    // Validate class exists
                    var cls = await _context.Classes.FindAsync(request.ClassId.Value);
                    if (cls == null)
                    {
                        return BadRequest(new { message = "Lớp học không tồn tại" });
                    }
                    document.ClassId = request.ClassId.Value;
                }

                await _context.SaveChangesAsync();

                // Return updated document
                var documentDto = new DocumentDto
                {
                    DocumentId = document.DocumentId,
                    Title = document.Title,
                    Description = document.Description,
                    Type = document.Type,
                    FileName = document.FileName,
                    OriginalFileName = document.OriginalFileName,
                    FileSize = document.FileSize,
                    FilePath = document.FilePath,
                    UploadDate = document.UploadDate,
                    DownloadCount = document.DownloadCount,
                    TeacherId = document.TeacherId,
                    ClassId = document.ClassId
                };

                _logger.LogInformation($"Document updated successfully: {document.DocumentId} - {document.Title}");

                return Ok(documentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating document");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật tài liệu" });
            }
        }

        /// <summary>
        /// Deletes a document. (Xóa tài liệu.)
        /// </summary>
        /// <param name="id">Document ID (ID tài liệu)</param>
        /// <returns>No Content</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            try
            {
                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                {
                    return NotFound(new { message = "Không tìm thấy tài liệu" });
                }

                // Delete physical file
                var webRootPath = _environment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
                }

                var filePath = Path.Combine(webRootPath, "uploads", "documents", document.FileName);
                
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                // Delete database record
                _context.Documents.Remove(document);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Document deleted successfully: {document.DocumentId} - {document.Title}");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting document");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa tài liệu" });
            }
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".txt" => "text/plain",
                ".mp3" => "audio/mpeg",
                ".mp4" => "video/mp4",
                ".avi" => "video/x-msvideo",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                _ => "application/octet-stream"
            };
        }
    }
}

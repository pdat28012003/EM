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
        /// <param name="curriculumId">Curriculum ID (ID chương trình học)</param>
        /// <param name="date">Upload date (Ngày tải lên)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paged list of documents (Danh sách tài liệu phân trang)</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<DocumentDto>>> GetAllDocuments(
            [FromQuery] string? search = null,
            [FromQuery] string? type = null,
            [FromQuery] int? curriculumId = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Check if user is admin - try both JWT "nameid" and standard NameIdentifier claim
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("nameid");
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Không xác định được người dùng" });
                }

                var currentUser = await _authService.GetCurrentUserAsync(userId);
                if (currentUser == null || currentUser.Role?.ToLower() != "admin")
                {
                    return Forbid("Chỉ admin mới có thể xem tất cả tài liệu hệ thống");
                }

                var query = _context.Documents.AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(d => d.OriginalFileName.Contains(search) || d.FileName.Contains(search));
                }

                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(d => d.Type == type);
                }

                if (curriculumId.HasValue)
                {
                    query = query.Where(d => d.CurriculumId == curriculumId.Value);
                }

                if (date.HasValue)
                {
                    query = query.Where(d => d.UploadDate.Date == date.Value.Date);
                }

                var totalCount = await query.CountAsync();

                var documents = await query
                    .Include(d => d.Curriculum)
                    .OrderByDescending(d => d.UploadDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new DocumentDto
                    {
                        DocumentId = d.DocumentId,
                        Type = d.Type,
                        FileName = d.FileName,
                        OriginalFileName = d.OriginalFileName,
                        FileSize = d.FileSize,
                        FilePath = d.FilePath,
                        UploadDate = d.UploadDate,
                        DownloadCount = d.DownloadCount,
                        CurriculumId = d.CurriculumId,
                        CurriculumName = d.Curriculum != null ? d.Curriculum.CurriculumName : null
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
                _logger.LogError(ex, "Error retrieving all documents: {Message}", ex.Message);
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tải danh sách tài liệu", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        /// <summary>
        /// Gets all documents for a student. (Lấy tất cả tài liệu cho sinh viên.)
        /// Documents are now standalone resources.
        /// </summary>
        /// <param name="studentId">Student ID (ID sinh viên)</param>
        /// <param name="search">Search term (Tìm kiếm)</param>
        /// <param name="type">Document type (Loại tài liệu)</param>
        /// <param name="curriculumId">Curriculum ID (ID chương trình học)</param>
        /// <param name="date">Upload date (Ngày tải lên)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paged list of documents (Danh sách tài liệu phân trang)</returns>
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<PagedResult<DocumentDto>>> GetStudentDocuments(
            int studentId,
            [FromQuery] string? search = null,
            [FromQuery] string? type = null,
            [FromQuery] int? curriculumId = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.Documents.AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(d => d.OriginalFileName.Contains(search) || d.FileName.Contains(search));
                }

                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(d => d.Type == type);
                }

                if (curriculumId.HasValue)
                {
                    query = query.Where(d => d.CurriculumId == curriculumId.Value);
                }

                if (date.HasValue)
                {
                    query = query.Where(d => d.UploadDate.Date == date.Value.Date);
                }

                var totalCount = await query.CountAsync();

                var documents = await query
                    .Include(d => d.Curriculum)
                    .OrderByDescending(d => d.UploadDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new DocumentDto
                    {
                        DocumentId = d.DocumentId,
                        Type = d.Type,
                        FileName = d.FileName,
                        OriginalFileName = d.OriginalFileName,
                        FileSize = d.FileSize,
                        FilePath = d.FilePath,
                        UploadDate = d.UploadDate,
                        DownloadCount = d.DownloadCount,
                        CurriculumId = d.CurriculumId,
                        CurriculumName = d.Curriculum != null ? d.Curriculum.CurriculumName : null
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
        /// Gets all documents for a teacher. (Lấy tất cả tài liệu cho giáo viên.)
        /// Documents are now standalone resources.
        /// </summary>
        /// <param name="teacherId">Teacher ID (ID giáo viên)</param>
        /// <param name="search">Search term (Tìm kiếm)</param>
        /// <param name="type">Document type (Loại tài liệu)</param>
        /// <param name="curriculumId">Curriculum ID (ID chương trình học)</param>
        /// <param name="date">Upload date (Ngày tải lên)</param>
        /// <param name="page">Page number (Số trang)</param>
        /// <param name="pageSize">Page size (Kích thước trang)</param>
        /// <returns>Paged list of documents (Danh sách tài liệu phân trang)</returns>
        [HttpGet("teacher/{teacherId}")]
        public async Task<ActionResult<PagedResult<DocumentDto>>> GetTeacherDocuments(
            int teacherId,
            [FromQuery] string? search = null,
            [FromQuery] string? type = null,
            [FromQuery] int? curriculumId = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.Documents.AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(d => d.OriginalFileName.Contains(search) || d.FileName.Contains(search));
                }

                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(d => d.Type == type);
                }

                if (curriculumId.HasValue)
                {
                    query = query.Where(d => d.CurriculumId == curriculumId.Value);
                }

                if (date.HasValue)
                {
                    query = query.Where(d => d.UploadDate.Date == date.Value.Date);
                }

                var totalCount = await query.CountAsync();

                var documents = await query
                    .Include(d => d.Curriculum)
                    .OrderByDescending(d => d.UploadDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new DocumentDto
                    {
                        DocumentId = d.DocumentId,
                        Type = d.Type,
                        FileName = d.FileName,
                        OriginalFileName = d.OriginalFileName,
                        FileSize = d.FileSize,
                        FilePath = d.FilePath,
                        UploadDate = d.UploadDate,
                        DownloadCount = d.DownloadCount,
                        CurriculumId = d.CurriculumId,
                        CurriculumName = d.Curriculum != null ? d.Curriculum.CurriculumName : null
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
        /// <param name="type">Document type (Loại tài liệu)</param>
        /// <param name="curriculumId">Curriculum ID (ID chương trình học - optional)</param>
        /// <returns>Uploaded document info (Thông tin tài liệu đã tải)</returns>
        [HttpPost("upload")]
        public async Task<ActionResult<DocumentDto>> UploadDocument(
            [FromForm] IFormFile file,
            [FromForm] string type,
            [FromForm] int? curriculumId = null)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "Không có file được chọn" });
                }

                // Get current user from token (for audit purposes only)
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("nameid");
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Không xác định được người dùng" });
                }

                var currentUser = await _authService.GetCurrentUserAsync(userId);
                if (currentUser == null)
                {
                    return Unauthorized(new { message = "Không xác định được người dùng" });
                }

                // Validate curriculum if provided
                if (curriculumId.HasValue)
                {
                    var curriculum = await _context.Curriculums.FindAsync(curriculumId.Value);
                    if (curriculum == null)
                    {
                        return BadRequest(new { message = "Chương trình học không tồn tại" });
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

                // Create document record with optional curriculum association
                var document = new Document
                {
                    Type = type,
                    FileName = uniqueFileName,
                    OriginalFileName = file.FileName,
                    FileSize = file.Length,
                    FilePath = $"/uploads/documents/{uniqueFileName}",
                    UploadDate = DateTime.Now,
                    DownloadCount = 0,
                    CurriculumId = curriculumId
                };

                _context.Documents.Add(document);
                await _context.SaveChangesAsync();

                // Return document info with curriculum
                var documentDto = new DocumentDto
                {
                    DocumentId = document.DocumentId,
                    Type = document.Type,
                    FileName = document.FileName,
                    OriginalFileName = document.OriginalFileName,
                    FileSize = document.FileSize,
                    FilePath = document.FilePath,
                    UploadDate = document.UploadDate,
                    DownloadCount = document.DownloadCount,
                    CurriculumId = document.CurriculumId
                };

                _logger.LogInformation($"Document uploaded successfully: {document.DocumentId} - {document.OriginalFileName} by User {currentUser.UserId}");

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

                Response.Headers["Content-Disposition"] = $"attachment; filename=\"{document.OriginalFileName}\"";
                
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
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("nameid");
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Không xác định được người dùng" });
                }

                var currentUser = await _authService.GetCurrentUserAsync(userId);
                if (currentUser == null)
                {
                    return Unauthorized(new { message = "Không xác định được người dùng" });
                }

                // Check permission: only admin can update documents
                if (currentUser.Role?.ToLower() != "admin")
                {
                    return Forbid("Chỉ admin mới có quyền cập nhật tài liệu");
                }

                // Update fields
                if (!string.IsNullOrEmpty(request.Type))
                {
                    document.Type = request.Type;
                }

                if (request.CurriculumId.HasValue)
                {
                    // Validate curriculum exists
                    var curriculum = await _context.Curriculums.FindAsync(request.CurriculumId.Value);
                    if (curriculum == null)
                    {
                        return BadRequest(new { message = "Chương trình học không tồn tại" });
                    }
                    document.CurriculumId = request.CurriculumId.Value;
                }

                await _context.SaveChangesAsync();

                // Return updated document
                var documentDto = new DocumentDto
                {
                    DocumentId = document.DocumentId,
                    Type = document.Type,
                    FileName = document.FileName,
                    OriginalFileName = document.OriginalFileName,
                    FileSize = document.FileSize,
                    FilePath = document.FilePath,
                    UploadDate = document.UploadDate,
                    DownloadCount = document.DownloadCount,
                    CurriculumId = document.CurriculumId
                };

                _logger.LogInformation($"Document updated successfully: {document.DocumentId} - {document.OriginalFileName}");

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

                _logger.LogInformation($"Document deleted successfully: {document.DocumentId} - {document.OriginalFileName}");

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

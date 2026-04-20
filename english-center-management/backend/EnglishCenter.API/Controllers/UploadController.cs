using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<UploadController> _logger;

        public UploadController(
            IWebHostEnvironment environment,
            ILogger<UploadController> logger)
        {
            _environment = environment; 
            _logger = logger;
        }

        /// <summary>
        /// Uploads an avatar image file. (Tải lên file ảnh đại diện)
        /// </summary>
        /// <param name="file">Image file (File ảnh)</param>
        /// <returns>File URL (Đường dẫn file)</returns>
        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "Không có file được chọn" });
                }

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { message = "Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)" });
                }

                // Validate file size (max 5MB)
                if (file.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new { message = "Kích thước file không được vượt quá 5MB" });
                }

                // Create uploads directory if it doesn't exist
                var webRootPath = _environment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    // Fallback to content root if WebRootPath is null
                    webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
                    if (!Directory.Exists(webRootPath))
                    {
                        Directory.CreateDirectory(webRootPath);
                    }
                }
                
                var uploadsFolder = Path.Combine(webRootPath, "uploads", "avatars");
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

                // Return the URL
                var fileUrl = $"/uploads/avatars/{uniqueFileName}";
                
                _logger.LogInformation($"Avatar uploaded successfully: {uniqueFileName}");

                return Ok(new { url = fileUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi upload file" });
            }
        }

        /// <summary>
        /// Uploads a submission file. (Tải lên file bài nộp)
        /// </summary>
        /// <param name="file">Submission file (File bài nộp)</param>
        /// <returns>File URL and metadata (Đường dẫn file và thông tin)</returns>
        [HttpPost("submission")]
        public async Task<IActionResult> UploadSubmission(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "Không có file được chọn" });
                }

                // Validate file type
                var allowedExtensions = new[] { ".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".rar",
                    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mp3" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { message = "Định dạng file không được hỗ trợ" });
                }

                // Validate file size (max 50MB)
                if (file.Length > 50 * 1024 * 1024)
                {
                    return BadRequest(new { message = "Kích thước file không được vượt quá 50MB" });
                }

                // Create uploads directory
                var webRootPath = _environment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
                    if (!Directory.Exists(webRootPath))
                    {
                        Directory.CreateDirectory(webRootPath);
                    }
                }
                
                var uploadsFolder = Path.Combine(webRootPath, "uploads", "submissions");
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

                var fileUrl = $"/uploads/submissions/{uniqueFileName}";
                
                _logger.LogInformation($"Submission file uploaded: {uniqueFileName}");

                return Ok(new { url = fileUrl, fileName = file.FileName, size = file.Length });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading submission file");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi upload file" });
            }
        }
    }
}

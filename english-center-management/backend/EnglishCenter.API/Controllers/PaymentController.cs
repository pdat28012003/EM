using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using EnglishCenter.API.Data;
using EnglishCenter.API.Models;
using EnglishCenter.API.DTOs;
using EnglishCenter.API.Services;
using EnglishCenter.API.Hubs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace EnglishCenter.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ISePayService _sePayService;
        private readonly IHubContext<PaymentHub> _hubContext;
        private readonly ILogger<PaymentController> _logger;
        private readonly IConfiguration _configuration;

        public PaymentController(
            ApplicationDbContext context,
            ISePayService sePayService,
            IHubContext<PaymentHub> hubContext,
            ILogger<PaymentController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _sePayService = sePayService;
            _hubContext = hubContext;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Gets enrolled courses for a student with payment status
        /// </summary>
        [HttpGet("student/{studentId}/enrolled-courses")]
        public async Task<ActionResult<StudentEnrolledCoursesDto>> GetStudentEnrolledCourses(int studentId)
        {
            try
            {
                var student = await _context.Students
                    .Include(s => s.Enrollments)
                        .ThenInclude(e => e.Curriculum)
                            .ThenInclude(c => c.Course)
                    .FirstOrDefaultAsync(s => s.StudentId == studentId);

                if (student == null)
                {
                    return NotFound("Student not found");
                }

                if (student.Enrollments == null)
                {
                    return Ok(new StudentEnrolledCoursesDto { StudentId = studentId, StudentName = student.FullName });
                }

                var courses = student.Enrollments
                    .Where(e => e.Status != "Dropped" && e.Status != "Cancelled" && e.Curriculum != null && e.Curriculum.Course != null)
                    .Select(e => e.Curriculum.Course)
                    .Distinct()
                    .Select(course => new CourseForPaymentDto
                    {
                        CourseId = course.CourseId,
                        CourseName = course.CourseName,
                        CourseCode = course.CourseCode,
                        Fee = course.Fee,
                        IsSelected = false,
                        IsPaid = false
                    })
                    .ToList();

                // Check which courses are already paid
                var paidCourseIds = await _context.PaymentCourses
                    .Include(pc => pc.Payment)
                    .Where(pc => pc.Payment != null && pc.Payment.StudentId == studentId && pc.Payment.Status == "Completed")
                    .Select(pc => pc.CourseId)
                    .ToListAsync();

                foreach (var course in courses)
                {
                    course.IsPaid = paidCourseIds.Contains(course.CourseId);
                }

                var result = new StudentEnrolledCoursesDto
                {
                    StudentId = studentId,
                    StudentName = student.FullName,
                    Courses = courses,
                    TotalSelectedAmount = 0
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting enrolled courses for student {StudentId}", studentId);
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        /// <summary>
        /// Creates a new payment with QR code
        /// </summary>
        [HttpPost("create-payment")]
        public async Task<ActionResult<PaymentDto>> CreatePayment([FromBody] CreatePaymentDto createPaymentDto)
        {
            try
            {
                // Validate student exists
                var student = await _context.Students.FindAsync(createPaymentDto.StudentId);
                if (student == null)
                {
                    return NotFound("Student not found");
                }

                // Calculate total amount from selected courses
                var courses = await _context.Courses
                    .Where(c => createPaymentDto.CourseIds.Contains(c.CourseId))
                    .ToListAsync();

                if (courses.Count != createPaymentDto.CourseIds.Count)
                {
                    return BadRequest("One or more courses not found");
                }

                var calculatedAmount = courses.Sum(c => c.Fee);
                if (Math.Abs(calculatedAmount - createPaymentDto.Amount) > 0.01m)
                {
                    return BadRequest("Amount does not match the sum of selected course fees");
                }

                // Create payment record
                var payment = new Payment
                {
                    StudentId = createPaymentDto.StudentId,
                    Amount = createPaymentDto.Amount,
                    PaymentDate = DateTime.Now,
                    PaymentMethod = "SePay",
                    Status = "Pending",
                    Notes = createPaymentDto.Notes ?? $"Payment for {courses.Count} course(s)"
                };

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                // Add payment-course relationships
                foreach (var course in courses)
                {
                    _context.PaymentCourses.Add(new PaymentCourse
                    {
                        PaymentId = payment.PaymentId,
                        CourseId = course.CourseId,
                        CourseFee = course.Fee
                    });
                }
                await _context.SaveChangesAsync();

                // Generate QR code with timeout handling
                _logger.LogInformation("Creating payment {PaymentId}. Requesting QR code from SePay Service...", payment.PaymentId);
                try
                {
                    var qrRequest = new SePayQRRequestDto
                    {
                        accountNumber = _configuration["SePay:AccountNumber"] ?? "0399076806",
                        accountName = _configuration["SePay:AccountName"] ?? "DOAN VU BINH DUONG",
                        acqId = _configuration["SePay:AcqId"] ?? "970422",
                        addInfo = $"EC-PAY-{payment.PaymentId}",
                        amount = payment.Amount.ToString("0"),
                        template = "compact"
                    };

                    var qrResponse = await _sePayService.GenerateQRCodeAsync(qrRequest);
                    
                    if (qrResponse != null)
                    {
                        _logger.LogInformation("Received QR code from SePay for Payment {PaymentId}", payment.PaymentId);
                        payment.QRCodeUrl = qrResponse.img;
                        payment.TransactionId = qrResponse.qrCode;
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        _logger.LogWarning("Failed to generate QR code for Payment {PaymentId} - continuing without QR", payment.PaymentId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Exception while generating QR code for Payment {PaymentId} - continuing without QR", payment.PaymentId);
                }

                // Add note if fallback QR was used
                if (string.IsNullOrEmpty(payment.QRCodeUrl))
                {
                    payment.Notes += " (QR code tự động tạo - vui lòng chuyển khoản thủ công)";
                }

                // Return payment DTO
                var paymentDto = new PaymentDto
                {
                    PaymentId = payment.PaymentId,
                    StudentId = payment.StudentId,
                    StudentName = student.FullName,
                    Amount = payment.Amount,
                    PaymentDate = payment.PaymentDate,
                    PaymentMethod = payment.PaymentMethod,
                    Status = payment.Status,
                    Notes = payment.Notes,
                    TransactionId = payment.TransactionId,
                    QRCodeUrl = payment.QRCodeUrl,
                    Gateway = payment.Gateway,
                    PaymentCompletedDate = payment.PaymentCompletedDate,
                    Courses = courses.Select(c => new CourseForPaymentDto
                    {
                        CourseId = c.CourseId,
                        CourseName = c.CourseName,
                        CourseCode = c.CourseCode,
                        Fee = c.Fee,
                        IsSelected = true,
                        IsPaid = false
                    }).ToList()
                };

                return CreatedAtAction(nameof(GetPayment), new { id = payment.PaymentId }, paymentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Gets payment by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentDto>> GetPayment(int id)
        {
            try
            {
                var payment = await _context.Payments
                    .Include(p => p.Student)
                    .Include(p => p.PaymentCourses)
                        .ThenInclude(pc => pc.Course)
                    .FirstOrDefaultAsync(p => p.PaymentId == id);

                if (payment == null)
                {
                    return NotFound();
                }

                var paymentDto = new PaymentDto
                {
                    PaymentId = payment.PaymentId,
                    StudentId = payment.StudentId,
                    StudentName = payment.Student.FullName,
                    Amount = payment.Amount,
                    PaymentDate = payment.PaymentDate,
                    PaymentMethod = payment.PaymentMethod,
                    Status = payment.Status,
                    Notes = payment.Notes,
                    TransactionId = payment.TransactionId,
                    QRCodeUrl = payment.QRCodeUrl,
                    Gateway = payment.Gateway,
                    PaymentCompletedDate = payment.PaymentCompletedDate,
                    Courses = payment.PaymentCourses.Select(pc => new CourseForPaymentDto
                    {
                        CourseId = pc.Course.CourseId,
                        CourseName = pc.Course.CourseName,
                        CourseCode = pc.Course.CourseCode,
                        Fee = pc.CourseFee,
                        IsSelected = true,
                        IsPaid = payment.Status == "Completed"
                    }).ToList()
                };

                return Ok(paymentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment {PaymentId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Poll payment status (fallback for when webhook doesn't work)
        /// </summary>
        [HttpGet("{id}/status")]
        public async Task<ActionResult<object>> GetPaymentStatus(int id)
        {
            try
            {
                var payment = await _context.Payments.FindAsync(id);
                if (payment == null)
                {
                    return NotFound();
                }

                return Ok(new
                {
                    paymentId = payment.PaymentId,
                    status = payment.Status,
                    completedDate = payment.PaymentCompletedDate,
                    transactionId = payment.TransactionId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment status {PaymentId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// SePay webhook endpoint
        /// </summary>
        [AllowAnonymous]
        [HttpPost("sepay/webhook")]
        public async Task<IActionResult> SePayWebhook([FromBody] SePayWebhookDto webhookData)
        {
            try
            {
                // Verify API Key from headers (check both Authorization and Api-Key)
                var authHeader = Request.Headers["Authorization"].ToString();
                var customApiKeyHeader = Request.Headers["Api-Key"].ToString();
                var configApiKey = _configuration["SePay:ApiKey"];
                var webhookSecret = _configuration["SePay:WebhookSecret"];
                
                bool isAuthorized = (!string.IsNullOrEmpty(authHeader) && 
                                     (authHeader.Contains(configApiKey!) || 
                                      authHeader.Contains(webhookSecret!) || 
                                      authHeader.Contains($"Bearer {configApiKey}") ||
                                      authHeader.Contains($"Apikey {webhookSecret}"))) ||
                                   (!string.IsNullOrEmpty(customApiKeyHeader) && 
                                     (customApiKeyHeader.Contains(configApiKey!) || 
                                      customApiKeyHeader.Contains(webhookSecret!)));

                if (!isAuthorized)
                {
                    var allHeaders = string.Join("; ", Request.Headers.Select(h => $"{h.Key}={h.Value}"));
                    _logger.LogWarning("Unauthorized SePay webhook attempt. All Headers: {Headers}", allHeaders);
                    return Unauthorized("Invalid API Key");
                }

                // Check both content and code as some banks put addInfo in different places
                string? searchContent = webhookData.content ?? webhookData.code;

                if (!string.IsNullOrEmpty(searchContent))
                {
                    // Look for ECPAY or EC-PAY- (case insensitive)
                    var upperContent = searchContent.ToUpper();
                    int startIndex = -1;
                    int prefixLength = 0;

                    if (upperContent.Contains("EC-PAY-"))
                    {
                        startIndex = upperContent.IndexOf("EC-PAY-");
                        prefixLength = 7;
                    }
                    else if (upperContent.Contains("ECPAY"))
                    {
                        startIndex = upperContent.IndexOf("ECPAY");
                        prefixLength = 5;
                    }

                    if (startIndex != -1)
                    {
                        var paymentIdStr = "";
                        for (int i = startIndex + prefixLength; i < searchContent.Length && char.IsDigit(searchContent[i]); i++)
                        {
                            paymentIdStr += searchContent[i];
                        }

                        if (int.TryParse(paymentIdStr, out var paymentId))
                        {
                            var payment = await _context.Payments.FindAsync(paymentId);
                            if (payment != null && payment.Status == "Pending")
                            {
                                // Verify amount matches (try both amount and transferAmount)
                                var rawAmount = webhookData.amount ?? webhookData.transferAmount;
                                var amountStr = rawAmount?.ToString();
                                
                                if (decimal.TryParse(amountStr, out var receivedAmount))
                                {
                                    if (Math.Abs(receivedAmount - payment.Amount) < 0.1m)
                                    {
                                        // Update payment status
                                        payment.Status = "Completed";
                                        payment.PaymentCompletedDate = DateTime.Now;
                                        payment.Gateway = "SePay";
                                        payment.TransactionId = webhookData.id?.ToString();
                                        
                                        await _context.SaveChangesAsync();

                                        // Notify via SignalR specific group
                                        await _hubContext.Clients.Group($"payment_{paymentId}")
                                            .SendAsync("PaymentStatusChanged", new
                                            {
                                                paymentId = payment.PaymentId,
                                                status = payment.Status,
                                                completedDate = payment.PaymentCompletedDate
                                            });
                                        
                                        // Also send a general event for broad compatibility
                                        await _hubContext.Clients.All.SendAsync("ReceivePaymentStatus", new { paymentId, status = "Completed" });

                                        _logger.LogInformation("Payment {Id} marked as completed successfully", paymentId);
                                    }
                                    else
                                    {
                                        _logger.LogWarning("Amount mismatch for payment {Id}: expected {Exp}, received {Rec}", 
                                            paymentId, payment.Amount, receivedAmount);
                                    }
                                }
                            }
                        }
                    }
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing SePay webhook");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Gets payment history for a student
        /// </summary>
        [HttpGet("student/{studentId}/history")]
        public async Task<ActionResult<List<PaymentDto>>> GetPaymentHistory(int studentId)
        {
            try
            {
                var payments = await _context.Payments
                    .Include(p => p.Student)
                    .Include(p => p.PaymentCourses)
                        .ThenInclude(pc => pc.Course)
                    .Where(p => p.StudentId == studentId)
                    .OrderByDescending(p => p.PaymentDate)
                    .ToListAsync();

                var paymentDtos = payments.Select(p => new PaymentDto
                {
                    PaymentId = p.PaymentId,
                    StudentId = p.StudentId,
                    StudentName = p.Student != null ? p.Student.FullName : "Unknown Student",
                    Amount = p.Amount,
                    PaymentDate = p.PaymentDate,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status == "Completed" ? "Complete" : "Pending",
                    Notes = p.Notes,
                    TransactionId = p.TransactionId,
                    QRCodeUrl = p.QRCodeUrl,
                    Gateway = p.Gateway,
                    PaymentCompletedDate = p.PaymentCompletedDate,
                    Courses = p.PaymentCourses != null 
                        ? p.PaymentCourses
                            .Where(pc => pc.Course != null)
                            .Select(pc => new CourseForPaymentDto
                            {
                                CourseId = pc.Course.CourseId,
                                CourseName = pc.Course.CourseName,
                                CourseCode = pc.Course.CourseCode,
                                Fee = pc.CourseFee,
                                IsSelected = true,
                                IsPaid = p.Status == "Completed"
                            }).ToList()
                        : new List<CourseForPaymentDto>()
                }).ToList();

                return Ok(paymentDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment history for student {StudentId}", studentId);
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }
    }
}

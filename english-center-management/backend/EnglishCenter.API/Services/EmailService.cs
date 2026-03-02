using System.Net;
using System.Net.Mail;

namespace EnglishCenter.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var emailSettings = _configuration.GetSection("EmailSettings");
                var fromEmail = emailSettings["Email"];
                var password = emailSettings["Password"];
                var host = emailSettings["Host"];
                var port = int.Parse(emailSettings["Port"] ?? "587");

                var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(fromEmail, password),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail!),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(to);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email sent successfully to {to}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send email to {to}");
                // In development, we might not want to crash the whole flow if email fails
                // but for otp it is critical.
                throw; 
            }
        }

        public async Task SendOtpEmailAsync(string to, string otp, string type)
        {
            string subject = type == "Registration" ? "Mã xác thực đăng ký tài khoản" : "Mã khôi phục mật khẩu";
            string body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;'>
                    <h2>Hệ Thống Quản Lý Trung Tâm Tiếng Anh</h2>
                    <p>Chào bạn,</p>
                    <p>Mã OTP của bạn cho yêu cầu <strong>{type}</strong> là:</p>
                    <h1 style='color: #2c3e50; letter-spacing: 5px;'>{otp}</h1>
                    <p>Mã này sẽ hết hạn sau 10 phút.</p>
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                </div>";

            await SendEmailAsync(to, subject, body);
        }
    }
}

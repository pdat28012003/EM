namespace EnglishCenter.API.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendOtpEmailAsync(string to, string otp, string type);
    }
}

namespace EnglishCenter.API.Services
{
    public interface ICaptchaService
    {
        Task<bool> VerifyAsync(string? captchaToken);
    }
}

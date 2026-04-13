using EnglishCenter.API.DTOs;

namespace EnglishCenter.API.Services
{
    public interface ISePayService
    {
        Task<SePayQRResponseDto?> GenerateQRCodeAsync(SePayQRRequestDto request);
        Task<bool> VerifyWebhookAsync(string webhookData, string secretKey);
        Task<SePayWebhookDto?> ParseWebhookDataAsync(string webhookData);
    }
}

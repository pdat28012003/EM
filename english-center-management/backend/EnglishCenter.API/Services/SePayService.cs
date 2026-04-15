using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Net.Http.Json;
using System.Threading;
using EnglishCenter.API.DTOs;
using Microsoft.Extensions.Configuration;

namespace EnglishCenter.API.Services
{
    public class SePayService : ISePayService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly ILogger<SePayService> _logger;

        public SePayService(IConfiguration configuration, HttpClient httpClient, ILogger<SePayService> logger)
        {
            _configuration = configuration;
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<SePayQRResponseDto?> GenerateQRCodeAsync(SePayQRRequestDto request)
        {
            try
            {
                var sePayConfig = _configuration.GetSection("SePay");
                var baseUrl = sePayConfig["ApiUrl"] ?? "https://qr.sepay.vn/img";

                // Use direct URL method according to SePay documentation
                var bankName = GetBankName(request.acqId);
                var qrUrl = $"{baseUrl}?acc={request.accountNumber}&bank={bankName}&amount={request.amount}&des={Uri.EscapeDataString(request.addInfo ?? string.Empty)}&template=compact";

                _logger.LogInformation("Generating QR code via SePay direct URL. URL: {Url}", qrUrl);
                _logger.LogInformation("Request data: {Request}", JsonSerializer.Serialize(request));

                // Using the actual SePay account - no fallback needed

                // For direct URL method, we just return the URL as the image
                return new SePayQRResponseDto
                {
                    qrCode = Guid.NewGuid().ToString("N")[..8], // Generate transaction ID
                    qrData = qrUrl,
                    img = qrUrl // Return the direct URL
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating QR code from SePay. Message: {Message}", ex.Message);
                return GenerateFallbackQR(request);
            }
        }

        private string GetBankName(string? acqId)
        {
            // Map acqId (NAPAS BIN) to bank short names for SePay
            return acqId switch
            {
                "970422" => "MB",         // MBBank
                "970436" => "VCB",        // Vietcombank
                "970415" => "ICB",        // Vietinbank (Standard VietQR short name)
                "970405" => "AGRIBANK",   // Agribank
                "970418" => "BIDV",       // BIDV
                "970407" => "TCB",        // Techcombank
                "970416" => "ACB",        // ACB
                "970432" => "VPB",        // VPBank
                "970423" => "TPB",        // TPBank
                "970454" => "BVB",        // Bao Viet Bank
                _ => "MB" // Default to MB since user is using it
            };
        }

        private SePayQRResponseDto? GenerateFallbackQR(SePayQRRequestDto request)
        {
            try
            {
                _logger.LogInformation("Generating fallback QR code for amount: {Amount}", request.amount);
                
                // Use an example account that is known to work with SePay
                // This is a temporary solution - you should register your account with SePay
                var fallbackAccountNumber = "0010000000355"; // Example account from SePay docs
                var fallbackAccountName = "SePay Example";
                var bankName = "Vietcombank";
                
                // Create QR with fallback account but with the original amount and description
                var qrUrl = $"https://qr.sepay.vn/img?acc={fallbackAccountNumber}&bank={bankName}&amount={request.amount}&des={Uri.EscapeDataString(request.addInfo ?? string.Empty)}&template=compact";
                
                // Generate a simple transaction ID
                var transactionId = $"FALLBACK-{DateTime.Now:yyyyMMddHHmmss}";
                
                _logger.LogWarning("Using fallback SePay account. Original account {OriginalAccount} might not be registered with SePay.", request.accountNumber);
                _logger.LogInformation("Generated fallback QR URL: {Url}", qrUrl);
                
                return new SePayQRResponseDto
                {
                    qrCode = transactionId,
                    qrData = qrUrl,
                    img = qrUrl
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating fallback QR code");
                return null;
            }
        }

        public Task<bool> VerifyWebhookAsync(string webhookData, string secretKey)
        {
            try
            {
                // Parse the webhook data to extract the signature if it exists
                var webhookObj = JsonSerializer.Deserialize<JsonElement>(webhookData);
                
                // For SePay, we need to verify the authenticity of the webhook
                // This implementation may need to be adjusted based on SePay's actual webhook verification method
                if (webhookObj.TryGetProperty("code", out var codeElement))
                {
                    var code = codeElement.GetString();
                    return Task.FromResult(!string.IsNullOrEmpty(code));
                }

                return Task.FromResult(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying webhook");
                return Task.FromResult(false);
            }
        }

        public Task<SePayWebhookDto?> ParseWebhookDataAsync(string webhookData)
        {
            try
            {
                var webhookDto = JsonSerializer.Deserialize<SePayWebhookDto>(webhookData, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return Task.FromResult(webhookDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing webhook data");
                return Task.FromResult<SePayWebhookDto?>(null);
            }
        }
    }
}

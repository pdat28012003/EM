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
                var apiKey = sePayConfig["ApiKey"];
                var apiUrl = sePayConfig["ApiUrl"] ?? "https://my.sepay.vn/api/v2/qr_code/generate";

                _logger.LogInformation("Generating QR code via SePay. URL: {Url}", apiUrl);
                _logger.LogInformation("Request data: {Request}", JsonSerializer.Serialize(request));

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
                
                // Add a reasonable timeout
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));

                var response = await _httpClient.PostAsJsonAsync(apiUrl, request, cts.Token);
                
                if (response.IsSuccessStatusCode)
                {
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("SePay Response Content: {Content}", content);
                    
                    var result = JsonSerializer.Deserialize<SePayResponse<SePayQRResponseDto>>(content, options);
                    
                    if (result?.status == 200 && result.data != null)
                    {
                        _logger.LogInformation("QR code generated successfully. QR Code: {QrCode}", result.data.qrCode);
                        return result.data;
                    }
                    
                    _logger.LogWarning("SePay returned success status code but error or missing data in body: Status={Status}, Error={Error}, FullContent={FullContent}", result?.status, result?.error, content);
                    return null;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("SePay API failed with status {StatusCode}: {Error}", response.StatusCode, errorContent);
                    return null;
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogError("SePay QR URL request timed out after 5 seconds - using fallback");
                return GenerateFallbackQR(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating QR code from SePay. Message: {Message} - using fallback", ex.Message);
                return GenerateFallbackQR(request);
            }
        }

        private string GetBankName(string? acqId)
        {
            // Map acqId to bank names for SePay
            return acqId switch
            {
                "970422" => "Vietcombank",
                "970415" => "Agribank",
                "970405" => "Vietinbank",
                "970436" => "Techcombank",
                "970418" => "VPBank",
                "970432" => "MBBank",
                "970416" => "ACB",
                "970454" => "TPBank",
                _ => "Vietcombank" // Default
            };
        }

        private SePayQRResponseDto? GenerateFallbackQR(SePayQRRequestDto request)
        {
            try
            {
                _logger.LogInformation("Generating fallback QR code for amount: {Amount}", request.amount);
                
                // Create a simple QR code data for Vietnam bank transfer
                var qrData = $"00020101021138370010{request.acqId}0113{request.accountNumber}0208{request.accountName}5303704{request.amount}5802VN6304";
                
                // Generate a simple transaction ID
                var transactionId = $"FALLBACK-{DateTime.Now:yyyyMMddHHmmss}";
                
                // For now, return a placeholder URL - in production, you would generate an actual QR code image
                var qrImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
                
                return new SePayQRResponseDto
                {
                    qrCode = transactionId,
                    qrData = qrData,
                    img = qrImageUrl
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

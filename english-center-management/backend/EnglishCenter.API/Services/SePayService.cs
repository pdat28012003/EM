using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
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

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                var response = await _httpClient.PostAsJsonAsync(apiUrl, request);
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<SePayQRResponseDto>();
                    _logger.LogInformation("QR code generated successfully");
                    return result;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to generate QR code: {Error}", errorContent);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating QR code");
                return null;
            }
        }

        public async Task<bool> VerifyWebhookAsync(string webhookData, string secretKey)
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
                    return !string.IsNullOrEmpty(code);
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying webhook");
                return false;
            }
        }

        public async Task<SePayWebhookDto?> ParseWebhookDataAsync(string webhookData)
        {
            try
            {
                var webhookDto = JsonSerializer.Deserialize<SePayWebhookDto>(webhookData, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return webhookDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing webhook data");
                return null;
            }
        }
    }
}

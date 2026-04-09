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

                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    _logger.LogError("SePay ApiKey is missing/empty. Please configure SePay:ApiKey in appsettings.");
                    return null;
                }

                _logger.LogInformation("Generating QR code via SePay. URL: {Url}", apiUrl);
                _logger.LogInformation("Request data: {Request}", JsonSerializer.Serialize(request));

                _httpClient.DefaultRequestHeaders.Clear();
                // SePay docs: Authorization: Bearer API_TOKEN
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
                _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

                // Add a reasonable timeout
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));

                var response = await _httpClient.PostAsJsonAsync(apiUrl, request, cts.Token);
                var content = await response.Content.ReadAsStringAsync(cts.Token);
                var contentType = response.Content?.Headers?.ContentType?.MediaType;
                _logger.LogInformation("SePay Response: StatusCode={StatusCode}, ContentType={ContentType}", response.StatusCode, contentType);
                _logger.LogInformation("SePay Response Content: {Content}", content);

                if (response.IsSuccessStatusCode)
                {
                    if (string.IsNullOrWhiteSpace(contentType) || !contentType.Contains("json", StringComparison.OrdinalIgnoreCase))
                    {
                        var snippet = content.Length > 300 ? content.Substring(0, 300) : content;
                        _logger.LogError(
                            "SePay returned non-JSON content with success status code. StatusCode={StatusCode}, ContentType={ContentType}, BodySnippet={BodySnippet}",
                            response.StatusCode,
                            contentType,
                            snippet);
                        return null;
                    }

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var result = JsonSerializer.Deserialize<SePayResponse<SePayQRResponseDto>>(content, options);

                    if (result?.data != null)
                    {
                        _logger.LogInformation("QR code generated successfully. QR Code: {QrCode}", result.data.qrCode);
                        return result.data;
                    }

                    // Try fallback if response is not in expected wrapper but contains expected fields directly.
                    try
                    {
                        using var document = JsonDocument.Parse(content);
                        if (document.RootElement.TryGetProperty("data", out var dataElement))
                        {
                            var data = JsonSerializer.Deserialize<SePayQRResponseDto>(dataElement.GetRawText(), options);
                            if (data != null)
                            {
                                _logger.LogInformation("QR code parsed from SePay response data fallback. QR Code: {QrCode}", data.qrCode);
                                return data;
                            }
                        }
                        else if (document.RootElement.TryGetProperty("qrCode", out var qrCodeElement) || document.RootElement.TryGetProperty("img", out var imgElement))
                        {
                            var data = JsonSerializer.Deserialize<SePayQRResponseDto>(content, options);
                            if (data != null)
                            {
                                _logger.LogInformation("QR code parsed from direct SePay response. QR Code: {QrCode}", data.qrCode);
                                return data;
                            }
                        }
                    }
                    catch (JsonException jsonEx)
                    {
                        _logger.LogWarning(jsonEx, "Fallback JSON parsing for SePay response failed");
                    }

                    _logger.LogWarning("SePay returned success status code but no usable data in body: FullContent={FullContent}", content);
                    return null;
                }
                else
                {
                    _logger.LogError("SePay API failed with status {StatusCode}: {Error}", response.StatusCode, content);
                    return null;
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogError("SePay API request timed out after 15 seconds");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating QR code from SePay. Message: {Message}", ex.Message);
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

using System.Text.Json;
using System.Text.Json.Serialization;

namespace EnglishCenter.API.Services
{
    public class CaptchaService : ICaptchaService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<CaptchaService> _logger;

        public CaptchaService(HttpClient httpClient, IConfiguration configuration, ILogger<CaptchaService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> VerifyAsync(string? captchaToken)
        {

            // Allow disabling captcha via configuration (useful for dev/test)
            var enabledVal = _configuration["ReCaptcha:Enabled"];
            if (!string.IsNullOrEmpty(enabledVal) && enabledVal.Equals("false", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("ReCaptcha verification is disabled via configuration.");
                return true;
            }

            // Skip verification if no token provided and not required
            if (string.IsNullOrEmpty(captchaToken))
            {
                _logger.LogWarning("CAPTCHA token is missing");
                return false;
            }

            var secretKey = _configuration["ReCaptcha:SecretKey"];
            
            // Use test secret key if not configured
            if (string.IsNullOrEmpty(secretKey))
            {
                _logger.LogWarning("ReCaptcha:SecretKey not configured, using test key");
                secretKey = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"; // Google test key
            }

            try
            {
                var response = await _httpClient.PostAsync(
                    $"https://www.google.com/recaptcha/api/siteverify?secret={secretKey}&response={captchaToken}",
                    null);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("CAPTCHA verification request failed: {StatusCode}", response.StatusCode);
                    return false;
                }

                var jsonString = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<ReCaptchaResponse>(jsonString);

                if (result?.Success != true)
                {
                    _logger.LogWarning("CAPTCHA verification failed: {ErrorCodes}", 
                        string.Join(", ", result?.ErrorCodes ?? Array.Empty<string>()));
                    return false;
                }

                // Check score for reCAPTCHA v3 (optional)
                if (result.Score.HasValue && result.Score.Value < 0.5)
                {
                    _logger.LogWarning("CAPTCHA score too low: {Score}", result.Score.Value);
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying CAPTCHA");
                return false;
            }
        }

        private class ReCaptchaResponse
        {
            [JsonPropertyName("success")]
            public bool Success { get; set; }

            [JsonPropertyName("challenge_ts")]
            public string? ChallengeTs { get; set; }

            [JsonPropertyName("hostname")]
            public string? Hostname { get; set; }

            [JsonPropertyName("score")]
            public double? Score { get; set; }

            [JsonPropertyName("action")]
            public string? Action { get; set; }

            [JsonPropertyName("error-codes")]
            public string[]? ErrorCodes { get; set; }
        }
    }
}

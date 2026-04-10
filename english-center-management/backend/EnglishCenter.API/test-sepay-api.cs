using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class SePayApiTester
{
    private static readonly HttpClient httpClient = new HttpClient();
    
    public static async Task<bool> TestApiKey(string apiKey)
    {
        try
        {
            Console.WriteLine($"Testing API Key: {apiKey.Substring(0, Math.Min(10, apiKey.Length))}...");
            
            var requestBody = new
            {
                accountNumber = "0399076806",
                accountName = "DOAN VU BINH DUONG",
                acqId = "970422",
                addInfo = "TEST-123",
                amount = "1000",
                template = "compact"
            };
            
            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            var request = new HttpRequestMessage(HttpMethod.Post, "https://my.sepay.vn/api/v2/qr_code/generate");
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Content = content;
            
            var response = await httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();
            
            Console.WriteLine($"Status Code: {response.StatusCode}");
            Console.WriteLine($"Response Content (first 200 chars): {responseContent.Substring(0, Math.Min(200, responseContent.Length))}");
            
            // Check if response is HTML (login page)
            if (responseContent.Contains("<html") || responseContent.Contains("DOCTYPE html"))
            {
                Console.WriteLine("❌ API Key không hợp lệ - trả về trang login");
                return false;
            }
            
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("✅ API Key hợp lệ");
                return true;
            }
            else
            {
                Console.WriteLine($"❌ API Key có vấn đề - Status: {response.StatusCode}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Lỗi khi test API Key: {ex.Message}");
            return false;
        }
    }
    
    public static async Task Main(string[] args)
    {
        var apiKey = "spsk_live_nTHqmUwFdjMHMLK8gkXV7eXVA9WQBZ9D";
        var isValid = await TestApiKey(apiKey);
        
        Console.WriteLine($"\nKết quả: API Key {(isValid ? "HỢP LỆ" : "KHÔNG HỢP LỆ")}");
        
        // Test with empty key
        Console.WriteLine("\n--- Test với API key rỗng ---");
        await TestApiKey("");
    }
}

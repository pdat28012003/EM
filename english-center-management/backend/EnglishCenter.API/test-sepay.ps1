# Script test API Key SePay
param(
    [string]$ApiKey = "spsk_live_nTHqmUwFdjMHMLK8gkXV7eXVA9WQBZ9D"
)

Write-Host "=== TEST API KEY SEPAY ===" -ForegroundColor Yellow
Write-Host "API Key: $($ApiKey.Substring(0, [Math]::Min(10, $ApiKey.Length)))..." -ForegroundColor Gray

try {
    $headers = @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        accountNumber = "0399076806"
        accountName = "DOAN VU BINH DUONG"
        acqId = "970422"
        addInfo = "TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
        amount = "1000"
        template = "compact"
    } | ConvertTo-Json
    
    Write-Host "Sending request to SePay API..." -ForegroundColor Blue
    
    $response = Invoke-RestMethod -Uri "https://my.sepay.vn/api/v2/qr_code/generate" -Method Post -Headers $headers -Body $body -TimeoutSec 10
    
    Write-Host "✅ API Key HỢP LỆ!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ API Key KHÔNG HỢP LỆ hoặc có lỗi!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        
        # Try to get response content
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $content = $reader.ReadToEnd()
            
            if ($content -like "*<html*") {
                Write-Host "Phản hồi là trang HTML -> API Key không hợp lệ hoặc hết hạn" -ForegroundColor Yellow
            } else {
                Write-Host "Response content: $($content.Substring(0, [Math]::Min(200, $content.Length)))" -ForegroundColor Gray
            }
        } catch {
            Write-Host "Không thể đọc response content" -ForegroundColor Gray
        }
    }
}

Write-Host "`n=== KẾT THÚC TEST ===" -ForegroundColor Yellow

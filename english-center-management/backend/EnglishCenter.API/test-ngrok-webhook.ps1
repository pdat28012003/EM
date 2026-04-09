# Test webhook qua ngrok
$webhookUrl = "https://gonial-margurite-carlish.ngrok-free.dev/api/payment/sepay/webhook"

$webhookData = @{
    code = "TEST123456"
    amount = "5000"
    content = "EC-PAY-27"
    description = "Chuyen khoan thanh toan"
    tran_date = "09/04/2026 15:52:00"
    account_number = "0399076806"
    sub_account = "DOAN VU BINH DUONG"
} | ConvertTo-Json

Write-Host "Testing webhook qua ngrok: $webhookUrl" -ForegroundColor Yellow
Write-Host "Webhook data: $webhookData" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Headers @{"Content-Type"="application/json"} -Body $webhookData -TimeoutSec 10
    Write-Host "SUCCESS: Webhook sent via ngrok!" -ForegroundColor Green
    Write-Host "Response: $response"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        $stream = $_.Exception.Response.GetResponseStream()
$reader = New-Object System.IO.StreamReader($stream)
$responseBody = $reader.ReadToEnd()
Write-Host "Response: $responseBody"
    }
}

$webhookUrl = "http://localhost:5000/api/payment/sepay/webhook"
$webhookData = '{"content":"EC-PAY-27","amount":"5000","code":"TEST123","description":"Test"}'

Write-Host "Testing local webhook: $webhookUrl"

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Headers @{"Content-Type"="application/json"} -Body $webhookData -TimeoutSec 5
    Write-Host "SUCCESS: Local webhook works!" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
    }
}

# Test webhook với dữ liệu thật từ giao dịch
$webhookUrl = "http://localhost:5000/api/payment/sepay/webhook"
$webhookData = @{
    content = "ECPAY29"
    amount = "5000"
    code = "13714899475"
    description = "Chuyen khoan thanh toan"
    tran_date = "09/04/2026 17:58:00"
    account_number = "0399076806"
    sub_account = "DOAN VU BINH DUONG"
} | ConvertTo-Json

Write-Host "Testing webhook with real transaction data..."
Write-Host "URL: $webhookUrl"
Write-Host "Data: $webhookData"

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Headers @{"Content-Type"="application/json"} -Body $webhookData -TimeoutSec 10
    Write-Host "SUCCESS: Webhook processed!" -ForegroundColor Green
    Write-Host "Response: $response"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
    }
}

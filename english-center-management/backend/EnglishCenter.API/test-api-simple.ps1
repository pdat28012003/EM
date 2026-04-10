# Simple API Key Test
$ApiKey = "spsk_live_nTHqmUwFdjMHMLK8gkXV7eXVA9WQBZ9D"

Write-Host "Testing SePay API Key..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

$body = '{"accountNumber":"0399076806","accountName":"DOAN VU BINH DUONG","acqId":"970422","addInfo":"TEST-123","amount":"1000","template":"compact"}'

try {
    $response = Invoke-RestMethod -Uri "https://my.sepay.vn/api/v2/qr_code/generate" -Method Post -Headers $headers -Body $body -TimeoutSec 10
    Write-Host "SUCCESS: API Key is valid!" -ForegroundColor Green
    Write-Host $response
} catch {
    Write-Host "FAILED: API Key is invalid or expired!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}

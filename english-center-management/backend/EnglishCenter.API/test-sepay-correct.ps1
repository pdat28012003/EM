# Test SePay QR URL (correct method)
$accountNumber = "0399076806"
$bankName = "Vietcombank"
$amount = "9000"
$description = "EC-PAY-123"

$qrUrl = "https://qr.sepay.vn/img?acc=$accountNumber&bank=$bankName&amount=$amount&des=$description"

Write-Host "Testing SePay QR URL..." -ForegroundColor Yellow
Write-Host "URL: $qrUrl" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $qrUrl -Method Get -TimeoutSec 10
    Write-Host "SUCCESS: QR URL is valid!" -ForegroundColor Green
    Write-Host "Content Type: $($response.Headers['Content-Type'])"
    Write-Host "Content Length: $($response.Headers['Content-Length'])"
} catch {
    Write-Host "FAILED: QR URL is invalid!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}

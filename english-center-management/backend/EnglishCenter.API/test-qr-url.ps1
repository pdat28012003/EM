$qrUrl = "https://qr.sepay.vn/img?acc=0399076806&bank=MBBank&amount=9000"
Write-Host "Testing QR URL: $qrUrl"

try {
    $response = Invoke-WebRequest -Uri $qrUrl -Method Get -TimeoutSec 5
    Write-Host "SUCCESS - Status: $($response.StatusCode)"
    Write-Host "Content Type: $($response.Headers['Content-Type'])"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

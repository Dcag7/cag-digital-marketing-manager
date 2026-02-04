# PowerShell script to generate secrets
# Run: .\scripts\generate-secrets.ps1

Write-Host ""
Write-Host "🔐 Growth OS - Secret Generator" -ForegroundColor Cyan
Write-Host ""
Write-Host "=" * 50
Write-Host ""
Write-Host "Copy these values to your Vercel environment variables:" -ForegroundColor Yellow
Write-Host ""

# Generate encryption key (32 bytes, base64)
$encryptionKeyBytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($encryptionKeyBytes)
$encryptionKey = [Convert]::ToBase64String($encryptionKeyBytes)

# Generate cron secret (32 bytes, hex)
$cronSecretBytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($cronSecretBytes)
$cronSecret = ($cronSecretBytes | ForEach-Object { $_.ToString("x2") }) -join ""

Write-Host "ENCRYPTION_KEY=$encryptionKey" -ForegroundColor Green
Write-Host "CRON_SECRET=$cronSecret" -ForegroundColor Green
Write-Host ""
Write-Host "=" * 50
Write-Host ""
Write-Host "✅ Secrets generated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Copy ENCRYPTION_KEY to Vercel environment variables"
Write-Host "2. Copy CRON_SECRET to Vercel environment variables"
Write-Host "3. Make sure to set them for Production, Preview, and Development environments"
Write-Host ""

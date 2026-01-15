# Script untuk upload DigiNote ke VPS
# Jalankan: powershell -ExecutionPolicy Bypass -File upload-to-vps.ps1

$VPS_IP = "152.42.194.188"
$VPS_USER = "root"
$VPS_PATH = "/var/www/apps/diginote"

Write-Host "=== Upload DigiNote ke VPS ===" -ForegroundColor Green
Write-Host ""

# Compress files
Write-Host "1. Membuat archive..." -ForegroundColor Yellow
$excludeFiles = @(
    "node_modules",
    ".git",
    "*.log",
    ".env",
    "package-lock.json"
)

# Create temp directory
$tempDir = "diginote-deploy"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files
Write-Host "2. Menyalin files..." -ForegroundColor Yellow
Copy-Item -Path "backend" -Destination "$tempDir/backend" -Recurse -Exclude $excludeFiles
Copy-Item -Path "frontend" -Destination "$tempDir/frontend" -Recurse -Exclude $excludeFiles
Copy-Item -Path "*.md" -Destination "$tempDir/" -ErrorAction SilentlyContinue
Copy-Item -Path "*.sh" -Destination "$tempDir/" -ErrorAction SilentlyContinue
Copy-Item -Path "nginx.conf" -Destination "$tempDir/" -ErrorAction SilentlyContinue

# Create archive
Write-Host "3. Membuat archive..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir/*" -DestinationPath "diginote.zip" -Force

# Upload via SCP
Write-Host "4. Upload ke VPS..." -ForegroundColor Yellow
Write-Host "Jalankan command ini di terminal:" -ForegroundColor Cyan
Write-Host "scp diginote.zip ${VPS_USER}@${VPS_IP}:/tmp/" -ForegroundColor White
Write-Host ""
Write-Host "Setelah upload selesai, lanjut ke Step 3" -ForegroundColor Yellow

# Cleanup
Remove-Item -Recurse -Force $tempDir

Write-Host ""
Write-Host "File diginote.zip sudah siap!" -ForegroundColor Green

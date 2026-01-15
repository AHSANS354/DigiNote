# Test script untuk API

Write-Host "Testing Backend API..." -ForegroundColor Green

# Test Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
Write-Host "Response: $($health | ConvertTo-Json)" -ForegroundColor Cyan

# Test Register
Write-Host "`n2. Testing Register..." -ForegroundColor Yellow
$registerBody = @{
    username = "testuser"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "Register Success: $($register | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "Register Error (mungkin user sudah ada): $($_.Exception.Message)" -ForegroundColor Red
}

# Test Login
Write-Host "`n3. Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    username = "testuser"
    password = "password123"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "Login Success!" -ForegroundColor Cyan
    Write-Host "Token: $($login.token.Substring(0, 20))..." -ForegroundColor Cyan
    
    $token = $login.token
    
    # Test Get Transactions
    Write-Host "`n4. Testing Get Transactions..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $token"
    }
    $transactions = Invoke-RestMethod -Uri "http://localhost:5000/api/transactions" -Method Get -Headers $headers
    Write-Host "Transactions: $($transactions | ConvertTo-Json)" -ForegroundColor Cyan
    
    # Test Get Summary
    Write-Host "`n5. Testing Get Summary..." -ForegroundColor Yellow
    $summary = Invoke-RestMethod -Uri "http://localhost:5000/api/transactions/summary" -Method Get -Headers $headers
    Write-Host "Summary: $($summary | ConvertTo-Json)" -ForegroundColor Cyan
    
} catch {
    Write-Host "Login Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest selesai!" -ForegroundColor Green

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$BackendPython = Join-Path $ProjectRoot "backend\.venv\Scripts\python.exe"

if (-not (Test-Path $BackendPython)) {
    throw "Backend environment not found. Run .\setup.ps1 first."
}

$BackendCommand = "Set-Location '$ProjectRoot\backend'; & '$BackendPython' -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
$FrontendCommand = "Set-Location '$ProjectRoot\frontend'; npm run dev"

Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $BackendCommand
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $FrontendCommand

Write-Host "Starting AeroCast..." -ForegroundColor Cyan
Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "API docs: http://127.0.0.1:8000/api/docs"

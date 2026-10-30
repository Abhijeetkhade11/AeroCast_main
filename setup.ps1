$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "Setting up AeroCast..." -ForegroundColor Cyan

$Python311 = py -3.11 -c "import sys; print(sys.executable)" 2>$null
if (-not $Python311) {
    throw "Python 3.11 is required. Install it with: winget install -e --id Python.Python.3.11"
}

$VenvPython = Join-Path $ProjectRoot "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    py -3.11 -m venv (Join-Path $ProjectRoot "backend\.venv")
}

& $VenvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw "pip upgrade failed" }

& $VenvPython -m pip install -r (Join-Path $ProjectRoot "backend\requirements.txt")
if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed" }

& $VenvPython (Join-Path $ProjectRoot "scripts\generate_sample_data.py")
if ($LASTEXITCODE -ne 0) { throw "Sample data generation failed" }

& $VenvPython (Join-Path $ProjectRoot "scripts\run_pipeline.py")
if ($LASTEXITCODE -ne 0) { throw "Data pipeline failed" }

Push-Location (Join-Path $ProjectRoot "backend")
try {
    & .\.venv\Scripts\python.exe -m ml.training.train_all
    if ($LASTEXITCODE -ne 0) { throw "Model training failed" }
}
finally {
    Pop-Location
}

Push-Location (Join-Path $ProjectRoot "frontend")
try {
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed" }
}
finally {
    Pop-Location
}

Write-Host "AeroCast setup completed successfully." -ForegroundColor Green

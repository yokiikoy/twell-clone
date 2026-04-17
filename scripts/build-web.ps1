# Production build for apps/web with Node on PATH (same pattern as dev-web.ps1).
$ErrorActionPreference = "Stop"
$nodeDir = "${env:ProgramFiles}\nodejs"
if (-not (Test-Path (Join-Path $nodeDir "node.exe"))) {
  Write-Error "node.exe not found at $nodeDir — install Node.js LTS or adjust path."
}
$env:Path = "$nodeDir;$env:Path"
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "PATH prepended: $nodeDir"
Write-Host "Repo: $(Get-Location)"
Write-Host "Running: npm run build -w web"
& npm run build -w web

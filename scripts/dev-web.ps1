# Start Next.js dev server with Node on PATH (fixes "'node' is not recognized" when
# PowerShell does not inherit C:\Program Files\nodejs from the installer).
$ErrorActionPreference = "Stop"
$nodeDir = "${env:ProgramFiles}\nodejs"
if (-not (Test-Path (Join-Path $nodeDir "node.exe"))) {
  Write-Error "node.exe not found at $nodeDir — install Node.js LTS or adjust path."
}
$env:Path = "$nodeDir;$env:Path"
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "PATH prepended: $nodeDir"
Write-Host "Repo: $(Get-Location)"
Write-Host "Running: npm run dev -w web"
& npm run dev -w web

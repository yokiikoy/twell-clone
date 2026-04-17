# Idempotent: append "%ProgramFiles%\nodejs" to the *user* PATH if missing.
$ErrorActionPreference = "Stop"
$nodeDir = Join-Path $env:ProgramFiles "nodejs"
if (-not (Test-Path (Join-Path $nodeDir "node.exe"))) {
  Write-Error "node.exe not found at $nodeDir — install Node.js or edit this script."
  exit 1
}

$cur = [Environment]::GetEnvironmentVariable("Path", "User")
if ($null -eq $cur) { $cur = "" }

$parts = $cur -split ";" | Where-Object { $_ -ne "" }
if ($parts -contains $nodeDir) {
  Write-Host "Already on user PATH: $nodeDir"
  exit 0
}

$newPath = if ($cur.Trim().Length -gt 0) { "$cur;$nodeDir" } else { $nodeDir }
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
Write-Host "Appended to user Path: $nodeDir"
Write-Host "Open a new PowerShell or CMD window, then run: node -v && npm -v"

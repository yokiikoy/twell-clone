# Workaround: PowerShell runs npm.ps1 first, which is blocked under Restricted execution policy.
# Put tiny npm.cmd / npx.cmd shims in ~/.typewell-jr/bin and PREPEND that folder to the user PATH
# so `npm` resolves to .cmd (no execution policy) instead of npm.ps1.
$ErrorActionPreference = "Stop"
$nodeDir = Join-Path $env:ProgramFiles "nodejs"
$npmReal = Join-Path $nodeDir "npm.cmd"
$npxReal = Join-Path $nodeDir "npx.cmd"
foreach ($p in @($npmReal, $npxReal)) {
  if (-not (Test-Path $p)) {
    Write-Error "Missing: $p — install Node.js or edit paths in this script."
    exit 1
  }
}

$shimDir = Join-Path $env:USERPROFILE ".typewell-jr\bin"
New-Item -ItemType Directory -Force -Path $shimDir | Out-Null

$npmShim = Join-Path $shimDir "npm.cmd"
$npxShim = Join-Path $shimDir "npx.cmd"
@"
@echo off
"$npmReal" %*
"@ | Set-Content -LiteralPath $npmShim -Encoding ascii
@"
@echo off
"$npxReal" %*
"@ | Set-Content -LiteralPath $npxShim -Encoding ascii
Write-Host "Wrote: $npmShim"
Write-Host "Wrote: $npxShim"

$cur = [Environment]::GetEnvironmentVariable("Path", "User")
if ($null -eq $cur) { $cur = "" }
$parts = @($cur -split ";" | Where-Object { $_ -ne "" } | Where-Object { $_ -ne $shimDir })
$rest = if ($parts.Count -gt 0) { ($parts -join ";") } else { "" }
$newPath = if ($rest) { "$shimDir;$rest" } else { $shimDir }
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
Write-Host "Prepended user Path with: $shimDir"
Write-Host "Open a NEW PowerShell window, then: npm -v"

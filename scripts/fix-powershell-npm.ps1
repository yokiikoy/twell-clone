# Fix `npm` / `npx` in PowerShell when npm.ps1 is blocked by execution policy.
# 1) Prefer shims (~/.typewell-jr/bin) — works even under Group Policy.
# 2) Optionally relax CurrentUser policy to RemoteSigned when allowed.
$ErrorActionPreference = "Stop"

$shimScript = Join-Path $PSScriptRoot "install-npm-powershell-shim.ps1"
& $shimScript
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

try {
  $pol = Get-ExecutionPolicy -Scope CurrentUser
  if ($pol -ne "RemoteSigned" -and $pol -ne "Bypass" -and $pol -ne "Unrestricted") {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "Set ExecutionPolicy (CurrentUser) to RemoteSigned (was: $pol)."
  }
} catch {
  Write-Host "ExecutionPolicy not changed (often OK): $($_.Exception.Message)"
}
Write-Host "Done. Open a new terminal and run: npm -v"

# Full monorepo build (engine typecheck + Next web) with Node on PATH.
$ErrorActionPreference = "Stop"
$nodeDir = "${env:ProgramFiles}\nodejs"
if (-not (Test-Path (Join-Path $nodeDir "node.exe"))) {
  Write-Error "node.exe not found at $nodeDir — install Node.js LTS or adjust path."
}
$env:Path = "$nodeDir;$env:Path"
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "PATH prepended: $nodeDir"
Write-Host "Repo: $(Get-Location)"
Write-Host "Running: npm run build -w @typewell-jr/engine && npm run build -w web"
& npm run build -w @typewell-jr/engine
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& npm run build -w web
exit $LASTEXITCODE

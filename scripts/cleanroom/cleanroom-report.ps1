# Lane A aggregates + master coverage (heuristic tuning). Does not run full wordlist build.
param(
  [string]$InputDir = ""
)
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Pipeline = Join-Path $Root "packages/cleanroom-pipeline"
$Cache = Join-Path $Pipeline ".cache"
$RefProf = Join-Path $Cache "reference_profiles"
$Public = if ($InputDir) { $InputDir } else { Join-Path $Root "apps/web/public" }
$Master = Join-Path $Cache "master.jsonl"

$Py = $null
foreach ($cand in @(
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe"
  )) {
  if (Test-Path $cand) { $Py = $cand; break }
}
if (-not $Py -and (Get-Command python -ErrorAction SilentlyContinue)) {
  $src = (Get-Command python).Source
  if ($src -notmatch "WindowsApps\\python") { $Py = $src }
}
if (-not $Py) { throw "Python 3.11+ not found." }

New-Item -ItemType Directory -Force -Path $RefProf | Out-Null
Push-Location $Pipeline
try {
  & $Py -m cleanroom_pipeline reference-features --input-dir "$Public" --output-dir "$RefProf"
  if ($LASTEXITCODE -ne 0) { throw "reference-features failed (exit $LASTEXITCODE)" }
  if (Test-Path $Master) {
    $sum = Join-Path $RefProf "summary.json"
    $cov = Join-Path $RefProf "COVERAGE_REPORT.md"
    & $Py -m cleanroom_pipeline compare-coverage -i "$Master" --reference-profiles "$sum" -o "$cov"
    if ($LASTEXITCODE -ne 0) { throw "compare-coverage failed (exit $LASTEXITCODE)" }
    Write-Host "Wrote $cov"
  } else {
    Write-Host "Skip compare-coverage (no master at $Master). Run ingest first or full cleanroom:gen-wordlists."
  }
  Write-Host "Wrote $RefProf\HEURISTIC_REPORT.md and summary.json"
}
finally {
  Pop-Location
}

# Generate apps/web/public/cleanroom/twelljr-cr-*.json (29 lanes) from Tatoeba-derived corpus.
# Semantic centroid: filtered candidates JSONL (--from-candidates-jsonl), not twelljr-*.json.
# Lane semantics: docs/cleanroom/lane-taxonomy-v1.md (cr-jou/cr-kata need ingest sn_*; cr-kan/cr-koto need enrich-* gazettes or stay empty).
# Requires: Python 3.11+, npm install at repo root, network for fetch-open-corpora (Tatoeba + JMdict).
# -StartFromSlug cr-kata3 : resume lane loop only (use with -SkipCorpus after a full run).
# -SkipCorpus              : skip fetch/build/ingest; requires existing .cache/master.jsonl
param([switch]$SkipReport, [string]$StartFromSlug = "", [switch]$SkipCorpus)
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Pipeline = Join-Path $Root "packages/cleanroom-pipeline"
$Cache = Join-Path $Pipeline ".cache"
$Profiles = Join-Path $Cache "profiles"
$Public = Join-Path $Root "apps/web/public"
$OutDir = Join-Path $Public "cleanroom"

# Prefer a real interpreter over the WindowsApps "python" shim.
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
if (-not $Py) {
  throw "Python 3.11+ not found (avoid Windows Store shim). Install from python.org or set PATH."
}

function Invoke-Py {
  param([Parameter(Mandatory = $true)][string[]]$PyArgs)
  & $Py @PyArgs
  if ($LASTEXITCODE -ne 0) {
    throw "python $($PyArgs -join ' ') failed (exit $LASTEXITCODE)"
  }
}

New-Item -ItemType Directory -Force -Path $Cache, $Profiles | Out-Null

Push-Location $Pipeline
try {
  # Always sync editable install so `python -m cleanroom_pipeline` loads this repo (not a stale site-packages copy).
  Write-Host "pip install -e .[build,semantic] (sync sources)..."
  Invoke-Py -PyArgs @("-m", "pip", "install", "-q", "-e", ".[build,semantic]")
  & $Py -c "import cleanroom_pipeline, cutlet, unidic_lite, sentence_transformers" 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Required imports failed after pip install -e .[build,semantic]"
  }
  $corpus = Join-Path $Cache "corpus.tsv"
  $master = Join-Path $Cache "master.jsonl"
  if (-not $SkipCorpus) {
    $openCorpora = Join-Path $Cache "open_corpora"
    Write-Host "fetch-open-corpora (network required) -> $openCorpora"
    Invoke-Py -PyArgs @("-m", "cleanroom_pipeline", "fetch-open-corpora", "--dest", "$openCorpora")

    $tatoebaTsv = Join-Path $openCorpora "tatoeba\jpn_sentences.tsv"
    Write-Host "build-corpus-from-tatoeba -> $corpus"
    Invoke-Py -PyArgs @(
      "-m", "cleanroom_pipeline", "build-corpus-from-tatoeba",
      "-i", "$tatoebaTsv", "-o", "$corpus", "--max-surfaces", "60000"
    )
    Write-Host "ingest -> $master"
    Invoke-Py -PyArgs @("-m", "cleanroom_pipeline", "ingest", "-i", "$corpus", "-o", "$master")
  } else {
    Write-Host "SkipCorpus: using existing master -> $master"
    if (-not (Test-Path $master)) {
      throw "master.jsonl not found at $master (run once without -SkipCorpus)"
    }
  }

  if (-not $SkipReport) {
    $RefProf = Join-Path $Cache "reference_profiles"
    try {
      New-Item -ItemType Directory -Force -Path $RefProf | Out-Null
      Write-Host "reference-features -> $RefProf"
      & $Py -m cleanroom_pipeline reference-features --input-dir "$Public" --output-dir "$RefProf"
      if ($LASTEXITCODE -eq 0) {
        $sum = Join-Path $RefProf "summary.json"
        $covMd = Join-Path $RefProf "COVERAGE_REPORT.md"
        Write-Host "compare-coverage -> $covMd"
        & $Py -m cleanroom_pipeline compare-coverage -i "$master" --reference-profiles "$sum" -o "$covMd"
        if ($LASTEXITCODE -ne 0) {
          Write-Warning "compare-coverage exited $LASTEXITCODE (continuing wordlist build)"
        }
      } else {
        Write-Warning "reference-features exited $LASTEXITCODE (continuing wordlist build)"
      }
    } catch {
      Write-Warning "cleanroom heuristic report skipped: $_"
    }
  }

  # Avoid PowerShell mangling python -c (e.g. $lid / ":s"); call a small helper script instead.
  $laneModesScript = Join-Path $Root "scripts/cleanroom/print_cr_lane_modes.py"
  $deckRowsJson = Invoke-Py -PyArgs @("$laneModesScript")
  $deckRows = $deckRowsJson | ConvertFrom-Json
  if ($deckRows.Count -ne 29) {
    throw "expected 29 cleanroom lanes (CR_LANE_SLUGS), got $($deckRows.Count)"
  }

  $MaxExportRows = 2000

  $deckActive = [string]::IsNullOrWhiteSpace($StartFromSlug)
  if (-not $deckActive) {
    $known = @($deckRows | ForEach-Object { $_.slug })
    if ($known -notcontains $StartFromSlug) {
      throw "StartFromSlug '$StartFromSlug' is not one of CR_LANE_SLUGS"
    }
  }

  foreach ($row in $deckRows) {
    if (-not $deckActive) {
      if ($row.slug -eq $StartFromSlug) {
        $deckActive = $true
      } else {
        continue
      }
    }
    $slug = $row.slug
    $mode = $row.mode
    $prof = Join-Path $Profiles "$slug.json"
    $candidates = Join-Path $Cache "candidates_$slug.jsonl"
    $stroked = Join-Path $Cache "stroked_$slug.jsonl"
    $scored = Join-Path $Cache "scored_$slug.jsonl"
    $outJson = Join-Path $OutDir "twelljr-$slug.json"

    Write-Host "deck $slug : filter-deck -> $candidates"
    $filterArgs = @("-m", "cleanroom_pipeline", "filter-deck", "-i", "$master", "-o", "$candidates", "--deck", "$slug")
    if ($slug -eq "cr-jou1") {
      $filterArgs += @("--strict-jou-verb-morph")
    }
    Invoke-Py -PyArgs $filterArgs
    Push-Location $Root
    try {
      Write-Host "deck $slug : join-strokes ($mode) -> $stroked"
      npm run cleanroom:join-strokes -w @typewell-jr/engine -- --input "../cleanroom-pipeline/.cache/candidates_$slug.jsonl" --output "../cleanroom-pipeline/.cache/stroked_$slug.jsonl" --mode $mode
      if ($LASTEXITCODE -ne 0) {
        throw "join-strokes failed for $slug (exit $LASTEXITCODE)"
      }
    } finally {
      Pop-Location
    }

    Write-Host "deck $slug : profile-semantic (centroid from candidates JSONL)"
    Invoke-Py -PyArgs @(
      "-m", "cleanroom_pipeline", "profile-semantic",
      "-i", "$candidates",
      "--from-candidates-jsonl",
      "--deck", "$slug",
      "-o", "$prof"
    )
    Write-Host "deck $slug : score-semantic"
    Invoke-Py -PyArgs @("-m", "cleanroom_pipeline", "score-semantic", "-i", "$stroked", "-p", "$prof", "-o", "$scored")
    Write-Host "deck $slug : export -> $outJson (max $MaxExportRows rows)"
    Invoke-Py -PyArgs @(
      "-m", "cleanroom_pipeline", "export", "-i", "$scored", "--deck", "$slug", "-o", "$outJson",
      "--max-rows", "$MaxExportRows"
    )
  }
}
finally {
  Pop-Location
}

Write-Host "Done. Updated JSON under $OutDir"

$ErrorActionPreference = 'Stop'

# Resolve gh path (prefer PATH, fallback to default install location)
$gh = (Get-Command gh -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $gh) {
  $defaultGh = 'C:\Program Files\GitHub CLI\gh.exe'
  if (Test-Path $defaultGh) { $gh = $defaultGh } else { throw 'GitHub CLI (gh) not found on PATH and default location not present.' }
}

$title = 'feat(#96): Option A server-backed SVG→GIF export (Playwright+FFmpeg); docs, ADR, setup script, tests'
$body = @"
This PR implements Option A from #96: server-backed SVG→GIF export using Playwright + FFmpeg (palettegen/paletteuse), with inline SVG posted from the UI and a local Node server orchestrating a Python helper.

## Summary
- UI: Existing Export SVG→GIF button now prefers server-backed export; falls back to in-browser gif.js if server not available.
- Server: scripts/export-server.js exposes POST /api/export/gif; accepts inline SVG, runs Python converter, returns GIF bytes.
- Runner: scripts/lib/export-svg-to-gif-runner.js shells out to docs/prototypes/sample-code/scripts/svg_to_gif_converter.py and streams progress.
- CLI: scripts/export-svg-to-gif.js and npm run export:gif for ad-hoc use.
- Docs: docs/features/gif-export.md with setup, quick start (Windows), troubleshooting, env overrides (FFMPEG_DIR/FFMPEG_PATH), and endpoints.
- ADR: docs/adr/ADR-0024 — GIF export: Local helper (Option A) now, Remote service (Option B) next.md describing the longer-term remote service approach and implementation plan.
- Tests: __tests__/cli/export-gif.spec.ts mocking child_process to verify progress parsing and error behavior.
- DX: npm run export:setup to install Python Playwright and Chromium for the current Python.

## Windows ergonomics
- Auto-detect Winget FFmpeg install under %LOCALAPPDATA%\Microsoft\WinGet\Packages and prepend its bin to PATH on server startup; also honors FFMPEG_DIR or FFMPEG_PATH env vars.

## How to use
1) One-time local setup:
   - npm run export:setup
   - Start server: npm run export:server (or set EXPORT_SERVER_PORT)
2) Enable server export: window.EXPORT_SERVER_ENABLED = true (or pass options.serverExport = true)
3) In the app: select an SVG and click Export; a GIF will download if the server succeeds; otherwise client-side gif.js fallback applies.

## Follow-ups
- Option B: Implement a containerized remote export service with the same API; add a feature flag/env to switch the base URL from localhost to the hosted service.

## Refs
- fix #96
- docs/features/gif-export.md
- ADR-0024
"@

$temp = New-TemporaryFile
Set-Content -Path $temp -Value $body -Encoding UTF8

# Create the PR
$cmd = @(
  'pr','create',
  '--title', $title,
  '--body-file', $temp,
  '--base','main',
  '--head','feat/96-gif-export-option-a-server'
)

Write-Host "Running: $gh $($cmd -join ' ')"
$proc = Start-Process -FilePath $gh -ArgumentList $cmd -NoNewWindow -PassThru -Wait

# Capture output by re-running with stdout capture if needed
if ($proc.ExitCode -eq 0) {
  $out = & $gh @cmd 2>$null
  Write-Output $out
}

Remove-Item $temp -Force

exit $proc.ExitCode


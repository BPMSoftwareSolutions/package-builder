param(
  [switch]$Quiet
)

$pathsToCheck = @(
  'C:\Program Files\ffmpeg\bin\ffmpeg.exe',
  'C:\Program Files\FFmpeg\bin\ffmpeg.exe'
)

foreach ($p in $pathsToCheck) {
  if (Test-Path $p) { if (-not $Quiet) { Write-Host $p }; exit 0 }
}

# Common winget locations
$wingetLinks = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links'
$wingetPkgs  = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'

$tryDirs = @()
if (Test-Path $wingetLinks) { $tryDirs += $wingetLinks }
if (Test-Path $wingetPkgs)  { $tryDirs += $wingetPkgs }

foreach ($d in $tryDirs) {
  try {
    $ff = Get-ChildItem -Path $d -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($ff) { if (-not $Quiet) { Write-Host $ff }; exit 0 }
  } catch {}
}

# Fallback search in Program Files trees
try {
  $pf = Get-ChildItem -Path 'C:\Program Files','C:\Program Files (x86)' -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
  if ($pf) { if (-not $Quiet) { Write-Host $pf }; exit 0 }
} catch {}

if (-not $Quiet) { Write-Host 'NOT_FOUND' }
exit 1

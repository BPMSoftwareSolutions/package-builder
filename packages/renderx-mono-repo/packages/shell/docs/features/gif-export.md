## GIF Export (Playwright + FFmpeg via Python)

### Overview

- Converts an SVG (including animated content) to an optimized animated GIF
- Implementation per Issue #96 Option A: local Python runner using Playwright (Chromium) and FFmpeg palettegen/paletteuse
- Browser UI posts inline SVG to a local export server, which runs the converter and returns GIF bytes
- Falls back to in-browser gif.js encoding if the server is unavailable

### Prerequisites (local dev)

- Python 3.8+
- FFmpeg on PATH
  - Windows: winget install FFmpeg
  - macOS: brew install ffmpeg
  - Linux: apt-get install ffmpeg
- Playwright (Python):
  - pip install playwright
  - python -m playwright install chromium

### Start the local export server

- npm run export:server
- The server listens on http://localhost:5055 by default (use EXPORT_SERVER_PORT to change)
- Windows: the server auto-detects Winget-installed FFmpeg under %LOCALAPPDATA%\Microsoft\WinGet\Packages and prepends its bin to PATH. You can also set FFMPEG_DIR or FFMPEG_PATH to override.
- Endpoints:
  - POST /api/export/gif — request body described below
  - GET /healthz — returns { ok: true }

### Request shape (POST /api/export/gif)

- JSON body:
  - svg: string (required) — inline SVG markup
  - width: number (default 1000)
  - height: number (default 700)
  - duration: seconds (default 10)
  - fps: frames per second (default 20)
  - maxColors: <=256 (default 256)
  - dither: string (default sierra2_4a)
  - loop: number (default 0 = infinite)
  - filename: string (default export-<timestamp>.gif)

Response: image/gif bytes with Content-Disposition attachment.

### Using the CLI directly

- npm run export:gif -- --input path/to/input.svg --output path/to/output.gif [--duration 10 --fps 20 --width 1000 --height 700 --maxColors 256 --dither sierra2_4a --loop 0]
- This calls the same Python runner and is useful for debugging.

### UI usage (existing Export SVG to GIF button)

- Click the 🎬 icon in the canvas header after selecting a single SVG element
- The UI will:
  - Serialize the selected SVG to a string and post it to the export server
  - Download the returned GIF as a file named <elementId>-<timestamp>.gif
  - If the server is unavailable, it falls back to in-browser gif.js

### Troubleshooting

- FFmpeg missing
  - Windows: winget install FFmpeg (then restart your shell)
  - If Winget installed under LocalAppData and PATH isn’t updated, the export server now auto-detects and prepends the bin to PATH on Windows. You can override with FFMPEG_DIR or FFMPEG_PATH.
  - macOS: brew install ffmpeg
  - Linux: apt-get install ffmpeg
- Python missing
  - Install Python 3.8+ and ensure it is on PATH
- Playwright not installed (Python)
  - Run: python -m ensurepip --upgrade && python -m pip install --user playwright && python -m playwright install chromium
- CORS or connection errors from browser
  - Ensure the export server is running (npm run export:server)
  - The server enables permissive CORS for localhost

### Parameters parity

- duration (s), fps, width, height, maxColors, dither, loop are supported and passed through to the Python runner.

### Notes

- This is a local-only helper. A follow-up may move this flow into a hosted/export service (Option B).

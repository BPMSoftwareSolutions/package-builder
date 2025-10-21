#!/usr/bin/env python3
"""
SVG to animated GIF Converter Script

Renders an animated SVG via Playwright (Chromium), captures frames, and assembles
an optimized animated GIF using FFmpeg palettegen/paletteuse.

Requirements:
- python 3.8+
- playwright (pip install playwright; then python -m playwright install chromium)
- ffmpeg available on PATH

Usage:
    python scripts/svg_to_gif_converter.py input.svg output.gif [options]
"""

import argparse
import asyncio
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Error: playwright is required. Install with: pip install playwright")
    print("Then run: python -m playwright install chromium")
    sys.exit(1)


class SVGToGIFConverter:
    def __init__(self, svg_path: str, output_path: str, duration: float = 10.0,
                 fps: int = 20, width: int = 1000, height: int = 700,
                 max_colors: int = 256, dither: str = "sierra2_4a", loop: int = 0):
        self.svg_path = Path(svg_path)
        self.output_path = Path(output_path)
        self.duration = duration
        self.fps = fps
        self.width = width
        self.height = height
        self.max_colors = max_colors
        self.dither = dither
        self.loop = loop
        self.total_frames = int(round(duration * fps))

        if not self.svg_path.exists():
            raise FileNotFoundError(f"SVG file not found: {svg_path}")

        # Ensure output directory exists
        self.output_path.parent.mkdir(parents=True, exist_ok=True)

        if not shutil.which("ffmpeg"):
            # Try WinGet Links path as a fallback within this process
            win_links = Path(os.environ.get('LOCALAPPDATA', '')) / 'Microsoft' / 'WinGet' / 'Links'
            if win_links.exists():
                os.environ['PATH'] = f"{str(win_links)}{os.pathsep}" + os.environ.get('PATH', '')
        if not shutil.which("ffmpeg"):
            raise RuntimeError("FFmpeg is required but not found on PATH")

    def create_html_wrapper(self, svg_content: str) -> str:
        return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset=\"utf-8\" />
  <style>
    html, body {{ margin: 0; padding: 0; background: white; overflow: hidden; }}
    svg {{ display: block; width: {self.width}px; height: {self.height}px; }}
  </style>
</head>
<body>
  {svg_content}
</body>
</html>
"""

    async def capture_frames(self, temp_dir: Path) -> None:
        print(f"Capturing {self.total_frames} frames @ {self.fps} fps...")
        svg_content = self.svg_path.read_text(encoding='utf-8')
        html = self.create_html_wrapper(svg_content)
        html_file = temp_dir / "animation.html"
        html_file.write_text(html, encoding='utf-8')

        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.set_viewport_size({"width": self.width, "height": self.height})
            await page.goto(f"file://{html_file.absolute()}")
            await page.wait_for_load_state("networkidle")

            frame_interval_ms = 1000 / self.fps
            for i in range(self.total_frames):
                if i > 0:
                    await page.wait_for_timeout(frame_interval_ms)
                frame_path = temp_dir / f"frame_{i:06d}.png"
                await page.screenshot(path=str(frame_path), full_page=True)
                if i % 30 == 0 or i == self.total_frames - 1:
                    pct = (i + 1) / self.total_frames * 100
                    print(f"Progress: {pct:.1f}% ({i + 1}/{self.total_frames})")
            await browser.close()

    def create_gif(self, temp_dir: Path) -> None:
        print("Generating palette and assembling GIF with FFmpeg...")
        palette = temp_dir / "palette.png"
        frames_pattern = str(temp_dir / "frame_%06d.png")

        # 1) Palette generation
        vf_palette = f"palettegen=stats_mode=full:max_colors={self.max_colors}"
        cmd_palette = [
            "ffmpeg", "-y",
            "-framerate", str(self.fps),
            "-i", frames_pattern,
            "-vf", vf_palette,
            str(palette)
        ]
        subprocess.run(cmd_palette, check=True, capture_output=True)

        # 2) Palette use for final GIF
        lavfi_use = f"paletteuse=dither={self.dither}"
        cmd_gif = [
            "ffmpeg", "-y",
            "-framerate", str(self.fps),
            "-i", frames_pattern,
            "-i", str(palette),
            "-lavfi", lavfi_use,
            "-loop", str(self.loop),
            str(self.output_path)
        ]
        subprocess.run(cmd_gif, check=True, capture_output=True)
        print(f"GIF created: {self.output_path}")

    async def convert(self) -> None:
        print(f"Converting {self.svg_path} -> {self.output_path}")
        print(f"Duration: {self.duration}s, FPS: {self.fps}, Size: {self.width}x{self.height}, Colors: {self.max_colors}, Dither: {self.dither}")
        with tempfile.TemporaryDirectory() as td:
            temp_dir = Path(td)
            await self.capture_frames(temp_dir)
            self.create_gif(temp_dir)
        print("Conversion completed!")


async def main():
    parser = argparse.ArgumentParser(description="Convert animated SVG to animated GIF")
    parser.add_argument("input", help="Input SVG file path")
    parser.add_argument("output", help="Output GIF file path")
    parser.add_argument("--duration", "-d", type=float, default=10.0, help="Video duration in seconds")
    parser.add_argument("--fps", "-f", type=int, default=20, help="Frames per second")
    parser.add_argument("--width", "-w", type=int, default=1000, help="Output width in pixels")
    parser.add_argument("--height", "-H", type=int, default=700, help="Output height in pixels")
    parser.add_argument("--max-colors", type=int, default=256, help="Max palette colors (<=256)")
    parser.add_argument("--dither", type=str, default="sierra2_4a", help="Dither method (none, bayer, floyd_steinberg, sierra2_4a, etc.)")
    parser.add_argument("--loop", type=int, default=0, help="Loop count (0=infinite)")

    args = parser.parse_args()

    try:
        converter = SVGToGIFConverter(
            svg_path=args.input,
            output_path=args.output,
            duration=args.duration,
            fps=args.fps,
            width=args.width,
            height=args.height,
            max_colors=args.max_colors,
            dither=args.dither,
            loop=args.loop,
        )
        await converter.convert()
    except subprocess.CalledProcessError as e:
        sys.stderr.write(e.stderr or str(e))
        sys.exit(e.returncode or 1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())


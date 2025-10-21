#!/usr/bin/env python3
"""
SVG to MP4 Converter Script

This script converts an animated SVG file to MP4 video format.
It uses Playwright to render the SVG in a browser and capture frames,
then uses FFmpeg to create the final MP4 video.

Requirements:
- playwright
- ffmpeg (system dependency)

Usage:
    python svg_to_mp4_converter.py input.svg output.mp4 [options]
"""

import argparse
import asyncio
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Error: playwright is required. Install with: pip install playwright")
    print("Then run: playwright install chromium")
    sys.exit(1)


class SVGToMP4Converter:
    def __init__(self, svg_path: str, output_path: str, duration: float = 10.0, 
                 fps: int = 30, width: int = 1000, height: int = 700):
        self.svg_path = Path(svg_path)
        self.output_path = Path(output_path)
        self.duration = duration
        self.fps = fps
        self.width = width
        self.height = height
        self.total_frames = int(duration * fps)
        
        # Validate inputs
        if not self.svg_path.exists():
            raise FileNotFoundError(f"SVG file not found: {svg_path}")
        
        # Check if ffmpeg is available
        if not shutil.which("ffmpeg"):
            raise RuntimeError("FFmpeg is required but not found in PATH")
    
    def create_html_wrapper(self, svg_content: str) -> str:
        """Create an HTML wrapper for the SVG to ensure proper rendering."""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{
            margin: 0;
            padding: 0;
            background: white;
            overflow: hidden;
        }}
        svg {{
            display: block;
            width: {self.width}px;
            height: {self.height}px;
        }}
    </style>
</head>
<body>
    {svg_content}
</body>
</html>
"""
    
    async def capture_frames(self, temp_dir: Path) -> None:
        """Capture frames from the animated SVG using Playwright."""
        print(f"Capturing {self.total_frames} frames...")
        
        # Read SVG content
        svg_content = self.svg_path.read_text(encoding='utf-8')
        html_content = self.create_html_wrapper(svg_content)
        
        # Create temporary HTML file
        html_file = temp_dir / "animation.html"
        html_file.write_text(html_content, encoding='utf-8')
        
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            # Set viewport size
            await page.set_viewport_size({"width": self.width, "height": self.height})
            
            # Navigate to the HTML file
            await page.goto(f"file://{html_file.absolute()}")
            
            # Wait for the page to load
            await page.wait_for_load_state("networkidle")
            
            # Capture frames
            frame_interval = 1000 / self.fps  # milliseconds per frame
            
            for frame_num in range(self.total_frames):
                # Calculate time for this frame
                current_time = frame_num * frame_interval
                
                # Wait for the specific time point
                if frame_num > 0:
                    await page.wait_for_timeout(frame_interval)
                
                # Capture screenshot
                frame_path = temp_dir / f"frame_{frame_num:06d}.png"
                await page.screenshot(path=str(frame_path), full_page=True)
                
                # Progress indicator
                if frame_num % 30 == 0 or frame_num == self.total_frames - 1:
                    progress = (frame_num + 1) / self.total_frames * 100
                    print(f"Progress: {progress:.1f}% ({frame_num + 1}/{self.total_frames})")
            
            await browser.close()
    
    def create_video(self, temp_dir: Path) -> None:
        """Create MP4 video from captured frames using FFmpeg."""
        print("Creating MP4 video...")
        
        # FFmpeg command to create video from image sequence
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
            "-framerate", str(self.fps),
            "-i", str(temp_dir / "frame_%06d.png"),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-crf", "18",  # High quality
            "-preset", "medium",
            str(self.output_path)
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"Video created successfully: {self.output_path}")
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error: {e.stderr}")
            raise
    
    async def convert(self) -> None:
        """Main conversion method."""
        print(f"Converting {self.svg_path} to {self.output_path}")
        print(f"Duration: {self.duration}s, FPS: {self.fps}, Resolution: {self.width}x{self.height}")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Capture frames
            await self.capture_frames(temp_path)
            
            # Create video
            self.create_video(temp_path)
        
        print("Conversion completed!")


async def main():
    parser = argparse.ArgumentParser(description="Convert animated SVG to MP4")
    parser.add_argument("input", help="Input SVG file path")
    parser.add_argument("output", help="Output MP4 file path")
    parser.add_argument("--duration", "-d", type=float, default=10.0,
                       help="Video duration in seconds (default: 10.0)")
    parser.add_argument("--fps", "-f", type=int, default=30,
                       help="Frames per second (default: 30)")
    parser.add_argument("--width", "-w", type=int, default=1000,
                       help="Video width in pixels (default: 1000)")
    parser.add_argument("--height", "-H", type=int, default=700,
                       help="Video height in pixels (default: 700)")

    args = parser.parse_args()

    try:
        converter = SVGToMP4Converter(
            svg_path=args.input,
            output_path=args.output,
            duration=args.duration,
            fps=args.fps,
            width=args.width,
            height=args.height
        )

        await converter.convert()

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

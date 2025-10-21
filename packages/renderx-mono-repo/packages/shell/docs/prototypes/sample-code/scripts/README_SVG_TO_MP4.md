# SVG to MP4 Converter

This directory contains scripts to convert the animated SVG diagram (`messy_codebase_diagram.svg`) to MP4 video format.

## Files

- `svg_to_mp4_converter.py` - Main Python script that handles the conversion
- `convert_svg_to_mp4.bat` - Windows batch script for easy execution
- `Convert-SVGToMP4.ps1` - PowerShell script with enhanced features
- `README_SVG_TO_MP4.md` - This documentation file

## Prerequisites

### Required Software

1. **Python 3.7+** - Download from [python.org](https://www.python.org/downloads/)
2. **FFmpeg** - Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Make sure FFmpeg is added to your system PATH

### Python Dependencies

The scripts will automatically install these if not present:
- `playwright` - For browser automation and SVG rendering

## Usage

### Option 1: Windows Batch Script (Easiest)

1. Double-click `convert_svg_to_mp4.bat`
2. The script will:
   - Check all dependencies
   - Install missing Python packages
   - Convert the SVG to MP4
   - Save the output to `data/assets/videos/messy_codebase_diagram.mp4`

### Option 2: PowerShell Script (Recommended)

1. Open PowerShell as Administrator (if needed for package installation)
2. Navigate to the project directory
3. Run: `.\scripts\Convert-SVGToMP4.ps1`

**PowerShell Parameters:**
```powershell
.\scripts\Convert-SVGToMP4.ps1 -Duration 20 -FPS 60 -Width 1920 -Height 1080
```

### Option 3: Direct Python Script

```bash
# Basic usage
python scripts/svg_to_mp4_converter.py data/assets/images/messy_codebase_diagram.svg output.mp4

# With custom parameters
python scripts/svg_to_mp4_converter.py input.svg output.mp4 --duration 15 --fps 30 --width 1000 --height 700
```

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--duration` / `-d` | Video duration in seconds | 10.0 |
| `--fps` / `-f` | Frames per second | 30 |
| `--width` / `-w` | Video width in pixels | 1000 |
| `--height` / `-h` | Video height in pixels | 700 |

## How It Works

1. **HTML Wrapper Creation**: The script wraps the SVG in an HTML document for proper browser rendering
2. **Browser Automation**: Uses Playwright to open the SVG in a Chromium browser
3. **Frame Capture**: Takes screenshots at regular intervals to capture the animation frames
4. **Video Assembly**: Uses FFmpeg to combine the frames into an MP4 video

## Output

The converted MP4 video will:
- Capture all CSS animations (pulse, shake effects)
- Maintain the original SVG quality
- Be compatible with most video players and web browsers
- Include all visual elements and styling

## Troubleshooting

### Common Issues

1. **"Python not found"**
   - Install Python from python.org
   - Make sure Python is added to PATH during installation

2. **"FFmpeg not found"**
   - Download FFmpeg from ffmpeg.org
   - Extract and add the `bin` folder to your system PATH
   - Restart your command prompt/PowerShell

3. **"Playwright installation failed"**
   - Run as Administrator
   - Try: `pip install --upgrade pip` first
   - Then: `pip install playwright`
   - Finally: `playwright install chromium`

4. **"Permission denied" errors**
   - Run PowerShell as Administrator
   - Check that the output directory is writable

### Manual Dependency Installation

If automatic installation fails:

```bash
# Install Python packages
pip install playwright

# Install Playwright browser
playwright install chromium
```

## Customization

### Modifying Animation Duration

To capture longer animations, increase the `--duration` parameter:
```bash
python scripts/svg_to_mp4_converter.py input.svg output.mp4 --duration 20
```

### Higher Quality Output

For better quality, increase FPS and resolution:
```bash
python scripts/svg_to_mp4_converter.py input.svg output.mp4 --fps 60 --width 1920 --height 1080
```

### Different Output Formats

The script uses FFmpeg, so you can modify the `create_video` method to output different formats (WebM, AVI, etc.).

## Performance Notes

- Higher FPS and resolution will increase processing time and file size
- A 10-second video at 30 FPS requires capturing 300 frames
- Each frame is a full-resolution screenshot, so temporary disk space is needed
- The script automatically cleans up temporary files after conversion

## License

This script is part of the BPM AI Speech-to-Articles project and follows the same licensing terms.

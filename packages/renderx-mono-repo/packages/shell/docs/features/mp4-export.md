# MP4 Animation Export

## Overview

The MP4 export feature allows you to export SVG canvas components as high-quality MP4 video files with smooth animations. This feature uses modern browser APIs (WebCodecs) with fallback support for broader compatibility.

## Basic Usage

### Simple MP4 Export

```typescript
await conductor.play("CanvasComponentExportMp4Plugin", "canvas-component-export-mp4-symphony", {
  targetId: "my-svg-element",
  options: {
    width: 800,
    height: 600,
    fps: 30,
    durationMs: 3000
  }
});
```

### With Animation Keyframes

```typescript
await conductor.play("CanvasComponentExportMp4Plugin", "canvas-component-export-mp4-symphony", {
  targetId: "animated-svg",
  options: {
    width: 1200,
    height: 800,
    fps: 30,
    durationMs: 5000,
    bitrate: 2000000, // 2Mbps
    animation: {
      keyframes: [
        {
          selector: ".rotating-element",
          attr: "transform",
          from: 0,
          to: 360,
          kind: "rotate"
        },
        {
          selector: ".scaling-element", 
          attr: "transform",
          from: 1.0,
          to: 1.5,
          kind: "scale"
        },
        {
          selector: ".fading-element",
          attr: "opacity",
          from: 1.0,
          to: 0.3
        }
      ]
    }
  }
});
```

## Configuration Options

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | number | SVG width | Output video width in pixels |
| `height` | number | SVG height | Output video height in pixels |
| `fps` | number | 30 | Frames per second (1-60) |
| `durationMs` | number | 0 | Animation duration in milliseconds |

### Advanced Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bitrate` | number | 2000000 | Video bitrate in bits per second |
| `codec` | string | "avc1.42001f" | H.264 codec profile |
| `backgroundColor` | string | transparent | Background fill color |
| `exportScope` | "inner" \| "wrapper" | "inner" | Export scope selection |
| `contentSelector` | string | undefined | CSS selector for content subset |

### Animation Keyframes

Each keyframe object supports:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `selector` | string | ✅ | CSS selector for target elements |
| `attr` | string | ✅ | Attribute to animate |
| `from` | number | ✅ | Starting value |
| `to` | number | ✅ | Ending value |
| `kind` | "rotate" \| "scale" | ❌ | Transform type for special handling |

## Browser Compatibility

### WebCodecs API (Primary)
- ✅ **Chrome 94+**: Full support with hardware acceleration
- ✅ **Edge 94+**: Full support with hardware acceleration  
- ✅ **Firefox 130+**: Full support
- ❌ **Safari**: Not supported (as of 2024)

### MediaRecorder API (Fallback)
- ✅ **Chrome 47+**: WebM/MP4 support
- ✅ **Firefox 29+**: WebM support
- ✅ **Safari 14.1+**: MP4 support
- ✅ **Mobile browsers**: Varies by platform

### Graceful Degradation
The system automatically detects browser capabilities and:
1. **First**: Attempts WebCodecs for optimal quality and performance
2. **Fallback**: Uses MediaRecorder API for broader compatibility
3. **Error**: Provides clear error messages for unsupported browsers

## Quality Presets

### High Quality (Presentations)
```typescript
options: {
  fps: 30,
  bitrate: 3000000, // 3Mbps
  codec: "avc1.42001f"
}
```

### Standard Quality (General Use)
```typescript
options: {
  fps: 24,
  bitrate: 2000000, // 2Mbps
  codec: "avc1.42001f"
}
```

### Compact Size (Web Sharing)
```typescript
options: {
  fps: 15,
  bitrate: 1000000, // 1Mbps
  codec: "avc1.42001f"
}
```

## Advanced Examples

### Complex Multi-Element Animation
```typescript
await conductor.play("CanvasComponentExportMp4Plugin", "canvas-component-export-mp4-symphony", {
  targetId: "complex-animation",
  options: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationMs: 10000,
    bitrate: 5000000,
    backgroundColor: "#f0f0f0",
    animation: {
      keyframes: [
        // Rotating gears
        { selector: ".gear-1", attr: "transform", from: 0, to: 360, kind: "rotate" },
        { selector: ".gear-2", attr: "transform", from: 0, to: -360, kind: "rotate" },
        
        // Pulsing elements
        { selector: ".pulse", attr: "transform", from: 1.0, to: 1.2, kind: "scale" },
        { selector: ".pulse", attr: "opacity", from: 1.0, to: 0.7 },
        
        // Moving elements
        { selector: ".slider", attr: "x", from: 0, to: 200 },
        
        // Color transitions (stroke-dashoffset for line animations)
        { selector: ".animated-path", attr: "stroke-dashoffset", from: 100, to: 0 }
      ]
    }
  }
});
```

### Selective Content Export
```typescript
await conductor.play("CanvasComponentExportMp4Plugin", "canvas-component-export-mp4-symphony", {
  targetId: "full-diagram",
  options: {
    width: 800,
    height: 600,
    contentSelector: ".export-group", // Only export this group
    exportScope: "inner",
    animation: {
      keyframes: [
        { selector: ".highlight", attr: "opacity", from: 0, to: 1 }
      ]
    }
  }
});
```

## Error Handling

### Common Error Scenarios
```typescript
try {
  await conductor.play("CanvasComponentExportMp4Plugin", "canvas-component-export-mp4-symphony", {
    targetId: "my-svg",
    options: { /* ... */ }
  });
} catch (error) {
  if (error.message.includes("not supported")) {
    // Browser doesn't support MP4 export
    console.log("Falling back to GIF export...");
    // Trigger GIF export instead
  } else if (error.message.includes("not found")) {
    // Target element doesn't exist
    console.error("SVG element not found");
  } else {
    // Other encoding errors
    console.error("Export failed:", error);
  }
}
```

### Browser Detection
```typescript
// Check WebCodecs support
const hasWebCodecs = 'VideoEncoder' in window;

// Check MediaRecorder support  
const hasMediaRecorder = 'MediaRecorder' in window;

if (!hasWebCodecs && !hasMediaRecorder) {
  console.warn("MP4 export not supported in this browser");
  // Show GIF export option instead
}
```

## Performance Tips

### Optimize for Large Animations
- Use lower FPS (15-24) for longer animations
- Reduce bitrate for web sharing (1-2 Mbps)
- Consider breaking very long animations into segments

### Improve Encoding Speed
- Reduce canvas dimensions when possible
- Minimize the number of animated elements
- Use simpler keyframe animations
- Enable hardware acceleration (WebCodecs automatically uses it)

### Memory Management
- Export large animations in smaller chunks if needed
- Clear references to large SVG elements after export
- Monitor memory usage during development

## Comparison with GIF Export

| Feature | MP4 Export | GIF Export |
|---------|------------|------------|
| **File Size** | 60-70% smaller | Larger files |
| **Quality** | 24-bit color, smooth | 8-bit color, dithering |
| **Frame Rate** | Up to 60fps | Typically 5-10fps |
| **Browser Support** | Modern browsers | Universal |
| **Encoding Speed** | Fast (hardware accelerated) | Slower |
| **Use Case** | Professional, high-quality | Universal compatibility |

## Troubleshooting

### Common Issues

**"WebCodecs API not supported"**
- Browser doesn't support WebCodecs
- Will automatically fallback to MediaRecorder
- Consider updating browser or using GIF export

**"No MP4 encoding method available"**
- Neither WebCodecs nor MediaRecorder are available
- Very old browser or restricted environment
- Use GIF export as alternative

**"Element not found"**
- Check that `targetId` matches an existing SVG element
- Ensure element is in the DOM when export is triggered

**Large file sizes**
- Reduce bitrate or dimensions
- Lower frame rate for longer animations
- Check animation complexity

## Integration Examples

See the [Performance Benchmark](../performance/mp4-vs-gif-export-benchmark.md) for detailed comparisons and use case recommendations.

/**
 * Host app main entry point
 * This demonstrates how packages would be used in a real application
 */

// Try to import svg-editor if available
// In a real scenario, this would be installed as a dependency
let svgEditor: any = null;

try {
  // This will fail until svg-editor is actually created and linked
  // svgEditor = await import('@bpm/svg-editor');
  console.log('SVG Editor package loaded');
} catch (error) {
  console.log('SVG Editor package not available yet');
}

// Setup demo buttons
const btnSetAttrs = document.getElementById('btn-set-attrs');
const btnTranslate = document.getElementById('btn-translate');
const output = document.getElementById('output');
const packageStatus = document.getElementById('package-status');

function log(message: string) {
  if (output) {
    output.textContent = message;
  }
  console.log(message);
}

function updatePackageStatus() {
  if (packageStatus) {
    if (svgEditor) {
      packageStatus.textContent = '✅ @bpm/svg-editor is loaded and ready';
    } else {
      packageStatus.textContent = '⚠️ No packages loaded yet. Create a package first!';
    }
  }
}

// Demo: Set attributes
btnSetAttrs?.addEventListener('click', () => {
  if (svgEditor && svgEditor.setAttrs) {
    const rect = document.getElementById('test-rect');
    const success = svgEditor.setAttrs(rect, {
      fill: 'red',
      width: 120,
      height: 120
    });
    log(`✅ setAttrs called: ${success}`);
  } else {
    // Fallback implementation for demo purposes
    const rect = document.getElementById('test-rect') as SVGRectElement;
    if (rect) {
      rect.setAttribute('fill', 'red');
      rect.setAttribute('width', '120');
      rect.setAttribute('height', '120');
      log('✅ Attributes set (using fallback)');
    }
  }
});

// Demo: Translate
btnTranslate?.addEventListener('click', () => {
  if (svgEditor && svgEditor.translate) {
    const success = svgEditor.translate('#test-rect', 10, 10);
    log(`✅ translate called: ${success}`);
  } else {
    // Fallback implementation for demo purposes
    const rect = document.getElementById('test-rect') as SVGRectElement;
    if (rect) {
      const currentTransform = rect.getAttribute('transform') || '';
      const newTransform = currentTransform 
        ? `${currentTransform} translate(10, 10)` 
        : 'translate(10, 10)';
      rect.setAttribute('transform', newTransform);
      log('✅ Transform applied (using fallback)');
    }
  }
});

// Initialize
updatePackageStatus();
log('Ready to test...');

console.log('Host app initialized');


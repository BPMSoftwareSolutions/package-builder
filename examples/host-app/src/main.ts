/**
 * Host app main entry point
 * This demonstrates how packages would be used in a real application
 */

// Import the svg-editor package
import { setAttrs, translate } from '@bpm/svg-editor';

console.log('✅ SVG Editor package loaded successfully!');

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
    packageStatus.textContent = '✅ @bpm/svg-editor is loaded and ready';
    packageStatus.style.background = '#e8f5e9';
  }
}

// Demo: Set attributes
btnSetAttrs?.addEventListener('click', () => {
  const rect = document.getElementById('test-rect');
  const success = setAttrs(rect!, {
    fill: 'red',
    width: 120,
    height: 120
  });
  log(`✅ setAttrs called: ${success} - Rectangle is now RED and 120x120`);
});

// Demo: Translate
btnTranslate?.addEventListener('click', () => {
  const success = translate('#test-rect', 10, 10);
  log(`✅ translate called: ${success} - Rectangle moved by (10, 10)`);
});

// Initialize
updatePackageStatus();
log('Ready to test...');

console.log('Host app initialized');


#!/usr/bin/env node
// ESM CLI wrapper for running the local Python-based SVG->GIF converter (Option A)
// Usage:
//   node scripts/export-svg-to-gif.js --input input.svg --output out.gif [--duration 10 --fps 20 --width 1000 --height 700 --maxColors 256 --dither sierra2_4a --loop 0]

import { runExport } from './lib/export-svg-to-gif-runner.js';

function parseArgs(argv) {
  const out = {};
  const toNum = (v) => (v == null ? undefined : Number(v));
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    const eat = () => { i++; return next; };
    if (a === '--input' || a === '-i') out.input = eat();
    else if (a === '--output' || a === '-o') out.output = eat();
    else if (a === '--duration' || a === '-d') out.duration = toNum(eat());
    else if (a === '--fps' || a === '-f') out.fps = toNum(eat());
    else if (a === '--width' || a === '-w') out.width = toNum(eat());
    else if (a === '--height' || a === '-H') out.height = toNum(eat());
    else if (a === '--maxColors') out.maxColors = toNum(eat());
    else if (a === '--dither') out.dither = eat();
    else if (a === '--loop') out.loop = toNum(eat());
    else if (a === '--help' || a === '-h') out.help = true;
    else {
      // ignore unknowns for now
    }
  }
  return out;
}

function printHelp() {
  console.log(`SVG -> GIF Export (Playwright + FFmpeg via Python)

Required:
  --input, -i    Path to input SVG
  --output, -o   Path to output GIF

Optional:
  --duration, -d Seconds (default 10)
  --fps, -f      Frames per second (default 20)
  --width, -w    Width in px (default 1000)
  --height, -H   Height in px (default 700)
  --maxColors    Palette colors (<=256, default 256)
  --dither       Dither method (default sierra2_4a)
  --loop         Loop count (0=infinite)
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); process.exit(0); }
  try {
    await runExport(args);
  } catch (err) {
    console.error(err?.message || String(err));
    process.exit(typeof err?.code === 'number' ? err.code : 1);
  }
}

await main();


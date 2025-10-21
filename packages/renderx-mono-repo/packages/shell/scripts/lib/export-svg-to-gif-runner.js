// ESM module
// Runs the local Python Playwright+FFmpeg converter as per issue #96 (Option A)
// Exposes a small API used by the CLI and tests

import { spawn } from "node:child_process";
import { platform } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import fs from "node:fs";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function which(cmd) {
  return new Promise((resolvePromise) => {
    try {
      const proc = spawn(cmd, ["--version"], { stdio: "ignore" });
      proc.on("error", () => resolvePromise(false));
      proc.on("exit", (code) => resolvePromise(code === 0));
    } catch {
      resolvePromise(false);
    }
  });
}

async function ensureFfmpegAvailable() {
  if (await which("ffmpeg")) return;
  // Windows: try where.exe and PATH scan as a fallback
  if (platform() === "win32") {
    const foundByWhere = await new Promise((resolveWhere) => {
      try {
        const p = spawn("where", ["ffmpeg"], { stdio: "ignore" });
        p.on("error", () => resolveWhere(false));
        p.on("exit", (code) => resolveWhere(code === 0));
      } catch {
        resolveWhere(false);
      }
    });
    if (foundByWhere) return;
    const pathEntries = (process.env.PATH || "").split(";").filter(Boolean);
    for (const entry of pathEntries) {
      try {
        const exe = path.join(entry, "ffmpeg.exe");
        if (fs.existsSync(exe)) return;
      } catch {}
    }
  }
  const os = platform();
  const base = "FFmpeg is required but was not found on PATH.";
  let tip = "";
  if (os === "win32") {
    tip = "Install via: winget install FFmpeg (then restart your shell)";
  } else if (os === "darwin") {
    tip = "Install via: brew install ffmpeg";
  } else {
    tip = "Install via your package manager, e.g.: sudo apt-get install ffmpeg";
  }
  const err = new Error(`${base} ${tip}`);
  err.code = "FFMPEG_MISSING";
  throw err;
}

async function ensurePythonAvailable() {
  if (await which("python")) return "python";
  // Windows often has the launcher "py"
  if (await which("py")) return "py";
  const err = new Error(
    "Python is required but was not found on PATH. Install Python 3.8+ and retry."
  );
  err.code = "PYTHON_MISSING";
  throw err;
}

export async function runExport(options) {
  const {
    input,
    output,
    duration = 10,
    fps = 20,
    width = 1000,
    height = 700,
    maxColors = 256,
    dither = "sierra2_4a",
    loop = 0,
    workingDir = process.cwd(),
    onProgress, // optional (pct, framesDone, totalFrames)
    skipEnvChecks = false, // for tests
  } = options || {};

  if (!input) throw new Error("Missing required option: input (path to SVG)");
  if (!output) throw new Error("Missing required option: output (path to GIF)");

  if (!skipEnvChecks) {
    await ensureFfmpegAvailable();
  }
  const pythonCmd = skipEnvChecks ? "python" : await ensurePythonAvailable();

  // python script lives relative to repo root at docs/prototypes/sample-code/scripts/svg_to_gif_converter.py
  const pythonScript = resolve(
    __dirname,
    "../../docs/prototypes/sample-code/scripts/svg_to_gif_converter.py"
  );

  const args = [
    pythonScript,
    input,
    output,
    "--duration",
    String(duration),
    "--fps",
    String(fps),
    "--width",
    String(width),
    "--height",
    String(height),
    "--max-colors",
    String(maxColors),
    "--dither",
    String(dither),
    "--loop",
    String(loop),
  ];

  // Stream progress by parsing "Progress: 12.3% (X/Y)" lines from the Python script
  const child = spawn(pythonCmd, args, { cwd: workingDir, env: process.env });

  return await new Promise((resolvePromise, reject) => {
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");

    child.stdout?.on("data", (chunk) => {
      const text = String(chunk);
      process.stdout.write(text);
      if (onProgress) {
        const match = text.match(
          /Progress:\s+([0-9]+(?:\.[0-9]+)?)%\s*\((\d+)\/(\d+)\)/
        );
        if (match) {
          const pct = Number(match[1]);
          const done = Number(match[2]);
          const total = Number(match[3]);
          try {
            onProgress(pct, done, total);
          } catch {}
        }
      }
    });

    let stderrBuf = "";
    child.stderr?.on("data", (chunk) => {
      const text = String(chunk);
      stderrBuf += text;
      process.stderr.write(text);
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      if (code === 0) return resolvePromise({ code: 0 });
      const err = new Error(
        stderrBuf || `Conversion failed with exit code ${code}`
      );
      err.code = code;
      reject(err);
    });
  });
}

export default { runExport };

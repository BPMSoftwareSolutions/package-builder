#!/usr/bin/env node
// Minimal local export server for Option A (Issue #96)
// Exposes POST /api/export/gif to convert inline SVG -> GIF via Python runner

import http from "node:http";
import { parse as parseUrl } from "node:url";
import { tmpdir } from "node:os";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import fs from "node:fs";
import path from "node:path";

import { runExport } from "./lib/export-svg-to-gif-runner.js";

// Try to auto-detect Winget-installed FFmpeg on Windows if not on PATH
(function ensureFfmpegOnPath() {
  try {
    if (process.platform !== "win32") return;
    if (process.env.FFMPEG_DIR || process.env.FFMPEG_PATH) {
      const dirCandidate =
        process.env.FFMPEG_DIR ||
        (process.env.FFMPEG_PATH ? path.dirname(process.env.FFMPEG_PATH) : "");
      if (dirCandidate) {
        process.env.PATH = `${dirCandidate};${process.env.PATH}`;
        console.log("🔧 Using FFmpeg from env:", dirCandidate);
        return;
      }
    }
    const wingetBase =
      process.env.LOCALAPPDATA &&
      path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages");
    if (!wingetBase) return;
    if (!fs.existsSync(wingetBase)) return;
    // Shallow scan for a folder containing ffmpeg-*-build/bin/ffmpeg.exe
    const candidates = fs
      .readdirSync(wingetBase)
      .filter((n) => /ffmpeg/i.test(n))
      .map((n) => path.join(wingetBase, n));
    for (const c of candidates) {
      const bin = path.join(c, "ffmpeg-8.0-full_build", "bin");
      const exe = path.join(bin, "ffmpeg.exe");
      if (fs.existsSync(exe)) {
        process.env.PATH = `${bin};${process.env.PATH}`;
        console.log("🔧 Detected Winget FFmpeg, added to PATH:", bin);
        return;
      }
      // Try generic pattern fallbacks
      const items = fs.readdirSync(c);
      for (const sub of items) {
        const maybeBin = path.join(c, sub, "bin");
        if (fs.existsSync(path.join(maybeBin, "ffmpeg.exe"))) {
          process.env.PATH = `${maybeBin};${process.env.PATH}`;
          console.log("🔧 Detected FFmpeg bin, added to PATH:", maybeBin);
          return;
        }
      }
    }
  } catch (e) {
    // Non-fatal
    console.warn("⚠️ FFmpeg auto-detect failed:", e?.message || e);
  }
})();

const PORT = process.env.EXPORT_SERVER_PORT
  ? Number(process.env.EXPORT_SERVER_PORT)
  : 5055;

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  if (body) res.end(body);
  else res.end();
}

async function handleExportGif(req, res) {
  console.log("🔄 Received GIF export request");
  try {
    let buf = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => (buf += chunk));
    req.on("end", async () => {
      try {
        console.log("📦 Request body length:", buf.length);
        const data = JSON.parse(buf || "{}");
        console.log("📋 Parsed data keys:", Object.keys(data));
        const {
          svg,
          width = 1000,
          height = 700,
          duration = 10,
          fps = 20,
          maxColors = 256,
          dither = "sierra2_4a",
          loop = 0,
          filename = `export-${Date.now()}.gif`,
        } = data || {};
        if (!svg || typeof svg !== "string") {
          console.log("❌ Missing or invalid SVG string");
          return send(
            res,
            400,
            { "Content-Type": "application/json" },
            JSON.stringify({ error: "Missing svg string" })
          );
        }
        console.log("📝 SVG length:", svg.length, "chars");
        console.log("🎬 Export params:", {
          width,
          height,
          duration,
          fps,
          maxColors,
          dither,
          loop,
        });

        const tmp = await mkdtemp(join(tmpdir(), "rx-export-"));
        const svgPath = join(tmp, "input.svg");
        const outPath = join(tmp, filename);
        console.log("📁 Temp dir:", tmp);

        await writeFile(svgPath, svg, "utf8");
        console.log("💾 Wrote SVG to:", svgPath);

        console.log("🚀 Starting Python conversion...");
        await runExport({
          input: svgPath,
          output: outPath,
          duration,
          fps,
          width,
          height,
          maxColors,
          dither,
          loop,
          workingDir: tmp,
        });
        console.log("✅ Python conversion completed");

        const gifBytes = await readFile(outPath);
        // Best-effort cleanup (ignore errors)
        try {
          await rm(outPath, { force: true });
        } catch {}
        try {
          await rm(tmp, { recursive: true, force: true });
        } catch {}

        send(
          res,
          200,
          {
            "Content-Type": "image/gif",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
          gifBytes
        );
      } catch (err) {
        console.error("💥 Export error:", err);
        const msg = err?.message || String(err);
        const code = err?.code;
        const help =
          code === "FFMPEG_MISSING"
            ? "FFmpeg missing. Windows: winget install FFmpeg; macOS: brew install ffmpeg; Linux: apt-get install ffmpeg"
            : code === "PYTHON_MISSING"
            ? "Python missing. Install Python 3.8+ and ensure it is on PATH."
            : undefined;
        send(
          res,
          500,
          { "Content-Type": "application/json" },
          JSON.stringify({ error: msg, code, help })
        );
      }
    });
  } catch (err) {
    send(
      res,
      500,
      { "Content-Type": "application/json" },
      JSON.stringify({ error: err?.message || String(err) })
    );
  }
}

const server = http.createServer(async (req, res) => {
  const url = parseUrl(req.url || "", true);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(204);
    return res.end();
  }

  // Default CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "POST" && url.pathname === "/api/export/gif") {
    return handleExportGif(req, res);
  }
  if (req.method === "GET" && url.pathname === "/healthz") {
    return send(
      res,
      200,
      { "Content-Type": "application/json" },
      JSON.stringify({ ok: true })
    );
  }
  send(
    res,
    404,
    { "Content-Type": "application/json" },
    JSON.stringify({ error: "Not found" })
  );
});

server.listen(PORT, () => {
  console.log(`🟢 Export server listening on http://localhost:${PORT}`);
});

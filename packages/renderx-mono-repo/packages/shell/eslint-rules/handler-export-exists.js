import fs from "node:fs";
import path from "node:path";

function readJsonSafe(p) {
  try {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function* iterateSequences(cwd) {
  const roots = [
    path.join(cwd, "json-sequences"),
    path.join(cwd, "public", "json-sequences"),
  ];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const dirent of fs.readdirSync(root, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      const pluginDir = dirent.name;
      const idx = path.join(root, pluginDir, "index.json");
      if (!fs.existsSync(idx)) continue;
      const indexJson = readJsonSafe(idx);
      const entries = (indexJson && Array.isArray(indexJson.sequences)) ? indexJson.sequences : [];
      for (const entry of entries) {
        const file = entry?.file;
        const handlersPath = entry?.handlersPath;
        if (!file || !handlersPath) continue;
        const seqPath = path.join(root, pluginDir, file);
        const seqJson = readJsonSafe(seqPath);
        if (!seqJson) continue;
        const beats = [];
        if (Array.isArray(seqJson.movements)) {
          for (const m of seqJson.movements) {
            if (Array.isArray(m?.beats)) beats.push(...m.beats);
          }
        }
        const handlerNames = beats.map((b) => (typeof b?.handler === "string" ? b.handler : null)).filter(Boolean);
        yield { pluginDir, sequenceFile: `${pluginDir}/${file}`, handlersPath, handlerNames };
      }
    }
  }
}

function fileHasHandlerExport(moduleAbsPath, handlerName) {
  try {
    const content = fs.readFileSync(moduleAbsPath, "utf8");
    const pats = [
      new RegExp(`export\\s+function\\s+${handlerName}\\s*\\(`, "m"),
      new RegExp(`export\\s+const\\s+${handlerName}\\s*[=:]`, "m"),
      new RegExp(`export\\s*{[^}]*\\b${handlerName}\\b[^}]*}`, "m"),
      new RegExp(`handlers\\s*[=:]\\s*{[\\s\\S]*?\\b${handlerName}\\b`, "m"),
      new RegExp(`export\\s+const\\s+handlers\\s*=\\s*{[\\s\\S]*?\\b${handlerName}\\b`, "m"),
    ];
    return pats.some((r) => r.test(content));
  } catch {
    return false;
  }
}

let didReport_handlerExportExists = false;

export default {
  rules: {
    "handler-export-exists": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Ensure each handler referenced in json-sequences beats exists in the referenced handlersPath module",
        },
        schema: [],
        messages: {
          missingHandler:
            "Handler '{{handlerName}}' referenced in '{{sequenceFile}}' was not found in module '{{moduleRef}}'",
        },
      },
      create(context) {
        if (didReport_handlerExportExists) return {};
        const cwd = context.getCwd?.() || process.cwd();
        const reports = [];

        for (const { sequenceFile, handlersPath, handlerNames } of iterateSequences(cwd)) {
          const spec = String(handlersPath || "");
          let moduleAbs = null;
          if (spec.startsWith("/src/")) {
            moduleAbs = path.join(cwd, spec.replace(/^\//, ""));
            if (!/[.](ts|tsx|js|mjs)$/.test(moduleAbs)) moduleAbs += ".ts";
          } else if (spec.startsWith("src/")) {
            moduleAbs = path.join(cwd, spec);
            if (!/[.](ts|tsx|js|mjs)$/.test(moduleAbs)) moduleAbs += ".ts";
          } else {
            // For now, only support src-backed modules per tests; node_modules support can be added later.
            continue;
          }

          for (const handlerName of handlerNames) {
            const ok = fileHasHandlerExport(moduleAbs, handlerName);
            if (!ok) {
              reports.push({
                messageId: "missingHandler",
                data: { handlerName, sequenceFile, moduleRef: handlersPath },
              });
            }
          }
        }

        return {
          Program(node) {
            for (const r of reports) context.report({ node, ...r });
            didReport_handlerExportExists = true;
          },
        };
      },
    },
  },
};


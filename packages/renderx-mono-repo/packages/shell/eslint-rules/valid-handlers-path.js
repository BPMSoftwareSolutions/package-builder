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

function* findIndexJsonFiles(cwd) {
  const roots = [
    path.join(cwd, "json-sequences"),
    path.join(cwd, "public", "json-sequences"),
  ];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const dirent of fs.readdirSync(root, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      const idx = path.join(root, dirent.name, "index.json");
      if (fs.existsSync(idx)) yield idx;
    }
  }
}

function isPackageResolvable(spec, cwd) {
  try {
    require.resolve(spec);
    return true;
  } catch {
    // Fallback check in node_modules for scoped or unscoped packages
    if (spec.startsWith("@")) {
      const parts = spec.split("/");
      if (parts.length >= 2) {
        const scope = parts[0];
        const name = parts[1];
        const nodePkg = path.join(cwd, "node_modules", scope, name, "package.json");
        if (fs.existsSync(nodePkg)) return true;
        // Workspace support: packages/<name>/package.json
        const wsDir = path.join(cwd, "packages", name);
        const wsPkg = path.join(wsDir, "package.json");
        if (fs.existsSync(wsPkg)) {
          // If a subpath is referenced, optionally verify the file exists under src/
          if (parts.length > 2) {
            const sub = parts.slice(2).join("/");
            const base = path.join(wsDir, "src", sub);
            const candidates = [base, base + ".ts", base + ".tsx", base + ".js", base + ".mjs"];
            if (candidates.some((p) => fs.existsSync(p))) return true;
            // Even if subpath file isn't found, the package exists in workspace; consider resolvable for Phase 1
            return true;
          }
          return true;
        }
      }
      return false;
    }
    const nodePkg = path.join(cwd, "node_modules", spec, "package.json");
    if (fs.existsSync(nodePkg)) return true;
    // Workspace unscoped support: packages/<spec>/package.json
    const wsPkg = path.join(cwd, "packages", spec, "package.json");
    return fs.existsSync(wsPkg);
  }
}

let didReport_validHandlersPath = false;

export default {
  rules: {
    "valid-handlers-path": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Validate handlersPath entries in json-sequences/*/index.json are module-resolvable and not under public/",
        },
        schema: [],
        messages: {
          publicPath:
            "handlersPath '{{spec}}' must not start with public/ (assets cannot be imported as modules)",
          missingSrc:
            "handlersPath '{{spec}}' points to a missing src module",
          unresolvable:
            "handlersPath '{{spec}}' is not under src/ and is not a resolvable package",
        },
      },
      create(context) {
        if (didReport_validHandlersPath) return {};
        const cwd = context.getCwd?.() || process.cwd();
        const reports = [];

        function validateSpec(spec) {
          if (!spec || typeof spec !== "string") return;
          const s = spec.replace(/^\//, "");
          if (s.startsWith("public/")) {
            reports.push({ messageId: "publicPath", data: { spec } });
            return;
          }
          if (s.startsWith("src/")) {
            const abs = path.join(cwd, s);
            // Accept .ts/.tsx or .js/.mjs files
            const candidates = [abs, abs + ".ts", abs + ".tsx", abs + ".js", abs + ".mjs"];
            const exists = candidates.some((p) => fs.existsSync(p));
            if (!exists) {
              reports.push({ messageId: "missingSrc", data: { spec } });
            }
            return;
          }
          if (s.startsWith("plugins/")) {
            // Allow virtual/aliased plugin handlers under /plugins/... (host resolves these via runtime mapping)
            // If a corresponding src/plugins file exists, great; otherwise do not flag.
            const abs = path.join(cwd, "src", s);
            const candidates = [abs, abs + ".ts", abs + ".tsx", abs + ".js", abs + ".mjs"];
            const exists = candidates.some((p) => fs.existsSync(p));
            if (!exists) {
              // Consider as OK (virtual alias) — do not report
              return;
            }
            return;
          }
          // Try resolve as a package/bare specifier
          if (!isPackageResolvable(spec, cwd)) {
            reports.push({ messageId: "unresolvable", data: { spec } });
          }
        }

        return {
          Program(node) {
            for (const idx of findIndexJsonFiles(cwd)) {
              const json = readJsonSafe(idx);
              const list = (json && Array.isArray(json.sequences)) ? json.sequences : [];
              for (const entry of list) {
                if (entry && entry.handlersPath) {
                  validateSpec(entry.handlersPath);
                }
              }
            }
            for (const r of reports) context.report({ node, ...r });
            didReport_validHandlersPath = true;
          },
        };
      },
    },
  },
};


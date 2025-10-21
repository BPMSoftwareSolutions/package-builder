/**
 * ESLint plugin: deprecate-stagecrew-api
 * - no-stagecrew-api-in-stage-crew: Forbid usage of ctx.stageCrew (conductor StageCrew API)
 *   inside stage-crew handlers. Handlers must manipulate the DOM directly instead.
 */
import fs from "node:fs";

function isStageCrewFile(filename) {
  const f = String(filename || "");
  // Match *.stage-crew.ts or *.stage-crew.tsx anywhere in path
  return /\.stage-crew\.(t|j)sx?$/.test(f);
}

function getSourceText(context) {
  try {
    const sc = context.getSourceCode?.();
    if (sc?.text && typeof sc.text === "string") return String(sc.text);
  } catch {}
  try {
    const filename = context.getFilename?.();
    if (filename && fs.existsSync(filename)) {
      return fs.readFileSync(filename, "utf8");
    }
  } catch {}
  return "";
}

const noStageCrewInStageCrewRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow StageCrew API (ctx.stageCrew / beginBeat / injectRawCSS) in stage-crew handlers",
    },
    schema: [],
    messages: {
      deprecatedStageCrew:
        "StageCrew API is deprecated in stage-crew handlers. Manipulate the DOM directly instead (found '{{usage}}').",
    },
  },
  create(context) {
    const filename = context.getFilename?.() || "";
    if (!isStageCrewFile(filename)) return {};

    return {
      Program(node) {
        const text = getSourceText(context);
        if (!text) return;

        // Minimal patterns indicating use of the deprecated API
        const patterns = [
          /\bctx\s*\.\s*stageCrew\b/, // ctx.stageCrew
          /\bstageCrew\s*[\.?]\s*beginBeat\b/, // stageCrew.beginBeat or stageCrew?.beginBeat
          /\bstageCrew\s*[\.?]\s*injectRawCSS\b/,
          /\bstageCrew\s*[\.?]\s*injectInstanceCSS\b/,
        ];

        for (const re of patterns) {
          const m = text.match(re);
          if (m) {
            context.report({ node, messageId: "deprecatedStageCrew", data: { usage: m[0] } });
            // Report once per file for now to keep noise low
            break;
          }
        }
      },
    };
  },
};

export default {
  rules: {
    "no-stagecrew-api-in-stage-crew": noStageCrewInStageCrewRule,
  },
};


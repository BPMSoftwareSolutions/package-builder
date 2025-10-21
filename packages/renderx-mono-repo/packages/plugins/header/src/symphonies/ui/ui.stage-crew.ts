function safeGetStoredTheme(): "light" | "dark" | null {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem("theme");
      return v === "dark" || v === "light" ? v : null;
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

function safeSetStoredTheme(theme: "light" | "dark") {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  } catch {
    // Ignore localStorage errors
  }
}

function coerceTheme(v: unknown): "light" | "dark" | null {
  return v === "dark" || v === "light" ? v : null;
}

export function getCurrentTheme(data: unknown, ctx: { payload: Record<string, unknown>; logger?: { warn?: (message: string, error: unknown) => void } }) {
  try {
    // Determine theme preference order: DOM attr -> storage -> default (dark)
    let currentTheme: "light" | "dark" = "dark";

    if (typeof document !== "undefined") {
      const domAttr = document.documentElement.getAttribute("data-theme");
      const domTheme = coerceTheme(domAttr);
      if (domTheme) currentTheme = domTheme;
      else {
        const stored = safeGetStoredTheme();
        if (stored) currentTheme = stored;
      }

      // Apply to DOM to ensure consistency and avoid flicker
      document.documentElement.setAttribute("data-theme", currentTheme);
    } else {
      const stored = safeGetStoredTheme();
      if (stored) currentTheme = stored;
    }

    // Persist to storage so the default is remembered across sessions
    safeSetStoredTheme(currentTheme);

    ctx.payload.currentTheme = currentTheme;
    return { theme: currentTheme };
  } catch (e) {
    ctx.logger?.warn?.("getCurrentTheme failed", e);
    ctx.payload.currentTheme = "dark";
    return { theme: "dark" };
  }
}

export function toggleTheme(data: { theme?: unknown }, ctx: { payload: Record<string, unknown>; logger?: { warn?: (message: string, error: unknown) => void } }) {
  try {
    const next: "light" | "dark" = coerceTheme(data?.theme) || "light";

    // Direct DOM manipulation in stage-crew handler (StageCrew API deprecated)
    try {
      if (typeof document !== "undefined") {
        const el = document.documentElement;
        const raf =
          (typeof window !== "undefined" &&
            (window as Window).requestAnimationFrame) ||
          null;
        const apply = () => el.setAttribute("data-theme", next);
        if (raf) raf(() => apply());
        else apply();
      }
    } catch {
      // Ignore DOM manipulation errors
    }

    // Persist preference marker on ctx (no direct globals)
    try {
      ctx.payload.theme = next;
    } catch {
      // Ignore payload assignment errors
    }

    // Persist to storage for cross-session retention
    safeSetStoredTheme(next);

    // Return the updated theme for DataBaton tracking
    return { theme: next };
  } catch (e) {
    ctx.logger?.warn?.("toggleTheme failed", e);
    return { error: e };
  }
}


import React from "react";
import { useConductor, resolveInteraction } from "@renderx-plugins/host-sdk";
import "./Header.css";

const isTestEnv = typeof import.meta !== "undefined" && !!(import.meta as { vitest?: boolean }).vitest;

type HeaderButtonViewProps = { theme: "light" | "dark" | null; onToggle: () => void };

// Provide a valid JSX component type in test to satisfy TS/JSX checks
const HeaderThemeButtonShim = React.forwardRef<HTMLButtonElement, HeaderButtonViewProps>(
  (_props: HeaderButtonViewProps, _ref: React.Ref<HTMLButtonElement>) => null
);
HeaderThemeButtonShim.displayName = "HeaderThemeButtonShim";

const HeaderThemeButtonView = isTestEnv
  ? (HeaderThemeButtonShim as unknown as React.ComponentType<
      HeaderButtonViewProps & React.RefAttributes<HTMLButtonElement>
    >)
  : (React.lazy(() => import("./HeaderThemeButtonView")) as unknown as React.ComponentType<
      HeaderButtonViewProps & React.RefAttributes<HTMLButtonElement>
    >);

export function HeaderThemeToggle() {
  const conductor = useConductor();
  const [theme, setThemeState] = React.useState<"light" | "dark" | null>(null);
  const requestedRef = React.useRef(false);
  const aliveRef = React.useRef(true);
  const userInteractedRef = React.useRef(false);
  React.useEffect(() => () => { aliveRef.current = false; }, []);

  const safeSetTheme = (t: "light" | "dark") => { if (!aliveRef.current) return; setThemeState(t); };

  const ensureTheme = React.useCallback((el: HTMLButtonElement | null) => {
    if (!el || theme !== null || requestedRef.current || !aliveRef.current) return;
    requestedRef.current = true;
    try {
      const route = resolveInteraction("app.ui.theme.get");
      conductor.play(route.pluginId, route.sequenceId, {
        onTheme: (t: "light" | "dark") => { if (!userInteractedRef.current) safeSetTheme(t); },
      }, (result: { theme?: string }) => {
        const t = result?.theme;
        if (!userInteractedRef.current && (t === "light" || t === "dark")) safeSetTheme(t);
      });
    } catch { if (!userInteractedRef.current) safeSetTheme("dark"); }
  }, [theme, conductor]);

  const toggle = async () => {
    try {
      userInteractedRef.current = true;
      const next: "light" | "dark" = theme == null ? "dark" : theme === "light" ? "dark" : "light";
      safeSetTheme(next);
      const route = resolveInteraction("app.ui.theme.toggle");
      const result = await conductor.play(route.pluginId, route.sequenceId, { theme: next });
      const updatedTheme = (result?.theme as "light" | "dark" | undefined) || next;
      safeSetTheme(updatedTheme);
    } catch {
      // Ignore theme toggle errors
    }
  };

  return (
    <div className="header-container">
      <div className="header-theme-toggle">
        {isTestEnv ? (
          <button ref={ensureTheme} onClick={toggle} className="header-theme-button" title="Toggle Theme">
            {theme === "light" ? "🌙 Dark" : "🌞 Light"}
          </button>
        ) : (
          <React.Suspense fallback={
            <button ref={ensureTheme} onClick={toggle} className="header-theme-button" title="Toggle Theme">
              {theme === "light" ? "🌙 Dark" : "🌞 Light"}
            </button>
          }>
            <HeaderThemeButtonView ref={ensureTheme} theme={theme} onToggle={toggle} />
          </React.Suspense>
        )}
      </div>
    </div>
  );
}


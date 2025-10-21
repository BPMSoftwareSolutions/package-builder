import { getCurrentTheme, toggleTheme } from "./ui.stage-crew";

export const handlers = {
  getCurrentTheme,
  toggleTheme,
  notifyUi(data: { onTheme?: (theme: string) => void }, ctx: { payload?: { currentTheme?: string; theme?: string } }) {
    // Prefer the value computed by the previous beat and stored in payload
    const theme = ctx?.payload?.currentTheme ?? ctx?.payload?.theme;
    try {
      data?.onTheme?.(theme);
    } catch {
      // Ignore callback errors
    }
  },
};


import React from "react";

// Pure presentational button. No conductor, no side-effects here.
const HeaderThemeButtonView = React.forwardRef<HTMLButtonElement, {
  theme: "light" | "dark" | null;
  onToggle: () => void;
}>(({ theme, onToggle }, ref) => {
  return (
    <button ref={ref} onClick={onToggle} className="header-theme-button" title="Toggle Theme">
      {theme === "light" ? "\ud83c\udf19 Dark" : "\ud83c\udf1e Light"}
    </button>
  );
});

HeaderThemeButtonView.displayName = "HeaderThemeButtonView";

export default HeaderThemeButtonView;


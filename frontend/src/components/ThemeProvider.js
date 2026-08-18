"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { MoonIcon, SunIcon } from "./ui/Icons";

const STORAGE_KEY = "electroshop.theme";
const ThemeContext = createContext(null);

/**
 * Inline script that runs before first paint.
 *
 * Reading the stored theme in an effect would paint the light palette first and
 * then snap to dark, which is the flash every themed app has to avoid.
 */
export const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export function ThemeProvider({ children }) {
  // Read the class the bootstrap script already applied, rather than defaulting
  // and correcting inside an effect (which would cascade an extra render).
  const [theme, setTheme] = useState(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const apply = useCallback((next) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private browsing */
    }
    setTheme(next);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme: apply,
      toggle: () => apply(theme === "dark" ? "light" : "dark"),
    }),
    [theme, apply]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}

export function ThemeToggle({ className }) {
  const { toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title="Toggle light and dark mode"
      aria-label="Toggle light and dark mode"
      className={
        "flex h-9 w-9 items-center justify-center rounded-[10px] border border-line-strong " +
        "text-muted transition-colors hover:border-accent hover:text-accent " +
        (className ?? "")
      }
    >
      {/* Both icons are rendered and swapped by CSS. Choosing one in JS would
          depend on a value the server cannot know, causing a hydration mismatch. */}
      <SunIcon size={16} className="hidden dark:block" />
      <MoonIcon size={16} className="block dark:hidden" />
    </button>
  );
}

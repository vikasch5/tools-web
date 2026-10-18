import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme";
const CHANGE_EVENT = "themechange";

/**
 * Runs inline in <head> before first paint so the page never flashes the
 * wrong theme. Keep it dependency-free and in sync with applyTheme().
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem("${STORAGE_KEY}");var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){}})();`;

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" || (preference === "system" && systemPrefersDark());
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/**
 * Shared theme state. Every consumer stays in sync through a window event,
 * so no context provider is needed. Values are null until hydration.
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference | null>(
    null,
  );
  const [resolved, setResolved] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const sync = () => {
      const pref = readPreference();
      applyTheme(pref);
      setPreferenceState(pref);
      setResolved(
        document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      );
    };
    sync();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable: theme still applies for this page view.
    }
    applyTheme(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { preference, resolved, setPreference };
}

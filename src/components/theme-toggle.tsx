"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

type Theme = "light" | "dark";
const preferenceKey = "pixlwave-theme";

function preferredTheme(): Theme {
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Browsers that block storage can still follow the device preference.
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const system = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const resolved = preferredTheme();
      document.documentElement.dataset.theme = resolved;
      setTheme(resolved);
    };
    sync();
    system.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    return () => {
      system.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isDark = theme === "dark";
  return <button type="button" className="theme-toggle" aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"} aria-pressed={isDark} title={isDark ? "Switch to light theme" : "Switch to dark theme"} onClick={() => {
    const next: Theme = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(preferenceKey, next); } catch { /* Theme still applies for this visit. */ }
    setTheme(next);
  }}><Icon name={isDark ? "sun" : "moon"} size={24} strokeWidth={isDark ? 2.2 : 0} fill={isDark ? "none" : "currentColor"} stroke={isDark ? "currentColor" : "none"} /></button>;
}

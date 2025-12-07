"use client";

import { useEffect } from "react";

/**
 * Bridges the app's theme toggle (which sets body.dark-mode) to Tailwind's `dark` class on <html>.
 * Ensures components using `dark:` variants respond instantly when the user switches theme.
 */
export function ThemeBridge() {
  useEffect(() => {
    const sync = (mode?: "light" | "dark") => {
      const isDark =
        mode === "dark" ||
        document.body.classList.contains("dark-mode") ||
        document.documentElement.classList.contains("dark-mode");

      document.documentElement.classList.toggle("dark", isDark);
    };

    // Initial sync
    sync();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      sync(detail);
    };

    window.addEventListener("theme-changed", handler as EventListener);
    const observer = new MutationObserver(() => sync());
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      window.removeEventListener("theme-changed", handler as EventListener);
      observer.disconnect();
    };
  }, []);

  return null;
}

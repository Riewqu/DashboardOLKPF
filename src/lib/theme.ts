export type ThemeMode = "light" | "dark";

export const setTheme = (mode: ThemeMode) => {
  if (typeof document === "undefined") return;
  if (mode === "dark") {
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
  } else {
    document.body.classList.add("light-mode");
    document.body.classList.remove("dark-mode");
  }
  window.dispatchEvent(new CustomEvent<ThemeMode>("theme-changed", { detail: mode }));
};

export const toggleTheme = (): ThemeMode => {
  if (typeof document === "undefined") return "light";
  const isDark = document.body.classList.contains("dark-mode");
  const next: ThemeMode = isDark ? "light" : "dark";
  setTheme(next);
  return next;
};

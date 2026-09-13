import { createContext, useContext, useEffect, useState } from "react";

/**
 * ThemeContext — light/dark theming for the whole app.
 *
 * Theme is persisted in localStorage and applied as a `dark` class on <html>.
 * An inline script in index.html applies the theme BEFORE first paint, so
 * this provider only needs to sync React state with whatever the script
 * already decided (and keep following the OS while the user hasn't chosen
 * explicitly).
 */

const STORAGE_KEY = "groundwork-theme";
const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

function getInitialTheme() {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark";
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Persisted choice wins; otherwise keep following the OS.
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch (e) {
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* private mode — theme just won't persist */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

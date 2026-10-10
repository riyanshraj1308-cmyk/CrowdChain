import { createContext, useContext, useEffect } from "react";

/**
 * ThemeContext — the app is dark-only.
 *
 * Kept as a context so existing `useTheme()` consumers (Landing's globe mode,
 * residual toggle code) keep working, but the value is permanently "dark".
 * The `dark` class is applied by an inline script in index.html before first
 * paint; this provider just re-asserts it after hydration.
 */

const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const theme = "dark";

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** @type {import('tailwindcss').Config} */

// Each palette step lives in index.css as a "R G B" channel triplet so that
// Tailwind's alpha modifier (e.g. `bg-ink-950/50`) compiles to
// `rgb(var(--ink-950) / 0.5)` and follows the active theme.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const ramp = (prefix, steps) =>
  Object.fromEntries(steps.map((s) => [s, v(`${prefix}-${s}`)]));

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Warm, ink-based neutral scale (not the default cool gray) — the
        // backbone of the UI. "ink" = near-black text/surfaces in light mode,
        // flipped to the light text ramp in dark mode; "paper" = warm
        // off-white backgrounds, deep charcoal in dark mode.
        ink: ramp("ink", [950, 900, 800, 700, 600, 500, 400, 300, 200, 100]),
        paper: ramp("paper", [50, 100, 200]),
        // "Copper" token ramp now renders the FLUX violet — the single
        // confident accent. Used sparingly for primary actions, links, and
        // key data points. Never washed with multi-stop "AI gradient" tones.
        copper: ramp("copper", [50, 100, 200, 300, 400, 500, 600, 700, 800]),
        // Violet — the FLUX accent. Primary CTAs, active nav, kicker rules.
        violet: { DEFAULT: v("violet"), 300: v("violet-300"), 500: v("violet") },
        // Moss — the "approved / success / funded" signal color. A deep,
        // desaturated green that reads as trustworthy rather than neon.
        moss: ramp("moss", [50, 100, 400, 500, 600]),
        // Signal red for destructive/rejected/error states.
        rust: ramp("rust", [50, 400, 500, 600]),
        amber: ramp("amber", [50, 400, 500]),
      },
      fontFamily: {
        // FLUX identity: Plus Jakarta Sans for display/headings, Inter for
        // body, IBM Plex Mono for kickers and meta.
        display: ["Plus Jakarta Sans", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.55" }],
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.125rem", { lineHeight: "1.6" }],
        xl: ["1.25rem", { lineHeight: "1.5" }],
        "2xl": ["1.5rem", { lineHeight: "1.35" }],
        "3xl": ["1.9rem", { lineHeight: "1.25" }],
        "4xl": ["2.4rem", { lineHeight: "1.15" }],
        "5xl": ["3.2rem", { lineHeight: "1.08" }],
        "6xl": ["4.2rem", { lineHeight: "1.02" }],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(18,17,16,0.04)",
        sm: "0 1px 3px 0 rgba(18,17,16,0.06), 0 1px 2px -1px rgba(18,17,16,0.06)",
        card: "0 2px 8px -2px rgba(18,17,16,0.08), 0 1px 2px -1px rgba(18,17,16,0.04)",
        lifted: "0 12px 32px -8px rgba(18,17,16,0.16), 0 4px 12px -4px rgba(18,17,16,0.08)",
        focus: "0 0 0 3px rgba(124,108,255,0.35)",
      },
      maxWidth: {
        content: "1280px",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

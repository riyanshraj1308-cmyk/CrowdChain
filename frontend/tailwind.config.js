/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Warm, ink-based neutral scale (not the default cool gray) — the
        // backbone of the UI. "ink" = near-black text/surfaces, "paper" = warm
        // off-white backgrounds.
        ink: {
          950: "#121110",
          900: "#1B1918",
          800: "#28251F",
          700: "#3A3630",
          600: "#524C43",
          500: "#6B6459",
          400: "#8B8375",
          300: "#B0A896",
          200: "#D3CBB8",
          100: "#E9E3D3",
        },
        paper: {
          50: "#FDFCF9",
          100: "#FAF7F0",
          200: "#F3EDE0",
        },
        // Copper — the single confident accent color. Used sparingly for
        // primary actions, links, and key data points. Never washed with
        // purple/blue "AI gradient" tones.
        copper: {
          50: "#FCF1E7",
          100: "#F8E1C9",
          200: "#F0C393",
          300: "#E4A05F",
          400: "#D3823C",
          500: "#B75B12",
          600: "#9A4A0E",
          700: "#7C3B0C",
          800: "#5E2C09",
        },
        // Moss — the "approved / success / funded" signal color. A deep,
        // desaturated green that reads as trustworthy rather than neon.
        moss: {
          50: "#EEF3EA",
          100: "#D6E4CC",
          400: "#5C8A46",
          500: "#3F6B2E",
          600: "#325623",
        },
        // Signal red for destructive/rejected/error states.
        rust: {
          50: "#FBEDEA",
          400: "#C6543D",
          500: "#AE402C",
          600: "#8F3423",
        },
        amber: {
          50: "#FBF3E3",
          400: "#C9932E",
          500: "#A6791F",
        },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
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
        focus: "0 0 0 3px rgba(183,91,18,0.35)",
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

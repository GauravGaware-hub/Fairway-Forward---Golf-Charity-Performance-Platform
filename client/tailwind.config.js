/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'Space Grotesk'", "monospace"],
        numeric: ["'Space Grotesk'", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        evergreen: {
          50: "#f2f8f5",
          100: "#dfefe7",
          200: "#c1ded2",
          300: "#99c6b4",
          400: "#6da893",
          500: "#498c75",
          600: "#37705d",
          700: "#2d5a4c",
          800: "#1B4D3E", // Primary Evergreen
          900: "#173f34",
          950: "#0B1914", // Forest Obsidian
        },
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#D97706", // Amber Purpose
          700: "#b45309",
        },
        emerald: {
          500: "#10b981",
          600: "#059669", // Emerald Momentum
          700: "#047857",
        },
        chalk: "#F8F9F6",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        xl: "1.5rem",
        lg: "1rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};

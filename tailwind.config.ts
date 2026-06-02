import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme. "paper" = the (now dark) surface, "ink" = the (now light)
        // foreground. The names are kept so the whole site flips in one place.
        paper: {
          DEFAULT: "#0b0b0c",
          soft: "#161617",
          deep: "#202022",
        },
        ink: {
          DEFAULT: "#f3f1ea",
          soft: "#c9c6bd",
          muted: "#8d8a82",
          faint: "#56544e",
        },
        wash: {
          50: "#f1f4f5",
          100: "#dde6e8",
          200: "#c0d2d6",
          300: "#9bb8bf",
          400: "#6f97a1",
          500: "#517a85",
          600: "#41626c",
          700: "#374f57",
          800: "#30424a",
          900: "#2b3a40",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      maxWidth: {
        prose2: "62ch",
      },
      transitionTimingFunction: {
        gallery: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;

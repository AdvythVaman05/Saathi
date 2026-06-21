import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        hyperlegible: ["var(--font-atkinson)", "Inter", "sans-serif"],
      },
      colors: {
        background: "var(--bg-primary)",
        secondary: "var(--bg-secondary)",
        foreground: "var(--text-primary)",
        muted: "var(--text-secondary)",
        accent: "var(--accent)",
        "focus-ring": "var(--focus-ring)",
      },
      spacing: {
        '1': '0.25rem', // 4px
        '2': '0.5rem',  // 8px
        '3': '0.75rem', // 12px
        '4': '1rem',    // 16px
        '6': '1.5rem',  // 24px
        '8': '2rem',    // 32px
        '12': '3rem',   // 48px
        '16': '4rem',   // 64px
      },
      borderRadius: {
        small: "var(--radius-small)",
        medium: "var(--radius-medium)",
        large: "var(--radius-large)",
      },
    },
  },
  plugins: [],
};
export default config;

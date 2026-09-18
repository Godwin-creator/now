import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        now: {
          blue: 'var(--color-primary)',
          'blue-dark': 'var(--color-primary-dark)',
          'blue-light': 'var(--color-primary-light)',
          yellow: 'var(--color-accent)',
          'yellow-hover': 'var(--color-accent-hover)',
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          text: 'var(--color-text)',
          border: 'var(--color-border)',
          muted: 'var(--color-muted)'
        },
      },
    },
  },
  plugins: [],
};
export default config;
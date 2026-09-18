import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        now: {
          green: "#1E4D2B",
          "green-light": "#2A6B3C",
          gold: "#F3B229",
          bg: "#F4F7F6",
          surface: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};
export default config;
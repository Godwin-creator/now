import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E4D2B", // Vert Forêt
          dark: "#14361E",
        },
        accent: {
          DEFAULT: "#F3B229", // Or / Jaune
          hover: "#D99B1F",
        },
      },
    },
  },
  plugins: [],
};
export default config;
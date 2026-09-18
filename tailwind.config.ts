import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        now: {
          blue: '#15274D',
          'blue-light': '#7096C6',
          yellow: '#FFC000',
          'yellow-hover': '#E6AD00',
          bg: '#F8FAFC',
          surface: '#FFFFFF'
        },
      },
    },
  },
  plugins: [],
};
export default config;
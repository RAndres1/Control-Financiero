import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981"
        }
      },
      boxShadow: {
        soft: "0 20px 45px -24px rgba(15, 23, 42, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;

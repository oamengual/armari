import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        editorial: {
          bg: "#FAF8F5",
          canvas: "#FFFFFF",
          sand: "#F2EFE9",
          border: "#E6E1D6",
          ink: "#141413",
          muted: "#6E6A64",
          sage: "#4A6B53",
          terracotta: "#B85D43",
          gold: "#9A7B3E",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

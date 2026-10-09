import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // User's exact light mode palette (#F2EAE0, #B4D3D9, #BDA6CE, #9B8EC7)
        cream: "#F2EAE0",
        cyan: "#B4D3D9",
        lavender: "#BDA6CE",
        purple: "#9B8EC7",

        // RGB equivalents
        "cream-rgb": "rgb(242, 234, 224)",
        "cyan-rgb": "rgb(180, 211, 217)",
        "lavender-rgb": "rgb(189, 166, 206)",
        "purple-rgb": "rgb(155, 142, 199)",

        // High contrast light mode typography and borders
        text: "#241E33",
        muted: "#635B77",
        border: "rgba(155, 142, 199, 0.28)",

        // Light mode surfaces
        bg: "#F2EAE0",
        panel: "#FFFFFF",
        panel2: "#FAF6F0",

        // Aliases for compatibility
        pixelCream: "#F2EAE0",
        pixelMint: "#B4D3D9",
        pixelLilac: "#BDA6CE",
        pixelViolet: "#9B8EC7",
        accent: "#9B8EC7",
        accent2: "#B4D3D9",
        accent3: "#BDA6CE",
      },
      borderRadius: {
        xl: "18px",
        "2xl": "24px",
        "3xl": "32px",
      },
    },
  },
  plugins: [],
};
export default config;
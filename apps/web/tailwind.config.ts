import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/streamdown/dist/**/*.{js,mjs}",
  ],
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
        // Stitch Light Design System tokens
        "canvas-ivory": "#FBF9F5",
        "surface-white": "#FFFFFF",
        "surface-cream": "#F5F1EA",
        "surface-panel-alt": "#FAF6F0",
        "border-warm": "#E6E0D8",
        "border-subtle": "#ECE7E1",
        "border-accent-tint": "rgba(136, 127, 206, 0.35)",
        "lavender-light": "#887FCE",
        "lavender-tint": "#EDEBF9",
        "honey-light": "#FBBF24",
        "honey-dark": "#D97706",
        "honey-tint": "#FEF3C7",
        "cyan-tint": "#E6F3F5",
        "cyan-dark": "#1C5B66",
        "status-success": "#1C6938",
        "status-success-bg": "#E8F5E9",
        "status-success-border": "#A5D6A7",
        "status-warning": "#F59E0B",
        "status-warning-bg": "#FFFBEB",
        "status-warning-border": "#FDE68A",
        "status-error": "#DC2626",
        "status-error-bg": "#FEF2F2",
        "status-error-border": "#FECACA",
        "text-primary": "#18181B",
        "text-muted": "#52525B",
        "text-tertiary": "#71717A",
        "primary": "#5C52A4",
        "primary-container": "#756BBF",
      },
      boxShadow: {
        "soft-card": "0 4px 20px -3px rgba(136, 127, 206, 0.08), 0 1px 4px 0 rgba(24, 24, 27, 0.02)",
        "soft-card-hover": "0 10px 28px -5px rgba(136, 127, 206, 0.14), 0 3px 8px -1px rgba(24, 24, 27, 0.04)",
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
import type { Config } from "tailwindcss";
import { semanticColors, flatColors } from "@/lib/constants/colors";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // CSS Variable-based colors (for theme switching)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Semantic colors from design system
        primary: {
          DEFAULT: semanticColors.primary.DEFAULT, // Yellow (#E8F401)
          foreground: semanticColors.accent.foreground, // Black text on yellow
          hover: semanticColors.primary.hover,
          muted: semanticColors.primary.muted,
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: semanticColors.destructive.DEFAULT, // Dark red (#80240B)
          foreground: semanticColors.foreground.DEFAULT,
          muted: semanticColors.destructive.muted,
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: semanticColors.accent.DEFAULT, // Yellow (#E8F401)
          foreground: semanticColors.accent.foreground, // Black
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: semanticColors.card.DEFAULT, // #1E1E1E
          foreground: semanticColors.foreground.DEFAULT, // #FDFDFD
          hover: semanticColors.card.hover,
        },

        // Custom semantic colors
        success: {
          DEFAULT: semanticColors.success.DEFAULT, // Green (#34A853)
          foreground: semanticColors.foreground.DEFAULT,
          muted: semanticColors.success.muted,
        },
        urgent: {
          DEFAULT: semanticColors.urgent.DEFAULT, // Orange/Red (#FF4815)
          foreground: semanticColors.foreground.DEFAULT,
          muted: semanticColors.urgent.muted,
        },

        // Flat color palette (all variants: fdfdfd-100, fdfdfd-60, etc.)
        ...flatColors,
      },
      borderRadius: {
        lg: "8px", // Cards
        md: "4px", // Buttons
        sm: "2px",
      },
      spacing: {
        // 8px grid system from PRD
        "0.5": "4px",
        "1": "8px",
        "1.5": "12px",
        "2": "16px",
        "2.5": "20px",
        "3": "24px",
        "3.5": "28px",
        "4": "32px",
        "5": "40px",
        "6": "48px",
        "7": "56px",
        "8": "64px",
      },
      fontFamily: {
        // Placeholder for custom fonts - user will provide
        sans: ["var(--font-custom)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

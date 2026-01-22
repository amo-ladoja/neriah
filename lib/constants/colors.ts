/**
 * Neriah Design System - Color Palette
 *
 * This file defines all colors used in the application with their opacity variants.
 * Each color includes both hex and rgba formats for maximum flexibility.
 */

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
};

// Helper function to convert hex to HSL
const hexToHsl = (hex: string, opacity: number = 100): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return opacity === 100
    ? `${h} ${s}% ${l}%`
    : `${h} ${s}% ${l}% / ${opacity}%`;
};

// Type definitions
export interface ColorVariant {
  hex: string;
  rgba: string;
  hsl: string;
  opacity: number;
}

export interface ColorScale {
  100: ColorVariant;
  60: ColorVariant;
  40: ColorVariant;
  30: ColorVariant;
  20: ColorVariant;
  15: ColorVariant;
  12: ColorVariant;
  2: ColorVariant;
}

// Base color definitions
const createColorScale = (baseHex: string): ColorScale => ({
  100: {
    hex: baseHex,
    rgba: hexToRgba(baseHex, 100),
    hsl: hexToHsl(baseHex, 100),
    opacity: 100,
  },
  60: {
    hex: baseHex,
    rgba: hexToRgba(baseHex, 60),
    hsl: hexToHsl(baseHex, 60),
    opacity: 60,
  },
  40: {
    hex: baseHex,
    rgba: hexToRgba(baseHex, 40),
    hsl: hexToHsl(baseHex, 40),
    opacity: 40,
  },
  30: {
    hex: baseHex,
    rgba: hexToRgba(baseHex, 30),
    hsl: hexToHsl(baseHex, 30),
    opacity: 30,
  },
  20: {
    hex: baseHex,
    rgba: hexToRgba(baseHex, 20),
    hsl: hexToHsl(baseHex, 20),
    opacity: 20,
  },
  15: {
    hex: baseHex,
    rgba: hexToRgba(baseHex, 15),
    hsl: hexToHsl(baseHex, 15),
    opacity: 15,
  },
  12: {
    hex: baseHex,
    rgba: hexToRgba(baseHex, 12),
    hsl: hexToHsl(baseHex, 12),
    opacity: 12,
  },
  2: {
    hex: baseHex,
    rgba: hexToRgba(baseHex, 2),
    hsl: hexToHsl(baseHex, 2),
    opacity: 2,
  },
});

// Color Palette
export const colors = {
  // Near white - Primary text, icons, UI surfaces
  fdfdfd: createColorScale('#FDFDFD'),

  // Very dark - Dark mode backgrounds, text
  131313: createColorScale('#131313'),

  // Bright yellow - Accents, primary actions
  e8f401: createColorScale('#E8F401'),

  // Green - Success states, positive indicators
  '34a853': createColorScale('#34A853'),

  // Black - Deep shadows, text
  '060606': createColorScale('#060606'),

  // Dark red/brown - Error states
  '80240b': createColorScale('#80240B'),

  // Dark gray - Secondary backgrounds
  '1e1e1e': createColorScale('#1E1E1E'),

  // Orange/red - Warnings, urgent states
  ff4815: createColorScale('#FF4815'),
};

// Semantic color mapping for Tailwind
export const semanticColors = {
  // Backgrounds
  background: {
    DEFAULT: colors['131313'][100].hex,
    muted: colors['1e1e1e'][100].hex,
  },

  // Text
  foreground: {
    DEFAULT: colors.fdfdfd[100].hex,
    muted: colors.fdfdfd[60].hex,
    subtle: colors.fdfdfd[40].hex,
  },

  // Cards & Surfaces
  card: {
    DEFAULT: colors['1e1e1e'][100].hex,
    hover: colors['1e1e1e'][60].hex,
  },

  // Primary actions (Yellow buttons)
  primary: {
    DEFAULT: colors.e8f401[100].hex,
    hover: colors.e8f401[60].hex,
    muted: colors.e8f401[40].hex,
  },

  // Success (Green badges & indicators)
  success: {
    DEFAULT: colors['34a853'][100].hex,
    muted: colors['34a853'][60].hex,
  },

  // Urgent/Warning (Orange badges)
  urgent: {
    DEFAULT: colors.ff4815[100].hex,
    muted: colors.ff4815[60].hex,
  },

  // Destructive/Error (Dark red)
  destructive: {
    DEFAULT: colors['80240b'][100].hex,
    muted: colors['80240b'][60].hex,
  },

  // Borders
  border: {
    DEFAULT: colors.fdfdfd[40].rgba,
    subtle: colors.fdfdfd[20].rgba,
    muted: colors.fdfdfd[12].rgba,
  },

  // Accents
  accent: {
    DEFAULT: colors.e8f401[100].hex,
    foreground: colors['060606'][100].hex,
  },
};

// Export flat color palette for direct Tailwind usage
export const flatColors = {
  // FDFDFD variants
  'fdfdfd-100': colors.fdfdfd[100].hex,
  'fdfdfd-60': colors.fdfdfd[60].rgba,
  'fdfdfd-40': colors.fdfdfd[40].rgba,
  'fdfdfd-30': colors.fdfdfd[30].rgba,
  'fdfdfd-20': colors.fdfdfd[20].rgba,
  'fdfdfd-15': colors.fdfdfd[15].rgba,
  'fdfdfd-12': colors.fdfdfd[12].rgba,
  'fdfdfd-2': colors.fdfdfd[2].rgba,

  // 131313 variants
  '131313-100': colors['131313'][100].hex,
  '131313-60': colors['131313'][60].rgba,
  '131313-40': colors['131313'][40].rgba,
  '131313-30': colors['131313'][30].rgba,
  '131313-20': colors['131313'][20].rgba,
  '131313-15': colors['131313'][15].rgba,
  '131313-12': colors['131313'][12].rgba,
  '131313-2': colors['131313'][2].rgba,

  // E8F401 variants
  'e8f401-100': colors.e8f401[100].hex,
  'e8f401-60': colors.e8f401[60].rgba,
  'e8f401-40': colors.e8f401[40].rgba,
  'e8f401-30': colors.e8f401[30].rgba,
  'e8f401-20': colors.e8f401[20].rgba,
  'e8f401-15': colors.e8f401[15].rgba,
  'e8f401-12': colors.e8f401[12].rgba,
  'e8f401-2': colors.e8f401[2].rgba,

  // 34A853 variants
  '34a853-100': colors['34a853'][100].hex,
  '34a853-60': colors['34a853'][60].rgba,
  '34a853-40': colors['34a853'][40].rgba,
  '34a853-30': colors['34a853'][30].rgba,
  '34a853-20': colors['34a853'][20].rgba,
  '34a853-15': colors['34a853'][15].rgba,
  '34a853-12': colors['34a853'][12].rgba,
  '34a853-2': colors['34a853'][2].rgba,

  // 060606 variants
  '060606-100': colors['060606'][100].hex,
  '060606-60': colors['060606'][60].rgba,
  '060606-40': colors['060606'][40].rgba,
  '060606-30': colors['060606'][30].rgba,
  '060606-20': colors['060606'][20].rgba,
  '060606-15': colors['060606'][15].rgba,
  '060606-12': colors['060606'][12].rgba,
  '060606-2': colors['060606'][2].rgba,

  // 80240B variants
  '80240b-100': colors['80240b'][100].hex,
  '80240b-60': colors['80240b'][60].rgba,
  '80240b-40': colors['80240b'][40].rgba,
  '80240b-30': colors['80240b'][30].rgba,
  '80240b-20': colors['80240b'][20].rgba,
  '80240b-15': colors['80240b'][15].rgba,
  '80240b-12': colors['80240b'][12].rgba,
  '80240b-2': colors['80240b'][2].rgba,

  // 1E1E1E variants
  '1e1e1e-100': colors['1e1e1e'][100].hex,
  '1e1e1e-60': colors['1e1e1e'][60].rgba,
  '1e1e1e-40': colors['1e1e1e'][40].rgba,
  '1e1e1e-30': colors['1e1e1e'][30].rgba,
  '1e1e1e-20': colors['1e1e1e'][20].rgba,
  '1e1e1e-15': colors['1e1e1e'][15].rgba,
  '1e1e1e-12': colors['1e1e1e'][12].rgba,
  '1e1e1e-2': colors['1e1e1e'][2].rgba,

  // FF4815 variants
  'ff4815-100': colors.ff4815[100].hex,
  'ff4815-60': colors.ff4815[60].rgba,
  'ff4815-40': colors.ff4815[40].rgba,
  'ff4815-30': colors.ff4815[30].rgba,
  'ff4815-20': colors.ff4815[20].rgba,
  'ff4815-15': colors.ff4815[15].rgba,
  'ff4815-12': colors.ff4815[12].rgba,
  'ff4815-2': colors.ff4815[2].rgba,
};

// Export default for convenience
export default colors;

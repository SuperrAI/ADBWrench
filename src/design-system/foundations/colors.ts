/**
 * Colors Foundation
 *
 * Terminal-inspired color system: Black, White, and Orange accent.
 * Flat, paper-like aesthetic with minimal color usage.
 */

// Core Colors - foundational colors
export const CoreColors = {
  White: '#FFFFFF',
  Black: '#000000',
}

// Neutral scale - for borders, muted text, backgrounds
export const Neutral = {
  N50: '#FAFAFA',
  N100: '#F5F5F5',
  N200: '#E5E5E5',
  N300: '#D4D4D4',
  N400: '#A3A3A3',
  N500: '#737373',
  N600: '#525252',
  N700: '#404040',
  N800: '#262626',
  N900: '#171717',
  N950: '#0A0A0A',
}

// Orange - primary accent color
export const Orange = {
  O50: '#FFF8F5',
  O100: '#FFEDE5',
  O200: '#FFDCCB',
  O300: '#FFBEA0',
  O400: '#FF9662',
  O500: '#FF6F1E',  // Primary accent
  O600: '#E85A0C',
  O700: '#C44600',
  O800: '#9C3700',
  O900: '#7A2E00',
  O950: '#451A00',
}

// Minimal status colors (kept for error/success states)
export const Green = {
  G500: '#22C55E',
  G600: '#16A34A',
}

export const Red = {
  R500: '#EF4444',
  R600: '#DC2626',
}

// Semantic Colors - purpose-based naming
export const SemanticColors = {
  Primary: CoreColors.Black,
  Secondary: Neutral.N500,
  Error: Red.R500,
  Warning: Orange.O500,
  Success: Green.G500,
  Info: Neutral.N500,
  Accent: Orange.O500,
}

// Terminal Theme - flat, paper-like aesthetic
export const TerminalTheme = {
  // Backgrounds
  bg: CoreColors.White,
  bgAlt: Neutral.N100,
  bgDark: CoreColors.Black,

  // Text
  text: CoreColors.Black,
  textMuted: Neutral.N500,
  textInverse: CoreColors.White,

  // Borders - use instead of shadows
  border: Neutral.N200,
  borderStrong: CoreColors.Black,
  borderMuted: Neutral.N100,

  // Accent (Orange)
  accent: Orange.O500,
  accentLight: Orange.O50,
  accentDark: Orange.O700,
  accentHover: Orange.O600,

  // Status
  success: Green.G500,
  error: Red.R500,
  warning: Orange.O500,
}

// Light Theme (compatible with existing usage)
export const LightTheme = {
  primary: CoreColors.Black,
  onPrimary: CoreColors.White,
  secondary: Neutral.N800,
  onSecondary: Neutral.N100,
  tertiary: Neutral.N600,
  onTertiary: CoreColors.White,
  background: CoreColors.White,
  onBackground: CoreColors.Black,
  surface: CoreColors.White,
  onSurface: CoreColors.Black,
  // UI Element Colors
  border: Neutral.N200,
  hover: Neutral.N100,
  backgroundPrimary: CoreColors.White,
  backgroundSecondary: Neutral.N50,
  backgroundAccent: Orange.O500,
  divider: Neutral.N200,
  // Typography Colors
  textPrimary: CoreColors.Black,
  textSecondary: Neutral.N500,
  textPlaceholder: Neutral.N400,
}

// Export all color tokens as default
export const colors = {
  core: CoreColors,
  semantic: SemanticColors,
  neutral: Neutral,
  orange: Orange,
  green: Green,
  red: Red,
  light: LightTheme,
  terminal: TerminalTheme,
}

export default colors

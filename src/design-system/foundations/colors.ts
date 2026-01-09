/**
 * Colors Foundation
 * 
 * This file defines the color system for the application.
 * It includes all color tokens used throughout the UI.
 */

// Core Colors - foundational colors
export const CoreColors = {
  White: '#FFFFFF',
  Black: '#000000',
}

// Semantic Colors - purpose-based naming
export const SemanticColors = {
  Primary: 'var(--blue)',
  Secondary: 'var(--neutral)',
  Error: 'var(--red)',
  Warning: 'var(--amber)',
  Success: 'var(--green)',
  Info: 'var(--blue)',
  Accent: 'var(--orange)',
}

// Color scales - organized for better maintenance
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

export const Blue = {
  B50: '#EFF6FF',
  B100: '#DBEAFE',
  B200: '#BFDBFE',
  B300: '#93C5FD',
  B400: '#60A5FA',
  B500: '#3B82F6',
  B600: '#2563EB',
  B700: '#1D4ED8',
  B800: '#1E40AF',
  B900: '#1E3A8A',
  B950: '#172554',
}

export const Green = {
  G50: '#F0FDF4',
  G100: '#DCFCE7',
  G200: '#BBF7D0',
  G300: '#86EFAC',
  G400: '#4ADE80',
  G500: '#22C55E',
  G600: '#16A34A',
  G700: '#15803D',
  G800: '#166534',
  G900: '#14532D',
  G950: '#052E16',
}

export const Red = {
  R50: '#FEF2F2',
  R100: '#FEE2E2',
  R200: '#FECACA',
  R300: '#FCA5A5',
  R400: '#F87171',
  R500: '#EF4444',
  R600: '#DC2626',
  R700: '#B91C1C',
  R800: '#991B1B',
  R900: '#7F1D1D',
  R950: '#450A0A',
}

export const Orange = {
  O50: '#FFF8F5',
  O100: '#FFEDE5',
  O200: '#FFDCCB',
  O300: '#FFBEA0',
  O400: '#FF9662',
  O500: '#FF6F1E',
  O600: '#E85A0C',
  O700: '#C44600',
  O800: '#9C3700',
  O900: '#7A2E00',
  O950: '#451A00',
}

export const Amber = {
  A50: '#FFFBEB',
  A100: '#FEF3C7',
  A200: '#FDE68A',
  A300: '#FCD34D',
  A400: '#FBBF24',
  A500: '#F59E0B',
  A600: '#D97706',
  A700: '#B45309',
  A800: '#92400E',
  A900: '#78350F',
  A950: '#451A03',
}

// Theme color schemes
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
  blue: Blue,
  green: Green,
  red: Red,
  orange: Orange,
  amber: Amber,
  light: LightTheme,
}

export default colors 
/**
 * Typography Foundation
 *
 * This file defines the typography system for the application.
 * It includes font families, font sizes, line heights, font weights,
 * and letter spacing values.
 */

export const typography = {
  fontFamily: {
    sans: 'var(--font-geist-sans), sans-serif',
    mono: 'var(--font-geist-mono), monospace',
    kalam: 'var(--font-kalam), sans-serif',
    shantell_sans: 'var(--font-shantell-sans), sans-serif',
    // serif: 'Ivy Presto Headline, serif',
  },
  // Font size scale in pixels
  fontSize: {
    textXS: '12px',
    textS: '14px',
    textM: '16px',
    textL: '18px',
    textXL: '24px',
    text2XL: '28px',
    text3XL: '40px',
  },
  // Line height scale
  lineHeight: {
    compact: '18px',
    tight: '20px',
    normal: '24px',
    relaxed: '30px',
    wide: '36px',
    extraWide: '48px',
  },
  // Font weight
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
  },
  // Letter spacing
  letterSpacing: {
    none: '0%',
  },
};

export const textStyles = {
  // Heading styles
  h1: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.text3XL,
    lineHeight: typography.lineHeight.extraWide,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.none,
  },
  h2: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.text2XL,
    lineHeight: typography.lineHeight.wide,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.none,
  },
  h3: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textXL,
    lineHeight: typography.lineHeight.wide,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.none,
  },
  h4: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textL,
    lineHeight: typography.lineHeight.normal,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.none,
  },

  // Body text styles
  body1Reg: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textM,
    lineHeight: typography.lineHeight.normal,
    fontWeight: typography.fontWeight.regular,
    letterSpacing: typography.letterSpacing.none,
  },
  body1Med: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textM,
    lineHeight: typography.lineHeight.normal,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.none,
  },
  body1Semi: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textM,
    lineHeight: typography.lineHeight.normal,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.none,
  },
  body1SemiLong: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textM,
    lineHeight: typography.lineHeight.relaxed,
    fontWeight: typography.fontWeight.regular,
    letterSpacing: typography.letterSpacing.none,
  },
  body2Reg: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textS,
    lineHeight: typography.lineHeight.tight,
    fontWeight: typography.fontWeight.regular,
    letterSpacing: typography.letterSpacing.none,
  },
  body2Med: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textS,
    lineHeight: typography.lineHeight.tight,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.none,
  },
  body2Semi: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textS,
    lineHeight: typography.lineHeight.tight,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.none,
  },
  body3Semi: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textS,
    lineHeight: typography.lineHeight.normal,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.none,
  },
  body3Med: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textL,
    lineHeight: typography.lineHeight.relaxed,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.none,
  },
  // Label styles
  labelSansReg: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textXS,
    lineHeight: typography.lineHeight.compact,
    fontWeight: typography.fontWeight.regular,
    letterSpacing: typography.letterSpacing.none,
  },
  labelSansMed: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textXS,
    lineHeight: typography.lineHeight.compact,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.none,
  },
  labelSansSemi: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.textXS,
    lineHeight: typography.lineHeight.compact,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.none,
  },
  labelMono: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.textM,
    lineHeight: typography.lineHeight.normal,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.none,
  },
  kalam: {
    fontFamily: typography.fontFamily.kalam,
    fontSize: typography.fontSize.textM,
    lineHeight: typography.lineHeight.normal,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.none,
  },
  shantell_sans: {
    fontFamily: typography.fontFamily.shantell_sans,
    fontSize: typography.fontSize.textM,
    lineHeight: typography.lineHeight.normal,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.none,
  },
};

export default { typography, textStyles };

/**
 * Animations Foundation
 * 
 * This file defines the animation system for the application.
 * It includes durations, easings, keyframes, and animation presets.
 */

export const durations = {
  fastest: '50ms',
  faster: '100ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '400ms',
  slowest: '500ms',
}

export const easings = {
  // Easings based on CSS standard
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // More expressive easings
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasizedDecelerate: 'cubic-bezier(0, 0, 0, 1)',
  emphasizedAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  
  // Standard easings
  easeInSine: 'cubic-bezier(0.12, 0, 0.39, 0)',
  easeOutSine: 'cubic-bezier(0.61, 1, 0.88, 1)',
  easeInOutSine: 'cubic-bezier(0.37, 0, 0.63, 1)',
  
  easeInQuad: 'cubic-bezier(0.11, 0, 0.5, 0)',
  easeOutQuad: 'cubic-bezier(0.5, 1, 0.89, 1)',
  easeInOutQuad: 'cubic-bezier(0.45, 0, 0.55, 1)',
  
  easeInCubic: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  
  easeInQuart: 'cubic-bezier(0.5, 0, 0.75, 0)',
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeInOutQuart: 'cubic-bezier(0.76, 0, 0.24, 1)',
  
  easeInQuint: 'cubic-bezier(0.64, 0, 0.78, 0)',
  easeOutQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeInOutQuint: 'cubic-bezier(0.83, 0, 0.17, 1)',
  
  easeInExpo: 'cubic-bezier(0.7, 0, 0.84, 0)',
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOutExpo: 'cubic-bezier(0.87, 0, 0.13, 1)',
  
  easeInCirc: 'cubic-bezier(0.55, 0, 1, 0.45)',
  easeOutCirc: 'cubic-bezier(0, 0.55, 0.45, 1)',
  easeInOutCirc: 'cubic-bezier(0.85, 0, 0.15, 1)',
  
  easeInBack: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeInOutBack: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
}

export const keyframes = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
  
  // Slide animations
  slideInTop: {
    from: { transform: 'translateY(-100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideOutTop: {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(-100%)' },
  },
  slideInRight: {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideOutRight: {
    from: { transform: 'translateX(0)' },
    to: { transform: 'translateX(100%)' },
  },
  slideInBottom: {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideOutBottom: {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(100%)' },
  },
  slideInLeft: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideOutLeft: {
    from: { transform: 'translateX(0)' },
    to: { transform: 'translateX(-100%)' },
  },
  
  // Scale animations
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.95)', opacity: 0 },
  },
  
  // Spinner animation
  spin: {
    to: { transform: 'rotate(360deg)' },
  },
  
  // Pulse animation
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  
  // Specific component animations
  accordionDown: {
    from: { height: 0 },
    to: { height: 'var(--radix-accordion-content-height)' },
  },
  accordionUp: {
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: 0 },
  },
}

export const animations = {
  // Common animation presets combining duration, easing, and keyframes
  fadeIn: `${keyframes.fadeIn} ${durations.normal} ${easings.out}`,
  fadeOut: `${keyframes.fadeOut} ${durations.normal} ${easings.in}`,
  
  slideInTop: `${keyframes.slideInTop} ${durations.normal} ${easings.out}`,
  slideOutTop: `${keyframes.slideOutTop} ${durations.normal} ${easings.in}`,
  slideInRight: `${keyframes.slideInRight} ${durations.normal} ${easings.out}`,
  slideOutRight: `${keyframes.slideOutRight} ${durations.normal} ${easings.in}`,
  slideInBottom: `${keyframes.slideInBottom} ${durations.normal} ${easings.out}`,
  slideOutBottom: `${keyframes.slideOutBottom} ${durations.normal} ${easings.in}`,
  slideInLeft: `${keyframes.slideInLeft} ${durations.normal} ${easings.out}`,
  slideOutLeft: `${keyframes.slideOutLeft} ${durations.normal} ${easings.in}`,
  
  scaleIn: `${keyframes.scaleIn} ${durations.normal} ${easings.out}`,
  scaleOut: `${keyframes.scaleOut} ${durations.normal} ${easings.in}`,
  
  spin: `${keyframes.spin} ${durations.slowest} ${easings.linear} infinite`,
  pulse: `${keyframes.pulse} ${durations.slow} ${easings.inOut} infinite`,
  
  accordionDown: `${keyframes.accordionDown} ${durations.normal} ${easings.out}`,
  accordionUp: `${keyframes.accordionUp} ${durations.normal} ${easings.in}`,
}

export default {
  durations,
  easings,
  keyframes,
  animations,
} 
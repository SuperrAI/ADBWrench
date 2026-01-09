import React from 'react';
import { cn } from '@/lib/utils';

type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type LoaderVariant = 'primary' | 'secondary' | 'accent' | 'muted' | 'white';

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The size of the loader
   */
  size?: LoaderSize;
  /**
   * The color variant of the loader
   */
  variant?: LoaderVariant;
  /**
   * Type of loader to display
   */
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  /**
   * Optional text to display with the loader
   */
  text?: string;
  /**
   * Whether to center the loader in its container
   */
  centered?: boolean;
  /**
   * Whether to display a full page overlay
   */
  fullPage?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Loader component
 *
 * A component for displaying loading states in different styles and sizes.
 */
export const Loader = ({
  size = 'md',
  variant = 'primary',
  type = 'spinner',
  text,
  centered = false,
  fullPage = false,
  className,
  ...props
}: LoaderProps) => {
  // Size classes for different loader types
  const sizeClasses = {
    spinner: {
      xs: 'h-4 w-4 border-2',
      sm: 'h-6 w-6 border-2',
      md: 'h-8 w-8 border-2',
      lg: 'h-12 w-12 border-3',
      xl: 'h-16 w-16 border-4',
    },
    dots: {
      xs: 'gap-1',
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-2.5',
      xl: 'gap-3',
    },
    pulse: {
      xs: 'h-4',
      sm: 'h-6',
      md: 'h-8',
      lg: 'h-12',
      xl: 'h-16',
    },
    skeleton: {
      xs: 'h-4',
      sm: 'h-6',
      md: 'h-8',
      lg: 'h-12',
      xl: 'h-16',
    },
  };

  // Dot sizes for dot loader
  const dotSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };

  // Variant classes for different loader types
  const variantClasses = {
    spinner: {
      primary: 'border-primary/30 border-t-primary',
      secondary: 'border-secondary/30 border-t-secondary',
      accent: 'border-accent/30 border-t-accent',
      muted: 'border-muted/30 border-t-muted',
      white: 'border-white/30 border-t-white',
    },
    dots: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      accent: 'bg-accent',
      muted: 'bg-muted',
      white: 'bg-white',
    },
    pulse: {
      primary: 'bg-primary/20',
      secondary: 'bg-secondary/20',
      accent: 'bg-accent/20',
      muted: 'bg-muted/20',
      white: 'bg-white/20',
    },
    skeleton: {
      primary: 'bg-primary/10',
      secondary: 'bg-secondary/10',
      accent: 'bg-accent/10',
      muted: 'bg-muted/10',
      white: 'bg-white/10',
    },
  };

  // Container classes
  const containerClasses = cn(
    'transition-all',
    centered && 'flex flex-col items-center justify-center',
    fullPage &&
      'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center',
    className
  );

  // Render the appropriate loader type
  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <div
            className={cn(
              'animate-spin rounded-full border-solid',
              sizeClasses.spinner[size],
              variantClasses.spinner[variant]
            )}
          />
        );

      case 'dots':
        return (
          <div className={cn('flex', sizeClasses.dots[size])}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full animate-pulse',
                  dotSizes[size],
                  variantClasses.dots[variant],
                  {
                    'animation-delay-200': i === 2,
                    'animation-delay-400': i === 3,
                  }
                )}
                style={{
                  animationDelay: i === 2 ? '0.2s' : i === 3 ? '0.4s' : '0s',
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div
            className={cn(
              'w-full animate-pulse rounded-md',
              sizeClasses.pulse[size],
              variantClasses.pulse[variant]
            )}
          />
        );

      case 'skeleton':
        return (
          <div
            className={cn(
              'w-full rounded-md relative overflow-hidden',
              sizeClasses.skeleton[size],
              variantClasses.skeleton[variant],
              'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent'
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={containerClasses} {...props}>
      {renderLoader()}
      {text && (
        <p
          className={cn('text-center mt-3', {
            'text-xs': size === 'xs' || size === 'sm',
            'text-sm': size === 'md',
            'text-base': size === 'lg' || size === 'xl',
          })}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;

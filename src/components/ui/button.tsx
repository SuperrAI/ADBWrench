import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { CoreColors, Neutral, Red } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';

// Base button styles without padding (to be applied conditionally)
const baseButtonStyles =
  'inline-flex items-center justify-center gap-1 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0';

const buttonVariants = cva(baseButtonStyles, {
  variants: {
    variant: {
      default: `bg-black text-white shadow hover:bg-neutral-800`,
      destructive: `bg-[#EF4444] text-white shadow-sm hover:bg-[#DC2626]`,
      outline: `border border-neutral-200 bg-white shadow-sm hover:bg-neutral-100 hover:text-black`,
      outlineDestructive: `border border-[#DC2626] text-[#DC2626] bg-transparent hover:bg-red-50`,
      secondary: `bg-neutral-100 text-black hover:bg-neutral-200`,
      ghost: `hover:bg-neutral-100 hover:text-black`,
      link: `text-neutral-500 underline-offset-4 hover:underline`,
    },
    size: {
      default: 'h-12 py-[10px] rounded-md', // Medium - vertical padding only
      sm: 'h-8 py-1.5 px-3 rounded-md', // Small - fixed padding
      lg: 'h-14 py-[12px] rounded-md', // Large - vertical padding only
      icon: 'h-12 w-12 p-0 rounded-md', // Icon - no padding needed
    },
    shape: {
      default: 'rounded-md', // Default squircle shape
      rounded: 'rounded-full', // Pill/rounded shape
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    shape: 'default',
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  hasIcon?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size = 'default',
      shape,
      asChild = false,
      hasIcon = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Check if button contains an icon by examining children
    const checkForIcon = () => {
      if (React.Children.count(children) === 0) return false;

      // If explicitly specified, use that
      if (hasIcon) return true;

      // Otherwise try to detect icon from children
      let containsIcon = false;
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && typeof child.type !== 'string') {
          containsIcon = true;
        }
      });

      return containsIcon;
    };

    const hasIconInContent = checkForIcon();

    // Get horizontal padding based on button size and content type
    const getHorizontalPadding = () => {
      if (size === 'icon') return {};

      if (size === 'lg') {
        return hasIconInContent
          ? { paddingLeft: '12px', paddingRight: '16px' } // Large with icon
          : { paddingLeft: '16px', paddingRight: '16px' }; // Large text-only
      }

      if (size === 'default') {
        return hasIconInContent
          ? { paddingLeft: '10px', paddingRight: '14px' } // Medium with icon
          : { paddingLeft: '14px', paddingRight: '14px' }; // Medium text-only
      }

      // Small buttons have fixed padding
      return {};
    };

    // Apply typography styles from design system based on button size
    const getTypographyStyle = () => {
      switch (size) {
        case 'lg':
          return {
            fontFamily: textStyles.body1Med.fontFamily,
            fontSize: textStyles.body1Med.fontSize,
            fontWeight: textStyles.body1Med.fontWeight,
            lineHeight: textStyles.body1Med.lineHeight,
            letterSpacing: textStyles.body1Med.letterSpacing,
          };
        case 'sm':
        case 'default':
        default:
          return {
            fontFamily: textStyles.body2Med.fontFamily,
            fontSize: textStyles.body2Med.fontSize,
            fontWeight: textStyles.body2Med.fontWeight,
            lineHeight: textStyles.body2Med.lineHeight,
            letterSpacing: textStyles.body2Med.letterSpacing,
          };
      }
    };

    const combinedStyles = {
      ...getTypographyStyle(),
      ...getHorizontalPadding(),
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        style={combinedStyles}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

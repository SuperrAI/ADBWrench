import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { CoreColors, Neutral, Orange } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';
import { Spinner } from './Spinner';

// Base classes that apply to all buttons
const baseButtonStyles = `inline-flex items-center justify-center rounded-full border border-[${Neutral.N200}] bg-[${Neutral.N50}] transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed`;

// Size-specific classes
const sizeClasses = {
  // Small button (no icon)
  small: 'py-[6px] px-[12px]', // 6px vertical, 12px horizontal
  // Medium button (no icon)
  medium: 'py-[10px] px-[14px]', // 10px vertical, 14px horizontal
  // Large button (no icon)
  large: 'py-[12px] px-[16px]', // 12px vertical, 16px horizontal
};

// Icon size classes
const iconSizeClasses = {
  small: 'w-[16px] h-[16px]', // 16x16
  medium: 'w-[20px] h-[20px]', // 20x20
  large: 'w-[24px] h-[24px]', // 24x24 for squircle icon buttons
};

// Icon-only button padding classes
const iconOnlyPaddingClasses = {
  small: 'p-[6px]', // 6px all sides
  medium: 'p-[10px]', // 10px all sides
  large: 'p-[12px]', // 12px all sides
};

// Icon gap classes
const iconGapClasses = {
  small: 'gap-[4px]', // 4px
  medium: 'gap-[4px]', // 4px
  large: 'gap-[6px]', // 6px
};

// Icon padding adjustments (left and right sides)
const iconPaddingClasses = {
  small: 'py-[6px] pl-[8px] pr-[12px]', // 6px vertical, 8px left, 12px right
  medium: 'py-[10px] pl-[10px] pr-[14px]', // 10px vertical, 10px left, 14px right
  large: 'py-[12px] pl-[12px] pr-[16px]', // 12px vertical, 12px left, 16px right
};

// Add SVG icons for squircle buttons
const SquircleSmallIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ strokeWidth: '1.2px' }}
  >
    <path d="M6 1V11M1 6H11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SquircleMediumIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ strokeWidth: '1.5px' }}
  >
    <path d="M7 1V13M1 7H13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SquircleLargeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ strokeWidth: '1.5px' }}
  >
    <path d="M8 1V15M1 8H15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Add SVG icons for small buttons
const SmallPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M8 3.83301V12.1663"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.1668 8H3.8335"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Add SVG icons for medium buttons
const MediumPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 4.79199V15.2087"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.2084 10H4.79169"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Add SVG icons for large buttons
const LargePlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5.75V18.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.25 12H5.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button size: small, medium, or large
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Button variant
   * @default 'outline'
   */
  variant?:
    | 'outline'
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'squircle'
    | 'success'
    | 'warning'
    | 'info'
    | 'elevated'
    | 'loading'
    | 'squircleIcon';

  /**
   * Button shape: default (for squircle when used with squircle variant) or rounded
   * @default 'rounded'
   */
  shape?: 'default' | 'rounded';

  /**
   * Required when using squircle variant. Specifies which variant's styles to inherit.
   * This dictates all styles (colors, borders, states) for the squircle button.
   */
  squircleBaseStyle?:
    | 'outline'
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'success'
    | 'warning'
    | 'info'
    | 'elevated';

  /**
   * Whether the button is in a loading state
   */
  isLoading?: boolean;

  /**
   * Text to show when loading (optional)
   */
  loadingText?: string;

  /**
   * Icon to display before the button text (left side)
   */
  icon?: React.ReactNode;

  /**
   * Icon to display after the button text (right side)
   */
  endIcon?: React.ReactNode;

  /**
   * If true, the component will be rendered as a child
   */
  asChild?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Render the button with a special icon (for squircle variant)
   */
  useSquircleIcon?: boolean;

  /**
   * If true, the button will be rendered as an icon-only button
   */
  iconOnly?: boolean;
}

/**
 * Button component
 *
 * A customizable button component with small, medium, and large sizes,
 * with or without an icon. All buttons hug their content.
 *
 * Sizes:
 * - small:
 *   - No icon: 6px vertical padding, 12px horizontal padding
 *   - With icon: 6px vertical padding, 8px left padding, 12px right padding, 4px gap
 *   - Icon-only: 6px padding, 16px icon size
 *
 * - medium:
 *   - No icon: 10px vertical padding, 14px horizontal padding
 *   - With icon: 10px vertical padding, 10px left padding, 14px right padding, 4px gap
 *   - Icon-only: 10px padding, 20px icon size
 *
 * - large:
 *   - No icon: 12px vertical padding, 16px horizontal padding
 *   - With icon: 12px vertical padding, 12px left padding, 16px right padding, 6px gap
 *   - Icon-only: 12px padding, 24px icon size
 *
 * Variants:
 * - outline: White background with border
 * - primary: Blue background
 * - secondary: Light gray background
 * - ghost: No background or border
 * - success: Green background
 * - warning: Amber background
 * - info: Blue information background
 * - elevated: White background with shadow
 * - squircle: Not a style variant, but a shape variant that inherits styles from other variants
 * - squircleIcon: Icon-only button with squircle shape (rounded corners)
 *   - Small: 8px border radius, 6px padding, 16px icon size
 *   - Medium: 10px border radius, 10px padding, 20px icon size
 *   - Large: 12px border radius, 12px padding, 20px icon size
 *   - Supports all base styles (outline, primary, secondary, etc.)
 *   - Fully inherits all state behaviors from the specified base style
 * - loading: Grey background with border and a spinner
 *
 * Loading variant:
 * - Small rounded: 6px 12px 6px 8px padding, 99px border radius
 * - Small squircle: 6px 12px 6px 8px padding, 10px border radius
 * - Medium rounded: 10px 14px 10px 12px padding, 99px border radius
 * - Medium squircle: 10px 14px 10px 12px padding, 12px border radius
 * - Large rounded: 12px 14px padding, 99px border radius
 * - Large squircle: 12px 14px padding, 14px border radius
 * - All loading buttons have 8px gap between spinner and text
 * - All loading buttons have 16px spinner in grey variant
 * - Small and medium use body2Med typography, large uses body1Med
 *
 * Squircle variant:
 * - Has no styling of its own - requires squircleBaseStyle to specify which variant styles to inherit
 * - Border radius: small: 10px, medium: 12px, large: 14px
 * - Can use built-in plus icon with 'useSquircleIcon' prop
 * - Built-in icon sizes: small: 12×12 with 1.2px stroke, medium/large: 14×14 with 1.5px stroke
 * - Fully inherits all state behaviors from the specified base style
 * - Supports all variants as base styles, including elevated
 *
 * States:
 * All button variants maintain consistent styling for:
 * - Normal: Base state
 * - Hover: Slightly darker background/border
 * - Active/Pressed: Darker background/border with slight Y translation
 * - Focus: Ring outline
 * - Disabled: 50% opacity and not-allowed cursor
 *
 * All buttons:
 * - Default rounded border radius: 99px (except squircle)
 * - Hug width and height
 *
 * Icon-only buttons:
 * - Small: 16px icon with 6px padding
 * - Medium: 20px icon with 10px padding
 * - Large: 24px icon with 12px padding
 * - Support all variants including ghost, outline
 * - Hug width and height for content
 *
 * Typography:
 * - Small and medium buttons use body2Med text style
 * - Large buttons use body1Med text style
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'outline',
      size = 'medium',
      squircleBaseStyle,
      isLoading = false,
      loadingText,
      icon,
      endIcon,
      asChild = false,
      className,
      children,
      disabled,
      style,
      useSquircleIcon = false,
      iconOnly = false,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);

    // Ensure squircleBaseStyle is provided when variant is squircle
    const effectiveVariant =
      variant === 'squircle' || variant === 'squircleIcon'
        ? squircleBaseStyle || 'outline' // Fallback to outline if not provided
        : variant;

    // Get padding based on size and icon presence
    const getPadding = () => {
      if (iconOnly) {
        // Icon-only button
        return iconOnlyPaddingClasses[size];
      } else if (variant === 'loading') {
        // Loading variant specific padding
        switch (size) {
          case 'small':
            return {
              paddingTop: '6px',
              paddingBottom: '6px',
              paddingLeft: '8px',
              paddingRight: '12px',
            };
          case 'medium':
            return {
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '12px',
              paddingRight: '14px',
            };
          case 'large':
            return {
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingLeft: '14px',
              paddingRight: '14px',
            };
          default:
            return {
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '12px',
              paddingRight: '14px',
            };
        }
      } else if (icon || isLoading || (variant === 'squircle' && useSquircleIcon)) {
        // With icon on left
        switch (size) {
          case 'small':
            return {
              paddingTop: '6px',
              paddingBottom: '6px',
              paddingLeft: '8px',
              paddingRight: endIcon ? '8px' : '12px',
            };
          case 'medium':
            return {
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '10px',
              paddingRight: endIcon ? '10px' : '14px',
            };
          case 'large':
            return {
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingLeft: '12px',
              paddingRight: endIcon ? '12px' : '16px',
            };
          default:
            return {
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '10px',
              paddingRight: endIcon ? '10px' : '14px',
            };
        }
      } else if (endIcon) {
        // With icon on right only
        switch (size) {
          case 'small':
            return {
              paddingTop: '6px',
              paddingBottom: '6px',
              paddingLeft: '12px',
              paddingRight: '8px',
            };
          case 'medium':
            return {
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '14px',
              paddingRight: '10px',
            };
          case 'large':
            return {
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingLeft: '16px',
              paddingRight: '12px',
            };
          default:
            return {
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '14px',
              paddingRight: '10px',
            };
        }
      } else {
        // Without icon
        switch (size) {
          case 'small':
            return {
              paddingTop: '6px',
              paddingBottom: '6px',
              paddingLeft: '12px',
              paddingRight: '12px',
            };
          case 'medium':
            return {
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '14px',
              paddingRight: '14px',
            };
          case 'large':
            return {
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingLeft: '16px',
              paddingRight: '16px',
            };
          default:
            return {
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '14px',
              paddingRight: '14px',
            };
        }
      }
    };

    // Get icon size based on button size
    const getIconSize = () => {
      if (variant === 'loading') {
        // For loading variant, spinner is consistently 16px
        return { width: '16px', height: '16px' };
      }

      if (iconOnly || variant === 'squircleIcon') {
        // For icon-only buttons, ensure exact sizing per specs
        if (size === 'small') {
          return { width: '16px', height: '16px' };
        } else if (size === 'medium') {
          return { width: '20px', height: '20px' };
        } else {
          return { width: '24px', height: '24px' };
        }
      }

      // For regular buttons with icons
      if (size === 'large') {
        return {
          width: '20px',
          height: '20px',
          aspectRatio: '1/1',
          maxWidth: '20px',
          maxHeight: '20px',
          minWidth: '20px',
          minHeight: '20px',
        };
      }

      return { width: '16px', height: '16px' };
    };

    // Get gap between icon and text
    const getGap = () => {
      if (variant === 'loading') {
        return '8px'; // 8px gap for loading variant
      }

      switch (size) {
        case 'small':
          return '4px';
        case 'medium':
          return '4px';
        case 'large':
          return '6px'; // Fixed gap for large buttons
        default:
          return '4px';
      }
    };

    const hasChildren = Boolean(children) && !iconOnly;

    // Get border radius based on variant and size
    const getBorderRadius = () => {
      if (variant === 'loading') {
        if (props.shape === 'default') {
          // Squircle loading button
          switch (size) {
            case 'small':
              return '10px';
            case 'medium':
              return '12px';
            case 'large':
              return '14px';
            default:
              return '12px';
          }
        }
        // Rounded loading button
        return '99px';
      }

      if (variant === 'squircle') {
        switch (size) {
          case 'small':
            return '10px';
          case 'medium':
            return '12px';
          case 'large':
            return '14px';
          default:
            return '12px';
        }
      } else if (variant === 'squircleIcon') {
        // New squircle icon button border radius
        switch (size) {
          case 'small':
            return '8px';
          case 'medium':
            return '10px';
          case 'large':
            return '12px';
          default:
            return '10px';
        }
      }
      return '99px'; // Default rounded for all other variants
    };

    // Get button size specific padding classes and width/height for icon-only buttons
    const getSizeClasses = () => {
      if (iconOnly) {
        switch (size) {
          case 'small':
            return 'p-[6px] w-8 h-8'; // 32px square
          case 'medium':
            return 'p-[10px] w-10 h-10'; // 40px square
          case 'large':
            return 'p-[12px] w-12 h-12'; // 48px square
          default:
            return 'p-[10px] w-10 h-10'; // default to medium
        }
      }

      switch (size) {
        case 'small':
          return 'px-4 py-[6px] min-h-8';
        case 'medium':
          return 'px-6 py-[10px] min-h-10';
        case 'large':
          return 'px-8 py-3 min-h-12';
        default:
          return 'px-6 py-[10px] min-h-10'; // default to medium
      }
    };

    // Get shadow if elevated
    const getShadow = () => {
      if (effectiveVariant === 'elevated') {
        return '0px 2px 2px -1px rgba(0,0,0,0.10)';
      }
      return 'none';
    };

    // Get variant styles (background, border, text color)
    const getVariantStyles = () => {
      if (disabled) {
        return `bg-[${Neutral.N100}] border border-[${Neutral.N200}] text-[${Neutral.N400}] pointer-events-none opacity-50`;
      }

      // Define variant styles
      switch (effectiveVariant) {
        case 'loading':
          return `bg-[${Neutral.N100}] border border-[${Neutral.N200}] text-[${Neutral.N500}]`;
        case 'primary':
          return `bg-black border border-black text-white active:bg-black active:border-black focus:ring-2 focus:ring-offset-2 focus:ring-black`;
        case 'secondary':
          return `bg-[${Orange.O500}] border border-[${Orange.O500}] text-white active:bg-[${Orange.O500}] active:border-[${Orange.O500}] focus:ring-2 focus:ring-offset-2 focus:ring-[${Orange.O500}]`;
        case 'outline':
          return `bg-[${Neutral.N50}] border border-[${Neutral.N200}] text-[${Neutral.N900}] hover:bg-[${Neutral.N100}] active:bg-[${Neutral.N50}] focus:ring-2 focus:ring-offset-2 focus:ring-[${Neutral.N900}]`;
        case 'ghost':
          return `bg-transparent border-0 text-[${Neutral.N900}] active:bg-transparent focus:ring-2 focus:ring-offset-2 focus:ring-[${Neutral.N900}]`;
        case 'elevated':
          return `bg-[${CoreColors.White}] border border-[${Neutral.N200}] text-[${CoreColors.Black}] hover:bg-[${Neutral.N100}] active:bg-[${CoreColors.White}] focus:ring-2 focus:ring-offset-2 focus:ring-[${Neutral.N900}]`;
        default:
          return `bg-[${Neutral.N50}] border border-[${Neutral.N200}] text-[${Neutral.N900}] hover:bg-[${Neutral.N100}] active:bg-[${Neutral.N50}] focus:ring-2 focus:ring-offset-2 focus:ring-[${Neutral.N900}]`;
      }
    };

    // Get typography styles
    const getTypographyStyle = () => {
      // Always use body2Med for small and medium buttons
      if (size === 'large') {
        return textStyles.body1Med; // 16px (textM) with medium weight
      }
      return textStyles.body2Med; // Default 14px (textS) with medium weight for small and medium
    };

    const Comp = asChild ? Slot : 'button';

    // Generate state-specific styles
    const getStateStyles = () => {
      return {
        // Hover state
        '&:hover:not(:disabled)': {
          backgroundColor: 'var(--hover-bg)',
          borderColor: 'var(--hover-border)',
          transform: 'none',
          boxShadow: 'none',
        },
        // Active/pressed state - not used as default state is the active state
        '&:active:not(:disabled)': {
          backgroundColor: 'var(--active-bg)',
          borderColor: 'var(--active-border)',
          transform: 'none',
          boxShadow: 'none',
        },
        // Focus state
        '&:focus-visible': {
          outline: 'none',
          boxShadow: `0 0 0 2px var(--focus-ring)`,
          transform: 'none', // Reset any transform
        },
        // Disabled state - no hover interaction
        '&:disabled': {
          backgroundColor: Neutral.N100,
          borderColor: Neutral.N200,
          color: Neutral.N400,
          cursor: 'not-allowed',
          opacity: 0.5,
          transform: 'none',
          boxShadow: 'none',
          pointerEvents: 'none', // Prevent hover interactions on disabled buttons
        },
        // Loading state
        '&:disabled[data-loading="true"]': {
          cursor: 'wait',
          opacity: 0.7,
        },
      };
    };

    // Base button styles with inline style to ensure proper display
    const buttonStyles: React.CSSProperties = {
      // Hug content for icon buttons
      width: iconOnly ? 'fit-content' : 'fit-content', // Hug content width
      height: iconOnly ? 'fit-content' : 'fit-content', // Hug content height
      boxSizing: 'border-box',
      whiteSpace: 'nowrap',
      // We'll use className for most styling to get hover support
      // but keep some inline styles for programmatic values
    };

    // Set border radius
    buttonStyles.borderRadius = getBorderRadius();

    // Set gap between icon and text
    if (!iconOnly) {
      buttonStyles.gap = getGap();
    }

    // Add padding properly
    if (iconOnly) {
      // For icon-only buttons, use explicit padding
      const iconPadding = size === 'small' ? '6px' : size === 'medium' ? '10px' : '12px';
      buttonStyles.padding = iconPadding;
    } else {
      // For regular buttons with or without icons
      const padding = getPadding();

      // Apply padding
      if (typeof padding === 'object') {
        if (padding.paddingTop) buttonStyles.paddingTop = padding.paddingTop;
        if (padding.paddingBottom) buttonStyles.paddingBottom = padding.paddingBottom;
        if (padding.paddingLeft) buttonStyles.paddingLeft = padding.paddingLeft;
        if (padding.paddingRight) buttonStyles.paddingRight = padding.paddingRight;
      }
    }

    // Apply custom styles from props, if any
    if (style) {
      Object.keys(style).forEach((key) => {
        (buttonStyles as any)[key] = (style as any)[key];
      });
    }

    // Get icon button size classes for proper hover interactions
    const getIconButtonClasses = () => {
      if (!iconOnly && variant !== 'squircleIcon') return '';

      let classes = 'transition-all duration-200';

      // Add specific sizes for icon-only buttons
      if (variant === 'squircleIcon') {
        // Set fixed sizes for squircleIcon buttons
        switch (size) {
          case 'small':
            classes += ' w-8 h-8'; // 32px square
            break;
          case 'medium':
            classes += ' w-10 h-10'; // 40px square
            break;
          case 'large':
            classes += ' w-12 h-12'; // 48px square
            break;
          default:
            classes += ' w-10 h-10'; // 40px square default
        }

        // Add border radius for squircleIcon variant
        switch (size) {
          case 'small':
            classes += ' rounded-[8px] flex items-center justify-center';
            break;
          case 'medium':
            classes += ' rounded-[10px] flex items-center justify-center';
            break;
          case 'large':
            classes += ' rounded-[12px] flex items-center justify-center';
            break;
          default:
            classes += ' rounded-[10px] flex items-center justify-center';
        }
      } else {
        // For regular icon-only buttons, use circular radius and fixed sizes
        switch (size) {
          case 'small':
            classes += ' w-8 h-8 rounded-full'; // 32px circle
            break;
          case 'medium':
            classes += ' w-10 h-10 rounded-full'; // 40px circle
            break;
          case 'large':
            classes += ' w-12 h-12 rounded-full'; // 48px circle
            break;
          default:
            classes += ' w-10 h-10 rounded-full'; // 40px circle default
        }
      }

      // Rest of styling based on variant...
      // ...

      return classes;
    };

    // Generate custom icon for squircle variant if needed
    const getSquircleCustomIcon = () => {
      if (variant === 'squircle' && useSquircleIcon) {
        if (size === 'small') {
          return <SquircleSmallIcon />;
        } else if (size === 'medium') {
          return <SquircleMediumIcon />;
        } else {
          return <SquircleLargeIcon />;
        }
      }
      return null;
    };

    // Generate default icon for icon buttons if none is provided
    const getDefaultIcon = () => {
      if (size === 'small') {
        return <SmallPlusIcon />;
      } else if (size === 'medium') {
        return <MediumPlusIcon />;
      } else {
        return <LargePlusIcon />;
      }
    };

    // Determine icon to display
    const renderIcon = () => {
      // For loading variant
      if (variant === 'loading') {
        return (
          <span
            style={{
              width: '16px',
              height: '16px',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Spinner
              size={16}
              primaryColor={Neutral.N500}
              secondaryColor={Neutral.N300}
              strokeWidth={3}
            />
          </span>
        );
      }

      // Always return an icon for icon-only buttons
      if (iconOnly || variant === 'squircleIcon') {
        // For icon-only buttons, get the correct icon size
        let iconSize;
        if (size === 'small') {
          iconSize = { width: '16px', height: '16px' };
        } else if (size === 'medium') {
          iconSize = { width: '20px', height: '20px' };
        } else {
          iconSize = { width: '24px', height: '24px' };
        }

        // Use provided icon or default plus icon based on size
        let displayIcon;
        if (!icon) {
          if (size === 'small') {
            displayIcon = <SmallPlusIcon />;
          } else if (size === 'medium') {
            displayIcon = <MediumPlusIcon />;
          } else {
            displayIcon = <LargePlusIcon />;
          }
        } else {
          displayIcon = icon;
        }

        // For squircle icon buttons, ensure perfect centering
        return (
          <div className="flex items-center justify-center w-full h-full">
            <span
              style={{
                width: iconSize.width,
                height: iconSize.height,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {displayIcon}
            </span>
          </div>
        );
      }

      // Regular buttons with icons
      if (isLoading || icon || (variant === 'squircle' && useSquircleIcon)) {
        const iconWidth = getIconSize().width;
        const iconHeight = getIconSize().height;
        const iconSizeNum = parseInt(iconWidth);

        if (isLoading) {
          // Loading spinner
          const loaderVariant = ['primary', 'secondary', 'success', 'warning', 'info'].includes(
            effectiveVariant
          )
            ? 'white'
            : 'primary';

          return (
            <span
              style={{
                width: iconWidth,
                height: iconHeight,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Spinner
                size={16}
                primaryColor={Neutral.N500}
                secondaryColor={Neutral.N300}
                strokeWidth={3}
              />
            </span>
          );
        } else if (variant === 'squircle' && useSquircleIcon) {
          // Squircle custom icon
          return (
            <span
              style={{
                width: iconWidth,
                height: iconHeight,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getSquircleCustomIcon()}
            </span>
          );
        } else if (icon) {
          // Regular icon - handle both React elements and custom SVGs
          return (
            <span
              style={{
                width: iconWidth,
                height: iconHeight,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'currentColor',
                overflow: 'hidden', // Ensure icon stays within bounds
              }}
            >
              {React.isValidElement(icon)
                ? React.cloneElement(icon as React.ReactElement, {
                    width: iconSizeNum,
                    height: iconSizeNum,
                    size: iconSizeNum,
                    style: { minWidth: iconSizeNum, minHeight: iconSizeNum },
                  })
                : icon}
            </span>
          );
        }
      }

      return null;
    };

    // Render end icon (right side)
    const renderEndIcon = () => {
      if (!endIcon) return null;

      const iconWidth = getIconSize().width;
      const iconHeight = getIconSize().height;
      const iconSizeNum = parseInt(iconWidth);

      return (
        <span
          style={{
            width: iconWidth,
            height: iconHeight,
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'currentColor',
            overflow: 'hidden',
          }}
        >
          {React.isValidElement(endIcon)
            ? React.cloneElement(endIcon as React.ReactElement, {
                width: iconSizeNum,
                height: iconSizeNum,
                size: iconSizeNum,
                style: { minWidth: iconSizeNum, minHeight: iconSizeNum },
              })
            : endIcon}
        </span>
      );
    };

    // Show warning if squircle is used without a base style (in development)
    if (process.env.NODE_ENV !== 'production' && variant === 'squircle' && !squircleBaseStyle) {
      console.warn(
        'Squircle variant should specify a squircleBaseStyle prop to inherit styling. Defaulting to "outline" style.'
      );
    }

    // Handle icon-only button sizing
    const getIconButtonSize = () => {
      if (!iconOnly) return '';

      // Apply specific padding for each size following specs
      switch (size) {
        case 'small':
          return 'p-[6px]'; // 6px padding for small icon buttons
        case 'medium':
          return 'p-[10px]'; // 10px padding for medium icon buttons
        case 'large':
          return 'p-[12px]'; // 12px padding for large icon buttons
        default:
          return 'p-[10px]'; // Default to medium padding
      }
    };

    // Set properties based on being an elevated button
    const isElevatedButton = effectiveVariant === 'elevated';
    const getElevatedStyles = () => {
      if (isElevatedButton) {
        return 'shadow-[0px_2px_2px_-1px_rgba(0,0,0,0.10)]';
      }
      return '';
    };

    return (
      <Comp
        ref={ref}
        disabled={disabled || (isLoading && variant !== 'loading')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          inline-flex items-center justify-center
          border transition-all duration-200 ease-in-out
          focus-visible:outline-none focus:ring-2 focus:ring-offset-2
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${
            iconOnly && variant !== 'squircleIcon'
              ? 'rounded-full'
              : variant === 'squircleIcon'
                ? size === 'small'
                  ? 'rounded-[8px]'
                  : size === 'medium'
                    ? 'rounded-[10px]'
                    : 'rounded-[12px]'
                : variant === 'squircle'
                  ? size === 'small'
                    ? 'rounded-[10px]'
                    : size === 'medium'
                      ? 'rounded-[12px]'
                      : 'rounded-[14px]'
                  : 'rounded-full'
          }
          ${variant === 'loading' ? `bg-[${Neutral.N100}] border border-[${Neutral.N200}] text-[${Neutral.N500}]` : ''}
          ${
            iconOnly
              ? 'rounded-full'
              : variant === 'squircle'
                ? size === 'small'
                  ? 'rounded-[10px]'
                  : size === 'medium'
                    ? 'rounded-[12px]'
                    : 'rounded-[14px]'
                : 'rounded-full'
          }
          ${
            variant === 'loading' && props.shape === 'default'
              ? size === 'small'
                ? 'rounded-[10px]'
                : size === 'medium'
                  ? 'rounded-[12px]'
                  : 'rounded-[14px]'
              : variant === 'loading'
                ? 'rounded-full'
                : ''
          }
          ${getSizeClasses()}
          ${iconOnly || variant === 'squircleIcon' ? getIconButtonClasses() : getVariantStyles()}
          ${getIconButtonSize()}
          ${size === 'large' && icon ? 'gap-[6px]' : ''}
          ${variant === 'squircleIcon' ? 'flex items-center justify-center' : ''}
          ${variant === 'loading' ? 'gap-2' : size === 'large' && icon ? 'gap-[6px]' : ''}
          ${effectiveVariant === 'primary' && !disabled ? 'hover:bg-[#404040] hover:border-transparent' : ''}
          ${effectiveVariant === 'secondary' && !disabled ? `hover:bg-[${Orange.O700}] hover:border-[${Orange.O700}]` : ''}
          ${effectiveVariant === 'ghost' && !disabled ? `hover:bg-[${Neutral.N100}]` : ''}
          ${effectiveVariant === 'outline' && !disabled ? `hover:bg-[${Neutral.N100}]` : ''}
          ${effectiveVariant === 'elevated' && !disabled ? `shadow-[0px_2px_2px_-1px_rgba(0,0,0,0.10)] hover:bg-[${Neutral.N100}]` : ''}
          data-[variant=primary]:hover:bg-[#404040] data-[variant=primary]:hover:border-transparent
          data-[variant=secondary]:hover:bg-[${Orange.O700}] data-[variant=secondary]:hover:border-[${Orange.O700}]
          data-[variant=ghost]:hover:bg-[${Neutral.N100}]
          data-[variant=outline]:hover:bg-[${Neutral.N100}]
          data-[variant=elevated]:hover:bg-[${Neutral.N100}]
          ${className}
        `}
        style={{
          ...buttonStyles,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          // Ensure perfect centering for squircle icon buttons
          ...(variant === 'squircleIcon'
            ? {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxSizing: 'border-box',
                padding: size === 'small' ? '6px' : size === 'medium' ? '10px' : '12px',
              }
            : {}),
          ...(size === 'large' && icon && !iconOnly
            ? {
                gap: '6px',
              }
            : {}),
          gap:
            variant === 'loading' ? '8px' : size === 'large' && icon && !iconOnly ? '6px' : '4px',
          ...(variant === 'loading' && {
            borderRadius: getBorderRadius(),
            gap: '8px',
            backgroundColor: Neutral.N100,
            borderColor: Neutral.N200,
          }),
          ...(effectiveVariant === 'primary' && !disabled && isHovered
            ? {
                backgroundColor: '#404040',
                borderColor: 'transparent',
              }
            : {}),
          ...(effectiveVariant === 'secondary' && !disabled && isHovered
            ? {
                backgroundColor: Orange.O700,
                borderColor: Orange.O700,
              }
            : {}),
          ...(effectiveVariant === 'ghost' && !disabled && isHovered
            ? {
                backgroundColor: Neutral.N100,
              }
            : {}),
          ...(effectiveVariant === 'outline' && !disabled && isHovered
            ? {
                backgroundColor: Neutral.N100,
              }
            : {}),
          ...(effectiveVariant === 'elevated' && !disabled && isHovered
            ? {
                backgroundColor: Neutral.N100,
                boxShadow: '0px 2px 2px -1px rgba(0,0,0,0.10)',
              }
            : {}),
          ...(effectiveVariant === 'elevated' && !disabled && !isHovered
            ? {
                boxShadow: '0px 2px 2px -1px rgba(0,0,0,0.10)',
              }
            : {}),
          ...style,
        }}
        data-loading={isLoading || variant === 'loading'}
        data-elevated={isElevatedButton}
        data-icon-only={iconOnly || variant === 'squircleIcon' ? 'true' : 'false'}
        data-size={size}
        data-variant={effectiveVariant}
        {...props}
      >
        {variant === 'loading' ? (
          <>
            <Spinner
              size={16}
              primaryColor={Neutral.N500}
              secondaryColor={Neutral.N300}
              strokeWidth={3}
            />
            <span style={{ ...getTypographyStyle(), color: Neutral.N500 }}>
              {loadingText || 'Loading'}
            </span>
          </>
        ) : (
          <>
            {renderIcon()}
            {hasChildren && (
              <span style={getTypographyStyle()}>
                {isLoading && loadingText ? loadingText : children}
              </span>
            )}
            {renderEndIcon()}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export default Button;

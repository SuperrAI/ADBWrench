import React from 'react';
import { cn } from '@/lib/utils';
import { CoreColors, Neutral, Orange } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';

// Enhanced base classes with maximum content hugging and proper scaling
const basePillStyles = `
  inline-flex items-center justify-center rounded-full transition-all duration-200 ease-in-out
  max-w-max h-min flex-shrink-0 select-none whitespace-nowrap
`;

// Variant-specific classes - using color variables instead of hardcoded values
const variantStyles = {
  default: `bg-[${Neutral.N200}] text-[${CoreColors.Black}]`,
  category: '', // Style applied via inline styles for better control
  outline: 'bg-transparent border border-dashed', // Colors applied via inline styles
  display: `bg-[${Neutral.N200}] text-[${CoreColors.Black}]`,
};

// Content type-specific classes with explicit values and tighter spacing
const contentStyles = {
  // Text-only and number-only pills: 5px vertical padding, 10px horizontal, 8px gap
  textOnly: 'py-[5px] px-[10px] gap-[8px]',
  numberOnly: 'py-[5px] px-[10px] gap-[8px]',
  textWithNumber: 'py-[5px] px-[10px] gap-[8px]',

  // Icon-only pills: equal 5px padding on all sides, adjusted for the 6px horizontal
  iconOnly: 'p-[5px] px-[6px]',

  // Icon-with-text pills: EXACT - 5px vertical, 10px right, 6px left, 2px gap
  iconWithText: 'gap-[2px]', // Padding applied via inline style

  // Dropdown pills: similar to text-only but with dropdown icon on right
  dropdownWithText: 'py-[5px] pl-[10px] pr-[6px] gap-[8px]',

  // Dropdown with icon and text: similar to icon-with-text but with dropdown icon on right
  dropdownWithIconAndText: 'gap-[2px]', // Padding applied via inline style
};

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  // Remove the hash
  const cleanHex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Return as rgba
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Default bookmark icon
export const BookmarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M12.8333 3.83366C12.8333 3.46547 12.5349 3.16699 12.1667 3.16699H9.33333C8.59693 3.16699 8 3.76395 8 4.50033V12.8337L8.55227 12.2814C9.0524 11.7813 9.73067 11.5003 10.4379 11.5003H12.1667C12.5349 11.5003 12.8333 11.2019 12.8333 10.8337V3.83366Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.16675 3.83366C3.16675 3.46547 3.46523 3.16699 3.83341 3.16699H6.66675C7.40315 3.16699 8.00008 3.76395 8.00008 4.50033V12.8337L7.44782 12.2814C6.94768 11.7813 6.26942 11.5003 5.56218 11.5003H3.83341C3.46523 11.5003 3.16675 11.2019 3.16675 10.8337V3.83366Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Dropdown chevron icon
export const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    style={{ display: 'block', marginLeft: '-2px' }} // Ensures the SVG itself doesn't introduce extra space
  >
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface PillProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Pill variant
   * @default 'default'
   */
  variant?: 'default' | 'category' | 'outline' | 'display';

  /**
   * The content to display within the pill
   */
  label?: string;

  /**
   * The number to display
   */
  number?: number;

  /**
   * Optional icon to display
   * - If used alone, icon-only layout is applied (padding: 5px 6px, gap: 2px)
   * - If used with label, icon-with-text layout is applied (padding: 5px 10px 5px 6px, gap: 2px)
   */
  icon?: React.ReactNode;

  /**
   * Whether this pill is a dropdown
   * - If true, a dropdown chevron will be displayed on the right
   */
  dropdown?: boolean;

  /**
   * Callback for when the dropdown pill is clicked
   */
  onDropdownClick?: () => void;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * Pills component
 *
 * A customizable pill/badge/chip component with multiple variants and content types.
 * The component hugs its content both horizontally and vertically.
 *
 * Layout Specifications:
 * - Text only:
 *   padding: 5px 10px
 *   gap: 8px
 *
 * - Icon with text:
 *   padding: 5px 10px 5px 6px
 *   gap: 2px
 *
 * - Dropdown with text:
 *   padding: 5px 10px 5px 6px (left padding 10px, right padding 6px)
 *   gap: 8px
 *
 * - Dropdown with icon and text:
 *   padding: 5px 6px 5px 6px
 *   gap: 2px
 *
 * Variants:
 * - default: Neutral background (N200) with black text
 * - category: Light orange background (O500 at 6% opacity) with orange border and text
 * - outline: Transparent background with dashed neutral border and N400 text color
 * - display: Neutral background (N200) with black text
 */
export const Pill = React.forwardRef<HTMLDivElement, PillProps>(
  (
    {
      variant = 'default',
      label,
      number,
      icon = null,
      dropdown = false,
      onDropdownClick,
      className,
      ...props
    },
    ref
  ) => {
    // Determine content type
    const getContentType = () => {
      if (dropdown) {
        if (icon && label) return 'dropdownWithIconAndText';
        if (label || number !== undefined) return 'dropdownWithText';
      }

      if (icon && !label && number === undefined) return 'iconOnly';
      if (icon && label) return 'iconWithText';
      if (number !== undefined && label) return 'textWithNumber';
      if (number !== undefined && !label) return 'numberOnly';
      return 'textOnly';
    };

    const contentType = getContentType();

    // Determine icon color based on variant
    const getIconColor = () => {
      if (variant === 'category') return Orange.O500;
      if (variant === 'outline') return Neutral.N400;
      return CoreColors.Black;
    };

    // Apply typography styles from textStyles.labelSansSemi
    const typographyStyle = {
      fontFamily: textStyles.labelSansSemi.fontFamily,
      fontSize: textStyles.labelSansSemi.fontSize,
      fontWeight: textStyles.labelSansSemi.fontWeight,
      lineHeight: textStyles.labelSansSemi.lineHeight,
      letterSpacing: textStyles.labelSansSemi.letterSpacing,
    };

    // Get background style with special handling for category variant
    const getBackgroundStyle = () => {
      switch (variant) {
        case 'category':
          return {
            backgroundColor: hexToRgba(Orange.O500, 0.06), // Using Orange.O500 with 6% opacity
            borderColor: Orange.O500,
            borderWidth: '1px',
            borderStyle: 'solid',
          };
        case 'outline':
          return {
            backgroundColor: 'transparent',
            borderColor: Neutral.N400,
            borderWidth: '1px',
            borderStyle: 'dashed',
          };
        case 'default':
        case 'display':
        default:
          return { backgroundColor: Neutral.N200 };
      }
    };

    // Get text color based on variant
    const getTextColor = () => {
      switch (variant) {
        case 'category':
          return Orange.O500;
        case 'outline':
          return Neutral.N400;
        case 'default':
        case 'display':
        default:
          return CoreColors.Black;
      }
    };

    // Get padding based on content type
    const getPaddingStyle = () => {
      if (contentType === 'iconWithText') {
        return {
          paddingTop: '5px',
          paddingBottom: '5px',
          paddingLeft: '6px',
          paddingRight: '10px',
          gap: '2px',
        };
      }

      if (contentType === 'iconOnly') {
        return {
          padding: '5px',
          paddingLeft: '6px',
          paddingRight: '6px',
        };
      }

      if (contentType === 'dropdownWithText') {
        return {
          paddingTop: '5px',
          paddingBottom: '5px',
          paddingLeft: '10px',
          paddingRight: '6px',
          gap: '4px',
        };
      }

      if (contentType === 'dropdownWithIconAndText') {
        return {
          paddingTop: '5px',
          paddingBottom: '5px',
          paddingLeft: '6px',
          paddingRight: '6px',
          gap: '4px',
        };
      }

      // All other types: text-only, number-only, text-with-number
      return {
        paddingTop: '5px',
        paddingBottom: '5px',
        paddingLeft: '10px',
        paddingRight: '10px',
      };
    };

    // Add additional styles for tighter content hugging
    const contentHuggingStyles = 'box-border inline-flex items-center justify-center';

    // Add cursor pointer if it's a dropdown
    const interactionStyles = dropdown ? 'cursor-pointer' : '';

    return (
      <div
        ref={ref}
        style={{
          ...typographyStyle,
          ...getBackgroundStyle(),
          ...getPaddingStyle(),
          color: getTextColor(),
        }}
        className={cn(
          basePillStyles,
          contentHuggingStyles,
          contentStyles[contentType],
          interactionStyles,
          className
        )}
        onClick={dropdown ? onDropdownClick : undefined}
        {...props}
      >
        {icon && (
          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{ color: getIconColor() }}
          >
            {icon}
          </span>
        )}
        {label && <span className="flex-shrink-0 truncate">{label}</span>}
        {number !== undefined && (
          <span className="flex items-center justify-center flex-shrink-0">{number}</span>
        )}
        {dropdown && (
          <span
            className="flex items-center justify-center flex-shrink-0 ml-1"
            style={{
              color: getIconColor(),
              display: 'inline-flex',
              alignItems: 'center',
              height: '100%',
              position: 'relative',
              top: '0px',
            }}
          >
            <ChevronDownIcon />
          </span>
        )}
      </div>
    );
  }
);

Pill.displayName = 'Pill';

export default Pill;

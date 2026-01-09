import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { textStyles } from '@/design-system/foundations/typography';
import { CoreColors, Neutral } from '@/design-system/foundations/colors';
import { durations, easings } from '@/design-system/foundations/animations';

// =====================================
// TYPES & INTERFACES
// =====================================

export type DropdownAlign = 'start' | 'center' | 'end';
export type DropdownSide = 'top' | 'right' | 'bottom' | 'left';
export type DropdownSize = 'small' | 'medium' | 'large';

export interface DropdownItemAction {
  type: 'action';
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
}

export interface DropdownItemSeparator {
  type: 'separator';
  id: string;
}

export interface DropdownItemHeader {
  type: 'header';
  id: string;
  label: string;
  className?: string;
}

export type DropdownItem = DropdownItemAction | DropdownItemSeparator | DropdownItemHeader;

export interface DropdownProps {
  /**
   * The trigger element that opens the dropdown
   */
  children: React.ReactNode;

  /**
   * Array of dropdown items
   */
  items: DropdownItem[];

  /**
   * Whether the dropdown is controlled (open state managed externally)
   */
  open?: boolean;

  /**
   * Called when the open state changes
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Dropdown alignment relative to trigger
   * @default 'center'
   */
  align?: DropdownAlign;

  /**
   * Which side of the trigger to place the dropdown
   * @default 'bottom'
   */
  side?: DropdownSide;

  /**
   * Distance in pixels from the trigger
   * @default 8
   */
  sideOffset?: number;

  /**
   * Dropdown size affects padding and spacing
   * @default 'medium'
   */
  size?: DropdownSize;

  /**
   * Custom className for dropdown item labels
   */
  labelClassName?: string;

  /**
   * Custom inline styles for dropdown item labels
   */
  labelStyle?: React.CSSProperties;

  /**
   * Custom width for the dropdown content
   * @default 'auto'
   */
  width?: number | 'auto' | 'min' | 'max-content';

  /**
   * Disable the dropdown
   */
  disabled?: boolean;

  /**
   * Custom className for the dropdown content
   */
  className?: string;

  /**
   * Custom className for individual items
   */
  itemClassName?: string;

  /**
   * Whether to close dropdown when an item is clicked
   * @default true
   */
  closeOnSelect?: boolean;

  /**
   * Whether the dropdown should close when clicking outside
   * @default true
   */
  closeOnOutsideClick?: boolean;

  /**
   * Portal the dropdown content to document.body
   * @default true
   */
  portal?: boolean;

  /**
   * Custom styles for the dropdown content
   */
  style?: React.CSSProperties;

  /**
   * Called when an item is selected (before individual onClick)
   */
  onItemSelect?: (item: DropdownItemAction) => void;

  /**
   * Custom loading state
   */
  loading?: boolean;

  /**
   * Empty state content when no items
   */
  emptyContent?: React.ReactNode;

  /**
   * Footer content at the bottom of dropdown
   */
  footer?: React.ReactNode;

  /**
   * Header content at the top of dropdown
   */
  header?: React.ReactNode;
}

// =====================================
// COMPONENT IMPLEMENTATION
// =====================================

/**
 * Dropdown Component
 * 
 * A highly flexible and reusable dropdown component built on top of Radix UI Popover.
 * Supports various use cases including action menus, select dropdowns, and context menus.
 * 
 * Features:
 * - Multiple item types (actions, separators, headers)
 * - Flexible positioning and alignment
 * - Customizable sizing and styling
 * - Proper hover effects and animations
 * - Accessibility support via Radix UI
 * - TypeScript support with comprehensive types
 * - Loading and empty states
 * - Header and footer support
 * 
 * @example
 * ```tsx
 * <Dropdown
 *   items={[
 *     { type: 'action', id: '1', label: 'Edit', icon: <EditIcon />, onClick: () => {} },
 *     { type: 'separator', id: 'sep1' },
 *     { type: 'action', id: '2', label: 'Delete', destructive: true, onClick: () => {} }
 *   ]}
 * >
 *   <Button>Options</Button>
 * </Dropdown>
 * ```
 */
export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      children,
      items,
      open,
      onOpenChange,
      align = 'center',
      side = 'bottom',
      sideOffset = 8,
      size = 'medium',
      labelClassName,
      labelStyle,
      width = 'auto',
      disabled = false,
      className,
      itemClassName,
      closeOnSelect = true,
      closeOnOutsideClick = true,
      portal = true,
      style,
      onItemSelect,
      loading = false,
      emptyContent,
      footer,
      header,
      ...props
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        if (disabled) return;

        if (!isControlled) {
          setInternalOpen(newOpen);
        }
        onOpenChange?.(newOpen);
      },
      [disabled, isControlled, onOpenChange]
    );

    const handleItemClick = React.useCallback(
      (item: DropdownItemAction) => {
        if (item.disabled) return;

        // Call the global item select handler first
        onItemSelect?.(item);

        // Call the individual item's onClick
        item.onClick();

        // Close dropdown if configured to do so
        if (closeOnSelect) {
          handleOpenChange(false);
        }
      },
      [onItemSelect, closeOnSelect, handleOpenChange]
    );

    // Get size-based styles
    const getSizeStyles = () => {
      switch (size) {
        case 'small':
          return {
            padding: 'p-1',
            itemPadding: 'px-2 py-1.5',
            gap: 'gap-2',
            minHeight: 'min-h-[32px]',
            fontSize: textStyles.body2Reg,
          };
        case 'large':
          return {
            padding: 'p-3',
            itemPadding: 'px-3 py-2.5',
            gap: 'gap-3',
            minHeight: 'min-h-[44px]',
            fontSize: textStyles.body1Reg,
          };
        default: // medium
          return {
            padding: 'p-2',
            itemPadding: 'px-2 py-2',
            gap: 'gap-2',
            minHeight: 'min-h-[40px]',
            fontSize: textStyles.body2Reg,
          };
      }
    };

    const sizeStyles = getSizeStyles();

    // Get width styles
    const getWidthStyles = () => {
      if (typeof width === 'number') {
        return { width: `${width}px` };
      }
      switch (width) {
        case 'min':
          return { minWidth: '120px' };
        case 'max-content':
          return { width: 'max-content' };
        default:
          return { minWidth: '180px' };
      }
    };

    // Render individual dropdown item
    const renderItem = (item: DropdownItem) => {
      switch (item.type) {
        case 'separator':
          return (
            <div
              key={item.id}
              className="h-px bg-neutral-200 my-1"
              role="separator"
            />
          );

        case 'header':
          return (
            <div
              key={item.id}
              className={cn(
                'px-3 py-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wide',
                item.className
              )}
              style={textStyles.labelSansMed}
            >
              {item.label}
            </div>
          );

        case 'action':
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => handleItemClick(item)}
              className={cn(
                // Base styles
                'w-full max-h-[44px] flex items-center rounded-lg text-left transition-all select-none outline-none',
                // Animation and timing
                `duration-[${durations.fast}] ease-[${easings.out}]`,
                // Size-based padding and spacing
                sizeStyles.itemPadding,
                sizeStyles.gap,
                sizeStyles.minHeight,
                // State styles
                'hover:bg-neutral-50 focus:bg-neutral-50',
                'active:bg-neutral-100 active:scale-[0.98]',
                // Disabled styles
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
                // Destructive styles
                item.destructive && [
                  'text-red-600 hover:bg-red-50 hover:text-red-700',
                  'focus:bg-red-50 focus:text-red-700',
                  'active:bg-red-100'
                ],
                // Custom classes
                itemClassName,
                item.className
              )}
              style={sizeStyles.fontSize}
            >
              {item.icon && (
                <span className="flex-shrink-0 flex items-center justify-center">
                  {item.icon}
                </span>
              )}
              <span 
                className={`flex-1 truncate ${labelClassName || ''}`}
                style={{...labelStyle}}
              >
                {item.label}
              </span>
            </button>
          );

        default:
          return null;
      }
    };

    // Render content
    const renderContent = () => {
      if (loading) {
        return (
          <div className={cn('flex items-center justify-center', sizeStyles.padding)}>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-300 border-t-neutral-600" />
          </div>
        );
      }

      if (items.length === 0 && emptyContent) {
        return (
          <div className={cn('text-center text-neutral-500', sizeStyles.padding)}>
            {emptyContent}
          </div>
        );
      }

      return (
        <>
          {header && (
            <div className="border-b border-neutral-200 pb-2 mb-2">
              {header}
            </div>
          )}

          <div className="space-y-1">
            {items.map(renderItem)}
          </div>

          {footer && (
            <div className="border-t border-neutral-200 pt-2 mt-2">
              {footer}
            </div>
          )}
        </>
      );
    };

    return (
      <Popover
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        <PopoverTrigger asChild disabled={disabled}>
          {children}
        </PopoverTrigger>

        <PopoverContent
          ref={ref}
          align={align}
          side={side}
          sideOffset={sideOffset}
          role="menu"
          aria-label="Dropdown menu"
          className={cn(
            // Base styles
            'z-50 bg-white rounded-xl border border-neutral-200 shadow-md outline-none',
            // Animation
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            // Size-based padding
            sizeStyles.padding,
            // Custom classes
            className
          )}
          style={{
            ...getWidthStyles(),
            ...style,
          }}
          onPointerDownOutside={closeOnOutsideClick ? undefined : (e) => e.preventDefault()}
          {...props}
        >
          {renderContent()}
        </PopoverContent>
      </Popover>
    );
  }
);

Dropdown.displayName = 'Dropdown';

// =====================================
// CONVENIENCE COMPONENTS
// =====================================

/**
 * Simple action-only dropdown for common use cases
 */
export interface SimpleDropdownProps extends Omit<DropdownProps, 'items'> {
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
  }>;
}

export const SimpleDropdown: React.FC<SimpleDropdownProps> = ({ actions, ...props }) => {
  const items: DropdownItem[] = actions.map((action, index) => ({
    type: 'action',
    id: `action-${index}`,
    ...action,
  }));

  return <Dropdown {...props} items={items} />;
};

export default Dropdown; 
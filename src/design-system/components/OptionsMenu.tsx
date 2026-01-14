import React from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './Button';
import { MoreHorizontal } from 'lucide-react';
import { Neutral, Red } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';
import { AppIcons } from '@/design-system/foundations/icons';

// Custom Edit Icon component
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    data-icon={AppIcons.ACTION_EDIT}
  >
    <path
      d="M3.96094 16.0415L7.5026 15.2082L15.7936 6.91725C16.119 6.59182 16.119 6.06418 15.7936 5.73874L14.2637 4.20892C13.9383 3.88348 13.4107 3.88348 13.0852 4.20892L4.79427 12.4999L3.96094 16.0415Z"
      stroke="#262626"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.6875 5.86523L14.1875 8.36523"
      stroke="#262626"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Custom Pin Icon component
const PinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    data-icon={AppIcons.ACTION_PIN}
  >
    <path
      d="M7.28906 6.45898L6.45573 3.95898H13.5391L12.7057 6.45898V8.33398C15.2057 9.16732 15.2057 11.8757 15.2057 11.8757H4.78906C4.78906 11.8757 4.78906 9.16732 7.28906 8.33398V6.45898Z"
      stroke="#262626"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 12.084V16.0423"
      stroke="#262626"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Common menu item styles - Default no hover state
const menuItemStyles = cn(
  'flex h-[36px] items-center gap-[10px] pl-[8px] pr-[12px] py-2',
  '!rounded-[8px]',
  'transition-colors',
  'disabled:opacity-100 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:data-[highlighted]:bg-transparent'
);

// Common menu content styles
const menuContentStyles = cn(
  'w-56',
  'rounded-[12px]',
  'border',
  'border-[var(--neutral-200)]',
  'bg-white',
  'shadow-[0px_10px_20px_0px_rgba(0,0,0,0.04),_0px_2px_6px_0px_rgba(0,0,0,0.04)]',
  'inline-flex',
  'flex-col',
  'items-start'
);

export interface OptionsMenuItem {
  /**
   * Unique identifier for the menu item
   */
  id: string;
  /**
   * Label text for the menu item
   */
  label: string;
  /**
   * Optional icon to display before the label
   */
  icon?: React.ReactNode;
  /**
   * Whether the item is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the item is a delete action
   * @default false
   */
  isDelete?: boolean;
  /**
   * Callback function when the item is clicked
   */
  onClick?: () => void;
}

export interface OptionsMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Array of menu items to display
   */
  items: OptionsMenuItem[];
  /**
   * Optional label for the menu group
   */
  label?: string;
  /**
   * Optional trigger element. If not provided, uses a default button with MoreHorizontal icon
   */
  trigger?: React.ReactNode;
  /**
   * Whether the menu is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the menu is open
   */
  open?: boolean;
  /**
   * Callback when the menu open state changes
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * OptionsMenu component
 *
 * A dropdown menu component that displays a list of options with support for:
 * - Regular menu items
 * - Icons
 * - Disabled states
 * - Delete actions
 *
 */
export const OptionsMenu = React.forwardRef<HTMLDivElement, OptionsMenuProps>(
  ({ className, items, label, trigger, disabled = false, open, onOpenChange, ...props }, ref) => {
    // Add CSS variable for Neutral.N200 and Neutral.N100
    React.useEffect(() => {
      document.documentElement.style.setProperty('--neutral-200', Neutral.N200);
      document.documentElement.style.setProperty('--neutral-100', Neutral.N100);
      document.documentElement.style.setProperty('--neutral-400', Neutral.N400);
      document.documentElement.style.setProperty('--red-50', '#FEF2F2'); // Light red for hover
      document.documentElement.style.setProperty('--red-500', Red.R500);

      // Add a style tag if it doesn't exist
      let style = document.getElementById('options-menu-styles');
      if (!style) {
        style = document.createElement('style');
        style.id = 'options-menu-styles';
        document.head.appendChild(style);
      }

      // Force override any conflicting styles
      style.innerHTML = `
        [data-radix-popper-content-wrapper] [role="menuitem"] {
          border-radius: 8px !important;
          font-family: ${textStyles.body2Reg.fontFamily};
          font-size: ${textStyles.body2Reg.fontSize};
          line-height: ${textStyles.body2Reg.lineHeight};
          font-weight: ${textStyles.body2Reg.fontWeight};
          letter-spacing: ${textStyles.body2Reg.letterSpacing};
          padding: 8px 12px 8px 8px !important;
        }
        
        [data-radix-popper-content-wrapper] [role="menuitem"] > * + * {
          margin-left: 10px !important;
        }
        
        /* Default/regular menu items */
        [data-radix-popper-content-wrapper] [role="menuitem"]:not([data-delete="true"]):not([data-disabled]) {
          margin-left: 4px !important;
          margin-right: 4px !important;
          width: calc(100% - 8px) !important;
        }
        
        /* Default/regular menu items hover */
        [data-radix-popper-content-wrapper] [role="menuitem"]:not([data-delete="true"]):not([data-disabled]):hover,
        [data-radix-popper-content-wrapper] [role="menuitem"]:not([data-delete="true"]):not([data-disabled])[data-highlighted] {
          background-color: ${Neutral.N100} !important;
          border-radius: 8px !important;
        }
        
        /* Delete menu items */
        [data-radix-popper-content-wrapper] [role="menuitem"][data-delete="true"] {
          margin-left: 0 !important;
          margin-right: 0 !important;
          width: 100% !important;
        }
        
        /* Delete menu item hover */
        [data-radix-popper-content-wrapper] [role="menuitem"][data-delete="true"]:hover,
        [data-radix-popper-content-wrapper] [role="menuitem"][data-delete="true"][data-highlighted] {
          background-color: #FEF2F2 !important;
          border-radius: 8px !important;
        }
        
        /* Delete menu item text color */
        [data-radix-popper-content-wrapper] [role="menuitem"][data-delete="true"] {
          color: ${Red.R500} !important;
        }
        
        /* Disabled menu items */
        [data-radix-popper-content-wrapper] [role="menuitem"][data-disabled] {
          color: ${Neutral.N400} !important;
          opacity: 1 !important;
          pointer-events: none;
        }
        
        [data-radix-popper-content-wrapper] [role="menuitem"][data-disabled]:hover,
        [data-radix-popper-content-wrapper] [role="menuitem"][data-disabled][data-highlighted] {
          background-color: transparent !important;
        }
      `;
    }, []);

    /**
     * Render a disabled menu item with custom styling
     * This explicitly renders a non-disabled item styled to look disabled
     */
    const renderDisabledStyleMenuItem = (item: OptionsMenuItem) => {
      return (
        <DropdownMenuItem
          key={item.id}
          // Not actually disabled for demonstration purposes
          disabled={false}
          className={cn(
            menuItemStyles,
            'cursor-not-allowed hover:bg-transparent data-[highlighted]:bg-transparent'
          )}
          style={{
            borderRadius: '8px',
            color: Neutral.N400,
            ...textStyles.body2Reg,
          }}
        >
          {item.icon && (
            <span
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center"
              style={{ color: Neutral.N400 }}
            >
              {item.icon}
            </span>
          )}
          <span style={{ color: Neutral.N400 }}>{item.label}</span>
        </DropdownMenuItem>
      );
    };

    const renderMenuItem = (item: OptionsMenuItem) => {
      // For specifically styled disabled items
      if (item.id === 'specific-disabled') {
        return renderDisabledStyleMenuItem(item);
      }

      return (
        <DropdownMenuItem
          key={item.id}
          disabled={item.disabled}
          onSelect={item.onClick}
          className={cn(menuItemStyles, 'w-full')}
          data-delete={item.isDelete ? 'true' : undefined}
          style={{
            borderRadius: '8px',
            textAlign: 'left',
            padding: '8px 12px 8px 8px',
            marginLeft: '4px',
            marginRight: '4px',
            width: 'calc(100% - 8px)',
            ...(item.disabled && { color: Neutral.N400 }),
            ...textStyles.body2Reg,
          }}
        >
          {item.id === 'edit' ? (
            <span
              className={cn(
                'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                item.disabled && `!text-[${Neutral.N400}]`
              )}
            >
              <EditIcon />
            </span>
          ) : item.id === 'archive' ? (
            <span
              className={cn(
                'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                item.disabled && `!text-[${Neutral.N400}]`
              )}
            >
              <PinIcon />
            </span>
          ) : (
            item.icon && (
              <span
                className={cn(
                  'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                  item.disabled && `!text-[${Neutral.N400}]`
                )}
              >
                {item.icon}
              </span>
            )
          )}
          <span
            className={cn(item.disabled && `!text-[${Neutral.N400}]`)}
            style={{
              ...textStyles.body2Reg,
            }}
          >
            {item.id === 'archive' ? 'Pin' : item.label}
          </span>
        </DropdownMenuItem>
      );
    };

    const defaultTrigger = (
      <Button type="button" variant="ghost" size="small" disabled={disabled} className="h-8 w-8">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    );

    return (
      <div ref={ref} className={cn('inline-block', className)} {...props}>
        <DropdownMenu open={open} onOpenChange={onOpenChange}>
          <DropdownMenuTrigger asChild>{trigger || defaultTrigger}</DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={menuContentStyles}
            sideOffset={4}
            style={{
              borderColor: Neutral.N200,
              borderRadius: '12px',
              padding: items.every((item) => item.isDelete) ? '4px' : '4px 0',
              boxShadow:
                '0px 10px 20px 0px rgba(0, 0, 0, 0.04), 0px 2px 6px 0px rgba(0, 0, 0, 0.04)',
            }}
          >
            {label && (
              <>
                <DropdownMenuLabel
                  className="pl-[8px] pr-[12px] py-2 mx-[4px]"
                  style={textStyles.body2Reg}
                >
                  {label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
              </>
            )}

            {/* Regular Items */}
            <div className="flex flex-col w-full gap-[4px] px-[4px]">
              {items
                .filter((item) => !item.isDelete)
                .map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    disabled={item.disabled}
                    onSelect={item.onClick}
                    className={cn(menuItemStyles, 'w-full')}
                    data-delete={item.isDelete ? 'true' : undefined}
                    style={{
                      borderRadius: '8px',
                      textAlign: 'left',
                      padding: '8px 12px 8px 8px',
                      marginLeft: '4px',
                      marginRight: '4px',
                      width: 'calc(100% - 8px)',
                      ...(item.disabled && { color: Neutral.N400 }),
                      ...textStyles.body2Reg,
                    }}
                  >
                    {item.id === 'edit' ? (
                      <span
                        className={cn(
                          'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                          item.disabled && `!text-[${Neutral.N400}]`
                        )}
                      >
                        <EditIcon />
                      </span>
                    ) : item.id === 'archive' ? (
                      <span
                        className={cn(
                          'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                          item.disabled && `!text-[${Neutral.N400}]`
                        )}
                      >
                        <PinIcon />
                      </span>
                    ) : (
                      item.icon && (
                        <span
                          className={cn(
                            'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                            item.disabled && `!text-[${Neutral.N400}]`
                          )}
                        >
                          {item.icon}
                        </span>
                      )
                    )}
                    <span
                      className={cn(item.disabled && `!text-[${Neutral.N400}]`)}
                      style={{
                        ...textStyles.body2Reg,
                      }}
                    >
                      {item.id === 'archive' ? 'Pin' : item.label}
                    </span>
                  </DropdownMenuItem>
                ))}
            </div>

            {/* Delete Items */}
            {items.some((item) => item.isDelete) && items.some((item) => !item.isDelete) ? (
              <>
                <DropdownMenuSeparator
                  className="w-full"
                  style={{
                    height: '1px',
                    backgroundColor: Neutral.N200,
                    margin: '4px 0 0 0',
                    width: '100%',
                  }}
                />
                <div
                  className="flex flex-col w-full"
                  style={{
                    display: 'flex',
                    padding: '4px 4px 0 4px',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    width: '100%',
                  }}
                >
                  {items
                    .filter((item) => item.isDelete)
                    .map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        disabled={item.disabled}
                        onSelect={item.onClick}
                        className={cn(menuItemStyles, 'group w-full')}
                        data-delete={item.isDelete ? 'true' : undefined}
                        style={{
                          borderRadius: '8px',
                          textAlign: 'left',
                          padding: '8px 12px 8px 8px',
                          width: '100%',
                          ...(item.disabled && { color: Neutral.N400 }),
                          ...(item.isDelete && { color: Red.R500 }),
                          ...textStyles.body2Reg,
                        }}
                      >
                        {item.icon && (
                          <span
                            className={cn(
                              'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                              item.disabled && `!text-[${Neutral.N400}]`
                            )}
                            style={{
                              color: item.isDelete ? Red.R500 : undefined,
                            }}
                          >
                            {item.icon}
                          </span>
                        )}
                        <span
                          className={cn(item.disabled && `!text-[${Neutral.N400}]`)}
                          style={{
                            ...textStyles.body2Reg,
                            color: item.isDelete ? Red.R500 : undefined,
                          }}
                        >
                          {item.label}
                        </span>
                      </DropdownMenuItem>
                    ))}
                </div>
              </>
            ) : items.every((item) => item.isDelete) ? (
              // Delete-only menu item state - without separator and with no extra padding
              <div
                className="flex flex-col w-full"
                style={{
                  display: 'flex',
                  padding: '0',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  width: '100%',
                }}
              >
                {items.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    disabled={item.disabled}
                    onSelect={item.onClick}
                    className={cn(menuItemStyles, 'group w-full')}
                    data-delete={item.isDelete ? 'true' : undefined}
                    style={{
                      borderRadius: '8px',
                      textAlign: 'left',
                      padding: '8px 12px 8px 8px',
                      width: '100%',
                      ...(item.disabled && { color: Neutral.N400 }),
                      ...(item.isDelete && { color: Red.R500 }),
                      ...textStyles.body2Reg,
                    }}
                  >
                    {item.icon && (
                      <span
                        className={cn(
                          'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                          item.disabled && `!text-[${Neutral.N400}]`
                        )}
                        style={{
                          color: item.isDelete ? Red.R500 : undefined,
                        }}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span
                      className={cn(item.disabled && `!text-[${Neutral.N400}]`)}
                      style={{
                        ...textStyles.body2Reg,
                        color: item.isDelete ? Red.R500 : undefined,
                      }}
                    >
                      {item.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);

OptionsMenu.displayName = 'OptionsMenu';

export default OptionsMenu;

'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';
import { typography } from '@/design-system/foundations/typography';
import { colors } from '@/design-system/foundations/colors';

// Custom checkmark SVG for checked state
const CheckMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect width="20" height="20" rx="6" fill="black" />
    <path
      d="M6 10.334L8.72837 12.7716L14.5 7"
      stroke="white"
      strokeWidth="1.98077"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  id?: string;
}

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, label, id, checked, onCheckedChange, ...props }, ref) => {
    // Manage internal state if checked prop is not provided
    const [internalChecked, setInternalChecked] = React.useState(false);
    const isChecked = checked !== undefined ? checked : internalChecked;

    const handleCheckedChange = (value: boolean | 'indeterminate') => {
      if (checked === undefined) {
        setInternalChecked(value === true);
      }
      if (onCheckedChange) {
        onCheckedChange(value);
      }
    };

    // Style based on checked state
    const checkboxStyle = isChecked
      ? {
          width: '20px',
          height: '20px',
          aspectRatio: '1/1',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }
      : {
          display: 'flex',
          width: '20px',
          height: '20px',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '6px',
          border: `2px solid ${colors.neutral.N300}`,
          background: colors.core.White,
        };

    return (
      <div className="flex items-center gap-2">
        <CheckboxPrimitive.Root
          ref={ref}
          id={id}
          checked={isChecked}
          onCheckedChange={handleCheckedChange}
          style={checkboxStyle}
          className={cn(
            'shrink-0 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center')}>
            <CheckMarkIcon />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {label && (
          <label
            htmlFor={id}
            className="cursor-pointer"
            style={{
              fontFamily: typography.fontFamily.sans,
              fontSize: typography.fontSize.textS,
              lineHeight: typography.lineHeight.tight,
              fontWeight: 400,
              letterSpacing: typography.letterSpacing.none,
            }}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };

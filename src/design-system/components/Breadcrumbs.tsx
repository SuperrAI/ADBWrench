import React from 'react';
import { cn } from '@/lib/utils';
import { CoreColors, Neutral } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';
import Button from './Button';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export interface BreadcrumbsProps {
  /**
   * Array of breadcrumb items with label and path
   */
  items: BreadcrumbItem[];
  /**
   * Function called when a breadcrumb item is clicked
   */
  onNavigate?: (path: string) => void;
  /**
   * Function called when the back button is clicked
   */
  onBack?: () => void;
  /**
   * Custom separator between breadcrumb items
   * @default "/"
   */
  separator?: React.ReactNode;
  /**
   * Custom back icon
   */
  backIcon?: React.ReactNode;
  /**
   * Whether to show hover effect on the back button
   * @default false
   */
  showHoverEffect?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const Breadcrumbs = ({
  items,
  onNavigate,
  onBack,
  separator = '/',
  backIcon,
  showHoverEffect = false,
  className,
}: BreadcrumbsProps) => {
  // Don't render if no items
  if (!items || items.length === 0) return null;

  // Typography style that matches the specifications:
  // font-family: Geist, font-weight: 500, font-size: 16px, line-height: 24px, letter-spacing: 0%
  const breadcrumbTextStyle = {
    fontFamily: textStyles.body1Med.fontFamily,
    fontSize: textStyles.body1Med.fontSize,
    lineHeight: textStyles.body1Med.lineHeight,
    fontWeight: textStyles.body1Med.fontWeight,
    letterSpacing: textStyles.body1Med.letterSpacing,
  };

  // Typography style for the last breadcrumb (grey)
  const lastBreadcrumbTextStyle = {
    fontFamily: textStyles.body1Med.fontFamily,
    fontSize: textStyles.body1Med.fontSize,
    lineHeight: textStyles.body1Med.lineHeight,
    fontWeight: textStyles.body1Med.fontWeight,
    letterSpacing: textStyles.body1Med.letterSpacing,
  };

  // Typography style for the recent tab (black)
  const recentTabTextStyle = {
    fontFamily: textStyles.body1Med.fontFamily,
    fontSize: textStyles.body1Med.fontSize,
    lineHeight: textStyles.body1Med.lineHeight,
    fontWeight: textStyles.body1Med.fontWeight,
    letterSpacing: textStyles.body1Med.letterSpacing,
  };

  // Back button icon
  const backButtonIcon = backIcon || (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.25 6.75L4.75 12L10.25 17.25" stroke={Neutral.N400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.25 12H5" stroke={Neutral.N400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center h-10 w-full max-w-[1036px] mx-auto', className)}
    >
      {/* Back button - flows naturally in layout */}
      <div className="mr-0 flex items-center">
        <div
          onClick={onBack}
          className="w-10 h-10 rounded-[12px] hover:bg-[#E5E5E5] flex items-center justify-center cursor-pointer transition-colors"
          style={{ borderRadius: '12px' }}
          aria-label="Go back"
        >
          {backButtonIcon}
        </div>
      </div>

      {/* Breadcrumb items - flows after the back button */}
      <div className="flex items-center">
        <ol className="flex items-center space-x-1 overflow-x-auto">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isClickable = !isLast && item.path && item.path !== '#' && item.path !== '';

            const handleClick = () => {
              if (isClickable) {
                onNavigate?.(item.path);
              }
            };

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                <li className="flex items-center">
                  <button
                    onClick={handleClick}
                    className={cn(
                      'whitespace-nowrap max-w-[200px] truncate flex items-center justify-center',
                      isLast
                        ? 'cursor-default'
                        : isClickable
                          ? 'cursor-pointer hover:underline'
                          : 'cursor-default'
                    )}
                    style={{
                      ...breadcrumbTextStyle,
                      color: isLast ? CoreColors.Black : Neutral.N400,
                      borderRadius: '12px',
                      height: '40px',
                      padding: '8px 8px',
                    }}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                </li>

                {!isLast && (
                  <li
                    className="text-neutral-400 flex items-center justify-center h-10"
                    style={breadcrumbTextStyle}
                    aria-hidden="true"
                  >
                    {separator}
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;

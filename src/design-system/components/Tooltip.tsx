import React from 'react';
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CoreColors, Neutral } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';

export interface DesignTooltipProps {
  /**
   * The content to display inside the tooltip
   */
  content: React.ReactNode;
  /**
   * The element that triggers the tooltip
   */
  children: React.ReactNode;
  /**
   * The side of the trigger where the tooltip appears
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * The alignment of the tooltip relative to the trigger
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Delay in ms before showing the tooltip
   */
  delayDuration?: number;
  /**
   * Is the tooltip initially open
   */
  defaultOpen?: boolean;
  /**
   * Control the open state
   */
  open?: boolean;
  /**
   * Handler for open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Additional CSS classes to apply to the tooltip content
   */
  className?: string;
  /**
   * Variant of the tooltip
   * @default 'default'
   */
  variant?: 'default' | 'info';
}

/**
 * Tooltip component
 *
 * An enhanced tooltip component that displays informative text when users hover over or focus on an element.
 * Uses black background (CoreColors.Black) with white text (CoreColors.White), Geist font at 14px/20px, and custom padding (16px horizontal, 12px vertical).
 * The tooltip has 16px corner radius and hugs content in both horizontal and vertical directions with proper spacing.
 * Features directional arrows and proper positioning based on the side property.
 * Maximum width is 240px with text wrapping for longer content.
 */
export const Tooltip = ({
  content,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  defaultOpen,
  open,
  onOpenChange,
  className,
  variant = 'default',
  ...props
}: DesignTooltipProps) => {
  // Tooltip background color - defined here to ensure consistency between tooltip and arrows
  const tooltipBgColor = variant === 'default' ? CoreColors.Black : '#3B82F6'; // Black for default, blue for info
  const tooltipTextColor = CoreColors.White;

  // Set CSS variable for Neutral.N50
  React.useEffect(() => {
    document.documentElement.style.setProperty('--Neutral-50', Neutral.N50);
  }, []);

  // Render the default variant tooltip with custom styling
  if (variant === 'default') {
    return (
      <TooltipProvider delayDuration={delayDuration}>
        <ShadcnTooltip defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent
            side={side}
            align={align}
            sideOffset={10}
            className={cn(
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'z-tooltip',
              'flex flex-col items-center',
              className
            )}
            style={{
              padding: 0,
              margin: 0,
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
              overflow: 'visible',
            }}
            {...props}
          >
            {/* Main tooltip content */}
            <div
              style={{
                display: 'flex',
                width: 'auto',
                maxWidth: '240px',
                padding: '12px 16px',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                gap: '4px',
                borderRadius: '16px',
                background: tooltipBgColor,
                color: tooltipTextColor,
                // Apply body2Reg text style
                fontFamily: textStyles.body2Reg.fontFamily,
                fontSize: textStyles.body2Reg.fontSize,
                lineHeight: textStyles.body2Reg.lineHeight,
                fontWeight: textStyles.body2Reg.fontWeight,
                letterSpacing: textStyles.body2Reg.letterSpacing,
                position: 'relative',
              }}
            >
              {content}
            </div>

            {/* Arrow for top placement */}
            {side === 'top' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="10"
                viewBox="0 0 20 10"
                fill="none"
                style={{ marginTop: '-1px', display: 'block' }}
              >
                <path
                  d="M20 0L0 0L7.04024 7.74426C8.62728 9.49001 11.3727 9.49001 12.9598 7.74426L20 0Z"
                  fill={tooltipBgColor}
                />
              </svg>
            )}

            {/* Arrow for bottom placement */}
            {side === 'bottom' && (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  position: 'absolute',
                  bottom: '100%',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="10"
                  viewBox="0 0 20 10"
                  fill="none"
                  style={{ transform: 'rotate(180deg)', display: 'block' }}
                >
                  <path
                    d="M20 0L0 0L7.04024 7.74426C8.62728 9.49001 11.3727 9.49001 12.9598 7.74426L20 0Z"
                    fill={tooltipBgColor}
                  />
                </svg>
              </div>
            )}

            {/* Arrow for left placement */}
            {side === 'left' && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'absolute',
                  right: '-10px',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="20"
                  viewBox="0 0 10 20"
                  fill="none"
                >
                  <path
                    d="M0 20L0 0L7.74426 7.04024C9.49001 8.62728 9.49001 11.3727 7.74426 12.9598L0 20Z"
                    fill={tooltipBgColor}
                  />
                </svg>
              </div>
            )}

            {/* Arrow for right placement */}
            {side === 'right' && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'absolute',
                  left: '-10px',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="20"
                  viewBox="0 0 10 20"
                  fill="none"
                >
                  <path
                    d="M10 0V20L2.25574 12.9598C0.509992 11.3727 0.509992 8.62728 2.25574 7.04024L10 0Z"
                    fill={tooltipBgColor}
                  />
                </svg>
              </div>
            )}
          </TooltipContent>
        </ShadcnTooltip>
      </TooltipProvider>
    );
  }

  // Render the info variant with body2Reg styling
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <ShadcnTooltip defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={10}
          className={cn(
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'rounded-[16px] shadow-md z-tooltip p-0 w-auto inline-block max-w-[240px] relative',
            'after:content-[""] after:absolute after:border-[10px] after:border-transparent',
            'bg-blue-500 text-white',
            side === 'top' &&
              cn(
                'after:left-1/2 after:-translate-x-1/2 after:bottom-[-19px]',
                'after:border-t-blue-500'
              ),
            side === 'right' &&
              cn(
                'after:top-1/2 after:-translate-y-1/2 after:left-[-19px]',
                'after:border-r-blue-500'
              ),
            side === 'bottom' &&
              cn(
                'after:left-1/2 after:-translate-x-1/2 after:top-[-19px]',
                'after:border-b-blue-500'
              ),
            side === 'left' &&
              cn(
                'after:top-1/2 after:-translate-y-1/2 after:right-[-19px]',
                'after:border-l-blue-500'
              ),
            className
          )}
          style={{
            fontFamily: textStyles.body2Reg.fontFamily,
            fontSize: textStyles.body2Reg.fontSize,
            lineHeight: textStyles.body2Reg.lineHeight,
            fontWeight: textStyles.body2Reg.fontWeight,
            letterSpacing: textStyles.body2Reg.letterSpacing,
          }}
          {...props}
        >
          <div
            className="px-[16px] py-[12px] w-full whitespace-normal break-words"
            style={{
              color: tooltipTextColor,
            }}
          >
            {content}
          </div>
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  );
};

export default Tooltip;

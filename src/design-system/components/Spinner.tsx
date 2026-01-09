import React from 'react';
import { cn } from '@/lib/utils';
import { Orange } from '@/design-system/foundations/colors';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the spinner in pixels. If not provided, uses a default size.
   */
  size?: number;
  /**
   * Primary color of the spinner (the progress arc)
   * @default Orange.O600
   */
  primaryColor?: string;
  /**
   * Secondary color of the spinner (the background track)
   * @default Orange.O200
   */
  secondaryColor?: string;
  /**
   * Stroke width of the spinner
   * @default 3
   */
  strokeWidth?: number;
  /**
   * Duration of one complete rotation in seconds
   * @default 1.5
   */
  duration?: number;
}

/**
 * Spinner component
 *
 * A circular loading indicator that rotates continuously to indicate loading state.
 * Features a two-color design with a customizable primary progress arc and secondary track.
 * Supports custom sizing and color customization.
 */
export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      className,
      size,
      primaryColor = Orange.O600,
      secondaryColor = Orange.O200,
      strokeWidth = 3,
      duration = 1.5,
      ...props
    },
    ref
  ) => {
    // Calculate dimensions - either use provided size or default to 24px
    const actualSize = size || 24;
    const viewBoxSize = 26; // Keep the viewBox consistent for the SVG path
    const sizeStyle = {
      width: `${actualSize}px`,
      height: `${actualSize}px`,
    };

    return (
      <div
        ref={ref}
        className={cn('flex-shrink-0 flex items-center justify-center', className)}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={actualSize}
          height={actualSize}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          fill="none"
          style={{
            ...sizeStyle,
            aspectRatio: '1/1',
            flexShrink: 0,
            animation: `spin ${duration}s linear infinite`,
          }}
        >
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
          {/* Background track */}
          <path
            d="M22.5263 18.5009L22.0107 19.3102L21.4265 20.0715L20.7782 20.779L20.0707 21.4273L19.3093 22.0115L18.5 22.5271L17.6488 22.9702L16.7622 23.3375L15.847 23.626L14.9101 23.8337L13.9587 23.959L13 24.0009L12.0413 23.959L11.0899 23.8337L10.153 23.626L9.23778 23.3375L8.3512 22.9702L7.5 22.5271L6.69066 22.0115L5.92934 21.4273L5.22183 20.779L4.57351 20.0715L3.98933 19.3102L3.47372 18.5009L3.03061 17.6497L2.66338 16.7631L2.37482 15.8479L2.16711 14.911L2.04186 13.9596L2 13.0009L2.04186 12.0421L2.16711 11.0907L2.37482 10.1538L2.66338 9.23863L3.03061 8.35205L3.47372 7.50085L3.98933 6.69151L4.57351 5.93019L5.22183 5.22268L5.92934 4.57437L6.69066 3.99018L7.5 3.47457L8.3512 3.03147L9.23778 2.66424L10.153 2.37567L11.0899 2.16797"
            stroke={secondaryColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M14.9102 2.16797L15.847 2.37567L16.7622 2.66424L17.6488 3.03147L18.5 3.47457L19.3094 3.99018L20.0707 4.57437L20.7782 5.22268L21.4265 5.93019L22.0107 6.69151L22.5263 7.50085L22.9694 8.35205L23.3366 9.23863L23.6252 10.1538L23.8329 11.0907L23.9582 12.0421L24 13.0009L23.9582 13.9596L23.8329 14.911"
            stroke={primaryColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;

import React from 'react';
import { Red } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';
import { cn } from '@/lib/utils';

interface ErrorProps {
  message: string;
  className?: string;
}

/**
 * Error component for displaying error messages with a warning icon
 * Uses the design system's typography, colors, and icons
 * Adapts to fit variable width containers
 */
const Error: React.FC<ErrorProps> = ({ message, className }) => {
  return (
    <div className={cn('flex items-end gap-1 w-full', className)}>
      {/* Triangular Warning Icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 4 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 " // Prevent icon from shrinking and align with text
      >
        <path
          d="M4.5396 14.9908L9.36403 5.36857C10.0405 4.01945 11.9662 4.0198 12.6421 5.36917L17.4621 14.9914C18.0727 16.2105 17.1864 17.6459 15.8229 17.6459H6.17848C4.81473 17.6459 3.92837 16.2099 4.5396 14.9908Z"
          fill={Red.R500}
        />
        <path
          d="M11 9.16675V11.0001"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.4587 14.6666C11.4587 14.9197 11.2535 15.1249 11.0003 15.1249C10.7472 15.1249 10.542 14.9197 10.542 14.6666C10.542 14.4135 10.7472 14.2083 11.0003 14.2083C11.2535 14.2083 11.4587 14.4135 11.4587 14.6666Z"
          stroke="white"
        />
      </svg>

      {/* Error Message */}
      <span
        style={{
          ...textStyles.body1Med,
          color: Red.R500, // #EF4444 from colors.ts
        }}
        className="flex-1 break-words"
      >
        {message}
      </span>
    </div>
  );
};

export default Error;

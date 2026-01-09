import React from 'react';
import { Tooltip } from '@/design-system';
import { truncateTextWithInfo } from '@/utils/utils';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  tooltipAlign?: 'start' | 'center' | 'end';
}

/**
 * TruncatedText component that shows truncated text with ellipsis
 * and displays a tooltip with the full text ONLY when the text is actually truncated.
 * If the text fits within maxLength, no tooltip is shown.
 */
export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxLength = 18,
  className = '',
  tooltipSide = 'top',
  tooltipAlign = 'center',
}) => {
  const { truncated, isTruncated } = truncateTextWithInfo(text, maxLength);

  if (!isTruncated) {
    return <span className={className}>{truncated}</span>;
  }

  return (
    <Tooltip 
      content={text} 
      side={tooltipSide} 
      align={tooltipAlign}
    >
      <span className={className}>{truncated}</span>
    </Tooltip>
  );
};

export default TruncatedText; 
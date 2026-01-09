import React from 'react';
import { Tooltip } from '@/design-system';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  tooltipAlign?: 'start' | 'center' | 'end';
}

function truncateTextWithInfo(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return { truncated: text, isTruncated: false };
  }
  return { truncated: text.slice(0, maxLength) + '...', isTruncated: true };
}

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
    <Tooltip content={text} side={tooltipSide} align={tooltipAlign}>
      <span className={className}>{truncated}</span>
    </Tooltip>
  );
};

export default TruncatedText;

'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

interface BoringAvatarProps {
  size?: number;
  name?: string;
  variant?: string;
  colors?: string[];
  className?: string;
  /**
   * Custom icon path from public folder (e.g., '/assets/icons/student-avatars/student-01.svg')
   * If provided, this will be used instead of the default avatar
   */
  iconPath?: string;
}

const DEFAULT_AVATAR_PATH = '/assets/icons/student-avatars/default.svg';

export function Avatar({
  size = 40,
  name = '',
  variant = 'beam',
  colors = ['#FF6F1E', '#EBEBEB'],
  className,
  iconPath,
}: BoringAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Determine which image source to use
  // Priority: custom iconPath (if provided and no error) -> default.svg
  const imageSrc = iconPath && !imageError ? iconPath : DEFAULT_AVATAR_PATH;

  return (
    <div
      className={cn('rounded-full border border-neutral-200 overflow-hidden flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <img
        src={imageSrc}
        alt={`${name}'s avatar`}
        width={size}
        height={size}
        className="rounded-full"
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        onError={() => {
          // If custom icon fails, fall back to default.svg
          if (iconPath && !imageError) {
            setImageError(true);
          } else {
            // If default.svg also fails, log an error but keep trying
            console.error(`Failed to load avatar for ${name}`);
          }
        }}
      />
    </div>
  );
}

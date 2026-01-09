'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { textStyles } from '@/design-system/foundations/typography';
import { colors } from '@/design-system/foundations/colors';

type AvatarContainerProps = {
  children: React.ReactNode;
  zIndex: number;
};

function AvatarContainer({ children, zIndex }: AvatarContainerProps) {
  return (
    <div data-slot="avatar-container" className="relative" style={{ zIndex }}>
      <div>{children}</div>
    </div>
  );
}

type AvatarGroupProps = React.ComponentProps<'div'> & {
  children: React.ReactElement[];
  invertOverlap?: boolean;
  size?: number;
  spacing?: number;
  limit?: number;
  showCount?: boolean;
  countStyle?: React.CSSProperties;
};

function AvatarGroup({
  children,
  className,
  invertOverlap = true,
  size = 32,
  spacing = -8,
  limit,
  showCount = false,
  countStyle,
  ...props
}: AvatarGroupProps) {
  // Calculate how many avatars to show and if we need a count indicator
  const childrenArray = React.Children.toArray(children) as React.ReactElement[];
  const totalCount = childrenArray.length;
  const visibleCount = limit ? Math.min(limit, totalCount) : totalCount;
  const hiddenCount = totalCount - visibleCount;

  // Visible children
  const visibleChildren = childrenArray.slice(0, visibleCount);

  // Create the count indicator if needed
  const countIndicator =
    showCount && hiddenCount > 0 ? (
      <div
        key="more"
        className="flex justify-center items-center rounded-full border"
        style={{
          width: size,
          height: size,
          backgroundColor: colors.neutral.N100,
          borderColor: colors.neutral.N200,
          color: colors.neutral.N400,
          // Apply typography styles from design system
          fontFamily: textStyles.labelSansMed.fontFamily,
          fontSize: textStyles.labelSansMed.fontSize,
          lineHeight: textStyles.labelSansMed.lineHeight,
          fontWeight: textStyles.labelSansMed.fontWeight,
          letterSpacing: textStyles.labelSansMed.letterSpacing,
          // Allow custom styling to override defaults
          ...countStyle,
        }}
      >
        +{hiddenCount}
      </div>
    ) : null;

  // Final children to render
  const finalChildren = countIndicator ? [...visibleChildren, countIndicator] : visibleChildren;

  // Calculate spacing in pixels
  const spacingStyle = `${spacing}px`;

  return (
    <div
      data-slot="avatar-group"
      className={cn('flex flex-row items-center', className)}
      style={{ height: size }}
      {...props}
    >
      {finalChildren.map((child, index) => (
        <AvatarContainer
          key={child.key || index}
          zIndex={invertOverlap ? finalChildren.length - index : index}
        >
          <div style={{ marginLeft: index === 0 ? 0 : spacingStyle }}>{child}</div>
        </AvatarContainer>
      ))}
    </div>
  );
}

export { AvatarGroup, type AvatarGroupProps };

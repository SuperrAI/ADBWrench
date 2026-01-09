'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { createAvatar } from '@dicebear/core';
import * as openPeeps from '@dicebear/open-peeps';
import { cn } from '@/lib/utils';

// Main Avatar component that accepts children (for shadcn/ui compatibility)
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

// Wrapper component that matches boring-avatars interface
interface BoringAvatarProps {
  size?: number;
  name?: string;
  variant?: string;
  colors?: string[];
  className?: string;
}

export function BoringAvatar({
  size = 40,
  name = '',
  variant = 'beam',
  colors = ['#FF6F1E', '#EBEBEB'],
  className,
}: BoringAvatarProps) {
  const avatarUrl = createAvatar(openPeeps, {
    seed: name,
    size: size,
    backgroundColor: colors,
    radius: 50,
  }).toDataUri();

  return (
    <img
      src={avatarUrl}
      alt={`${name}'s avatar`}
      className={cn('rounded-full border border-neutral-200', className)}
      width={size}
      height={size}
    />
  );
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };

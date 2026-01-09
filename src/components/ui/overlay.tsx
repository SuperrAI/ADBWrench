import * as React from 'react';
import { cn } from '@/lib/utils';

interface OverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onClose?: () => void;
}

const Overlay = React.forwardRef<HTMLDivElement, OverlayProps>(
  ({ className, isOpen = false, onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 bg-black/30 transition-opacity duration-300 ease-in-out z-[60]',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          className
        )}
        onClick={onClose}
        {...props}
      />
    );
  }
);
Overlay.displayName = 'Overlay';

export { Overlay };
export type { OverlayProps };

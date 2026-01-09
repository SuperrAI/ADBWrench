import * as Tooltip from '@radix-ui/react-tooltip';
import React from 'react';

interface AdminTooltipProps {
  content: string;
  children: React.ReactNode;
}

export const AdminTooltip: React.FC<AdminTooltipProps> = ({ content, children }) => (
  <Tooltip.Provider delayDuration={200}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          align="center"
          sideOffset={8}
          className="z-50 rounded-2xl bg-black px-6 py-3 text-sm text-white shadow-lg max-w-xs text-left font-normal leading-[22px] transition-all duration-200 ease-out data-[state=delayed-open]:animate-fade-in data-[state=closed]:animate-fade-out"
        >
          {content}
          <Tooltip.Arrow asChild>
            <svg width="24" height="8" viewBox="25 8 16 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M41 8L25 8L29.8765 14.0957C31.4778 16.0973 34.5222 16.0973 36.1235 14.0957L41 8Z" fill="black"/>
            </svg>
          </Tooltip.Arrow>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

export default AdminTooltip;

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { textStyles } from '@/design-system/foundations/typography';
import { CoreColors, Neutral, Orange } from '@/design-system/foundations/colors';
import { animations } from '@/design-system/foundations/animations';

export interface DarkMenuItemProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isDelete?: boolean;
  isHovered?: boolean;
  isAI?: boolean;
  customIconBg?: string;
}

export interface DarkMenuProps {
  items: DarkMenuItemProps[];
  className?: string;
  trigger?: React.ReactNode;
  showHoverEffect?: boolean;
  maxItems?: number;
}

const DarkMenu: React.FC<DarkMenuProps> = ({
  items,
  className,
  trigger,
  showHoverEffect = false,
  maxItems = 2,
}) => {
  const menuItems = maxItems ? items.slice(0, maxItems) : items;
  const textStyle = textStyles.body1Reg;

  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const itemHeight = 44;
  const itemGap = 0;
  const padding = 8;
  const containerHeight =
    padding * 2 + menuItems.length * itemHeight + (menuItems.length - 1) * itemGap;

  return (
    <div
      className={cn('rounded-[24px] shadow-lg', className)}
      style={{
        width: '274px',
        height: `${containerHeight}px`,
        padding: '8px',
        backgroundColor: CoreColors.Black,
        animation: `${animations.fadeIn}`,
      }}
    >
      <div className="flex flex-col h-full space-y-[2px]">
        {menuItems.map((item) => {
          const isHovered = showHoverEffect ? item.isHovered || hoveredItemId === item.id : false;

          let bgColor = 'transparent';
          let borderColor = 'transparent';

          if (isHovered) {
            if (item.isAI) {
              bgColor = 'rgba(255, 111, 30, 0.25)';
              borderColor = 'rgba(255, 111, 30, 0.2)';
            } else {
              bgColor = '#171717';
              borderColor = Neutral.N800;
            }
          }

          const iconBgColor = item.customIconBg
            ? item.customIconBg
            : item.id === 'create-ai' || item.isAI
              ? Orange.O500
              : Neutral.N800;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              disabled={item.disabled}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
              className={cn(
                'flex items-center transition-colors',
                'text-left',
                item.isDelete ? 'text-red-400' : 'text-white',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                width: '258px',
                height: '44px',
                borderRadius: '16px',
                paddingTop: '8px',
                paddingRight: '8px',
                paddingBottom: '8px',
                paddingLeft: '10px',
                fontFamily: textStyle.fontFamily,
                fontSize: textStyle.fontSize,
                fontWeight: 400,
                lineHeight: textStyle.lineHeight,
                letterSpacing: textStyle.letterSpacing,
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                boxSizing: 'border-box',
              }}
            >
              {item.icon && (
                <div
                  className="flex-shrink-0 relative rounded-full"
                  style={{
                    width: '28px',
                    height: '28px',
                    marginRight: '12px',
                    backgroundColor: iconBgColor,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '16px',
                      height: '16px',
                    }}
                  >
                    {React.cloneElement(item.icon as React.ReactElement, {
                      width: 16,
                      height: 16,
                      color: '#F5F5F5',
                      strokeWidth: 1.5,
                      stroke: '#F5F5F5',
                      style: {
                        strokeWidth: 1.5,
                        stroke: '#F5F5F5',
                      },
                    })}
                  </div>
                </div>
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DarkMenu;

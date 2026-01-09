'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CoreColors, Neutral } from '@/design-system/foundations/colors';
import { AppIcons, ICONS_PATH } from '@/design-system/foundations/icons';
import { textStyles } from '@/design-system/foundations/typography';
import { useLayout } from '@/context/layout-context';

interface NavItem {
  href: string;
  icon: string;
  activeIcon?: string;
  title?: string;
  isLogo?: boolean;
}

interface SideNavProps {
  className?: string;
  avatarColor?: string;
  navItems?: NavItem[];
}

export function SideNav({ className, navItems = [] }: SideNavProps) {
  const pathname = usePathname();
  const { setIsSideNavHovered } = useLayout();

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  const topItems: NavItem[] = [
    {
      href: '/',
      icon: `${ICONS_PATH}/${AppIcons.NAV_LOGO}.svg`,
      title: 'Logo',
      isLogo: true,
    },
  ];

  const isItemActive = (item: NavItem) => {
    return item.href === pathname || pathname?.startsWith(item.href + '/');
  };

  const renderNavItem = (item: NavItem, showLabel: boolean = true) => {
    const isActive = isItemActive(item);
    const isHovered = hoveredItem === item.href;
    const iconSrc = isActive && item.activeIcon ? item.activeIcon : item.icon;

    if (item.isLogo) {
      return (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center justify-start w-full h-14 rounded-xl"
        >
          <Image
            src={iconSrc}
            alt={item.title || 'Logo'}
            width={48}
            height={48}
            className="object-contain"
            style={{ filter: 'brightness(0)' }}
          />
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center h-12 rounded-xl transition-colors px-2 whitespace-nowrap',
          isActive ? 'nav-item-active' : 'nav-item'
        )}
        onMouseEnter={() => setHoveredItem(item.href)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div className="flex items-center justify-center w-12 min-w-12 relative">
          <Image
            src={iconSrc}
            alt={item.title || 'Navigation icon'}
            width={32}
            height={32}
            className="transition-all duration-200"
            style={{
              opacity: isActive || isHovered ? 1 : 0.6,
            }}
          />
        </div>

        <div className="flex-1 w-full min-w-0">
          {item.title && showLabel && (
            <span
              className="ml-4 transition-all duration-200 ease-in-out block rounded-lg"
              style={{
                ...textStyles.body1Med,
                color: isActive || isHovered ? CoreColors.Black : Neutral.N400,
                opacity: isExpanded ? 1 : 0,
                transform: isExpanded ? 'translateX(0)' : 'translateX(-10px)',
                width: isExpanded ? 'auto' : '0',
                visibility: isExpanded ? 'visible' : 'hidden',
                whiteSpace: 'nowrap',
                backgroundColor: isExpanded ? Neutral.N50 : 'transparent',
                padding: isExpanded ? '4px 12px' : '0px',
              }}
            >
              {item.title}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="relative">
      <nav
        className={cn(
          'flex flex-col min-h-screen h-full transition-all duration-300 ease-in-out fixed top-0 left-0 py-6 md:py-10',
          isExpanded ? 'w-[290px]' : 'w-[48px] sm:w-[60px]',
          className
        )}
        style={{
          zIndex: 50,
        }}
      >
        <div className="flex flex-col items-start w-full">
          {topItems.map((item) => renderNavItem(item, false))}
        </div>

        <div className="flex-1" />

        <div
          className="flex flex-col w-full gap-6 items-start"
          onMouseEnter={() => {
            setIsExpanded(true);
            setIsSideNavHovered(true);
          }}
          onMouseLeave={() => {
            setIsExpanded(false);
            setIsSideNavHovered(false);
          }}
        >
          {navItems.map((item) => renderNavItem(item, true))}
        </div>

        <div className="flex-1" />
      </nav>
    </div>
  );
}

export default SideNav;

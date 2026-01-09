'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CoreColors, Neutral } from '@/design-system/foundations/colors';
import { AppIcons, ICONS_PATH } from '@/design-system/foundations/icons';
import { textStyles } from '@/design-system/foundations/typography';
import { Menu, X } from 'lucide-react';

interface NavItem {
  href: string;
  icon: string;
  activeIcon?: string;
  title?: string;
}

interface MobileNavProps {
  navItems?: NavItem[];
}

export function MobileNav({ navItems = [] }: MobileNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isItemActive = (item: NavItem) => {
    return item.href === pathname || pathname?.startsWith(item.href);
  };

  return (
    <>
      <nav className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center">
            <Image
              src={`${ICONS_PATH}/${AppIcons.NAV_LOGO}.svg`}
              alt="Logo"
              width={40}
              height={40}
              className="object-contain"
              style={{ filter: 'brightness(0)' }}
            />
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" style={{ color: CoreColors.Black }} />
            ) : (
              <Menu className="w-6 h-6" style={{ color: CoreColors.Black }} />
            )}
          </button>
        </div>
      </nav>

      <div
        className={cn(
          'md:hidden fixed left-0 right-0 bg-white z-50 shadow-2xl border-b border-gray-200',
          isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        style={{
          maxHeight: isMenuOpen ? 'calc(100vh - 4rem)' : '0',
          opacity: isMenuOpen ? 1 : 0,
          overflow: isMenuOpen ? 'auto' : 'hidden',
          transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
          top: isMenuOpen ? '4rem' : '0',
        }}
      >
        <div className="py-2">
          {navItems.map((item) => {
            const isActive = isItemActive(item);
            const iconSrc = isActive && item.activeIcon ? item.activeIcon : item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'flex items-center gap-4 px-6 py-3 transition-colors',
                  isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
                )}
              >
                <Image
                  src={iconSrc}
                  alt={item.title || 'Navigation icon'}
                  width={24}
                  height={24}
                  style={{
                    opacity: isActive ? 1 : 0.6,
                  }}
                />
                <span
                  style={{
                    ...textStyles.body1Med,
                    color: isActive ? CoreColors.Black : Neutral.N400,
                  }}
                >
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default MobileNav;

'use client';

import React from 'react';
import { SideNav } from '@/design-system/patterns/SideNav';
import { MobileNav } from '@/design-system/patterns/MobileNav';
import { usePathname } from 'next/navigation';
import { useLayout } from '@/context/layout-context';
import { Header } from '@/design-system/patterns/Header';
import { useIsMobile } from '@/hooks/use-mobile';
import { TopBar } from '@/components/ui/TopBar';

interface PageLayoutProps {
  children: React.ReactNode;
  headerProps?: React.ComponentProps<typeof Header>;
}

// Default navigation items for the app
const defaultNavItems = [
  {
    href: '/dashboard',
    icon: '/assets/icons/nav_feed.svg',
    activeIcon: '/assets/icons/nav_feed_fill.svg',
    title: 'Dashboard',
  },
  {
    href: '/shell',
    icon: '/assets/icons/nav_assignment.svg',
    activeIcon: '/assets/icons/nav_assignment_fill.svg',
    title: 'Shell',
  },
  {
    href: '/logcat',
    icon: '/assets/icons/nav_files.svg',
    activeIcon: '/assets/icons/nav_files_fill.svg',
    title: 'Logcat',
  },
  {
    href: '/files',
    icon: '/assets/icons/nav_files.svg',
    activeIcon: '/assets/icons/nav_files_fill.svg',
    title: 'Files',
  },
];

export function PageLayout({ children, headerProps: propHeaderProps }: PageLayoutProps) {
  // Use a static orange color for the avatar background
  const avatarColor = '#FFA500';
  const pathname = usePathname();
  const { layoutType, showHeader, headerProps: contextHeaderProps, isSideNavHovered } = useLayout();

  // Check if we're on pages where SideNav should be hidden
  const isHomePage = pathname === '/' || pathname === '/home';
  const isLoginPage = pathname === '/login' || pathname === '/signin';
  const isTestingPage = pathname === '/testing';
  const isActivatePage = pathname === '/activate';

  const isMobile = useIsMobile();
  // Hide SideNav if layout is 4-col
  const isFourColumnLayout = layoutType === '4-col';

  const hideSideNav = isHomePage || isLoginPage || isTestingPage || isActivatePage || isFourColumnLayout;

  // Merge header props from props and context, with props taking precedence
  const mergedHeaderProps = { ...contextHeaderProps, ...propHeaderProps };

  // Render the header component
  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <div className="w-full flex justify-center" style={{ flexShrink: 0 }}>
        <Header {...mergedHeaderProps} />
      </div>
    );
  };

  // Render the main content with optional header
  const renderMainContent = (showTopBar: boolean = false) => (
    <div
      className="h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
    >
      {showTopBar && <TopBar />}
      {renderHeader()}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );

  // If we should hide SideNav, render only the children with optional header
  if (hideSideNav) {
    return renderMainContent();
  }

  // For all other pages, include the SideNav and optional header
  return (
    <>

      <div className="h-full overflow-hidden flex flex-col sm:flex-row sm:gap-4">
        {isMobile ? <MobileNav /> : <div
          style={{
            padding: '0px 0px 0px 0px',
            width: '72px', // Fixed width for the SideNav container
          }}
          className="h-full z-50 flex-shrink-0"
        >
          <SideNav className="h-full" avatarColor={avatarColor} navItems={defaultNavItems} />
        </div>}
        <div className="flex-1 overflow-hidden ml-0 md:ml-[72px] h-full md:pt-0">{renderMainContent(true)}</div>
      </div>
    </>
  );
}

export default PageLayout;

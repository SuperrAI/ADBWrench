'use client';

import { SideNav } from '@/design-system/patterns/SideNav';
import { usePathname } from 'next/navigation';

interface LayoutWithSideNavProps {
  children: React.ReactNode;
}

export function LayoutWithSideNav({ children }: LayoutWithSideNavProps) {
  // Use a static orange color for the avatar background
  const avatarColor = '#FFA500';
  const pathname = usePathname();

  // Check if we're on the Home page or login page - don't show SideNav there
  const isHomePage = pathname === '/' || pathname === '/home';
  const isLoginPage = pathname === '/login' || pathname === '/signin';
  const isTestingPage = pathname === '/testing';
  const hideSideNav = isHomePage || isLoginPage || isTestingPage;

  // If we're on the Home page or login page, render only the children without SideNav
  if (hideSideNav) {
    return <main className="h-full overflow-auto">{children}</main>;
  }

  // For all other pages, include the SideNav
  return (
    <div className="h-full overflow-hidden">
      <div style={{ padding: '12px 0px 12px 12px' }} className="h-full fixed">
        <SideNav className="h-full" avatarColor={avatarColor} />
      </div>
      <main className="overflow-auto ml-[72px] h-full">{children}</main>
    </div>
  );
}

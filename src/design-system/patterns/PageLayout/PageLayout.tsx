'use client';

import React from 'react';
import { SideNav } from '@/design-system/patterns/SideNav';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Terminal,
  ScrollText,
  Monitor,
  Package,
  SlidersHorizontal,
  FolderOpen,
  Activity,
  Bug,
  Settings
} from 'lucide-react';

interface PageLayoutProps {
  children: React.ReactNode;
}

// Default navigation items for the app with Lucide icons
const defaultNavItems = [
  {
    href: '/dashboard',
    title: 'Dashboard',
    lucideIcon: LayoutDashboard,
  },
  {
    href: '/shell',
    title: 'Shell',
    lucideIcon: Terminal,
  },
  {
    href: '/logcat',
    title: 'Logcat',
    lucideIcon: ScrollText,
  },
  {
    href: '/screen',
    title: 'Screen',
    lucideIcon: Monitor,
  },
  {
    href: '/apps',
    title: 'Apps',
    lucideIcon: Package,
  },
  {
    href: '/controls',
    title: 'Controls',
    lucideIcon: SlidersHorizontal,
  },
  {
    href: '/files',
    title: 'Files',
    lucideIcon: FolderOpen,
  },
  {
    href: '/performance',
    title: 'Performance',
    lucideIcon: Activity,
  },
  {
    href: '/bugreport',
    title: 'Bugreport',
    lucideIcon: Bug,
  },
  {
    href: '/settings',
    title: 'Settings',
    lucideIcon: Settings,
  },
];

export function PageLayout({ children }: PageLayoutProps) {
  const pathname = usePathname();

  // Check if we're on pages where SideNav should be hidden
  const isHomePage = pathname === '/' || pathname === '/home';
  const isLoginPage = pathname === '/login' || pathname === '/signin';
  const isActivatePage = pathname === '/activate';

  const hideSideNav = isHomePage || isLoginPage || isActivatePage;

  // If we should hide SideNav, render only the children
  if (hideSideNav) {
    return (
      <div className="h-screen overflow-auto">
        {children}
      </div>
    );
  }

  // Two-column layout: sidebar (left) + main content (right)
  return (
    <div className="fixed inset-0 flex">
      {/* Left Column: Sidebar - fixed, no scroll */}
      <div className="w-[220px] flex-shrink-0 h-full overflow-hidden">
        <SideNav className="h-full" navItems={defaultNavItems} />
      </div>

      {/* Right Column: Main Content Area - only this scrolls */}
      <div className="flex-1 h-full overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}

export default PageLayout;

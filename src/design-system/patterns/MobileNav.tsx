'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CoreColors, Neutral, Red } from '@/design-system/foundations/colors';
import { AppIcons, ICONS_PATH } from '@/design-system/foundations/icons';
import { Avatar } from '@/components/ui/dicebear-avatar';
import { textStyles } from '@/design-system/foundations/typography';
import { Menu, X, LogOut, User, QrCode } from 'lucide-react';
import { useUser as useAuthUser } from '@/context/user-context';
import { useLogout } from '@/hooks/use-logout';

interface NavItem {
    href: string;
    icon: string;
    activeIcon?: string;
    title?: string;
}

interface MobileNavProps {
    avatarColor?: string;
}

export function MobileNav({ avatarColor = '#FFA500' }: MobileNavProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user: authUser } = useAuthUser();

    const { logout } = useLogout();

    // Extract class ID from the pathname if available
    const pathSegments = pathname?.split('/') || [];
    let classId = null;

    for (let i = 0; i < pathSegments.length - 1; i++) {
        if (pathSegments[i] === 'class' && pathSegments[i + 1]) {
            classId = pathSegments[i + 1];
            break;
        }
    }

    // Navigation items
    const navItems: NavItem[] = [
        {
            href: classId ? `/people` : '/people',
            icon: `${ICONS_PATH}/${AppIcons.NAV_PEOPLE}.svg`,
            activeIcon: `${ICONS_PATH}/${AppIcons.NAV_PEOPLE_FILL}.svg`,
            title: 'People',
        },
        {
            href: classId ? `/files` : '/files',
            icon: `${ICONS_PATH}/${AppIcons.NAV_FILES}.svg`,
            activeIcon: `${ICONS_PATH}/${AppIcons.NAV_FILES_FILL}.svg`,
            title: 'Files',
        },
        {
            href: classId ? `/homework` : '/homework',
            icon: `${ICONS_PATH}/${AppIcons.NAV_ASSIGNMENT}.svg`,
            activeIcon: `${ICONS_PATH}/${AppIcons.NAV_ASSIGNMENT_FILL}.svg`,
            title: 'Assignments',
        },
        {
            href: classId ? `/gradebook` : '/gradebook',
            icon: `${ICONS_PATH}/${AppIcons.NAV_GRADEBOOK}.svg`,
            activeIcon: `${ICONS_PATH}/${AppIcons.NAV_GRADEBOOK_FILL}.svg`,
            title: 'Gradebook',
        },
        {
            href: '/ai-dashboard',
            icon: `${ICONS_PATH}/${AppIcons.NAV_AI_DASHBOARD}.svg`,
            activeIcon: `${ICONS_PATH}/${AppIcons.NAV_AI_DASHBOARD_FILL}.svg`,
            title: 'Chat Insights',
        },
    ];

    // Filter items based on user role
    const filteredNavItems = navItems.filter((item) => {
        const isStudent = authUser?.role?.toLowerCase() === 'student';
        const hiddenItems = ['Gradebook', 'People', 'Chat Insights'];
        if (hiddenItems.includes(item.title as string) && isStudent) {
            return false;
        }
        return true;
    });

    // Handle sign out
    const handleSignOut = () => {
        logout();
    };

    // Check if item is active
    const isItemActive = (item: NavItem) => {
        let isActive = item.href === pathname;

        if (!isActive && item.title === 'Assignments' && pathname) {
            isActive = pathname.startsWith('/homework');
        }

        if (!isActive && item.title === 'People' && pathname) {
            isActive = pathname.startsWith('/people');
        }

        if (!isActive && pathname && pathname.includes('/class/')) {
            const itemPathType = item.href.split('/').pop();
            const currentPathType = pathname.split('/').pop();
            isActive = itemPathType === currentPathType;
        }

        return isActive;
    };

    // User info
    const userName =
        authUser?.firstName && authUser?.lastName
            ? `${authUser.firstName} ${authUser.lastName}`
            : authUser?.firstName || 'User Name';
    const userEmail = authUser?.email || 'user@example.com';

    return (
        <>
            {/* Mobile navbar - visible on small screens only */}
            <nav className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-white border-b border-gray-200 shadow-sm">
                <div className="flex items-center justify-between h-16 px-4">
                    {/* Logo */}
                    <Link href="/people" className="flex items-center">
                        <Image
                            src={`${ICONS_PATH}/${AppIcons.NAV_LOGO}.svg`}
                            alt="Logo"
                            width={40}
                            height={40}
                            className="object-contain"
                            style={{ filter: 'brightness(0)' }}
                        />
                    </Link>

                    {/* Hamburger Menu Button */}
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

            {/* Mobile menu drawer - slides from top */}
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

                {/* User profile section */}
                <div className="px-4 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <Avatar
                                size={40}
                                name="User"
                                variant="beam"
                                colors={[avatarColor, Neutral.N200]}
                                className="rounded-full"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate font-medium" style={{ ...textStyles.body1Med, color: CoreColors.Black }}>
                                {userName}
                            </p>
                            <p className="truncate text-sm" style={{ ...textStyles.body2Reg, color: Neutral.N500 }}>
                                {userEmail}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Navigation items */}
                <div className="py-2">
                    {filteredNavItems.map((item) => {
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

                {/* Bottom actions */}
                <div className="border-t border-gray-200 bg-white">
                    {/* Action buttons */}
                    <div className="px-4 py-3">
                        {authUser?.role?.toLowerCase() === 'teacher' && (
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    router.push('/activate?source=manual');
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                            >
                                <QrCode className="h-5 w-5" style={{ color: Neutral.N500 }} />
                                <span style={{ ...textStyles.body1Med, color: CoreColors.Black }}>QR Activate</span>
                            </button>
                        )}

                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors"
                            style={{
                                backgroundColor: Red.R50,
                            }}
                        >
                            <LogOut className="h-5 w-5" style={{ color: Red.R600 }} />
                            <span style={{ ...textStyles.body1Med, color: Red.R600 }}>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default MobileNav;


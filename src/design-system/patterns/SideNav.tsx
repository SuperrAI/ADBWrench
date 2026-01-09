import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CoreColors, Neutral, Red } from '@/design-system/foundations/colors';
import { AppIcons, ICONS_PATH } from '@/design-system/foundations/icons';
import { Avatar } from '@/components/ui/dicebear-avatar';
import { textStyles } from '@/design-system/foundations/typography';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser as useAuthUser } from '@/context/user-context';
import { LogOut, User, QrCode } from 'lucide-react';
import { useLayout } from '@/context/layout-context';
import { useLogout } from '@/hooks/use-logout';

// Navigation item interface
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
  userAvatar?: string;
}

export function SideNav({ className, avatarColor = '#FFA500', userAvatar }: SideNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, isLoading: isLoadingAuth } = useAuthUser();
  const { setIsSideNavHovered } = useLayout();
  const { logout } = useLogout();

  // Extract class ID from the pathname if available - improved logic
  const pathSegments = pathname?.split('/') || [];
  let classId = null;

  // Check for class ID in the URL path
  for (let i = 0; i < pathSegments.length - 1; i++) {
    if (pathSegments[i] === 'class' && pathSegments[i + 1]) {
      classId = pathSegments[i + 1];
      break;
    }
  }

  // If we're on a post page but don't have a class ID in the URL,
  // we need to check if this post is associated with a class context
  if (!classId && pathSegments.length > 2 && pathSegments[1] === 'post') {
    // Try to get the class ID from localStorage (set when navigating from class to post)
    if (typeof window !== 'undefined') {
      const storedClassId = localStorage.getItem('currentClassId');
      if (storedClassId) {
        classId = storedClassId;
      }
    }
  }

  // Store the current class ID if we're in a class context
  React.useEffect(() => {
    if (classId && typeof window !== 'undefined') {
      localStorage.setItem('currentClassId', classId);
    }
  }, [classId]);

  // State for showing sidebar labels
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Define navigation items
  const topItems: NavItem[] = [
    {
      href: '/people',
      icon: `${ICONS_PATH}/${AppIcons.NAV_LOGO}.svg`,
      title: 'Logo',
      isLogo: true,
    },
  ];

  // If we have a class ID, use class-specific routes, otherwise use general routes
  const centerItems: NavItem[] = [
    // {
    //   href: classId ? `/class/${classId}/home` : '/feed',
    //   icon: `${ICONS_PATH}/${AppIcons.NAV_FEED}.svg`,
    //   activeIcon: `${ICONS_PATH}/${AppIcons.NAV_FEED_FILL}.svg`,
    //   title: 'Feed',
    // },
    // {
    //   href: '/search',
    //   icon: `${ICONS_PATH}/${AppIcons.NAV_SEARCH}.svg`,
    //   activeIcon: `${ICONS_PATH}/${AppIcons.NAV_SEARCH_FILL}.svg`,
    //   title: 'Search',
    // },
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
    }
  ];

  // Filter out gradebook and other admin items for students
  const filteredCenterItems = centerItems.filter((item) => {
    // Hide admin-only items from students
    const isStudent = authUser?.role?.toLowerCase() === 'student';
    const hiddenItems = ['Gradebook', 'People', 'Chat Insights'];
    if (hiddenItems.includes(item.title as string) && isStudent) {
      return false;
    }
    return true;
  });

  const bottomItems: NavItem[] = [
    // {
    //   href: '/notifications',
    //   icon: `${ICONS_PATH}/${AppIcons.NAV_NOTIFICATION}.svg`,
    //   activeIcon: `${ICONS_PATH}/${AppIcons.NAV_NOTIFICATION_FILL}.svg`,
    //   title: 'Notifications',
    // },
  ];

  // State to track which item is being hovered
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  // Function to handle sign out
  const handleSignOut = () => {
    logout();
  };

  // Render a navigation item
  const renderNavItem = (item: NavItem, showLabel: boolean = true) => {
    // Check if this link matches the current path
    let isActive = item.href === pathname;

    // Special case for homework - make it active for both /homework and /homework/[homework_id]
    if (!isActive && item.title === 'Assignments' && pathname) {
      isActive = pathname.startsWith('/homework');
    }

    // Special case for people - make it active for both /people and /people/[people_id]
    if (!isActive && item.title === 'People' && pathname) {
      isActive = pathname.startsWith('/people');
    }

    // For class-specific pages, check path segments
    if (!isActive && pathname && pathname.includes('/class/')) {
      // Get the last segment of the item's href (e.g., "home", "files", "homework")
      const itemPathType = item.href.split('/').pop();

      // Get the last segment of the current pathname
      const currentPathType = pathname.split('/').pop();

      // Check if they match exactly
      isActive = itemPathType === currentPathType;
    }

    const isHovered = hoveredItem === item.href;
    const iconSrc = isActive && item.activeIcon ? item.activeIcon : item.icon;

    // Special case for logo rendering
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

    // Regular navigation item rendering
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

        {/* Label text container that is always present but only visible when expanded */}
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

  // Render user avatar for bottom section
  const renderAvatar = () => {
    const isHovered = hoveredItem === 'profile';
    // Use firstName and lastName from authUser, provide fallbacks
    const userName =
      authUser?.firstName && authUser?.lastName
        ? `${authUser.firstName} ${authUser.lastName}`
        : authUser?.firstName || 'User Name';
    // Use email from authUser (we know this works)
    const userEmail = authUser?.email || 'user@example.com';
    // Determine overall loading state (optional, for potential spinner)
    const isLoading = isLoadingAuth;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              'flex items-center h-12 rounded-xl px-2 overflow-hidden whitespace-nowrap cursor-pointer focus:outline-none focus:ring-0 transition-all duration-200',
              `hover:bg-[${Neutral.N100}]`
            )}
            onMouseEnter={() => setHoveredItem('profile')}
            onMouseLeave={() => setHoveredItem(null)}
            role="button"
            aria-label="User menu"
          >
            <div className="flex items-center justify-center w-12 min-w-12 relative">
              <div className="w-8 h-8 rounded-full overflow-hidden transition-all duration-200">
                <Avatar
                  size={32}
                  name="User"
                  variant="beam"
                  colors={[avatarColor, Neutral.N200]}
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 rounded-xl"
          style={{ minHeight: '149px' }}
          align="end"
          side="right"
          sideOffset={4}
        >
          <DropdownMenuLabel className="font-normal h-14 flex items-center">
            <div className="flex flex-col space-y-1 p-2 w-full">
              <p className="truncate" style={{ ...textStyles.body1Med, color: CoreColors.Black }}>
                {userName}
              </p>
              <p className="truncate" style={{ ...textStyles.body2Reg, color: Neutral.N500 }}>
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2 h-9"
            style={{ ...textStyles.body2Reg }}
          >
            <User className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          {authUser?.role?.toLowerCase() === 'teacher' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2 h-9"
                style={{ ...textStyles.body2Reg }}
                onClick={() => router.push('/activate?source=manual')}
              >
                <QrCode className="h-4 w-4" />
                QR Activate
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={cn(
              'cursor-pointer focus:text-red-600 flex items-center gap-2 h-9 rounded-lg',
              `focus:bg-[${Red.R100}]`
            )}
            style={{
              ...textStyles.body2Reg,
              backgroundColor: Red.R50,
              color: Red.R600,
            }}
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 text-[${Red.R500}]" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="relative">
      {/* Actual navigation that can expand */}
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
        {/* Top section */}
        <div className="flex flex-col items-start w-full">
          {topItems.map((item) => renderNavItem(item, false))}
        </div>

        {/* Spacer to push content to center */}
        <div className="flex-1" />

        {/* Center section - with 24px gap between items */}
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
          {filteredCenterItems.map((item) => renderNavItem(item, true))}
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Bottom section with 24px gap between items */}
        <div className="flex flex-col w-full gap-6 items-start mb-8">
          {bottomItems.map((item) => renderNavItem(item, false))}
          {renderAvatar()}
        </div>
      </nav>
    </div>
  );
}

export default SideNav;

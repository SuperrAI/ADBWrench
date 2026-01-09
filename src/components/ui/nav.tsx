'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/dicebear-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HelpCircle, LogOut, Settings, User } from 'lucide-react';
import { useUser as useUserProfile } from '@/hooks/use-user';
import { useUser as useAuthUser } from '@/context/user-context';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/hooks/use-logout';

export function Nav() {
  const pathname = usePathname();
  const { user: authUser } = useAuthUser();
  const { user, userLoading, userError } = useUserProfile(authUser?.id);
  const { logout } = useLogout();

  // Get display name and email - handle loading and error states
  const displayName = userLoading
    ? 'Loading...'
    : userError
      ? 'John Doe'
      : user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : 'Guest User';

  const displayEmail = userLoading
    ? 'Loading...'
    : userError
      ? 'johndoe@gmail.com'
      : (authUser?.email ?? user?.email ?? 'No email');

  const handleSignOut = () => {
    logout();
  };

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname?.startsWith('/superrlibrary/login') ||
    pathname?.startsWith('/superrlibrary/signup');

  return (
    <header className="fixed top-0 left-0 right-0 h-[80px] z-50  bg-background">
      <div className="mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/home">
            <Image
              src="/images/wordmark.svg"
              alt="Logo"
              width={100}
              height={52}
              className="cursor-pointer"
            />
          </Link>
        </div>

        {/* Only show avatar and dropdown if user is logged in and not on auth pages */}

        {!isAuthPage && (
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:brightness-90 rounded-full focus:outline-none focus-visible:ring-0">
                  <Avatar
                    size={44}
                    name="User"
                    variant="beam"
                    colors={['#FF6F1E', '#EBEBEB']}
                    className="rounded-full"
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-[224px] rounded-xl p-2">
                <div className="px-3 py-3 border-b border-neutral-100">
                  <div className="font-medium text-base">{displayName}</div>

                  <div className="text-sm text-neutral-500 mt-1.5 truncate">{displayEmail}</div>
                </div>

                <div className="py-1">
                  <DropdownMenuItem className="flex justify-between items-center cursor-pointer py-3 px-3 hover:bg-neutral-100 h-11 rounded-lg">
                    <span className="text-base">Profile</span>

                    <div className="flex items-center justify-center w-6 h-6">
                      <User size={20} strokeWidth={1.5} />
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="flex justify-between items-center cursor-pointer py-3 px-3 hover:bg-neutral-100 h-11 rounded-lg">
                    <span className="text-base">Settings</span>

                    <div className="flex items-center justify-center w-6 h-6">
                      <Settings size={20} strokeWidth={1.5} />
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="flex justify-between items-center cursor-pointer py-3 px-3 hover:bg-neutral-100 h-11 rounded-lg">
                    <span className="text-base">Help</span>

                    <div className="flex items-center justify-center w-6 h-6">
                      <HelpCircle size={20} strokeWidth={1.5} />
                    </div>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  className="flex justify-between items-center cursor-pointer py-3 px-3 hover:bg-neutral-100 bg-neutral-50 text-red-600 h-11 rounded-lg"
                  onClick={handleSignOut}
                >
                  <span className="text-base text-red-600">Sign Out</span>

                  <div className="flex items-center justify-center w-6 h-6 text-red-600">
                    <LogOut size={20} strokeWidth={1.5} />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}

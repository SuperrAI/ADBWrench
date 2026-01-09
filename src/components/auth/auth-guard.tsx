'use client';

import { useUser } from '@/context/user-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AUTH_PAGES = ['/login', '/signup'];

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isAuthPage) {
        console.log('Redirecting to login...');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirectAfterLogin', pathname);
        }
        router.push('/login');
      } else if (user && isAuthPage) {
        const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/home';
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      }
    }
  }, [user, isLoading, isAuthPage, pathname, router]);

  if (isLoading) {
    return <div>Loading...</div>; // Show a loading indicator until the user data is fetched
  }

  if (!user && !isAuthPage) {
    return null; // Prevent rendering until user state is resolved
  }

  return <>{children}</>;
};

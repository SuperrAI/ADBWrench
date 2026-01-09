'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { useLogin } from '@/hooks/use-login';

import { useUser } from '@/context/user-context';
import { getAndClearPendingActivationRedirect } from '@/lib/auth/pending-activation';

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
  const { login, data, loading: isLoading, error: loginError } = useLogin();
  const { setUser, user } = useUser();

  console.log("login data", data)

  useEffect(() => {
    if (data?.loginUser?.user) {
      // Set user in context
      setUser(data.loginUser.user);

      // Check if there's a pending activation code from before login
      const pendingActivationRedirect = getAndClearPendingActivationRedirect();
      console.log('Login complete, pending redirect:', pendingActivationRedirect);

      if (pendingActivationRedirect) {
        // Redirect to activate page with the code pre-filled
        router.push(pendingActivationRedirect);
      } else {
        // Normal login flow - go to people page
        router.push('/people');
      }
    }
  }, [data]);

  // If user is already logged in on mount (not from fresh login), redirect to people
  useEffect(() => {
    if (user && !data?.loginUser?.user) {
      router.push('/people');
    }
  }, [user]);


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    login(email, password);
  };


  return (
    <motion.div
      layout
      layoutId="login-form"
      className={cn('flex flex-col gap-6 md:w-[560px] mx-auto', className)}
    >
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="flex flex-col gap-8 md:gap-10 p-7 md:p-10 bg-white rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex flex-col gap-2 pl-1">
            <motion.h1 layoutId="title" className="text-xl md:text-2xl font-semibold">
              Sign In
            </motion.h1>
            <motion.p layoutId="description" className="text-base text-neutral-500">
              Welcome to Superr – your new learning tool.
            </motion.p>
          </div>
          <div className={cn('flex flex-col', loginError ? 'gap-6' : 'gap-10')}>
            <motion.div layoutId="form-inputs" className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-base font-medium pl-1">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  required
                  autoComplete="off"
                  className="text-base h-12 rounded-xl bg-white border border-neutral-200"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-base font-medium pl-1">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  autoComplete="new-password"
                  className="text-base h-12 rounded-xl bg-white border border-neutral-200"
                />
              </div>
            </motion.div>
            {loginError && (
              <div className="px-1">
                <p className="text-red-500">{loginError.message}</p>
              </div>
            )}
            <motion.div layoutId="button-container">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base bg-[#FF6F1E] hover:bg-[#EB5F11]"
                disabled={isLoading}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    key={isLoading ? 'loading' : 'initial'}
                  >
                    {isLoading ? <Spinner /> : 'Sign In'}
                  </motion.span>
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

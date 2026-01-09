'use client';

import React from 'react';
import { useTheme } from '@/context/theme-context';
import { Button } from '@/design-system/components/Button';

const SunIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 16V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4 10H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15.657 4.343L14.243 5.757" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5.757 14.243L4.343 15.657" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15.657 15.657L14.243 14.243" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5.757 5.757L4.343 4.343" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="medium"
      iconOnly
      icon={resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    />
  );
}

export default ThemeToggle;

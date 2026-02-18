import { redirect } from 'next/navigation';

/**
 * Backwards-compatible redirect from /screenshot to /screen.
 * This is a Server Component (no 'use client') so Next.js handles the redirect
 * at the server level before any client-side rendering.
 */
export default function ScreenshotRedirectPage() {
  redirect('/screen');
}

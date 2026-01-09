'use client';
import { Button as DSButton } from '@/design-system/components/Button';

import { useRouter, useSearchParams } from 'next/navigation';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { CircleCheckBig } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActivateSession } from '@/hooks/use-activation-form';
import Spinner from '@/components/ui/spinner';
import { useUser } from '@/context/user-context';
import { savePendingActivationCode } from '@/lib/auth/pending-activation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ActivateForm({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const sessionCode = searchParams.get('sessionCode');
  const source = searchParams.get('source'); // Check if opened from manual button
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [code, setCode] = useState(sessionCode || '');
  const [countdown, setCountdown] = useState(5);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { user } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Use the new GraphQL-based hook
  const { activateSession } = useActivateSession();


  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      timeout = setTimeout(() => {
        setShowLoadingState(true);
      }, 250);
    } else {
      setShowLoadingState(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Initialize refs array
  if (inputRefs.current.length === 0) {
    inputRefs.current = Array(6).fill(null);
  }

  useEffect(() => {
    // Focus the first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown and redirect after success (only if opened from manual button)
  useEffect(() => {
    // Only do countdown and redirect if source is 'manual'
    if (source === 'manual' && isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (source === 'manual' && isSuccess && countdown === 0) {
      // Redirect back to previous page or default to /people
      router.back();
    }
  }, [isSuccess, countdown, router, source]);

  const clearError = () => {
    if (error) setError(null);
  };

  const handleInputChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;

    clearError();
    const newCode = code.split('');
    newCode[index] = value;
    const updatedCode = newCode.join('');
    setCode(updatedCode);

    // Move focus to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move focus to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/[^0-9]/g, '')
      .slice(0, 6);
    setCode(pastedData);

    // Fill in the inputs
    pastedData.split('').forEach((digit, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index]!.value = digit;
      }
    });

    // Focus the next empty input or the last input
    const nextEmptyIndex = pastedData.length < 6 ? pastedData.length : 5;
    inputRefs.current[nextEmptyIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      // Save the code so it persists through the login flow
      if (code) {
        savePendingActivationCode(code);
      }
      setShowLoginDialog(true);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const { error, result } = await activateSession(code);
      if (error) {
        let errorMessage = 'An unexpected error occurred. Please try again.';

        // Parse error type and message
        const [errorType, errorText] = error.includes(':')
          ? error.split(':', 2)
          : ['unknown', error];

        // Check for "already assigned to device" error first (can appear in any error type)
        const fullErrorText = errorText || error;
        if (fullErrorText.toLowerCase().includes('already assigned to device')) {
          // Extract device names from the error message (e.g., "[device1, device2]" or "[device1]")
          const deviceMatch = fullErrorText.match(/\[([^\]]+)\]/);
          const devices = deviceMatch ? deviceMatch[1].split(',').map((d) => d.trim()) : [];

          if (devices.length > 0) {
            const deviceList =
              devices.length === 1
                ? devices[0]
                : devices.length === 2
                  ? `${devices[0]} and ${devices[1]}`
                  : `${devices.slice(0, -1).join(', ')}, and ${devices[devices.length - 1]}`;
            errorMessage = `You are already assigned to device${devices.length > 1 ? 's' : ''}: ${deviceList}.`;
          } else {
            errorMessage = 'You’re logged in on another device. Log out there to continue.';
          }
        } else {
          // Map error types to user-friendly messages
          switch (errorType) {
            case 'invalid_code':
              errorMessage = 'The entered code is incorrect. Please try again.';
              break;
            case 'server_error':
              // Check for other specific server error messages
              if (fullErrorText.toLowerCase().includes('expired')) {
                errorMessage = 'This code has expired. Please request a new one.';
              } else if (fullErrorText.toLowerCase().includes('invalid')) {
                errorMessage = 'The entered code is incorrect. Please try again.';
              } else {
                errorMessage = 'Server error occurred. Please try again later.';
              }
              break;
            case 'not_found':
              errorMessage = 'Session not found. Please check your code.';
              break;
            case 'already_activated':
              errorMessage = 'This session is already activated.';
              break;
            default:
              // For other errors, check the error text for specific patterns
              if (fullErrorText.toLowerCase().includes('expired')) {
                errorMessage = 'This code has expired. Please request a new one.';
              } else if (fullErrorText.toLowerCase().includes('invalid')) {
                errorMessage = 'The entered code is incorrect. Please try again.';
              } else {
                // Use the server message if it's informative, otherwise use generic message
                errorMessage =
                  fullErrorText.length > 5 && !fullErrorText.includes('undefined')
                    ? fullErrorText
                    : 'An unexpected error occurred. Please try again.';
              }
          }
        }

        throw new Error(errorMessage);
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6 w-full max-w-[560px] mx-auto md:px-4', className)}>
      <form onSubmit={handleSubmit}>
        <motion.div
          layout
          layoutId="login-form"
          className="flex flex-col gap-6 sm:gap-8 md:gap-10 p-4 sm:p-6 md:p-7 lg:p-10 bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-sm mx-auto w-full"
        >
          <div className="flex flex-col gap-2 pl-1">
            <motion.h1
              layoutId="title"
              className="text-lg sm:text-xl md:text-2xl font-semibold text-left"
            >
              {isSuccess ? 'Signed In' : 'Enter Code'}
            </motion.h1>
            <motion.p
              layoutId="description"
              className="text-sm sm:text-base text-neutral-500 text-left leading-relaxed"
            >
              {isSuccess
                ? 'You have signed in to Superr. Your Superr device will refresh.'
                : 'Enter the 6-digit code displayed on your Superr device.'}
            </motion.p>
          </div>

          {isSuccess && source === 'manual' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-[#FF6F1E] shadow-sm">
                <span className="text-[#FF6F1E] font-semibold text-sm">{countdown}</span>
              </div>
              <p className="text-sm text-neutral-600 font-medium">Redirecting...</p>
            </motion.div>
          )}

          {!isSuccess && (
            <motion.div
              className={cn('flex flex-col', error ? 'gap-4 sm:gap-6' : 'gap-6 sm:gap-8 md:gap-10')}
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="grid gap-4 sm:gap-6">
                  <Label htmlFor="code-0" className="sr-only">
                    Enter Code
                  </Label>
                  <motion.div
                    layoutId="code-inputs"
                    className="grid grid-cols-6 gap-1.5 sm:gap-2 md:gap-3 w-full"
                    onPaste={handlePaste}
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Input
                        key={index}
                        id={`code-${index}`}
                        ref={(el: HTMLInputElement | null): void => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={code[index] || ''}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={cn(
                          'text-center font-mono w-full bg-white border border-neutral-200 rounded-lg sm:rounded-xl',
                          'text-sm sm:text-base md:text-lg font-semibold',
                          'h-10 sm:h-11 md:h-12',
                          'focus:ring-2 focus:ring-[#FF6F1E] focus:border-[#FF6F1E]',
                          'transition-all duration-200',
                          // Ensure visibility on all screen sizes
                          'min-w-0 flex-shrink-0'
                        )}
                        style={{
                          // Ensure minimum touch target size for mobile
                          minHeight: '40px',
                          // minWidth: '40px'
                        }}
                        required
                        disabled={isSuccess}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                    ))}
                  </motion.div>
                </div>

                {error && (
                  <motion.div
                    className="px-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="text-red-500 text-sm sm:text-base text-center sm:text-left">
                      {error}
                    </p>
                  </motion.div>
                )}

                <motion.div layoutId="button-container">
                  <Button
                    type="submit"
                    className={cn(
                      'w-full rounded-lg sm:rounded-xl text-sm sm:text-base font-medium',
                      'h-10 sm:h-11 md:h-12',
                      'transition-all duration-200',
                      isSuccess
                        ? 'bg-[#FF6F1E] hover:bg-[#FF6F1E] hover:cursor-not-allowed'
                        : 'bg-[#FF6F1E] hover:bg-[#EB5F11] active:bg-[#D14A00]'
                    )}
                    disabled={isLoading || code.length !== 6}
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                        initial={{ opacity: 0, y: -25 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 25 }}
                        key={showLoadingState ? 'loading' : isSuccess ? 'success' : 'initial'}
                        className="flex items-center justify-center"
                      >
                        {showLoadingState ? (
                          <Spinner />
                        ) : isSuccess ? (
                          <CircleCheckBig className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2px]" />
                        ) : (
                          'Continue'
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </form>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="w-[95vw] rounded-xl sm:w-full max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Not Logged In</DialogTitle>
            <DialogDescription>
              You need to be logged in to activate a device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:gap-0">
            <DSButton
              variant="outline"
              onClick={() => setShowLoginDialog(false)}
              className="w-full sm:w-auto"
              style={{ width: '100%' }}
            >
              Cancel
            </DSButton>
            <DSButton
              variant="secondary"
              onClick={() => {
                // Ensure code is saved before navigating to login
                if (code) {
                  savePendingActivationCode(code);
                }
                router.push('/login');
              }}
              className="w-full sm:w-auto"
              style={{ width: '100%' }}
            >
              Log In
            </DSButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/design-system/components/Button';
import { useDevice } from '@/context/device-context';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Usb,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const { connect, connectionState, isWebUsbSupported, error, deviceInfo } = useDevice();
  const [isHoveringConnect, setIsHoveringConnect] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-background">
      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Hero Card - Terminal Style */}
        <div className="bg-background border border-border p-8 md:p-12 text-center relative">
          {/* Top border accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />

          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground mt-4">
            ADB Wrench
          </motion.h1>

          <motion.p variants={itemVariants} className="text-base text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed font-mono">
            Browser-based Android debugging tool.<br className="hidden md:block"/>
            Diagnose, manage, and repair devices.
          </motion.p>

          {/* Interaction Zone */}
          <motion.div variants={itemVariants} className="space-y-6">

            {/* Browser Support Check */}
            {!isWebUsbSupported && (
              <div className="p-4 border-2 border-red-500 bg-red-500/5 text-red-600 dark:text-red-400 flex items-start text-left gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">Browser Not Supported</h3>
                  <p className="text-xs opacity-90 mt-1 font-mono">
                    ADB Wrench requires WebUSB. Use Chrome, Edge, or Opera on desktop.
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 border-2 border-red-500 bg-red-500/5 text-red-600 dark:text-red-400 flex items-center gap-3 text-sm font-medium"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Connection States */}
            {connectionState === 'unauthorized' ? (
              <div className="border-2 border-orange-500 bg-orange-500/5 p-6 text-left">
                <div className="flex items-center gap-3 mb-4 text-orange-600 dark:text-orange-400">
                  <ShieldAlert className="w-6 h-6" />
                  <h3 className="font-semibold text-lg">Authorization Required</h3>
                </div>
                <ol className="space-y-3 text-sm text-orange-900/80 dark:text-orange-200/80 ml-1 font-mono">
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-5 h-5 border border-orange-500 text-xs font-bold shrink-0">1</span>
                    Unlock your Android device screen.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-5 h-5 border border-orange-500 text-xs font-bold shrink-0">2</span>
                    Look for "Allow USB debugging?" prompt.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-5 h-5 border border-orange-500 text-xs font-bold shrink-0">3</span>
                    Tap <strong>Allow</strong> (check "Always allow").
                  </li>
                </ol>
                <div className="mt-6 flex justify-center">
                  <Button variant="loading" size="medium" loadingText="Waiting for permission..." />
                </div>
              </div>
            ) : connectionState === 'connected' && deviceInfo ? (
              <div className="relative border-2 border-green-500 bg-green-500/5 p-6">
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500" />

                <div className="flex items-center gap-5 mb-6 pt-2">
                  {/* Device icon */}
                  <div className="relative">
                    <div className="w-16 h-16 border-2 border-green-500 flex items-center justify-center bg-background">
                      <Smartphone className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  {/* Device info */}
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-xl font-bold text-foreground leading-tight truncate">
                      {deviceInfo.model}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {deviceInfo.manufacturer}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500" />
                      <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                        {deviceInfo.serial}
                      </p>
                    </div>
                  </div>
                </div>

                <Link href="/dashboard" className="block group/btn">
                  <Button
                    variant="primary"
                    size="large"
                    className="w-full bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 transition-all duration-200"
                    endIcon={<ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />}
                  >
                    Launch Dashboard
                  </Button>
                </Link>
              </div>
            ) : isWebUsbSupported && (
              <div className="relative group">
                {connectionState === 'connecting' ? (
                  <Button
                    variant="loading"
                    size="large"
                    loadingText="Connecting..."
                    className="w-full py-6 text-lg"
                  />
                ) : (
                  <div
                    onMouseEnter={() => setIsHoveringConnect(true)}
                    onMouseLeave={() => setIsHoveringConnect(false)}
                    className="relative"
                  >
                    <Button
                      variant="primary"
                      size="large"
                      onClick={connect}
                      className={cn(
                        "w-full relative py-6 text-lg font-semibold tracking-wide border-2 transition-all duration-200",
                        isHoveringConnect ? "bg-foreground text-background" : ""
                      )}
                      icon={<Usb className="w-5 h-5 mr-1" />}
                    >
                      Connect Device
                    </Button>
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/80 font-mono">
                  Ensure USB debugging is enabled in Developer Settings
                </p>
              </div>
            )}

            {/* Footer Shortcuts */}
            <motion.div variants={itemVariants} className="pt-8 mt-2 border-t border-border flex items-center justify-center gap-8 text-xs text-muted-foreground/60">
               <div className="flex items-center gap-2 hover:text-muted-foreground transition-colors cursor-default">
                 <kbd className="px-2.5 py-1 border border-border bg-muted/40 font-mono text-[10px]">Cmd+U</kbd>
                 <span className="font-medium">Connect</span>
               </div>
               <div className="w-1 h-1 bg-muted-foreground/30" />
               <div className="flex items-center gap-2 hover:text-muted-foreground transition-colors cursor-default">
                 <kbd className="px-2.5 py-1 border border-border bg-muted/40 font-mono text-[10px]">?</kbd>
                 <span className="font-medium">Help</span>
               </div>
            </motion.div>

          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}

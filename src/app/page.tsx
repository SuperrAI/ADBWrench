'use client';

import { useState, useEffect } from 'react';
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
  Cable,
  Zap
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
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden bg-dot-pattern">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20 z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(120,60,255,0.05),transparent)] z-0" />
      
      <motion.div 
        className="relative z-10 w-full max-w-2xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Hero Card */}
        <div className="backdrop-blur-xl bg-card/60 border border-white/10 shadow-2xl rounded-3xl p-8 md:p-12 text-center relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
          
          <motion.div variants={itemVariants} className="mb-8 flex justify-center">
            <div className="relative">
              {/* Ambient glow based on connection state */}
              <div className={cn(
                "absolute inset-0 blur-2xl rounded-full transition-colors duration-500",
                connectionState === 'connected' ? "bg-emerald-500/30" :
                connectionState === 'unauthorized' ? "bg-amber-500/30" : "bg-primary/20"
              )} />
              <div className={cn(
                "relative p-5 rounded-2xl shadow-xl border transition-all duration-500",
                connectionState === 'connected'
                  ? "bg-gradient-to-b from-emerald-500/10 to-green-500/5 border-emerald-500/30"
                  : connectionState === 'unauthorized'
                  ? "bg-gradient-to-b from-amber-500/10 to-yellow-500/5 border-amber-500/30"
                  : "bg-gradient-to-b from-background to-secondary/50 border-white/10"
              )}>
                <Smartphone className={cn(
                  "w-12 h-12 transition-colors duration-500",
                  connectionState === 'connected' ? "text-emerald-500" :
                  connectionState === 'unauthorized' ? "text-amber-500" : "text-foreground"
                )} />
              </div>
              {/* Status Badge */}
              <div className={cn(
                "absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-card shadow-lg transition-colors duration-500",
                connectionState === 'connected' ? "bg-gradient-to-br from-emerald-400 to-green-500" :
                connectionState === 'unauthorized' ? "bg-gradient-to-br from-amber-400 to-yellow-500" : "bg-neutral-500"
              )}>
                {connectionState === 'connected' ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : connectionState === 'unauthorized' ? (
                  <ShieldAlert className="w-4 h-4 text-white" />
                ) : (
                  <Cable className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            SuperrWrench
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
            Advanced in-browser Android debugging suite. <br className="hidden md:block"/>
            Diagnose, manage, and repair devices instantly.
          </motion.p>

          {/* Interaction Zone */}
          <motion.div variants={itemVariants} className="space-y-6">
            
            {/* Browser Support Check */}
            {!isWebUsbSupported && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-start text-left gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">Browser Not Supported</h3>
                  <p className="text-xs opacity-90 mt-1">
                    SuperrWrench requires WebUSB. Please use a Chromium-based browser (Chrome, Edge, Opera) on desktop.
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
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3 text-sm font-medium"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Connection States */}
            {connectionState === 'unauthorized' ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-left">
                <div className="flex items-center gap-3 mb-4 text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                  <h3 className="font-semibold text-lg">Authorization Required</h3>
                </div>
                <ol className="space-y-3 text-sm text-amber-900/80 dark:text-amber-200/80 ml-1">
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-xs font-bold shrink-0">1</span>
                    Unlock your Android device screen.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-xs font-bold shrink-0">2</span>
                    Look for the "Allow USB debugging?" prompt.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-xs font-bold shrink-0">3</span>
                    Tap <strong>Allow</strong> (Check "Always allow" for convenience).
                  </li>
                </ol>
                <div className="mt-6 flex justify-center">
                  <Button variant="loading" size="medium" loadingText="Waiting for permission..." />
                </div>
              </div>
            ) : connectionState === 'connected' && deviceInfo ? (
              <div className="relative">
                {/* Success glow - more visible */}
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/30 via-green-500/25 to-teal-500/30 rounded-3xl blur-2xl animate-pulse" />

                <div className="relative bg-gradient-to-b from-card via-card to-card/90 border border-emerald-500/20 rounded-2xl p-6 shadow-2xl shadow-emerald-500/10">
                  {/* Connected indicator bar */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 rounded-full shadow-lg shadow-emerald-500/50" />

                  <div className="flex items-center gap-5 mb-6 pt-3">
                    {/* Device icon */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/15 via-green-500/10 to-teal-500/15 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-inner">
                        <Smartphone className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center ring-3 ring-card shadow-lg">
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
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                          {deviceInfo.serial}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link href="/dashboard" className="block group/btn">
                    <Button
                      variant="primary"
                      size="large"
                      className="w-full bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:from-emerald-500 hover:via-green-500 hover:to-emerald-500 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-semibold tracking-wide"
                      endIcon={<ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />}
                    >
                      Launch Dashboard
                    </Button>
                  </Link>
                </div>
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
                    {/* Pulsing effect behind button */}
                    <div className={cn(
                      "absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-indigo-500 rounded-xl opacity-30 blur transition-opacity duration-500",
                      isHoveringConnect ? "opacity-70" : "opacity-30"
                    )} />
                    <Button
                      variant="primary"
                      size="large"
                      onClick={connect}
                      className="w-full relative py-6 text-lg font-semibold tracking-wide"
                      icon={<Usb className="w-5 h-5 mr-1" />}
                    >
                      Connect Device
                    </Button>
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/80">
                  Ensured USB debugging is enabled in Developer Settings
                </p>
              </div>
            )}

            {/* Footer Shortcuts */}
            <motion.div variants={itemVariants} className="pt-8 mt-2 border-t border-border/30 flex items-center justify-center gap-8 text-xs text-muted-foreground/60">
               <div className="flex items-center gap-2 hover:text-muted-foreground transition-colors cursor-default">
                 <kbd className="px-2.5 py-1 rounded-md bg-muted/40 border border-border/40 font-mono text-[10px] shadow-sm">Cmd+U</kbd>
                 <span className="font-medium">Connect</span>
               </div>
               <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
               <div className="flex items-center gap-2 hover:text-muted-foreground transition-colors cursor-default">
                 <kbd className="px-2.5 py-1 rounded-md bg-muted/40 border border-border/40 font-mono text-[10px] shadow-sm">?</kbd>
                 <span className="font-medium">Help</span>
               </div>
            </motion.div>

          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import { shell } from '@/services/adb';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Power,
  Smartphone,
  Volume2,
  Sun,
  Wifi,
  Plane,
  Keyboard,
  Sliders,
  Check,
  X,
  RefreshCw,
  RotateCcw,
  HardDrive,
  Lock,
  VolumeX,
  Minus,
  Plus,
  Send,
  Home,
  ArrowLeft,
  Grid3X3,
  Clock,
  Camera,
  SkipBack,
  SkipForward,
  Pause,
  Play
} from 'lucide-react';

// Key events with icons
const KEY_EVENTS = [
  { label: 'Home', keycode: 3, icon: Home },
  { label: 'Back', keycode: 4, icon: ArrowLeft },
  { label: 'Menu', keycode: 82, icon: Grid3X3 },
  { label: 'Recent', keycode: 187, icon: Clock },
  { label: 'Power', keycode: 26, icon: Power },
  { label: 'Vol Up', keycode: 24, icon: Plus },
  { label: 'Vol Down', keycode: 25, icon: Minus },
  { label: 'Mute', keycode: 164, icon: VolumeX },
  { label: 'Play/Pause', keycode: 85, icon: Play },
  { label: 'Next', keycode: 87, icon: SkipForward },
  { label: 'Prev', keycode: 88, icon: SkipBack },
  { label: 'Camera', keycode: 27, icon: Camera },
];

// Confirmation dialog
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  icon,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-xl p-6 max-w-md mx-4 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          {icon && (
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border/50">
          <Button variant="ghost" size="small" onClick={onCancel} icon={<X className="w-4 h-4" />}>
            Cancel
          </Button>
          <Button variant="warning" size="small" onClick={onConfirm} icon={<RefreshCw className="w-4 h-4" />}>
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Control section component
function ControlSection({
  title,
  icon,
  color = 'primary',
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color?: 'primary' | 'red' | 'blue' | 'amber' | 'green' | 'purple';
  children: React.ReactNode;
}) {
  const colorClasses = {
    primary: 'from-primary/10 border-primary/20 hover:border-primary/40',
    red: 'from-red-500/10 border-red-500/20 hover:border-red-500/40',
    blue: 'from-blue-500/10 border-blue-500/20 hover:border-blue-500/40',
    amber: 'from-amber-500/10 border-amber-500/20 hover:border-amber-500/40',
    green: 'from-green-500/10 border-green-500/20 hover:border-green-500/40',
    purple: 'from-purple-500/10 border-purple-500/20 hover:border-purple-500/40',
  };

  const iconColorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  return (
    <div className={cn(
      "bg-gradient-to-br via-card/80 to-card border rounded-xl p-5 transition-all duration-200 hover:shadow-lg",
      colorClasses[color]
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2.5 rounded-xl border", iconColorClasses[color])}>
          {icon}
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ControlsPage() {
  const { connectionState } = useDevice();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'reboot' | 'reboot-recovery' | 'reboot-bootloader';
    title: string;
    message: string;
  } | null>(null);
  const [inputText, setInputText] = useState('');
  const [brightness, setBrightness] = useState(128);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2000);
  };

  const runCommand = useCallback(async (cmd: string, name: string) => {
    setLoading(name);
    setError(null);
    try {
      await shell(cmd);
      showSuccess(`${name} executed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to execute ${name}`);
    } finally {
      setLoading(null);
    }
  }, []);

  // Reboot commands
  const handleReboot = async (type: 'normal' | 'recovery' | 'bootloader') => {
    setConfirmAction(null);
    const cmd = type === 'normal' ? 'reboot' : `reboot ${type}`;
    await runCommand(cmd, `Reboot to ${type}`);
  };

  // Screen controls
  const toggleScreen = () => runCommand('input keyevent 26', 'Toggle screen');
  const unlockScreen = () => runCommand('input swipe 540 1800 540 800', 'Unlock swipe');

  // Volume controls
  const volumeUp = () => runCommand('input keyevent 24', 'Volume up');
  const volumeDown = () => runCommand('input keyevent 25', 'Volume down');
  const volumeMute = () => runCommand('input keyevent 164', 'Mute');

  // Brightness
  const setBrightnessLevel = async (level: number) => {
    setBrightness(level);
    await runCommand(`settings put system screen_brightness ${level}`, 'Set brightness');
  };

  // Toggles
  const toggleWifi = () => runCommand('svc wifi disable && svc wifi enable', 'Toggle WiFi');
  const toggleAirplane = () => runCommand('settings put global airplane_mode_on 1 && am broadcast -a android.intent.action.AIRPLANE_MODE', 'Toggle Airplane');
  const toggleStayAwake = () => runCommand('svc power stayon true', 'Stay awake on');
  const disableStayAwake = () => runCommand('svc power stayon false', 'Stay awake off');

  // Input text
  const sendText = async () => {
    if (!inputText.trim()) return;
    // Escape special characters for shell
    const escaped = inputText.replace(/(['"\\$`])/g, '\\$1').replace(/ /g, '%s');
    await runCommand(`input text "${escaped}"`, 'Send text');
    setInputText('');
  };

  // Key event
  const sendKeyEvent = (keycode: number, label: string) => {
    runCommand(`input keyevent ${keycode}`, label);
  };

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device via USB to use device controls."
            icon={<Sliders className="w-16 h-16 text-muted-foreground/30" />}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-card/30 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Device Controls</h1>
              <p className="text-xs text-muted-foreground">Remote device management</p>
            </div>
          </div>
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3"
            >
              <X className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-muted/20 scrollbar-thin scrollbar-thumb-muted-foreground/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
            {/* Power / Reboot */}
            <ControlSection title="Power" icon={<Power className="w-5 h-5" />} color="red">
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setConfirmAction({
                    type: 'reboot',
                    title: 'Reboot Device',
                    message: 'Are you sure you want to reboot the device?',
                  })}
                  disabled={loading !== null}
                  className="w-full justify-start"
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Reboot
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setConfirmAction({
                    type: 'reboot-recovery',
                    title: 'Reboot to Recovery',
                    message: 'This will reboot the device into recovery mode.',
                  })}
                  disabled={loading !== null}
                  className="w-full justify-start"
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Recovery Mode
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setConfirmAction({
                    type: 'reboot-bootloader',
                    title: 'Reboot to Bootloader',
                    message: 'This will reboot the device into bootloader/fastboot mode.',
                  })}
                  disabled={loading !== null}
                  className="w-full justify-start"
                  icon={<HardDrive className="w-4 h-4" />}
                >
                  Bootloader Mode
                </Button>
              </div>
            </ControlSection>

            {/* Screen */}
            <ControlSection title="Screen" icon={<Smartphone className="w-5 h-5" />} color="blue">
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={toggleScreen}
                  disabled={loading !== null}
                  className="w-full justify-start"
                  icon={<Power className="w-4 h-4" />}
                >
                  Toggle Screen On/Off
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={unlockScreen}
                  disabled={loading !== null}
                  className="w-full justify-start"
                  icon={<Lock className="w-4 h-4" />}
                >
                  Swipe to Unlock
                </Button>
              </div>
            </ControlSection>

            {/* Volume */}
            <ControlSection title="Volume" icon={<Volume2 className="w-5 h-5" />} color="green">
              <div className="flex gap-2">
                <button
                  onClick={volumeDown}
                  disabled={loading !== null}
                  className="flex-1 p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 transition-all hover:scale-105 disabled:opacity-50"
                >
                  <Minus className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={volumeMute}
                  disabled={loading !== null}
                  className="flex-1 p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 transition-all hover:scale-105 disabled:opacity-50"
                >
                  <VolumeX className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={volumeUp}
                  disabled={loading !== null}
                  className="flex-1 p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 transition-all hover:scale-105 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </ControlSection>

            {/* Brightness */}
            <ControlSection title="Brightness" icon={<Sun className="w-5 h-5" />} color="amber">
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={brightness}
                    onChange={(e) => setBrightnessLevel(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                    disabled={loading !== null}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Sun className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-mono font-medium bg-muted/50 px-2 py-0.5 rounded">
                    {Math.round((brightness / 255) * 100)}%
                  </span>
                  <Sun className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </ControlSection>

            {/* Toggles */}
            <ControlSection title="Connectivity" icon={<Wifi className="w-5 h-5" />} color="purple">
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={toggleWifi}
                  disabled={loading !== null}
                  className="w-full justify-start"
                  icon={<Wifi className="w-4 h-4" />}
                >
                  Toggle WiFi
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={toggleAirplane}
                  disabled={loading !== null}
                  className="w-full justify-start"
                  icon={<Plane className="w-4 h-4" />}
                >
                  Toggle Airplane Mode
                </Button>
                <div className="flex gap-2 pt-2 border-t border-border/30">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={toggleStayAwake}
                    disabled={loading !== null}
                    className="flex-1"
                  >
                    Stay Awake
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={disableStayAwake}
                    disabled={loading !== null}
                    className="flex-1"
                  >
                    Sleep
                  </Button>
                </div>
              </div>
            </ControlSection>

            {/* Text Input */}
            <ControlSection title="Text Input" icon={<Keyboard className="w-5 h-5" />} color="primary">
              <div className="space-y-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendText()}
                  placeholder="Type text to send..."
                  className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  disabled={loading !== null}
                />
                <Button
                  variant="primary"
                  size="small"
                  onClick={sendText}
                  disabled={loading !== null || !inputText.trim()}
                  className="w-full"
                  icon={<Send className="w-4 h-4" />}
                >
                  Send Text
                </Button>
              </div>
            </ControlSection>

            {/* Key Events - spans full width on larger screens */}
            <div className="md:col-span-2 lg:col-span-3">
              <ControlSection title="Hardware Keys" icon={<Grid3X3 className="w-5 h-5" />} color="primary">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {KEY_EVENTS.map((key) => {
                    const IconComponent = key.icon;
                    return (
                      <button
                        key={key.keycode}
                        onClick={() => sendKeyEvent(key.keycode, key.label)}
                        disabled={loading !== null}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200',
                          'bg-muted/30 border border-border/50',
                          'hover:bg-muted hover:border-primary/30 hover:shadow-md hover:scale-105',
                          'active:scale-95',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{key.label}</span>
                      </button>
                    );
                  })}
                </div>
              </ControlSection>
            </div>
          </div>
        </div>

        {/* Confirmation dialogs */}
        <AnimatePresence>
          {confirmAction?.type === 'reboot' && (
            <ConfirmDialog
              title={confirmAction.title}
              message={confirmAction.message}
              confirmLabel="Reboot"
              icon={<RefreshCw className="w-6 h-6" />}
              onConfirm={() => handleReboot('normal')}
              onCancel={() => setConfirmAction(null)}
            />
          )}
          {confirmAction?.type === 'reboot-recovery' && (
            <ConfirmDialog
              title={confirmAction.title}
              message={confirmAction.message}
              confirmLabel="Reboot to Recovery"
              icon={<RotateCcw className="w-6 h-6" />}
              onConfirm={() => handleReboot('recovery')}
              onCancel={() => setConfirmAction(null)}
            />
          )}
          {confirmAction?.type === 'reboot-bootloader' && (
            <ConfirmDialog
              title={confirmAction.title}
              message={confirmAction.message}
              confirmLabel="Reboot to Bootloader"
              icon={<HardDrive className="w-6 h-6" />}
              onConfirm={() => handleReboot('bootloader')}
              onCancel={() => setConfirmAction(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}

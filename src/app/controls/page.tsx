'use client';

import { useState, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import { shell } from '@/services/adb';
import { textStyles } from '@/design-system/foundations/typography';
import { cn } from '@/lib/utils';

// Key events
const KEY_EVENTS = [
  { label: 'Home', keycode: 3 },
  { label: 'Back', keycode: 4 },
  { label: 'Menu', keycode: 82 },
  { label: 'Recent', keycode: 187 },
  { label: 'Power', keycode: 26 },
  { label: 'Vol Up', keycode: 24 },
  { label: 'Vol Down', keycode: 25 },
  { label: 'Mute', keycode: 164 },
  { label: 'Play/Pause', keycode: 85 },
  { label: 'Next', keycode: 87 },
  { label: 'Prev', keycode: 88 },
  { label: 'Camera', keycode: 27 },
];

// Icons
const PowerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M15.5 4.5C17 6 18 8 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 8 3 6 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ScreenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="7" y1="15" x2="13" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8V12H6L10 16V4L6 8H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M13 7C14 8 14.5 9 14.5 10C14.5 11 14 12 13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 5C17 6.5 18 8 18 10C18 12 17 13.5 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BrightnessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.5 4.5L14 6M6 14L4.5 15.5M15.5 15.5L14 14M6 6L4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const WifiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 8C5 5 8 4 10 4C12 4 15 5 18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 11C7 9 8 8.5 10 8.5C12 8.5 13 9 15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 14C9 13 9.5 13 10 13C10.5 13 11 13 12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="16" r="1" fill="currentColor" />
  </svg>
);

const AirplaneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L10 6L3 10L3 12L10 10L10 15L8 16L8 18L10 17L12 18L12 16L10 15L10 10L17 12L17 10L10 6L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const KeyboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 8H6M9 8H11M14 8H15M5 11H6M14 11H15M8 11H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Confirmation dialog
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  variant = 'danger',
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md mx-4">
        <h3 style={{ ...textStyles.h4 }} className="text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="small" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="small" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// Control section component
function ControlSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-muted-foreground">{icon}</span>
        <h3 style={{ ...textStyles.labelSansMed }} className="text-foreground">{title}</h3>
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
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h1 style={{ ...textStyles.h4 }} className="text-foreground">
            Device Controls
          </h1>
          {success && (
            <span className="text-sm text-green-600 dark:text-green-400">{success}</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
            {/* Power / Reboot */}
            <ControlSection title="Power" icon={<PowerIcon />}>
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
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
                >
                  Bootloader Mode
                </Button>
              </div>
            </ControlSection>

            {/* Screen */}
            <ControlSection title="Screen" icon={<ScreenIcon />}>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={toggleScreen}
                  disabled={loading !== null}
                  className="w-full"
                >
                  Toggle Screen On/Off
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={unlockScreen}
                  disabled={loading !== null}
                  className="w-full"
                >
                  Swipe to Unlock
                </Button>
              </div>
            </ControlSection>

            {/* Volume */}
            <ControlSection title="Volume" icon={<VolumeIcon />}>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={volumeDown}
                  disabled={loading !== null}
                  className="flex-1"
                >
                  -
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={volumeMute}
                  disabled={loading !== null}
                  className="flex-1"
                >
                  Mute
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={volumeUp}
                  disabled={loading !== null}
                  className="flex-1"
                >
                  +
                </Button>
              </div>
            </ControlSection>

            {/* Brightness */}
            <ControlSection title="Brightness" icon={<BrightnessIcon />}>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={brightness}
                  onChange={(e) => setBrightnessLevel(Number(e.target.value))}
                  className="w-full"
                  disabled={loading !== null}
                />
                <div className="text-xs text-muted-foreground text-center">
                  {Math.round((brightness / 255) * 100)}%
                </div>
              </div>
            </ControlSection>

            {/* Toggles */}
            <ControlSection title="Toggles" icon={<WifiIcon />}>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={toggleWifi}
                  disabled={loading !== null}
                  className="w-full"
                >
                  Toggle WiFi
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={toggleAirplane}
                  disabled={loading !== null}
                  className="w-full"
                >
                  Toggle Airplane Mode
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={toggleStayAwake}
                    disabled={loading !== null}
                    className="flex-1"
                  >
                    Stay Awake On
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={disableStayAwake}
                    disabled={loading !== null}
                    className="flex-1"
                  >
                    Off
                  </Button>
                </div>
              </div>
            </ControlSection>

            {/* Text Input */}
            <ControlSection title="Input Text" icon={<KeyboardIcon />}>
              <div className="space-y-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendText()}
                  placeholder="Type text to send..."
                  className="w-full text-sm bg-background border border-border rounded px-2 py-1.5 text-foreground"
                  disabled={loading !== null}
                />
                <Button
                  variant="primary"
                  size="small"
                  onClick={sendText}
                  disabled={loading !== null || !inputText.trim()}
                  className="w-full"
                >
                  Send Text
                </Button>
              </div>
            </ControlSection>

            {/* Key Events */}
            <ControlSection title="Key Events" icon={<KeyboardIcon />}>
              <div className="grid grid-cols-3 gap-1">
                {KEY_EVENTS.map((key) => (
                  <button
                    key={key.keycode}
                    onClick={() => sendKeyEvent(key.keycode, key.label)}
                    disabled={loading !== null}
                    className={cn(
                      'text-xs px-2 py-1.5 rounded border',
                      'border-border bg-muted/50 hover:bg-muted',
                      'text-foreground transition-colors',
                      'disabled:opacity-50'
                    )}
                  >
                    {key.label}
                  </button>
                ))}
              </div>
            </ControlSection>
          </div>
        </div>

        {/* Confirmation dialogs */}
        {confirmAction?.type === 'reboot' && (
          <ConfirmDialog
            title={confirmAction.title}
            message={confirmAction.message}
            confirmLabel="Reboot"
            onConfirm={() => handleReboot('normal')}
            onCancel={() => setConfirmAction(null)}
          />
        )}
        {confirmAction?.type === 'reboot-recovery' && (
          <ConfirmDialog
            title={confirmAction.title}
            message={confirmAction.message}
            confirmLabel="Reboot to Recovery"
            onConfirm={() => handleReboot('recovery')}
            onCancel={() => setConfirmAction(null)}
          />
        )}
        {confirmAction?.type === 'reboot-bootloader' && (
          <ConfirmDialog
            title={confirmAction.title}
            message={confirmAction.message}
            confirmLabel="Reboot to Bootloader"
            onConfirm={() => handleReboot('bootloader')}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </div>
    </PageLayout>
  );
}

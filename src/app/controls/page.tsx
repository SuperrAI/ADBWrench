'use client';

import { useState, useCallback, useRef } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { shell } from '@/services/adb';
import { cn } from '@/lib/utils';

const KEY_EVENTS = [
  { label: 'HOME', keycode: 3 },
  { label: 'BACK', keycode: 4 },
  { label: 'MENU', keycode: 82 },
  { label: 'RECENT', keycode: 187 },
  { label: 'PLAY', keycode: 85 },
  { label: 'PREV', keycode: 88 },
  { label: 'NEXT', keycode: 87 },
  { label: 'CAM', keycode: 27 },
];

export default function ControlsPage() {
  const { connectionState } = useDevice();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [brightness, setBrightness] = useState(128);
  const [volume, setVolume] = useState(7); // 0-15 range
  const brightnessTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showResult = (type: 'ok' | 'error', msg: string) => {
    setResult({ type, msg });
    setTimeout(() => setResult(null), 2000);
  };

  const runCommand = useCallback(async (cmd: string, name: string) => {
    setLoading(name);
    try {
      await shell(cmd);
      showResult('ok', `${name} OK`);
    } catch (err) {
      showResult('error', `${name} FAILED`);
    } finally {
      setLoading(null);
    }
  }, []);

  const handleReboot = async (type: 'normal' | 'recovery' | 'bootloader') => {
    setConfirmAction(null);
    const cmd = type === 'normal' ? 'reboot' : `reboot ${type}`;
    await runCommand(cmd, `REBOOT ${type.toUpperCase()}`);
  };

  const toggleScreen = () => runCommand('input keyevent 26', 'TOGGLE SCREEN');
  const unlockScreen = () => runCommand('input swipe 540 1800 540 800', 'UNLOCK');
  const volumeUp = () => {
    setVolume(v => Math.min(15, v + 1));
    runCommand('input keyevent 24', 'VOL UP');
  };
  const volumeDown = () => {
    setVolume(v => Math.max(0, v - 1));
    runCommand('input keyevent 25', 'VOL DOWN');
  };
  const volumeMute = () => {
    setVolume(0);
    runCommand('input keyevent 164', 'MUTE');
  };

  const handleBrightnessChange = (level: number) => {
    // Update local state immediately for smooth UI
    setBrightness(level);

    // Debounce the actual command to the device
    if (brightnessTimeoutRef.current) {
      clearTimeout(brightnessTimeoutRef.current);
    }
    brightnessTimeoutRef.current = setTimeout(async () => {
      try {
        await shell(`settings put system screen_brightness ${level}`);
      } catch {
        // Silently fail for brightness
      }
    }, 100);
  };

  const toggleWifi = () => runCommand('svc wifi disable && svc wifi enable', 'WIFI');
  const toggleBluetooth = () => runCommand('svc bluetooth disable && svc bluetooth enable', 'BLUETOOTH');
  const toggleAirplane = () => runCommand('settings put global airplane_mode_on 1 && am broadcast -a android.intent.action.AIRPLANE_MODE', 'AIRPLANE');
  const toggleStayAwake = () => runCommand('svc power stayon true', 'STAY AWAKE ON');
  const disableStayAwake = () => runCommand('svc power stayon false', 'STAY AWAKE OFF');

  const sendText = async () => {
    if (!inputText.trim()) return;
    const escaped = inputText.replace(/(['"\\$`])/g, '\\$1').replace(/ /g, '%s');
    await runCommand(`input text "${escaped}"`, 'SEND TEXT');
    setInputText('');
  };

  const sendKeyEvent = (keycode: number, label: string) => {
    runCommand(`input keyevent ${keycode}`, label);
  };

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <pre className="text-muted-foreground mb-4 text-xs">
{`  ______
 |  []  |
 | CTRL |
 |______|`}
            </pre>
            <div className="text-sm mb-2">CONTROLS DISCONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect a device to use controls.
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col font-mono overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm uppercase tracking-wider">CONTROLS // REMOTE</h1>
              <div className="text-xs text-muted-foreground mt-1">
                DEVICE MANAGEMENT
              </div>
            </div>
            {result && (
              <div className={cn(
                "text-xs px-2 py-1 border",
                result.type === 'ok' ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
              )}>
                {result.msg}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Power Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">POWER</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Reboot</span>
                  <button
                    onClick={() => setConfirmAction('reboot')}
                    className="px-3 py-1 border border-border hover:bg-muted"
                  >
                    [ REBOOT ]
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Recovery Mode</span>
                  <button
                    onClick={() => setConfirmAction('recovery')}
                    className="px-3 py-1 border border-border hover:bg-muted"
                  >
                    [ RECOVERY ]
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bootloader</span>
                  <button
                    onClick={() => setConfirmAction('bootloader')}
                    className="px-3 py-1 border border-border hover:bg-muted"
                  >
                    [ FASTBOOT ]
                  </button>
                </div>
              </div>
            </div>

            {/* Screen Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">SCREEN</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Power</span>
                  <button
                    onClick={toggleScreen}
                    className={cn(
                      "px-3 py-1 border border-border hover:bg-muted",
                      loading === 'TOGGLE SCREEN' && "text-orange-500 border-orange-500"
                    )}
                  >
                    [ TOGGLE ]
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Unlock</span>
                  <button
                    onClick={unlockScreen}
                    className={cn(
                      "px-3 py-1 border border-border hover:bg-muted",
                      loading === 'UNLOCK' && "text-orange-500 border-orange-500"
                    )}
                  >
                    [ SWIPE ]
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Stay Awake</span>
                  <div className="flex gap-1">
                    <button
                      onClick={toggleStayAwake}
                      className={cn(
                        "px-3 py-1 border border-border hover:bg-muted",
                        loading === 'STAY AWAKE ON' && "text-orange-500 border-orange-500"
                      )}
                    >
                      [ ON ]
                    </button>
                    <button
                      onClick={disableStayAwake}
                      className={cn(
                        "px-3 py-1 border border-border hover:bg-muted",
                        loading === 'STAY AWAKE OFF' && "text-orange-500 border-orange-500"
                      )}
                    >
                      [ OFF ]
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Connectivity Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">CONNECTIVITY</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Wi-Fi</span>
                  <button
                    onClick={toggleWifi}
                    className={cn(
                      "px-3 py-1 border border-border hover:bg-muted",
                      loading === 'WIFI' && "text-orange-500 border-orange-500"
                    )}
                  >
                    [ TOGGLE ]
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bluetooth</span>
                  <button
                    onClick={toggleBluetooth}
                    className={cn(
                      "px-3 py-1 border border-border hover:bg-muted",
                      loading === 'BLUETOOTH' && "text-orange-500 border-orange-500"
                    )}
                  >
                    [ TOGGLE ]
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Airplane Mode</span>
                  <button
                    onClick={toggleAirplane}
                    className={cn(
                      "px-3 py-1 border border-border hover:bg-muted",
                      loading === 'AIRPLANE' && "text-orange-500 border-orange-500"
                    )}
                  >
                    [ TOGGLE ]
                  </button>
                </div>
              </div>
            </div>

            {/* Audio & Display Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">AUDIO & DISPLAY</div>
              <div className="space-y-4 text-xs">
                {/* Volume */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Volume</span>
                    <span className="text-orange-500 font-mono">{Math.round((volume / 15) * 100)}%</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={volumeDown}
                      disabled={volume <= 0}
                      className={cn(
                        "flex-1 px-3 py-2 border border-border hover:bg-muted disabled:opacity-50",
                        loading === 'VOL DOWN' && "text-orange-500 border-orange-500"
                      )}
                    >
                      [ - ]
                    </button>
                    <button
                      onClick={volumeMute}
                      className={cn(
                        "flex-1 px-3 py-2 border border-border hover:bg-muted",
                        loading === 'MUTE' && "text-orange-500 border-orange-500"
                      )}
                    >
                      [ MUTE ]
                    </button>
                    <button
                      onClick={volumeUp}
                      disabled={volume >= 15}
                      className={cn(
                        "flex-1 px-3 py-2 border border-border hover:bg-muted disabled:opacity-50",
                        loading === 'VOL UP' && "text-orange-500 border-orange-500"
                      )}
                    >
                      [ + ]
                    </button>
                  </div>
                </div>
                {/* Brightness */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Brightness</span>
                    <span className="text-orange-500 font-mono">{Math.max(1, Math.round((brightness / 255) * 100))}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleBrightnessChange(Math.max(3, brightness - 26))}
                      disabled={brightness <= 3}
                      className="flex-1 h-8 border border-border hover:bg-muted disabled:opacity-50"
                    >
                      -
                    </button>
                    {[...Array(10)].map((_, i) => {
                      const blockThreshold = ((i + 1) / 10) * 255;
                      const isFilled = brightness >= blockThreshold;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 h-8 border transition-colors cursor-pointer",
                            isFilled
                              ? "bg-orange-500 border-orange-500"
                              : "bg-muted/30 border-border hover:border-orange-500/50"
                          )}
                          onClick={() => handleBrightnessChange(Math.max(3, Math.round(((i + 1) / 10) * 255)))}
                        />
                      );
                    })}
                    <button
                      onClick={() => handleBrightnessChange(Math.min(255, brightness + 26))}
                      disabled={brightness >= 255}
                      className="flex-1 h-8 border border-border hover:bg-muted disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Input Section */}
            <div className="border border-border p-4 flex flex-col">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">TEXT INPUT</div>
              <div className="flex-1 flex flex-col text-xs">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendText())}
                  placeholder="Type text to send to device..."
                  className="terminal-input flex-1 min-h-[80px] w-full bg-transparent border border-border px-2 py-2 outline-none focus:border-orange-500 resize-none"
                />
                <button
                  onClick={sendText}
                  disabled={!inputText.trim()}
                  className={cn(
                    "mt-2 w-full px-3 py-2 border border-orange-500 text-orange-500 hover:bg-orange-500/10 disabled:opacity-50",
                    loading === 'SEND TEXT' && "bg-orange-500/20"
                  )}
                >
                  [ SEND ]
                </button>
              </div>
            </div>

            {/* Hardware Keys Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">HARDWARE KEYS</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {KEY_EVENTS.map((key) => (
                  <button
                    key={key.keycode}
                    onClick={() => sendKeyEvent(key.keycode, key.label)}
                    className={cn(
                      "px-3 py-2 border border-border hover:bg-muted hover:border-orange-500 text-center",
                      loading === key.label && "text-orange-500 border-orange-500"
                    )}
                  >
                    {key.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="border border-border bg-background p-4 w-80">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">CONFIRM</div>
              <div className="text-sm mb-4">
                {confirmAction === 'reboot' && 'Reboot device?'}
                {confirmAction === 'recovery' && 'Reboot to recovery mode?'}
                {confirmAction === 'bootloader' && 'Reboot to bootloader?'}
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-3 py-1 border border-border hover:bg-muted"
                >
                  [ CANCEL ]
                </button>
                <button
                  onClick={() => handleReboot(confirmAction as 'normal' | 'recovery' | 'bootloader')}
                  className="px-3 py-1 border border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  [ CONFIRM ]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-3 flex-shrink-0 bg-background flex items-center min-h-[36px]">
          <span className="text-[10px] text-muted-foreground">
            SEND COMMANDS | CONTROL DEVICE REMOTELY
          </span>
        </div>
      </div>
    </PageLayout>
  );
}

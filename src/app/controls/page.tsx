'use client';

import { useState, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { shell } from '@/services/adb';
import { cn } from '@/lib/utils';

const KEY_EVENTS = [
  { label: 'HOME', keycode: 3 },
  { label: 'BACK', keycode: 4 },
  { label: 'MENU', keycode: 82 },
  { label: 'RECENT', keycode: 187 },
  { label: 'POWER', keycode: 26 },
  { label: 'VOL+', keycode: 24 },
  { label: 'VOL-', keycode: 25 },
  { label: 'MUTE', keycode: 164 },
  { label: 'PLAY', keycode: 85 },
  { label: 'NEXT', keycode: 87 },
  { label: 'PREV', keycode: 88 },
  { label: 'CAM', keycode: 27 },
];

export default function ControlsPage() {
  const { connectionState } = useDevice();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [brightness, setBrightness] = useState(128);

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
  const volumeUp = () => runCommand('input keyevent 24', 'VOL UP');
  const volumeDown = () => runCommand('input keyevent 25', 'VOL DOWN');
  const volumeMute = () => runCommand('input keyevent 164', 'MUTE');

  const setBrightnessLevel = async (level: number) => {
    setBrightness(level);
    await runCommand(`settings put system screen_brightness ${level}`, 'BRIGHTNESS');
  };

  const toggleWifi = () => runCommand('svc wifi disable && svc wifi enable', 'WIFI');
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">

            {/* Power Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">POWER</div>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setConfirmAction('reboot')}
                  disabled={loading !== null}
                  className="w-full px-3 py-2 border border-border hover:bg-muted text-left disabled:opacity-50"
                >
                  [ REBOOT ]
                </button>
                <button
                  onClick={() => setConfirmAction('recovery')}
                  disabled={loading !== null}
                  className="w-full px-3 py-2 border border-border hover:bg-muted text-left disabled:opacity-50"
                >
                  [ RECOVERY MODE ]
                </button>
                <button
                  onClick={() => setConfirmAction('bootloader')}
                  disabled={loading !== null}
                  className="w-full px-3 py-2 border border-border hover:bg-muted text-left disabled:opacity-50"
                >
                  [ BOOTLOADER ]
                </button>
              </div>
            </div>

            {/* Screen Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">SCREEN</div>
              <div className="space-y-2 text-xs">
                <button
                  onClick={toggleScreen}
                  disabled={loading !== null}
                  className="w-full px-3 py-2 border border-border hover:bg-muted text-left disabled:opacity-50"
                >
                  [ TOGGLE ON/OFF ]
                </button>
                <button
                  onClick={unlockScreen}
                  disabled={loading !== null}
                  className="w-full px-3 py-2 border border-border hover:bg-muted text-left disabled:opacity-50"
                >
                  [ SWIPE UNLOCK ]
                </button>
              </div>
            </div>

            {/* Volume Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">VOLUME</div>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={volumeDown}
                  disabled={loading !== null}
                  className="flex-1 px-3 py-2 border border-border hover:bg-muted disabled:opacity-50"
                >
                  [ - ]
                </button>
                <button
                  onClick={volumeMute}
                  disabled={loading !== null}
                  className="flex-1 px-3 py-2 border border-border hover:bg-muted disabled:opacity-50"
                >
                  [ X ]
                </button>
                <button
                  onClick={volumeUp}
                  disabled={loading !== null}
                  className="flex-1 px-3 py-2 border border-border hover:bg-muted disabled:opacity-50"
                >
                  [ + ]
                </button>
              </div>
            </div>

            {/* Brightness Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
                BRIGHTNESS: {Math.round((brightness / 255) * 100)}%
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={brightness}
                onChange={(e) => setBrightnessLevel(Number(e.target.value))}
                disabled={loading !== null}
                className="w-full h-2 bg-muted accent-orange-500 cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Connectivity Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">CONNECTIVITY</div>
              <div className="space-y-2 text-xs">
                <button
                  onClick={toggleWifi}
                  disabled={loading !== null}
                  className="w-full px-3 py-2 border border-border hover:bg-muted text-left disabled:opacity-50"
                >
                  [ TOGGLE WIFI ]
                </button>
                <button
                  onClick={toggleAirplane}
                  disabled={loading !== null}
                  className="w-full px-3 py-2 border border-border hover:bg-muted text-left disabled:opacity-50"
                >
                  [ AIRPLANE MODE ]
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={toggleStayAwake}
                    disabled={loading !== null}
                    className="flex-1 px-3 py-2 border border-border hover:bg-muted disabled:opacity-50"
                  >
                    AWAKE
                  </button>
                  <button
                    onClick={disableStayAwake}
                    disabled={loading !== null}
                    className="flex-1 px-3 py-2 border border-border hover:bg-muted disabled:opacity-50"
                  >
                    SLEEP
                  </button>
                </div>
              </div>
            </div>

            {/* Text Input Section */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">TEXT INPUT</div>
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendText()}
                  placeholder="Type text..."
                  disabled={loading !== null}
                  className="w-full bg-transparent border border-border px-2 py-1 outline-none focus:border-orange-500 disabled:opacity-50"
                />
                <button
                  onClick={sendText}
                  disabled={loading !== null || !inputText.trim()}
                  className="w-full px-3 py-2 border border-orange-500 text-orange-500 hover:bg-orange-500/10 disabled:opacity-50"
                >
                  [ SEND ]
                </button>
              </div>
            </div>

            {/* Hardware Keys Section - Full Width */}
            <div className="border border-border p-4 md:col-span-2 lg:col-span-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">HARDWARE KEYS</div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-xs">
                {KEY_EVENTS.map((key) => (
                  <button
                    key={key.keycode}
                    onClick={() => sendKeyEvent(key.keycode, key.label)}
                    disabled={loading !== null}
                    className="px-3 py-2 border border-border hover:bg-muted hover:border-orange-500 disabled:opacity-50 text-center"
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
        <div className="border-t border-border p-2 flex-shrink-0 bg-zinc-950">
          <div className="text-[10px] text-zinc-600">
            SEND COMMANDS | CONTROL DEVICE REMOTELY
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

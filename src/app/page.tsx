'use client';

import { useState, useEffect } from 'react';
import { useDevice } from '@/context/device-context';
import Link from 'next/link';
import { DeviceSelector } from '@/components/ui/DeviceSelector';
import {
  Terminal,
  FileText,
  FolderOpen,
  Package,
  Camera,
  Activity,
  Settings,
  Sliders,
  Bug,
  Github,
  Sun,
  Moon,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useTheme } from '@/context/theme-context';

const TOOLS = [
  { icon: Terminal, label: 'Shell' },
  { icon: FileText, label: 'Logcat' },
  { icon: FolderOpen, label: 'Files' },
  { icon: Package, label: 'Apps' },
  { icon: Camera, label: 'Screen' },
  { icon: Activity, label: 'Perf' },
  { icon: Sliders, label: 'Control' },
  { icon: Bug, label: 'Debug' },
  { icon: Settings, label: 'Config' },
];

export default function Home() {
  const { connectionState, isWebUsbSupported, deviceInfo, dismissConnectionLost } = useDevice();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // On homepage, auto-dismiss connection-lost state - user hasn't started connecting yet
  useEffect(() => {
    if (connectionState === 'connection-lost') {
      dismissConnectionLost();
    }
  }, [connectionState, dismissConnectionLost]);

  // Render the connection card content
  const renderConnectionContent = () => {
    // Don't show unsupported message until mounted (prevents SSR flash)
    if (!mounted) {
      return (
        <button
          disabled
          className="w-full py-3 bg-foreground text-background text-sm opacity-50"
        >
          Connect Device
        </button>
      );
    }

    if (!isWebUsbSupported) {
      return (
        <div className="text-center py-2">
          <div className="text-red-500 text-xs mb-1">[!] Chrome or Edge required</div>
          <p className="text-[10px] text-muted-foreground">WebUSB not supported</p>
        </div>
      );
    }

    if (connectionState === 'connected' && deviceInfo) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Connected</span>
            <span className="text-green-500">● {deviceInfo.model}</span>
          </div>
          <Link
            href="/dashboard"
            className="block w-full py-3 text-center bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm"
          >
            Open Dashboard →
          </Link>
        </div>
      );
    }

    return <DeviceSelector />;
  };

  return (
    <main className="min-h-screen bg-background font-mono">
      {/* Hero */}
      <section className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 mb-3">
                <span className="text-orange-500 font-bold text-4xl">&gt;_</span>
                <span className="text-4xl tracking-tight">ADB Wrench</span>
              </div>
              <p className="text-base text-muted-foreground">
                Browser-based Android debugging tool
              </p>
            </div>

            {/* Connect Card */}
            <div className="border border-border bg-card">
              <div className="p-6">
                {renderConnectionContent()}
              </div>
              <div className="border-t border-border px-4 py-3 text-center bg-muted/30">
                <span className="text-xs text-muted-foreground">
                  No install · No drivers · No account
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="pb-10 flex justify-center">
          <div
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            role="button"
            aria-label="Scroll down"
            className="group cursor-pointer p-1.5 border border-transparent hover:bg-orange-500 hover:border-orange-500 transition-colors"
          >
            <ChevronDown className="w-5 h-5 animate-bounce text-orange-500 group-hover:animate-none group-hover:text-white" />
          </div>
        </div>
      </section>

      {/* Value Prop + Terminal Preview */}
      <section className="border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-medium mb-4">
              Full ADB access. <span className="text-muted-foreground">Zero setup.</span>
            </h2>
            <p className="text-muted-foreground">
              Connect via USB, start debugging.<br />
              Everything runs locally in your browser.
            </p>
          </div>

          {/* Terminal Preview */}
          <div className="border border-border bg-background">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-border" />
                  <div className="w-2.5 h-2.5 rounded-full bg-border" />
                  <div className="w-2.5 h-2.5 rounded-full bg-border" />
                </div>
                <span className="text-xs text-muted-foreground">shell</span>
              </div>
              <span className="text-xs text-green-500">● pixel_8</span>
            </div>
            <div className="p-5 text-sm space-y-3">
              <div className="flex gap-3">
                <span className="text-orange-500">$</span>
                <span>pm list packages -3 | wc -l</span>
              </div>
              <div className="text-muted-foreground pl-5">47</div>
              <div className="flex gap-3 pt-1">
                <span className="text-orange-500">$</span>
                <span>dumpsys battery | grep level</span>
              </div>
              <div className="text-muted-foreground pl-5">level: 87</div>
              <div className="flex gap-3 pt-1">
                <span className="text-orange-500">$</span>
                <span className="border-r border-orange-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 text-orange-500 text-xs uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4" />
                AI Assistant
              </div>
              <h3 className="text-xl font-medium mb-3">
                Don&apos;t know the command?
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                Describe what you want in plain English.
                AI generates the command and explains it.
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>· Bring your own API key</div>
                <div>· OpenAI, Anthropic, or OpenRouter</div>
                <div>· Keys stay in your browser</div>
              </div>
            </div>
            <div className="border border-border bg-background">
              <div className="border-b border-border px-4 py-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs">ai assist</span>
              </div>
              <div className="p-4 space-y-4 text-sm">
                <div className="flex gap-3">
                  <span className="text-muted-foreground text-xs">you</span>
                  <span className="text-muted-foreground">list google apps</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-orange-500 text-xs">ai</span>
                  <div>
                    <code className="block bg-muted px-2 py-1.5 border border-border text-xs mb-2">
                      pm list packages | grep google
                    </code>
                    <span className="text-xs text-muted-foreground">
                      Lists packages with &quot;google&quot; in name.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools + CTA */}
      <section className="border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="grid grid-cols-3 gap-px bg-border border border-border mb-12">
            {TOOLS.map(({ icon: Icon, label }) => (
              <div key={label} className="py-6 bg-background text-center">
                <Icon className="w-5 h-5 text-orange-500 mx-auto mb-2" strokeWidth={1.5} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-5">
              Open source · Free forever · No tracking
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-3 bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-orange-500">&gt;_</span>
              <span>ADB Wrench</span>
              <span className="text-muted-foreground/40">By</span>
              <a href="https://superr.ai" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
                Superr
              </a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 border border-border hover:bg-muted transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              </button>
              <a
                href="https://github.com/superrAI/adbwrench"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 border border-border hover:bg-muted transition-colors"
              >
                <Github className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

# SuperrWrench

A browser-based Android device debugging and management PWA built on WebUSB. Enables IT service personnel to perform device diagnostics, maintenance, and debugging without installing desktop software.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Device Connection** | USB discovery, ADB handshake, RSA key management, multi-device support | Done |
| **Device Dashboard** | Device info, build details, hardware specs, storage, battery status | Done |
| **Shell Interface** | Interactive terminal with command history and preset commands | Done |
| **Logcat Viewer** | Real-time log streaming with filtering, search, and export | Done |
| **Screenshot/Recording** | Capture screenshots and screen recordings | Done |
| **App Manager** | List, install, uninstall, and manage applications | Done |
| **File Browser** | Browse, upload, and download files from device | Done |
| **Device Controls** | Reboot options, screen controls, volume, brightness, Wi-Fi toggle | Done |
| **Performance Monitor** | Real-time CPU/memory graphs, process monitoring | Done |
| **Bugreport Generator** | Generate and download Android bugreports | Done |
| **Settings Editor** | View and modify system/secure/global settings | Done |
| **PWA Support** | Installable, offline-capable, responsive design | Done |

## Tech Stack

- **Framework:** Next.js 14 (App Router, React Server Components)
- **Language:** TypeScript (strict mode)
- **UI:** Shadcn UI + Radix UI + Tailwind CSS
- **ADB:** WebUSB API with @yume-chan/adb
- **Data:** Apollo Client (GraphQL)
- **PWA:** next-pwa with service worker

## Browser Support

Requires WebUSB API - Chromium-based browsers only:
- Chrome 89+
- Edge 89+

## Getting Started

### Prerequisites

- Node.js 18+
- Android device with USB debugging enabled

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome/Edge.

### Connecting a Device

1. Enable USB debugging on your Android device
2. Connect via USB cable
3. Click "Connect Device" and select your device
4. Accept the USB debugging prompt on your device

## Development

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── apps/           # Application Manager
│   ├── bugreport/      # Bugreport Generator
│   ├── controls/       # Device Controls
│   ├── dashboard/      # Device Information
│   ├── files/          # File Browser
│   ├── logcat/         # Logcat Viewer
│   ├── performance/    # Performance Monitor
│   ├── screenshot/     # Screenshot & Recording
│   ├── settings/       # Settings Editor
│   └── shell/          # Shell Interface
├── components/          # React components
│   ├── providers/      # Context providers
│   └── ui/             # Shadcn UI components
├── context/            # React contexts (device, theme)
├── design-system/      # Reusable design system
│   ├── foundations/    # Design tokens
│   ├── components/     # Base components
│   └── patterns/       # Layout patterns
├── lib/                # Utilities and ADB helpers
└── styles/             # Global CSS
```

## ADB Commands Reference

```bash
# Device Info
getprop ro.product.model
getprop ro.build.fingerprint

# Package Management
pm list packages
pm install /path/to/app.apk
pm uninstall com.package.name

# Screen Capture
screencap -p /sdcard/screen.png
screenrecord /sdcard/video.mp4

# System Controls
reboot
reboot recovery
reboot bootloader

# Logs
logcat -d
logcat -c
```

## Security

- RSA keys stored securely in IndexedDB
- No data transmitted to external servers
- No analytics or telemetry
- All operations local to browser + device

## Out of Scope (v1.0)

- Screen mirroring / remote control
- Wireless ADB (requires server component)
- Multi-user collaboration
- Device fleet management
- iOS support
- Firefox/Safari support (no WebUSB)

## License

Proprietary - Superr

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines.

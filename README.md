# ADBWrench

**ADB in your browser. No install. No drivers. Just plug in and debug.**

ADBWrench is a browser-based Android debugging tool built on WebUSB. It implements the ADB protocol entirely in JavaScript, giving you full device access without installing Android SDK, platform-tools, or USB drivers.

## Why This Exists

Every Android developer knows the drill: install Android Studio (or at least platform-tools), wrestle with USB drivers on Windows, hope `adb devices` actually shows your device. For quick debugging tasks, that's a lot of friction.

ADBWrench removes all of it. Open a URL, grant USB permission, and you're connected.

## What You Can Do

### Shell
Full interactive ADB shell in your browser. Command history persists across sessions. Supports all standard shell commands - `pm`, `am`, `dumpsys`, `getprop`, you name it. Output streams in real-time with proper stdout/stderr separation.

### Logcat
Real-time log streaming with priority filtering (Verbose → Fatal). Filter by tag, search through logs, pause/resume stream. No more `adb logcat | grep` chains - just type and filter.

### File Browser
Navigate the device filesystem visually. Drag-and-drop file uploads, click-to-download pulls. Create directories, delete files, view permissions. Handles large files with chunked transfers and progress indication.

### App Manager
See all installed packages (system + user). Install APKs by drag-and-drop. Uninstall, force-stop, clear data, enable/disable packages. View package details including version, install location, and permissions.

### Screenshot & Screen Record
One-click screen capture, downloads as PNG. Screen recording saves as MP4. Useful for bug reports, documentation, or grabbing assets off a test device.

### Performance Monitor
Live graphs for CPU and memory usage. View running processes sorted by resource consumption. Identify performance bottlenecks without connecting Android Studio's profiler.

### Device Controls
Reboot (normal, recovery, bootloader), adjust volume and brightness, toggle screen on/off. Quick actions without hunting through shell commands.

### Settings Editor
Browse and modify `system`, `secure`, and `global` settings namespaces. Search settings by name. See current values and edit directly. Useful for toggling developer options or testing setting-dependent behavior.

### Bugreport
Generate full Android bugreports and download as ZIP. Same output as `adb bugreport` - includes system logs, dumpsys output, and device state. Ready to attach to bug trackers.

---

Everything runs client-side. Your device data never touches a server.

## Who It's For

- **Android developers** who want quick device access without full SDK setup
- **QA engineers** debugging issues on physical devices
- **IT support** managing Android device fleets
- **Hobbyists** exploring their devices without command line
- **Anyone** who's ever typed `adb devices` and seen nothing

## Quick Start

1. Open ADBWrench in Chrome/Edge
2. Click "Connect Device"
3. Select your Android device from the USB prompt
4. Approve the debugging prompt on your device
5. Done

No install. No PATH configuration. No driver hunting.

## Technical Details

- Built with Next.js 14, TypeScript, and [@yume-chan/adb](https://github.com/yume-chan/ya-webadb)
- RSA keys stored in IndexedDB (persistent across sessions)
- PWA with offline support - install it locally
- Chunked file transfers for large files
- Works on Chrome, Edge, and other Chromium browsers (WebUSB requirement)

## Limitations

Being honest about what this isn't:

- **No wireless ADB** - WebUSB requires physical USB connection
- **No screen mirroring** - scrcpy still wins for that
- **Chromium only** - Firefox and Safari don't support WebUSB
- **Single device** - no fleet management (yet)

## Development

```bash
npm install
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

## The Stack

```
WebUSB API → ADB Protocol (TypeScript) → React UI
```

All ADB communication happens through the browser's WebUSB API. The [@yume-chan/adb](https://github.com/yume-chan/ya-webadb) library handles protocol implementation. We built the UI and feature set on top.

## Acknowledgments

This project is built on the excellent [ya-webadb](https://github.com/yume-chan/ya-webadb) library by [@yume-chan](https://github.com/yume-chan). The following packages make browser-based ADB communication possible:

- **[@yume-chan/adb](https://www.npmjs.com/package/@yume-chan/adb)** - Core ADB protocol implementation
- **[@yume-chan/adb-credential-web](https://www.npmjs.com/package/@yume-chan/adb-credential-web)** - RSA key management for web browsers
- **[@yume-chan/adb-daemon-webusb](https://www.npmjs.com/package/@yume-chan/adb-daemon-webusb)** - WebUSB transport layer

Without this library, ADBWrench would not exist. Thank you for making ADB accessible in the browser!

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](./LICENSE). You are free to use, modify, and distribute this software for any noncommercial purpose. Commercial use is not permitted without separate authorization.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

For development setup and code style guidelines, see [CLAUDE.md](./CLAUDE.md).

---

Built by [Superr](https://x.com/superr_ai)

*Tested on Android 8.0+ devices. USB debugging must be enabled in Developer Options.*

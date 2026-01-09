# TICKETS.md

Implementation tickets for SuperrWrench, ordered by milestone and priority.

---

## Milestone 1: Core

### ✅ Ticket 1: F12 - PWA Infrastructure

**Priority:** P0 (Critical)
**Milestone:** M1

**Description:**
Progressive Web App setup for installability and offline support.

**Requirements:**

- F12.1: Web app manifest with:
  - App name: "SuperrWrench"
  - Icons (multiple sizes)
  - Theme color
  - Display: standalone
- F12.2: Service worker for offline caching
- F12.3: Install prompt handling
- F12.4: Update notification when new version available
- F12.5: Offline indicator in UI
- F12.6: All static assets cached for offline use
- F12.7: Responsive design (tablet and desktop)

**Acceptance Criteria:**
- App installable on Chrome/Edge
- App functions fully offline after first load
- Update flow is seamless

---

### ✅ Ticket 2: F13 - UI/UX Framework

**Priority:** P0 (Critical)
**Milestone:** M1

**Description:**
Core user interface structure and design system.

**Requirements:**

- F13.1: Navigation sidebar with feature modules
- F13.2: Top bar with:
  - Connection status
  - Connected device info (model, serial)
  - Disconnect button
- F13.3: Dark/light theme toggle (persist preference)
- F13.4: Loading states for all async operations
- F13.5: Toast notifications for success/error feedback
- F13.6: Confirmation dialogs for destructive actions
- F13.7: Keyboard shortcuts for common actions
- F13.8: Empty states with helpful guidance
- F13.9: Error boundary with recovery options
- F13.10: Responsive layout for various screen sizes

**Acceptance Criteria:**
- UI is intuitive for non-technical users
- Visual feedback for all actions
- Consistent design language throughout

---

### Ticket 3: F1 - Device Connection Manager

**Priority:** P0 (Critical)
**Milestone:** M1

**Description:**
Handles USB device discovery, ADB handshake, RSA key generation/storage, and connection lifecycle management.

**Requirements:**

- F1.1: USB device picker integration via WebUSB `requestDevice()`
- F1.2: ADB protocol handshake implementation (CNXN, AUTH messages)
- F1.3: RSA keypair generation and persistent storage in IndexedDB
- F1.4: Connection state management (disconnected, connecting, unauthorized, connected)
- F1.5: Auto-reconnect on USB re-plug (using saved device serial)
- F1.6: Multi-device support with device switcher UI
- F1.7: Connection status indicator with device serial display
- F1.8: Graceful handling of "unauthorized" state with user instructions

**Acceptance Criteria:**
- User can connect to a device within 3 clicks
- Connection persists across page refreshes (for authorized devices)
- Clear error messaging for common failure modes

---

### Ticket 4: F2 - Device Information Dashboard

**Priority:** P0 (Critical)
**Milestone:** M1

**Description:**
Displays comprehensive device information retrieved via ADB shell commands and getprop.

**Requirements:**

- F2.1: Device identity panel
  - Model name (`ro.product.model`)
  - Manufacturer (`ro.product.manufacturer`)
  - Device codename (`ro.product.device`)
  - Serial number
- F2.2: Build information panel
  - Android version (`ro.build.version.release`)
  - SDK level (`ro.build.version.sdk`)
  - Build fingerprint (`ro.build.fingerprint`)
  - Build date (`ro.build.date`)
  - Security patch level (`ro.build.version.security_patch`)
- F2.3: Hardware information panel
  - CPU architecture (`ro.product.cpu.abi`)
  - Hardware platform (`ro.hardware`)
  - Total RAM (parsed from `/proc/meminfo`)
  - Display resolution (`wm size`)
  - Display density (`wm density`)
- F2.4: Storage information panel
  - Internal storage usage (`df /data`)
  - Available space calculation
- F2.5: Battery status panel
  - Battery level (`dumpsys battery`)
  - Charging state
  - Battery health
- F2.6: One-click "Copy All Info" to clipboard
- F2.7: Auto-refresh toggle (configurable interval)

**Acceptance Criteria:**
- All information loads within 3 seconds of connection
- Data is presented in scannable, organized layout
- Copy function produces clean, formatted text

---

### Ticket 5: F3 - Shell Command Interface

**Priority:** P0 (Critical)
**Milestone:** M1

**Description:**
Interactive shell terminal for executing arbitrary ADB shell commands with output display.

**Requirements:**

- F3.1: Command input field with execute button and Enter key support
- F3.2: Command output display with monospace formatting
- F3.3: Command history (up/down arrow navigation, persisted in localStorage)
- F3.4: Preset command quick-buttons for common operations:
  - `getprop`
  - `pm list packages`
  - `dumpsys battery`
  - `df -h`
  - `top -n 1`
  - `ps -A`
- F3.5: Output copy-to-clipboard button
- F3.6: Clear output button
- F3.7: Command timeout handling (configurable, default 30s)
- F3.8: Support for commands with continuous output (with stop button)

**Acceptance Criteria:**
- Commands execute and display output correctly
- History persists across sessions
- UI remains responsive during long-running commands

---

## Milestone 2: Essential Tools

### Ticket 6: F4 - Logcat Viewer

**Priority:** P1 (High)
**Milestone:** M2

**Description:**
Real-time logcat streaming with filtering and search capabilities.

**Requirements:**

- F4.1: Start/stop logcat streaming
- F4.2: Log level filter (Verbose, Debug, Info, Warn, Error, Fatal)
- F4.3: Tag filter (include/exclude specific tags)
- F4.4: Text search within logs (highlight matches)
- F4.5: Auto-scroll toggle (scroll lock)
- F4.6: Buffer selection (main, system, crash, events)
- F4.7: Clear logs button
- F4.8: Export logs to file (.txt download)
- F4.9: Color-coded log levels
- F4.10: Maximum buffer size with automatic pruning (configurable, default 10,000 lines)
- F4.11: Timestamp display toggle

**Acceptance Criteria:**
- Logs stream in real-time without UI lag
- Filtering is responsive (< 100ms)
- Export produces valid, complete log file

---

### Ticket 7: F5 - Screenshot & Screen Recording

**Priority:** P1 (High)
**Milestone:** M2

**Description:**
Capture device screen as image or video for documentation and debugging.

**Requirements:**

- F5.1: One-click screenshot capture (`screencap -p`)
- F5.2: Screenshot preview display
- F5.3: Screenshot download as PNG
- F5.4: Screenshot copy to clipboard
- F5.5: Screen recording start/stop (`screenrecord`)
- F5.6: Recording duration limit setting (default 180s, max per Android)
- F5.7: Recording download as MP4
- F5.8: Recording status indicator with elapsed time
- F5.9: Screenshot history gallery (last 10, stored in memory)

**Acceptance Criteria:**
- Screenshot captured and displayed within 2 seconds
- Recording starts/stops reliably
- Downloaded files are valid and playable

---

### Ticket 8: F6 - Application Manager

**Priority:** P1 (High)
**Milestone:** M2

**Description:**
List, inspect, install, and uninstall applications on the device.

**Requirements:**

- F6.1: List installed packages (system/user filter)
- F6.2: Package search/filter
- F6.3: Package details view:
  - Package name
  - Version name/code
  - Install location
  - Permissions
  - Enabled/disabled state
- F6.4: Uninstall package (with confirmation)
- F6.5: Force stop application
- F6.6: Clear app data (with confirmation)
- F6.7: Disable/enable package
- F6.8: APK installation via drag-and-drop or file picker
- F6.9: Installation progress indicator
- F6.10: Launch application (via `am start`)
- F6.11: Extract APK from device (pull and download)

**Acceptance Criteria:**
- Package list loads within 5 seconds
- APK installation works for files up to 500MB
- All actions provide clear success/failure feedback

---

### Ticket 9: F8 - Device Controls

**Priority:** P1 (High)
**Milestone:** M2

**Description:**
Quick actions for common device operations.

**Requirements:**

- F8.1: Reboot options:
  - Normal reboot
  - Reboot to recovery
  - Reboot to bootloader/fastboot
- F8.2: All reboot actions require confirmation dialog
- F8.3: Screen controls:
  - Screen on/off (`input keyevent 26`)
  - Unlock screen (swipe gesture via `input swipe`)
- F8.4: Volume controls (up/down/mute)
- F8.5: Brightness control slider
- F8.6: Wi-Fi toggle
- F8.7: Airplane mode toggle
- F8.8: Keep screen awake toggle (`svc power stayon`)
- F8.9: Input text to device (`input text`)
- F8.10: Key event sender (home, back, recent apps, etc.)

**Acceptance Criteria:**
- All controls execute within 1 second
- Confirmation dialogs prevent accidental reboots
- Current state reflected in UI where applicable

---

## Milestone 3: Advanced

### Ticket 10: F7 - File Browser

**Priority:** P2 (Medium)
**Milestone:** M3

**Description:**
Browse, upload, and download files from the device filesystem.

**Requirements:**

- F7.1: Directory listing with navigation (`ls -la`)
- F7.2: Common location shortcuts:
  - `/sdcard`
  - `/sdcard/Download`
  - `/sdcard/DCIM`
  - `/data/local/tmp`
- F7.3: File download (pull to local machine)
- F7.4: File upload (push to device) via drag-and-drop or picker
- F7.5: Create new directory
- F7.6: Delete file/directory (with confirmation)
- F7.7: File details (size, permissions, modified date)
- F7.8: Path breadcrumb navigation
- F7.9: Refresh current directory
- F7.10: Multi-file selection for batch download

**Acceptance Criteria:**
- Navigation is responsive
- Large file transfers (>100MB) work reliably with progress indication
- Permission errors handled gracefully with clear messaging

---

### Ticket 11: F9 - Performance Monitor

**Priority:** P2 (Medium)
**Milestone:** M3

**Description:**
Real-time monitoring of device resource usage.

**Requirements:**

- F9.1: CPU usage graph (real-time, parsed from `top` or `/proc/stat`)
- F9.2: Memory usage graph (total, used, available)
- F9.3: Per-process CPU/memory table (top 10)
- F9.4: Refresh rate selector (1s, 2s, 5s)
- F9.5: Battery drain rate indicator
- F9.6: Temperature readings (if available via `dumpsys battery`)
- F9.7: Start/stop monitoring toggle
- F9.8: Export performance snapshot

**Acceptance Criteria:**
- Graphs update smoothly without UI jank
- Resource usage of the tool itself is minimal
- Data is accurate compared to on-device tools

---

### Ticket 12: F10 - Bugreport Generator

**Priority:** P2 (Medium)
**Milestone:** M3

**Description:**
Generate and download Android bugreport for advanced debugging.

**Requirements:**

- F10.1: Initiate bugreport generation (`bugreportz` or `bugreport`)
- F10.2: Progress indication (bugreport can take several minutes)
- F10.3: Download completed bugreport as ZIP
- F10.4: Cancel in-progress bugreport
- F10.5: Estimated time remaining display
- F10.6: History of generated reports (current session)

**Acceptance Criteria:**
- Bugreport completes successfully on supported devices
- User informed of expected wait time
- Large bugreport files download correctly

---

## Milestone 4: Polish

### Ticket 13: F11 - Settings Viewer/Editor

**Priority:** P3 (Low)
**Milestone:** M4

**Description:**
View and modify system settings.

**Requirements:**

- F11.1: List settings from all namespaces (system, secure, global)
- F11.2: Search/filter settings
- F11.3: Edit setting value (with appropriate warnings)
- F11.4: View setting type and current value
- F11.5: Preset quick-settings for common tweaks:
  - Enable/disable ADB over network
  - Show touches
  - Pointer location
  - Developer options shortcuts
- F11.6: Reset individual setting to default

**Acceptance Criteria:**
- Settings load completely
- Edits apply immediately
- Dangerous settings require confirmation

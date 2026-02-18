# Screen Capture Feature: Technical Feasibility & Strategy Report

**Date:** 2026-02-18
**Feature:** F5 - Screenshot & Screen Recording (Expansion to unified "Screen Capture")
**Status:** Research Complete

---

## Executive Summary

ADBWrench currently supports still screenshot capture via `adb shell screencap -p` and basic screen recording via `adb shell screenrecord`. This report evaluates expanding F5 into a unified "Screen Capture" feature comprising three capabilities: **Screenshot** (existing), **Screen Recording** (partially existing, needs improvement), and **Live Screen View** (new, real-time mirroring).

The most important finding is that the **@yume-chan ecosystem already provides production-ready packages** for scrcpy integration over WebUSB, including browser-based H.264 decoding via the WebCodecs API. Since ADBWrench already uses `@yume-chan/adb@2.5.1`, adding scrcpy support requires installing compatible companion packages (`@yume-chan/adb-scrcpy@2.3.2`, `@yume-chan/scrcpy@2.3.0`, `@yume-chan/scrcpy-decoder-webcodecs@2.5.0`) and bundling the ~90KB scrcpy server binary. This approach unlocks both high-quality live screen mirroring and superior screen recording compared to the current `screenrecord` shell command.

**Recommended strategy:** Keep the existing `screencap` approach for screenshots. Replace the `adb shell screenrecord` approach with scrcpy-based recording for better quality and no 3-minute limit. Add live screen mirroring via the same scrcpy connection. Unify all three under a single page with mode tabs.

---

## Table of Contents

1. [Technical Analysis: ADB Shell Commands](#1-technical-analysis-adb-shell-commands)
2. [Technical Analysis: Scrcpy Protocol (Recommended Path)](#2-technical-analysis-scrcpy-protocol)
3. [Technical Analysis: Browser Decoding (WebCodecs)](#3-technical-analysis-browser-decoding)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Feasibility Matrix](#5-feasibility-matrix)
6. [Recommended Approach per Capability](#6-recommended-approach-per-capability)
7. [Package Dependencies & Installation](#7-package-dependencies--installation)
8. [UX Recommendations](#8-ux-recommendations)
9. [Naming Convention](#9-naming-convention)
10. [Limitations & Gotchas](#10-limitations--gotchas)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Technical Analysis: ADB Shell Commands

### 1.1 `screencap -p` (Currently Used for Screenshots)

The existing implementation at `/Users/paramjeetdesai/Development/superr/SuperrWrench/src/services/adb.ts` (line 380-393) uses `screencap -p` which outputs PNG to stdout:

```typescript
// Current implementation
export async function captureScreenshot(): Promise<Uint8Array> {
  if (currentAdb.subprocess.shellProtocol) {
    const result = await currentAdb.subprocess.shellProtocol.spawnWait(['screencap', '-p']);
    return result.stdout;
  } else {
    const result = await currentAdb.subprocess.noneProtocol.spawnWait(['screencap', '-p']);
    return result;
  }
}
```

**Performance:** Typical capture time is 40-200ms depending on device. Output is PNG format, directly usable in the browser.

**Verdict:** This approach is solid for single screenshots and should be kept as-is.

### 1.2 `screenrecord` (Currently Used for Recording)

The existing implementation at `/Users/paramjeetdesai/Development/superr/SuperrWrench/src/app/screenshot/page.tsx` (line 75-107) uses `adb shell screenrecord`:

```typescript
// Current implementation
const { exit } = await shellStream(
  `screenrecord --time-limit ${recordingDuration} ${recordingPathRef.current}`,
  () => {}, () => {}
);
```

**Parameters and limitations:**

| Parameter | Default | Range | Notes |
|-----------|---------|-------|-------|
| `--time-limit` | 180s | 1-180s | **Hardcoded max of 3 minutes** in AOSP source (`kMaxTimeLimitSec = 180`) |
| `--size` | Native resolution | Any (encoder-limited) | Falls back to 1280x720 if unsupported |
| `--bit-rate` | 20 Mbps | Any | Specified in bits/sec or as "4M" shorthand |
| `--rotate` | Off | 90 degrees | Experimental |
| Format | MP4 (MPEG-4) | MP4 only | No other container formats |
| Audio | None | N/A | **Audio is never recorded** |

**Critical limitations:**
- 3-minute maximum is a compiled-in constant in the AOSP binary; cannot be changed without modifying the device binary
- No audio capture whatsoever
- Rotation during recording causes frame cropping
- Output file is written to device storage, then must be pulled back (adds delay)
- Apps with `FLAG_SECURE` (banking apps, DRM content) block capture

**Verdict:** The current `screenrecord` approach works but has significant limitations. For recordings beyond 3 minutes, the only native workaround is chaining multiple recordings or patching the binary (as Maestro does). The scrcpy approach described below is superior in every way.

### 1.3 `framebuffer:` ADB Protocol Command

The ADB daemon supports a `framebuffer:` command that returns raw pixel data of the current screen. The `@yume-chan/adb` library exposes this via `AdbFrameBuffer`:

- Returns raw RGB/RGBA data with metadata (width, height, bpp, color offsets)
- Format changed between Android versions (pre-9 vs post-9)
- Much larger data size than PNG (raw pixels vs compressed)
- Single frame only, not a stream

**Verdict:** Not useful for live streaming or recording. Inferior to `screencap -p` for screenshots due to larger transfer size and format complexity.

---

## 2. Technical Analysis: Scrcpy Protocol

### 2.1 How Scrcpy Works

Scrcpy operates via a client-server architecture:

1. **Push:** The client pushes a ~90KB Java JAR file (`scrcpy-server.jar`) to `/data/local/tmp/` on the device
2. **Launch:** The server is started via `app_process` (not as an APK -- no installation required)
3. **Connect:** Client and server establish 1-3 sockets via ADB reverse/forward tunnels for video, audio, and control
4. **Stream:** The server uses Android's `MediaCodec` API to capture the screen and encode it as H.264 (default), H.265, or AV1, then streams the encoded packets over the video socket
5. **Decode:** The client decodes and renders the video frames

**Requirements:**
- Android 5.0+ (API 21+) for screen mirroring
- Android 11+ (API 30+) for audio forwarding
- Android 12+ for camera mirroring
- No root access required
- No app installation required (uses `app_process`)

### 2.2 @yume-chan Scrcpy Packages (Browser-Ready)

The same author (`yume-chan`) who created the ADB packages already in use by ADBWrench has also built a complete scrcpy client for web browsers:

| Package | Version | Purpose |
|---------|---------|---------|
| `@yume-chan/scrcpy` | 2.3.0 | Core scrcpy protocol implementation |
| `@yume-chan/adb-scrcpy` | 2.3.2 | ADB integration (push, start, connect) |
| `@yume-chan/scrcpy-decoder-webcodecs` | 2.5.0 | Hardware-accelerated H.264/H.265/AV1 decoder |
| `@yume-chan/scrcpy-decoder-tinyh264` | 2.1.0 | Software fallback decoder (WASM) |
| `@yume-chan/fetch-scrcpy-server` | 1.0.0 | Helper to download server binary |

**Compatibility with existing project:** `@yume-chan/adb-scrcpy@2.3.2` requires `@yume-chan/adb@^2.3.1`. The project currently uses `@yume-chan/adb@2.5.1`, which satisfies this requirement.

### 2.3 Scrcpy vs screenrecord Comparison

| Capability | `screenrecord` | Scrcpy |
|------------|---------------|--------|
| Max duration | 3 minutes (hardcoded) | Unlimited |
| Audio | Never | Android 11+ |
| Output format | MP4 on device | H.264 stream, mux in browser |
| Live preview | No | Yes (primary purpose) |
| Resolution control | Limited | Full control |
| Bitrate control | Yes | Yes, plus more codecs |
| Input injection | No | Yes (touch, keyboard) |
| Requires device storage | Yes (writes to sdcard) | No (streams directly) |
| FLAG_SECURE bypass | No | No |
| Recording while viewing | No | Yes (simultaneous) |

### 2.4 Scrcpy Server Binary Hosting

The scrcpy server binary (~90KB) needs to be bundled with the application. Options:

1. **Bundle statically:** Include in `public/` directory, fetch at runtime
2. **Use `@yume-chan/fetch-scrcpy-server`:** Downloads from GitHub releases at build time
3. **CDN/dynamic fetch:** Download on first use, cache in IndexedDB

Recommended: **Option 1** (bundle in `public/`) for reliability and offline PWA support.

---

## 3. Technical Analysis: Browser Decoding

### 3.1 WebCodecs API (Primary Decoder)

The WebCodecs API provides hardware-accelerated video decoding directly in the browser.

**Browser support for VideoDecoder H.264:**

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 94+ | Full support | Uses FFmpeg internally |
| Edge 94+ | Full support | Uses Media Foundation on Windows |
| Safari 16.4+ | VideoDecoder only | AudioDecoder in Technology Preview |
| Firefox Desktop 130+ | Supported with bugs | Some H.264 decode issues reported (Bug 1918769) |
| Firefox Mobile | Not supported | WebCodecs mobile implementation in progress |

**Since ADBWrench targets Chromium-based browsers (Chrome, Edge) per CLAUDE.md, WebCodecs H.264 support is guaranteed.**

**Key requirements:**
- Secure context (HTTPS or localhost) -- already satisfied by PWA architecture
- `VideoDecoder.isConfigSupported()` for runtime verification

**Rendering pipeline:** `VideoDecoder` -> `VideoFrame` -> `<canvas>` (via WebGL or drawImage)

The `@yume-chan/scrcpy-decoder-webcodecs` package provides three renderers:

1. **`WebGLVideoFrameRenderer`** -- Recommended. Renders to `<canvas>` using WebGL. Requires hardware-accelerated WebGL.
2. **`BitmapVideoFrameRenderer`** -- Fallback. Uses `drawImage()` on a canvas. Slower but universally works.
3. **`InsertableStreamVideoFrameRenderer`** -- Experimental. Renders to `<video>` element using Insertable Streams API.

### 3.2 TinyH264 (Fallback Decoder)

For browsers where WebCodecs is unavailable (should not happen for Chrome/Edge targets):

- Software H.264 decoder compiled to WASM
- Runs in a Web Worker to avoid blocking the main thread
- Only supports H.264 Baseline/Main profile at level 4
- Significantly slower than WebCodecs
- Renders via YUV-to-RGB conversion on canvas

**Verdict:** Include as a fallback, but WebCodecs should handle 99%+ of the target browser population.

### 3.3 Recording Video in the Browser

For saving recorded video as a file, the H.264 stream from scrcpy needs to be muxed into a container format (MP4 or WebM). The stream arrives in Annex B format and must be converted to AVC format for MP4:

- **`mp4-muxer`** npm package: Designed around WebCodecs API, can mux H.264 Annex B streams into MP4
- **`webm-muxer`** npm package: Alternative for WebM container
- No re-encoding needed -- the encoded stream is directly muxed, preserving quality

The Tango ADB documentation provides detailed code for Annex B to AVC conversion, SPS/PPS extraction, and configuration record building.

---

## 4. Competitive Landscape

### 4.1 Direct Competitors

| Tool | Type | Browser-Based | Live Mirror | Record | Screenshot | Price |
|------|------|---------------|-------------|--------|------------|-------|
| **Tango ADB / ya-webadb** | Web App (PWA) | Yes (WebUSB) | Yes (scrcpy) | In progress | Yes | Free (MIT) |
| **Vysor** | Desktop + Web | Yes (WebUSB) | Yes | Pro only | Yes | Free/$2.50/mo |
| **ADBWrench (ours)** | Web App (PWA) | Yes (WebUSB) | Not yet | Basic (3min) | Yes | Free |

### 4.2 Indirect Competitors (Desktop)

| Tool | Live Mirror | Record | Control | Price |
|------|-------------|--------|---------|-------|
| **scrcpy** | Yes, 35-70ms latency | Yes, unlimited | Yes | Free (Apache 2.0) |
| **QtScrcpy / guiscrcpy** | Yes | Yes | Yes | Free |
| **AirDroid** | Yes (WiFi) | Yes | Partial | Freemium |
| **Reflector** | Yes | Yes | No | $20+ |

### 4.3 Key Differentiation Opportunity

ADBWrench's advantage is being a **zero-install, browser-based PWA** targeting **IT service personnel**. No other tool combines:
- No desktop software installation
- Full ADB debugging suite (shell, logcat, file browser, etc.)
- Screen mirroring in the same browser-based interface
- Works on any Chromium browser including Chromebooks

Vysor comes closest but is commercial and lacks the debugging tool suite. Tango ADB's demo is a developer-focused proof of concept, not a polished product.

---

## 5. Feasibility Matrix

| Capability | Technical Feasibility | Complexity | Impact | Priority |
|------------|----------------------|------------|--------|----------|
| **Screenshot** (existing) | Proven -- already working | Done | High | Maintain |
| **Screen Recording via scrcpy** | High -- libraries exist, browser muxing proven | Medium | High | P1 |
| **Live Screen View via scrcpy** | High -- Tango ADB demo proves it works | Medium-High | Very High | P1 |
| **Touch/Input Injection** | High -- scrcpy control channel supports it | Medium | Medium | P2 (future) |
| **Audio forwarding** | Medium -- requires Android 11+, AudioDecoder support varies | High | Low | P3 (future) |
| **Recording via screenrecord** (current) | Proven -- already working, limited | Done | Medium | Replace with scrcpy |

---

## 6. Recommended Approach per Capability

### 6.1 Screenshot -- Keep Current Approach

**Method:** `screencap -p` via `adb.subprocess.shellProtocol.spawnWait()`

**Rationale:** The current approach is fast (40-200ms), produces PNG directly, and is simpler than extracting a single frame from a scrcpy stream. The scrcpy decoder does offer a `snapshot()` method that captures the current frame as PNG, which could be used as a secondary option when live view is active.

**Enhancement opportunity:** When live screen view is active, offer "grab frame" as an instant screenshot from the already-decoded video stream (via `decoder.snapshot()`), avoiding a separate `screencap` round-trip.

### 6.2 Screen Recording -- Migrate to Scrcpy

**Method:** Use `@yume-chan/adb-scrcpy` to start a scrcpy server, capture the H.264 stream, and mux to MP4 in the browser using `mp4-muxer`.

**Architecture:**
1. Push scrcpy server binary to device
2. Start server with video enabled, audio disabled (initially), control disabled
3. Pipe video stream through `options.createMediaStreamTransformer()`
4. For each packet, convert Annex B to AVC format and feed to `mp4-muxer`
5. When recording stops, finalize the MP4 and trigger download

**Advantages over current approach:**
- No 3-minute limit
- No need to write/pull file from device storage
- Can record while simultaneously viewing live stream
- Better codec control (bitrate, resolution, framerate)
- Smaller, more efficient output files

**Configuration options to expose:**

```typescript
{
  videoCodec: 'h264',      // safest default
  maxSize: 1920,           // max dimension, preserves aspect ratio
  videoBitRate: 8_000_000, // 8 Mbps (adjustable)
  maxFps: 30,              // cap framerate
  audio: false,            // initially disabled
}
```

### 6.3 Live Screen View -- New via Scrcpy

**Method:** Use `@yume-chan/adb-scrcpy` + `@yume-chan/scrcpy-decoder-webcodecs` to stream and render live screen content.

**Architecture:**
1. Push scrcpy server binary to device (reuse if already pushed)
2. Start server with video enabled, control disabled (initially)
3. Pipe video stream to `WebCodecsVideoDecoder`
4. Render to `<canvas>` via `WebGLVideoFrameRenderer`
5. Handle rotation/resize via `sizeChanged` events

**Key implementation details:**

```typescript
import { AdbScrcpyClient, AdbScrcpyOptions2_1 } from '@yume-chan/adb-scrcpy';
import { WebCodecsVideoDecoder, WebGLVideoFrameRenderer } from '@yume-chan/scrcpy-decoder-webcodecs';

// Check support
if (!WebCodecsVideoDecoder.isSupported) {
  // Fall back to TinyH264 or show error
}

// Create renderer
const renderer = new WebGLVideoFrameRenderer();
document.getElementById('screen-canvas').appendChild(renderer.element);

// Start scrcpy
const client = await AdbScrcpyClient.start(adb, serverPath, new AdbScrcpyOptions2_1({
  video: true,
  audio: false,
  control: false,
  maxSize: 1920,
  videoBitRate: 8_000_000,
}));

// Decode and render
const { metadata, stream } = await client.videoStream;
const decoder = new WebCodecsVideoDecoder({ codec: metadata.codec, renderer });

// CRITICAL: Must read all streams to prevent ADB multiplexing deadlock
await stream.pipeTo(decoder.writable);
```

**Expected performance:**
- Latency: 35-100ms (comparable to native scrcpy)
- FPS: 30-60 depending on device encoder and USB bandwidth
- Resolution: Up to native device resolution

---

## 7. Package Dependencies & Installation

### Required New Packages

```bash
npm install @yume-chan/scrcpy@^2.3.0 \
            @yume-chan/adb-scrcpy@^2.3.2 \
            @yume-chan/scrcpy-decoder-webcodecs@^2.5.0 \
            @yume-chan/scrcpy-decoder-tinyh264@^2.1.0 \
            @yume-chan/stream-extra@^2.1.0 \
            mp4-muxer
```

### Scrcpy Server Binary

Download the scrcpy server v3.3.x binary and place it at:
```
public/scrcpy-server.jar
```

Size: ~90KB. This is small enough to bundle and serves the PWA offline requirement.

### Compatibility Check

| Existing Package | Version | Compatible? |
|-----------------|---------|-------------|
| `@yume-chan/adb` | 2.5.1 | Yes (adb-scrcpy requires ^2.3.1) |
| `@yume-chan/adb-daemon-webusb` | 2.3.2 | Yes (same ecosystem) |
| `@yume-chan/adb-credential-web` | 2.1.0 | Yes (unchanged) |

---

## 8. UX Recommendations

### 8.1 Unified Page with Mode Tabs

Replace the current `/screenshot` route with a unified `/screen` (or `/display`) route. Use tabs/modes within the page:

```
+-------------------------------------------------------------------+
| SCREEN // CAPTURE                                    [Screenshot ▼] |
|                                                                     |
| [ SCREENSHOT ]  [ RECORD ]  [ LIVE VIEW ]          [Settings gear] |
+-------------------------------------------------------------------+
|                                                                     |
|  (Main content area changes based on selected mode)                 |
|                                                                     |
+-------------------------------------------------------------------+
```

**Tab behaviors:**

1. **SCREENSHOT mode** (default, matches current behavior)
   - Capture button, preview area, history sidebar
   - Download, copy, delete actions
   - No persistent connection needed

2. **RECORD mode**
   - Start/Stop recording button
   - Duration timer (no max limit with scrcpy)
   - Optional: live preview while recording
   - Resolution and bitrate controls
   - Auto-download on stop

3. **LIVE VIEW mode**
   - Full-screen canvas rendering
   - FPS counter and latency indicator
   - Pause/resume stream
   - "Grab screenshot" button (from current frame)
   - Future: touch input forwarding overlay

### 8.2 Shared State

When switching between modes, share the scrcpy server connection when possible:
- SCREENSHOT mode: No scrcpy connection needed (uses `screencap`)
- RECORD and LIVE VIEW: Can share the same scrcpy server instance
- Switching from LIVE VIEW to RECORD: Start muxing the existing stream to file
- Switching from RECORD to LIVE VIEW: Stop muxing but keep streaming

### 8.3 SideNav Update

Update the SideNav at `/Users/paramjeetdesai/Development/superr/SuperrWrench/src/design-system/patterns/SideNav.tsx` to rename "Screenshot" to "Screen" or "Display" in the TOOLS section.

### 8.4 Progressive Enhancement

- If scrcpy server push fails (old device, restricted permissions), gracefully fall back to `screenrecord` for recording
- If WebCodecs is unavailable, fall back to TinyH264 for live view (with performance warning)
- Screenshot always works via `screencap` regardless of scrcpy availability

---

## 9. Naming Convention

### Recommended: "Screen"

| Consideration | "Screen Capture" | "Screen" | "Display" |
|---------------|-----------------|----------|-----------|
| Covers screenshots | Yes | Yes | Partially |
| Covers recording | Yes | Yes | Partially |
| Covers live view | Partially | Yes | Yes |
| Brevity (nav label) | Too long | Perfect | Good |
| Consistency with ADB terms | Good | Good | Fair |
| Developer familiarity | Good | Good | Fair |

**Final recommendation:** Use **"Screen"** as the nav label and route (`/screen`). The page header can read `SCREEN // CAPTURE` (for screenshot/record modes) or `SCREEN // LIVE` (for live view mode), following the existing header pattern (`SCREENSHOT // CAPTURE`).

**Sub-modes:**
- `/screen` with `?mode=screenshot` (default)
- `/screen` with `?mode=record`
- `/screen` with `?mode=live`

Or use client-side tab state without URL params if preferred.

---

## 10. Limitations & Gotchas

### 10.1 Critical: ADB Stream Multiplexing

**ADB is a multiplexing protocol.** Multiple logical streams (video, audio, control, shell) are transmitted over one USB connection. Blocking one stream blocks ALL others. This means:

- When scrcpy is streaming video, you **must** continuously read from the video stream
- If you also have audio or control sockets open, those must be continuously read too
- Failing to read will freeze the entire ADB connection, including shell commands

**Mitigation:** Always use separate async readers for each stream. When not using audio/control, disable them in server options to avoid extra streams.

### 10.2 One USB Device = One Application

WebUSB allows only one application to access a USB device at a time. The user cannot have:
- ADBWrench open in two tabs connected to the same device
- The native `adb` server running simultaneously (`adb kill-server` required)
- Another WebADB tab open

**Mitigation:** This is already handled by the existing connection manager. Add a clear error message if connection fails due to device being in use.

### 10.3 FLAG_SECURE Content

Apps with `FLAG_SECURE` (banking apps, DRM video players, some enterprise apps) will show black frames in the captured area. This applies to ALL capture methods (screencap, screenrecord, scrcpy).

**Mitigation:** Display an informational message when the user sees black areas: "Some apps prevent screen capture for security."

### 10.4 Scrcpy Server Version Coupling

The scrcpy protocol is explicitly unstable -- the Scrcpy developers state it "may (and will) change at any time." The `@yume-chan/scrcpy` client must match the server version.

**Mitigation:** Bundle a specific server version and pin the `@yume-chan/scrcpy` package version. Test before upgrading either.

### 10.5 Device Encoder Availability

Not all Android devices have hardware H.264 encoders at all resolution/bitrate combinations. Some low-end devices may fail to start the scrcpy server.

**Mitigation:** Catch `AdbScrcpyExitedError` and fall back to lower resolution/bitrate, or fall back to `screenrecord` for recording.

### 10.6 WebCodecs Secure Context

The WebCodecs API requires HTTPS or localhost. Since ADBWrench is a PWA served over HTTPS, this is already satisfied. However, developers testing locally must use `localhost`, not a raw IP.

### 10.7 MP4 Muxing in Browser

When recording, the MP4 file is assembled in browser memory. Long recordings at high bitrate can consume significant RAM.

**Mitigation:**
- For long recordings, consider streaming chunks to a `File System Access API` writable file
- Show a memory warning for recordings over 10 minutes
- Offer quality presets (Low/Medium/High) that control bitrate

### 10.8 First-Time Server Push Latency

The first time live view or recording is started, the scrcpy server binary must be pushed to the device (~90KB). Subsequent starts can reuse the cached binary.

**Mitigation:** Show a "Preparing device..." progress indicator during the initial push. Consider pre-pushing the server at connection time in the background.

---

## 11. Implementation Roadmap

### Phase 1: Foundation (1-2 weeks)

- [ ] Install scrcpy packages and verify builds with existing Next.js/TypeScript setup
- [ ] Create `src/services/scrcpy.ts` service module (push server, start/stop, manage connection lifecycle)
- [ ] Bundle scrcpy server binary in `public/scrcpy-server.jar`
- [ ] Create route `/screen` and migrate existing screenshot functionality from `/screenshot`
- [ ] Add tab UI for SCREENSHOT / RECORD / LIVE VIEW modes
- [ ] Update SideNav label from "Screenshot" to "Screen"

### Phase 2: Live Screen View (1-2 weeks)

- [ ] Implement WebCodecs decoder integration with canvas rendering
- [ ] Handle rotation and size changes
- [ ] Add FPS and connection quality indicators
- [ ] Implement "grab frame" screenshot from live stream
- [ ] Add start/stop/pause controls
- [ ] Implement TinyH264 fallback detection and warning

### Phase 3: Scrcpy-Based Recording (1 week)

- [ ] Implement H.264 stream to MP4 muxing using `mp4-muxer`
- [ ] Handle Annex B to AVC conversion for MP4 container
- [ ] Add recording controls (start, stop, duration display)
- [ ] Implement auto-download of completed recording
- [ ] Add quality presets (resolution, bitrate, framerate)
- [ ] Keep `screenrecord` as fallback for devices where scrcpy fails

### Phase 4: Polish & Edge Cases (1 week)

- [ ] Handle connection loss during streaming/recording gracefully
- [ ] Memory management for long recordings
- [ ] Error states for all failure modes (no encoder, FLAG_SECURE, etc.)
- [ ] Keyboard shortcuts (S for screenshot, R for record, L for live view)
- [ ] PWA offline handling (show appropriate message)
- [ ] Update TICKETS.md marking F5 as expanded

---

## Sources

### ADB Commands & Limitations
- [ADB Shell screenrecord](https://adbshell.com/commands/adb-shell-screenrecord)
- [Fixing Android's 3-minute screen recording limitation (Maestro)](https://maestro.dev/blog/fixing-androids-3-minute-screen-recording-limitation)
- [Android Screen Recording using ADB](http://adventuresinqa.com/2015/02/04/android-screen-recording-using-adb/)
- [Tango ADB framebuffer documentation](https://tangoadb.dev/0.0.24/api/adb/framebuffer/)
- [Capturing Binary Screen Data Using ADB (Repeato)](https://www.repeato.app/efficiently-capturing-screenshots-on-android-devices-via-adb/)

### Scrcpy Protocol & Architecture
- [Scrcpy developer documentation](https://github.com/Genymobile/scrcpy/blob/master/doc/develop.md)
- [scrcpy Wikipedia](https://en.wikipedia.org/wiki/Scrcpy)
- [Introducing scrcpy (rom1v blog)](https://blog.rom1v.com/2018/03/introducing-scrcpy/)
- [Scrcpy 2.0 with audio (rom1v blog)](https://blog.rom1v.com/2023/03/scrcpy-2-0-with-audio/)
- [Genymobile/scrcpy GitHub](https://github.com/Genymobile/scrcpy)

### Tango ADB / @yume-chan Packages
- [Tango ADB Development Guide](https://tangoadb.dev/)
- [Tango ADB scrcpy quick start](https://tangoadb.dev/scrcpy/)
- [Push server documentation](https://tangoadb.dev/scrcpy/push-server/)
- [Start server documentation](https://tangoadb.dev/scrcpy/start-server/)
- [Handle video stream](https://tangoadb.dev/scrcpy/video/)
- [WebCodecs decoder](https://tangoadb.dev/scrcpy/video/web-codecs/)
- [TinyH264 decoder](https://tangoadb.dev/scrcpy/video/tiny-h264/)
- [Save to file (recording)](https://tangoadb.dev/1.1.0/scrcpy/video/record/)
- [ya-webadb GitHub](https://github.com/yume-chan/ya-webadb)
- [ya-webadb live demo (scrcpy)](https://yume-chan.github.io/ya-webadb/scrcpy)
- [@yume-chan/adb-scrcpy npm](https://www.npmjs.com/package/@yume-chan/adb-scrcpy)
- [@yume-chan/scrcpy npm](https://www.npmjs.com/package/@yume-chan/scrcpy)
- [@yume-chan/scrcpy-decoder-webcodecs npm](https://www.npmjs.com/package/@yume-chan/scrcpy-decoder-webcodecs)
- [@yume-chan/scrcpy-decoder-tinyh264 npm](https://www.npmjs.com/package/@yume-chan/scrcpy-decoder-tinyh264)

### WebCodecs API
- [WebCodecs API MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [VideoDecoder MDN](https://developer.mozilla.org/en-US/docs/Web/API/VideoDecoder)
- [WebCodecs best practices (Chrome)](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs)
- [WebCodecs Codec Support Dataset](https://webcodecsfundamentals.org/datasets/codec-support/)
- [Firefox Bug 1918769 (H.264 decode issue)](https://bugzilla.mozilla.org/show_bug.cgi?id=1918769)

### Competitors
- [Vysor](https://www.vysor.io/)
- [Vysor Reviews 2025](https://www.selecthub.com/p/screen-sharing-software/vysor/)
- [minicap (DeviceFarmer)](https://github.com/DeviceFarmer/minicap)
- [restsend/andbrowser](https://github.com/restsend/andbrowser)
- [ADB for Android Devices in Your Browser](https://www.blog.brightcoding.dev/2025/08/11/adb-for-android-devices-in-your-browser/)

### Recording & Muxing
- [mp4-muxer approach (canvas-record)](https://github.com/dmnsgn/canvas-record)
- [Canvas to MP4 via WebCodecs](https://devtails.xyz/adam/how-to-save-html-canvas-to-mp4-using-web-codecs-api)
- [scrcpy recording documentation](https://github.com/Genymobile/scrcpy/blob/master/doc/recording.md)

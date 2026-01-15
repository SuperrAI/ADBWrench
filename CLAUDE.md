# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ADBWrench is a browser-based Android device debugging and management PWA built on WebUSB. It enables IT service personnel to perform device diagnostics, maintenance, and debugging without installing desktop software.

**Core Tech:** WebUSB API with ADB protocol implementation
**Browser Support:** Chromium-based browsers (Chrome, Edge)

## Development Commands

```bash
npm run dev              # Start Next.js development server
npm run build            # Build production bundle
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test             # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run format           # Format code with Prettier
npm run storybook        # Run Storybook on port 6006
npm run cypress          # Open Cypress interactive
npm run cypress:headless # Run Cypress headlessly
```

## Architecture

### Tech Stack
- **Framework:** Next.js 14 with App Router (React Server Components enabled)
- **Language:** TypeScript (strict mode)
- **UI:** Shadcn UI + Radix UI primitives + Tailwind CSS
- **State:** Redux Toolkit + TanStack React Query
- **Data:** Apollo Client (GraphQL)
- **Auth:** Supabase SSR
- **Testing:** Jest + React Testing Library + Cypress

### Directory Structure

```
src/
├── components/          # Feature-specific components
│   ├── auth/           # Authentication flows
│   ├── providers/      # Context providers (Apollo, etc.)
│   └── ui/             # Shadcn UI components
├── design-system/      # Reusable design system
│   ├── foundations/    # Design tokens (colors, typography, spacing)
│   ├── components/     # Base components (Button, Dropdown, etc.)
│   └── patterns/       # Layout patterns (PageLayout, Header, Navigation)
└── styles/             # Global CSS
```

### Key Patterns

**Path Alias:** `@/*` maps to `./src/*`

**Component Structure:** Exported component → Subcomponents → Helpers → Static content → Types

**Directory Naming:** Lowercase with dashes (e.g., `components/auth-wizard`)

**Provider Setup:** `src/components/providers/providers.tsx` wraps the app with Apollo Client and Sonner toasts

## Code Style Guidelines

- Use functional and declarative patterns; avoid classes
- Minimize `'use client'`, `useEffect`, and `setState`; favor RSC and SSR
- Use descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)
- Use early returns and guard clauses for error handling
- Validate with Zod for schema validation
- Use dynamic imports for code splitting

## Feature Modules (from PRD)

The app implements these core features around WebUSB/ADB:
- **F1:** Device Connection Manager (USB discovery, ADB handshake, RSA key management)
- **F2:** Device Information Dashboard (device properties via ADB shell)
- **F3:** Shell Command Interface (interactive terminal)
- **F4:** Logcat Viewer (real-time log streaming)
- **F5:** Screenshot & Screen Recording
- **F6:** Application Manager (install/uninstall APKs)
- **F7:** File Browser (device filesystem access)
- **F8:** Device Controls (reboot, screen, volume)
- **F9:** Performance Monitor (CPU/memory graphs)
- **F12:** PWA Infrastructure (offline support, installability)

See `PRD.md` for complete feature specifications and acceptance criteria.

## Workflow Rules

### Ticket Tracking
When a ticket is completed, mark it with ✅ in `TICKETS.md` (e.g., `### ✅ Ticket 1: F12 - PWA Infrastructure`). A ticket with ✅ indicates that feature is complete.

### Design System Reuse
Always reuse existing design system components from `src/design-system/` to maintain parity with other Superr web apps:
- **Foundations:** `src/design-system/foundations/` - colors, typography, spacing, animations
- **Components:** `src/design-system/components/` - Button, Dropdown, Tooltip, Filter, etc.
- **Patterns:** `src/design-system/patterns/` - PageLayout, CardLayout, Header, Navigation

Check these directories first before creating new UI components.

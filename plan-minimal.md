# Photo Quest Minimal Static Version - Implementation Plan

## Overview
A stripped-down, static-hostable version of the Photo Quest app focused purely on the core photo-taking experience with custom prompt list support via Pastebin, personal name branding, proper image saving to device camera roll, and specific UI/UX requirements.

## Implemented Features
- [x] Camera viewfinder with prompt display and countdown timer
- [x] Shutter button to capture photos (always enabled, shows subtle reminder when name not set)
- [x] Camera switch button (front/rear, environment-facing by default)
- [x] Automatic image save to device camera roll with structured filename
- [x] Prompt "burning" effect on captured image (specific text layout)
- [x] Personal name branding on captured image
- [x] Custom prompt list loading from Pastebin raw URL (accepts URL or ID)
- [x] Persistent name, custom prompts, timer, and position storage (localStorage)
- [x] Prompt position tracking (for custom lists only; random for default)
- [x] Configurable timer duration (default 60 seconds, settable in Settings)
- [x] Timer resets to configured duration on capture and on timer expiry
- [x] Settings overlay with name, timer, Pastebin loader, help text, and actions
- [x] Clear Position button (resets custom list to start)
- [x] Remove Custom Prompt button (reverts to defaults)
- [x] Full static site export compatibility (`output: 'export'`)
- [x] Expanded prompt list (350 total prompts: original 50 + 300 new)
- [x] Share via URL parameter (`?promptlist=tsA2ZAwt` or full raw URL)
- [x] Confetti celebration on capture
- [x] Dark theme throughout (black background, white text, orange accents)
- [x] PWA manifest configured

## Prompt Selection Logic
- **Default Mode**: A new random prompt is picked each time a photo is taken. No sequential order, no position tracking. Seed makes random selection reproducible.
- **Custom Mode**: Sequential order (0, 1, 2...) from loaded Pastebin list. Position tracked in localStorage and restored on page reload. Timer expiry advances to next prompt.
- **Auto-save**: Successful Pastebin fetches are saved to localStorage to avoid re-fetching. Subsequent page loads use the cached list.
- **URL Parameter**: `?promptlist=<ID or URL>` auto-loads a Pastebin list on page load. Both formats accepted:
  - `?promptlist=tsA2ZAwt`
  - `?promptlist=https://pastebin.com/raw/tsA2ZAwt`

## User Experience Flow
1. App loads, hydrates from localStorage:
   - Name (shows subtle "Set your name..." reminder if missing)
   - Custom prompts (if present, uses sequential mode; if not, uses default random mode)
   - Timer duration (defaults to 60s)
   - Seed (for reproducible sequences)
   - Prompt index (only in custom mode)
2. Main screen shows:
   - Current prompt (top-left overlay on camera feed)
   - Live camera feed (environment-facing)
   - Countdown timer (top-right, MM:SS 24-hour format, e.g. `0:59`)
   - Shutter button (bottom-center, large circular)
   - Camera switch button (bottom-right, rotates 180deg on press)
   - Settings button (bottom-left, opens overlay)
3. Tap shutter to capture:
   - Image processed with text banner (prompt + name + timestamp)
   - Saved to device camera roll with filename: `QuestSnap-{03d}-{name}-{prompt}.jpg`
   - Confetti celebration (100 particles, orange/white/black)
   - Timer resets to configured duration
   - Custom mode: advances to next prompt
   - Default mode: picks new random prompt
4. Timer expires (reaches 0):
   - Custom mode: advances to next prompt automatically
   - Default mode: picks new random prompt
   - Timer resets to configured duration
5. Settings overlay (top-left icon):
   - Name input with save button
   - Timer duration input (seconds, min 1) with save button
   - Pastebin URL/ID input with load button
   - Reset Position button
   - Remove Custom Prompts button (only shown when custom mode active)
   - Help text section explaining all features

## Technical Implementation

### Dependencies
- `next` 16.2.4 (core framework)
- `react` 19.2.4 & `react-dom` 19.2.4
- `lucide-react` 0.471.x (icons: Settings, Zap, Clock, Info, X, Save, Hash, Camera, RefreshCw)
- `seedrandom` 3.0.5 (for seeded prompt sequences)
- `canvas-confetti` 1.9.3 (celebration effect)
- **Dev types**: `@types/seedrandom`, `@types/canvas-confetti`
- **Removed**: `idb` (no image storage needed)

### File Structure
```
src/
  app/
    page.tsx              # Main app: camera view, settings overlay, capture handler
    layout.tsx            # Root layout: Inter font, black bg, PWA metadata, viewport
    globals.css           # Tailwind import, dark theme CSS vars, scrollbar, touch-action
  components/
    CameraViewfinder.tsx  # Camera feed, shutter button, switch button, prompt/timer overlay
    Settings.tsx          # Settings overlay: name, timer, pastebin, help, actions
  hooks/
    useGameLogic.ts       # Game state: prompts, timer, name, seed, persistence
  lib/
    imageProcessor.ts     # Canvas processing, text burning, filename generation, download
    promptEngine.ts       # Pastebin fetching (with CORS proxy fallback), ID validation, localStorage helpers
    prompts.ts            # 350 default prompts
public/
  manifest.json           # PWA manifest
  icon.png                # PWA icon (192x192)
```

### Removed Files
- `src/lib/db.ts` — no longer needed (images go directly to camera roll)
- `src/components/Gallery.tsx` — no gallery in minimal version

### `src/app/page.tsx`
- State: `view` ('camera' | 'settings'), `isProcessing` (bool)
- Destructures all state and actions from `useGameLogic()`
- `handleCapture`: calls `processImageWithBanner()`, `downloadBlob()`, triggers confetti, calls `nextPrompt()`
- `handleApplyPastebin`: calls `loadCustomPromptsFromInput()`, applies or shows error
- Renders: CameraViewfinder, processing overlay, name reminder (conditional), Settings (conditional)
- Bottom nav: single Settings button

### `src/components/CameraViewfinder.tsx`
- Props: `onCapture`, `prompt`, `timer`, `name`
- Uses `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`
- Captures photo via canvas `drawImage` + `toBlob('image/jpeg', 0.9)`
- Camera switch calls `startCamera()` again (toggles via browser's facingMode cycling)
- Timer displayed as `MM:SS` via `Math.floor(seconds / 60):seconds.toString().padStart(2, '0')`
- Error state shows red font-mono message if camera access denied

### `src/components/Settings.tsx`
- Sections:
  1. **How it works**: Explains name, timer, custom prompts, share via URL, and default mode
  2. **Your Name**: text input + save button
  3. **Timer (seconds)**: number input + save button
  4. **Custom Prompts**: text input (URL or ID) + load button, error display, "Using custom prompt list" indicator
  5. **Actions**: Reset Position, Remove Custom Prompts (conditional)
- Error handling:
  - Pastebin load failure shows red error message and clears input field
  - Error cleared when user edits the input
  - Success shows green toast "Prompts loaded!" / "Name saved!" / "Timer set!" for 2 seconds
- Input sync: `tempName` and `tempTimer` initialized from props, updated via useEffect

### `src/hooks/useGameLogic.ts`
- State: `name`, `seed`, `customPrompts`, `customIndex`, `timerDuration`, `timeLeft`, `currentPrompt`, `isHydrated`
- Hydration: loads all values from localStorage on mount, sets `isHydrated = true`
- URL loading: `useRef`-guarded one-time fetch of `?promptlist=` parameter on mount
- Timer: `setInterval` countdown, resets to `timerDuration` on capture or expiry
- Prompt selection:
  - Custom mode: `customPrompts[customIndex % length]`
  - Default mode: `getRandomPromptIndex(DEFAULT_PROMPTS.length, seed)`
- `nextPrompt()`: advances custom index or picks random; always resets timer
- `updateTimerDuration()`: persists to localStorage, resets timer immediately
- Returns: `name`, `updateName`, `seed`, `updateSeed`, `currentPrompt`, `timeLeft`, `timerDuration`, `updateTimerDuration`, `nextPrompt`, `isCustomMode`, `customIndex`, `resetPosition`, `applyCustomPrompts`, `removeCustomPrompts`, `loadCustomPromptsFromInput`

### `src/lib/imageProcessor.ts`
- `processImageWithBanner(imageBlob, prompt, name, index)` → `{ blob, filename }`
- Banner: 12% of image height (min 80px), dark background (`#0a0a0a`)
- Font: "Courier New" monospace, fluorescent orange (`#ff5f00`)
- Text layout:
  - Line 1: Prompt (left-aligned, wraps if needed)
  - Line 2: Name (left) + Timestamp HH:MM (right, 24-hour with leading zeros)
- Font sizing: starts at `bannerHeight * 0.18` (max 40px), reduces to min 8px until name+timestamp fit on one line. Prompt wraps if needed.
- Prompt wrapping: word-by-word, leaves room for name+timestamp line
- Filename generation:
  - Sanitization: `a-zA-Zäöüß0-9`, space, period allowed; all others removed
  - Lowercase, whitespace normalized, trailing periods removed
  - Strict 100 character limit on prompt portion
  - Format: `QuestSnap-{03d index+1}-{name}-{prompt}.jpg`
  - Empty name defaults to `anonymous`
- `downloadBlob(blob, filename)`: creates temporary anchor, clicks, removes, revokes URL

### `src/lib/promptEngine.ts`
- `getRandomPromptIndex(length, seed)`: uses `seedrandom` if seed provided, otherwise `Math.random()`
- `extractPastebinId(input)`: extracts ID from various formats. Pastebin IDs are **exactly 8 alphanumeric characters**. Rejects IDs of wrong length (e.g., `tsA2ZAwthf` = 12 chars → null).
- `loadCustomPromptsFromInput(input)`: fetches from Pastebin with CORS proxy fallback chain:
  1. Direct: `https://pastebin.com/raw/<id>`
  2. Proxy 1: `https://api.allorigins.win/raw?url=...`
  3. Proxy 2: `https://corsproxy.io/?...`
  - Each attempt has 8-second timeout via `AbortController`
  - **HTML detection**: rejects responses containing any HTML tag (`/<[a-z][\s\S]*>/i`) — Pastebin returns HTML error pages for invalid IDs even with 200 status
  - Returns prompts array or null on any failure
- `saveCustomPrompts(prompts)`: saves to localStorage as JSON
- `clearStoredCustomPrompts()`: removes from localStorage
- `getStoredName()`, `saveName()`, `getStoredSeed()`, `saveSeed()`, `getStoredPromptIndex()`, `savePromptIndex()`, `clearPromptIndex()`: localStorage helpers with null/undefined checks

### `src/lib/prompts.ts`
- `DEFAULT_PROMPTS`: 350 creative, achievable photo challenges
- Style: open to interpretation, smartphone-photographable anywhere, no special equipment needed, mix of concrete and abstract concepts

### `next.config.ts`
```typescript
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
};
export default nextConfig;
```

### `src/app/globals.css`
- `@import "tailwindcss"`
- CSS vars: `--background: #000000`, `--foreground: #ffffff`
- `overflow: hidden` on body, `touch-action: manipulation` (prevents double-tap zoom)
- Custom scrollbar: 4px wide, dark thumb, transparent track

## Static Site Export
```bash
npm install
npm run build   # outputs to ./out directory
# Deploy contents of ./out to any static host (Netlify, Vercel, GitHub Pages)
```

## Data Persistence (localStorage)
| Key | Type | Purpose |
|-----|------|---------|
| `photoquest_name` | string | User's name, burned onto photos |
| `photoquest_customPrompts` | JSON string[] | Custom prompt list from Pastebin |
| `photoquest_promptIndex` | number (stringified) | Current position in custom list |
| `photoquest_timerDuration` | number (stringified) | Timer duration in seconds |
| `photoquest_seed` | string | Seed for reproducible prompt selection |

## Filename Format
`QuestSnap-{index:03d}-{name}-{prompt}.jpg`
- Index: 1-based, zero-padded to 3 digits (001, 002, ...)
- Name: sanitized, lowercase, defaults to `anonymous`
- Prompt: sanitized, lowercase, max 100 chars
- Sanitization: `a-zA-Zäöüß0-9`, space, period only; whitespace normalized; trailing periods removed
- Examples: `QuestSnap-005-alex-something_blue.jpg`, `QuestSnap-003-übung-etwas_blaues.jpg`

## Error Handling & Edge Cases

### Camera
- `getUserMedia` with `facingMode: 'environment'` for rear camera
- Error state displays clear message if permissions denied
- Retry mechanism: switch button re-calls `startCamera()`

### Pastebin Loading
- **ID validation**: only accepts exactly 8 alphanumeric characters (Pastebin's format). Invalid lengths rejected immediately without network request.
- **HTML detection**: regex `/<[a-z][\s\S]*>/i` scans response for any HTML tags. If found, response is rejected as invalid (Pastebin serves HTML 404 pages with 200 status for bad IDs).
- **CORS fallback chain**: tries direct fetch → allorigins proxy → corsproxy proxy. Each has 8-second timeout.
- **Content validation**: rejects empty responses, HTML error pages, 404 content
- **Error UX**: shows error message in Settings, clears input field, error auto-clears on next user edit
- **Auto-save**: successful fetches cached in localStorage, no re-fetch needed

### Timer
- Configurable in seconds (min 1), persisted to localStorage
- Resets to configured duration on capture and on timer expiry
- Default: 60 seconds

### Name
- Optional, capture works without it
- Subtle reminder shown when name is empty
- Defaults to `anonymous` in filename if empty

### Storage
- localStorage ~5MB limit, well within bounds for this data
- All writes wrapped in try/catch where appropriate
- JSON parsing errors silently fall back to defaults

### Hydration
- All localStorage reads happen in `useEffect` after mount to prevent SSR/CSR mismatch
- `isHydrated` flag prevents premature timer/prompt logic before state is loaded

## Mobile Optimization
- `touch-action: manipulation` prevents double-tap zoom on buttons
- `userScalable: false`, `maximumScale: 1` in viewport meta
- Shutter button: 80x80px with 64px inner circle, large touch target
- Bottom nav at 80px height for easy thumb reach
- `object-cover` on video ensures camera feed fills screen on any aspect ratio
- `playsInline` on video prevents iOS fullscreen hijack
- `env(safe-area-inset-*)` ready for notch/cutout support if needed
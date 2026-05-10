# QuestSnap Polaroid Design - Implementation Plan

## Overview
Redesign of the QuestSnap photo challenge app with a Polaroid-style camera frame overlay. Both the live camera preview and the saved images will share the same Polaroid aesthetic.

---

## 1. Asset Placement

| File | From | To |
|------|------|----|
| `rahmen.png` | `../src/assets/rahmen.png` | `questsnap/public/frame.png` |
| `PermanentMarker-Regular.ttf` | `../src/assets/PermanentMarker-Regular.ttf` | `questsnap/public/fonts/PermanentMarker-Regular.ttf` |

The frame image (`frame.png`) is 2393×2870 RGBA. It has a transparent "hole" at the camera position so the camera image shows through.

---

## 2. Saved Image Composition (imageProcessor.ts)

**Canvas size:** 2393×2870 (matching the frame PNG dimensions)

### Layer stack (bottom to top):

1. **Blurred background** — Camera image scaled to fill entire 2393×2870 canvas, blurred (`canvasContext.filter = 'blur(25px)'`), then slightly darkened (`fillRect(0,0,w,h)` with semi-transparent black).

2. **Main camera image** — Camera image square-cropped to 2140×2140 (center-crop, keeping the middle square), positioned at (135, 135) from top-left.

3. **Polaroid frame** — `frame.png` drawn on top (2393×2870). The alpha channel in the frame creates the Polaroid border effect around the camera image.

4. **Prompt text** — Drawn in the bottom section of the Polaroid:
   - **Font:** PermanentMarker (loaded from `/fonts/PermanentMarker-Regular.ttf`)
   - **Color:** `#000000` (black)
   - **Bounds:** x=0 to x=2393 (full width), y=2260 to y=2870 (610px tall)
   - **Size:** Calculated dynamically — largest possible that fits within the bounds with aesthetic margins (~40px padding left/right, ~30px top/bottom)
   - **Alignment:** Left-aligned text within the text bounds
   - **Content:** Only the prompt string (no name, no timestamp)

### Output:
- Format: JPEG (quality 0.95)
- Filename: `QuestSnap-{index:03d}-{prompt}.jpg`
- No name or timestamp in the output

---

## 3. Live Camera Preview (CameraViewfinder.tsx)

### Layout (top to bottom):

```
┌─────────────────────────────────────┐
│              Timer (top-right)       │
│                                     │
│     ┌─────────────────────────┐     │
│     │                         │     │
│     │   Polaroid Frame        │     │
│     │   (centered,            │     │
│     │    max 90vw wide)       │     │
│     │                         │     │
│     │   Square camera feed    │     │
│     │   (behind frame)        │     │
│     │                         │     │
│     │   Prompt text (bottom)  │     │
│     │                         │     │
│     └─────────────────────────┘     │
│                                     │
│  [Settings]  [Shutter]  [Switch]    │
└─────────────────────────────────────┘
```

### Background:
- Full-screen blurred camera feed (`filter: blur(25px)`, `opacity: 0.2`, `object-fit: cover`)

### Polaroid area (centered vertically & horizontally):
- Aspect ratio: 2393×2870 (from the frame PNG)
- Max width: 90vw (responsive)
- Frame image (`/frame.png`) as overlay
- Behind it: camera `<video>` element, square-cropped via CSS (`object-fit: cover` with aspect-ratio 1/1), positioned to match the frame hole at (135, 135) offset within the scaled frame

### Prompt text:
- Positioned at the bottom of the Polaroid area (y ≈ 78.7% of frame height = 2260/2870)
- Font: PermanentMarker, black
- Size: responsive to the scaled frame

### Timer:
- Top-right of screen
- Font: `PermanentMarker`
- Color: orange (`#ff5f00`)
- Format: `M:SS`
- Uses `position: fixed` or `absolute` to float above the Polaroid

### Controls (below the Polaroid, on dark background):
- **Shutter button**: Same as before, centered, white, 80x80px circle
- **Switch camera (fix the bug!)**: Right side, `RefreshCw` icon, now actually switches `facingMode` between `'environment'` and `'user'`
- **Settings**: Left side, `Settings` icon

---

## 4. Font Handling (index.css)

```css
@font-face {
  font-family: 'PermanentMarker';
  src: url('/fonts/PermanentMarker-Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
```

---

## 5. Camera Switch Fix (CameraViewfinder.tsx)

**Current problem:** `startCamera()` always uses `facingMode: 'environment'`. The switch button calls `startCamera()` but doesn't change `facingMode`.

**Fix:**
- Add state: `facingMode: 'environment' | 'user'`
- `switchCamera()`: toggles `facingMode`, stops old stream via `stream.getTracks().forEach(t => t.stop())`, starts new stream with new facingMode
- `startCamera(facingMode)` takes the mode as parameter and uses `getUserMedia({ video: { facingMode } })`

---

## 6. Timer URL Parameter (useGameLogic.ts)

**Addition to existing URL loading `useEffect`** (where `?promptlist=` is handled):

```typescript
const urlTimer = urlParams.get('timer');
if (urlTimer) {
  const parsed = parseInt(urlTimer, 10);
  if (parsed >= 1 && parsed <= 3600) {
    updateTimerDuration(parsed);
  }
}
```

**Format:** `?timer=60` (seconds, 1–3600). Persisted to localStorage like the manual timer setting.

---

## 7. Remote load indicator

Instead of removing the Pastebin/dpaste/Gist load UI, keep it but add GitHub Gist and dpaste support (already done in promptEngine.ts). The Settings page help text should document `?timer=` alongside `?promptlist=`.

---

## 8. API Changes

### `processImageWithBanner` → simplified

**Before:** `(imageBlob, prompt, name, index)` → `{ blob, filename }`
**After:** `(imageBlob, prompt, index)` → `{ blob, filename }`

- No more `name` parameter (text content is only the prompt)
- No more timestamp in the image
- Font changes from Courier New to PermanentMarker
- Layout changes from flat banner to Polaroid frame composition

### `downloadBlob` — unchanged

### `CameraViewfinder` props

**Before:** `onCapture`, `prompt`, `timer`, `name`
**After:** `onCapture`, `prompt`, `timer`

- Removed `name` prop (not displayed in the new design)

### Filename

**Before:** `QuestSnap-{index:03d}-{name}-{prompt}.jpg`
**After:** `QuestSnap-{index:03d}-{prompt}.jpg`

- No more name in the filename

---

## 9. Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `public/frame.png` | **New** | Copied from `../src/assets/rahmen.png` |
| `public/fonts/PermanentMarker-Regular.ttf` | **New** | Copied from `../src/assets/PermanentMarker-Regular.ttf` |
| `src/index.css` | **Edit** | Add `@font-face` for PermanentMarker |
| `src/lib/imageProcessor.ts` | **Rewrite** | Composite Polaroid layout, dynamic text sizing, no name/timestamp |
| `src/components/CameraViewfinder.tsx` | **Rewrite** | Polaroid UI, camera switch fix, square crop preview |
| `src/hooks/useGameLogic.ts` | **Edit** | Read `?timer=` URL param |
| `src/components/Settings.tsx` | **Edit** | Document `?timer=` in help text |
| `src/App.tsx` | **Edit** | Remove `name` from `processImageWithBanner` call, remove from `CameraViewfinder` props |

---

## 10. Build Output

`dist/` will contain:
- `index.html`
- `manifest.json`
- `frame.png`
- `fonts/PermanentMarker-Regular.ttf`
- `assets/index-*.css`
- `assets/index-*.js`

The `frame.png` and `fonts/` directory need to be copied from `public/` during build (Vite does this automatically).

# QuestSnap Polaroid Design v2 - Fixes & Updates

## Issues Fixed

### 1. Fixed Bottom Control Bar
- Controls (Settings, Shutter, Switch) are now in a **fixed-position bottom bar**
- Always visible regardless of Polaroid frame dimensions
- Layout: Settings (left) | Shutter (center) | Switch (right)
- No longer inside the camera/Polaroid container

### 2. Background Blur Reduced
- Changed from `blur(25px)` to `blur(5px)` for both live preview and saved image
- Less resource intensive, cleaner look

### 3. Timer Styling
- Text color: white
- With thin black outline via `text-shadow` for readability on any background
- Same PermanentMarker font

### 4. Consistent Text Positioning (Preview = Saved Image)
- Both use **7% padding** from all sides of the text area
- Text area: y=2260 to y=2870 (610px tall), full width 2393px
- With 7% padding: text starts at x≈168, y≈2303, max width≈2057, max height≈525
- Font size dynamically calculated to fill the available space optimally:
  - Short text (1 word, few chars) → large font, 1 line
  - Long text → wraps to multiple lines, fills height
  - Same calculation in both canvas and CSS (via JS measurement)

### 5. Dynamic Font Sizing Algorithm
```
For font sizes from 96 down to 12:
  1. Count how many lines the prompt needs at this size
  2. Calculate total height = lines × lineHeight (1.3em)
  3. If total fits within text area height → use this size
  Effect: Short text gets huge, long text wraps and shrinks
```

## Files Changed

| File | Changes |
|------|---------|
| `src/lib/imageProcessor.ts` | blur 25→5, padding 80px→7% text area, text bounding box updated |
| `src/components/CameraViewfinder.tsx` | blur 25→5, fixed bottom bar, timer white+text-shadow, dynamic JS font sizing, onOpenSettings prop |
| `src/App.tsx` | removed nav bar, integrated controls into CameraViewfinder via onOpenSettings |
| `plan-polaroid-design.md` | Initial version (kept for history) |

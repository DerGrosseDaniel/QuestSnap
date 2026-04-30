<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# QuestSnap Next.js Project Guide

## Setup & Installation

1. Create project: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-git --yes`
2. Install dependencies: `npm install seedrandom lucide-react idb canvas-confetti && npm install -D @types/seedrandom @types/canvas-confetti`

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- No test command configured by default (add vitest/jest if needed)

## Project Structure

- `/src` - Source code directory
- `/app` - Next.js app router pages and layouts
- `/components` - Reusable UI components
- `/hooks` - Custom React hooks
- `/lib` - Utility functions and services
- `/public` - Static assets (manifest.json, icon.png)
- Path alias: `@/*` maps to `/src/*`

## Key Files

- `src/app/layout.tsx` - Root layout with metadata and PWA settings
- `src/app/page.tsx` - Main app logic (camera, gallery, settings views)
- `src/app/globals.css` - Global CSS with Tailwind and custom styles
- `src/components/CameraViewfinder.tsx` - Camera interface with capture functionality
- `src/components/Gallery.tsx` - Photo gallery viewer
- `src/components/Settings.tsx` - Seed and prompt management
- `src/hooks/useGameLogic.ts` - Timer and seed logic
- `src/lib/imageProcessor.ts` - Image processing ("burning" effect) and download
- `src/lib/promptEngine.ts` - Prompt randomization and management
- `src/lib/db.ts` - IndexedDB storage for photos
- `src/lib/prompts.ts` - Default prompt list
- `public/manifest.json` - PWA manifest

## Styling

- Uses Tailwind CSS v4
- CSS classes in JSX/TSX files
- Dark theme (black background, white text)
- Custom scrollbar styling
- No CSS modules or styled-components

## TypeScript

- Strict mode enabled
- Path aliases configured in tsconfig.json
- Component props should be typed
- Proper typing for PhotoEntry, Blob handling, etc.

## Linting

- ESLint with next/core-web-vitals recommended rules
- Run `npm run lint` to check for issues
- Fix with `npm run lint -- --fix` (if using ESLint 8+)

## Environment

- No .env file by default
- Uses localStorage for seed and custom prompts
- Uses IndexedDB for photo storage
- Add environment variables as needed (NEXT_PUBLIC_* for client-side)

## Special Notes

- Camera access required for core functionality (getUserMedia)
- Image processing via Canvas API for "burning" effect with date stamp
- Automatic image download feature using Blob URLs
- Confetti celebration on successful capture
- PWA support with manifest.json
- Seed functionality for shared prompt sequences across users
- Prompt persistence via localStorage
- Photo persistence via IndexedDB
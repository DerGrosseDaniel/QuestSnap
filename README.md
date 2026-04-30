# QuestSnap

> **[Try it now at https://useless.blue/QuestSnap](https://useless.blue/QuestSnap)**

A minimalist photo challenge app. Displays a random or custom photo prompt with a countdown timer. Capture photos that are instantly saved to your device with burned-in text (prompt, name, timestamp).

## Quick Start

### Development

```bash
npm install
npm run dev
```

Open the app in your browser. The dev server starts with hot reload.

### Production Build

```bash
npm run build
```

Output goes to `dist/` — that's everything you need.

## Deployment — Drop Anywhere

Installation is dead simple: **just copy the contents of the `dist/` folder to any web server**. No Node.js, no build step, no configuration.

```bash
npm run build
# dist/ now contains:
#   index.html
#   manifest.json
#   assets/index-*.css
#   assets/index-*.js
```

Copy those files anywhere:

- Any static host (Cloudflare Pages, Netlify, Vercel, S3, GitHub Pages)
- Any web server (Nginx, Apache, Caddy)
- Any folder on any server — paths are fully relative
- Even open `index.html` directly in a browser (`file://`)

No environment variables, no root path requirements, no rewrites needed.

## Custom Prompt Lists

Load your own prompt list via URL. Supported services:

| Service | Reliability | Auth | Notes |
|---|---|---|---|
| **GitHub Gist** | Best | GitHub account | Permanent, CORS works natively. Recommended. |
| **dpaste.com** | Good | None | Anonymous, expires after configurable time. |
| **Pastebin** | Unreliable | None | CORS often blocked. Use as fallback only. |

### Usage

1. Create a text file with one prompt per line on any supported service
2. Copy the URL
3. Paste it in the app's Settings under "Custom Prompts"

Or share via link — append `?promptlist=<URL>` to your site URL:

```
https://your-site.com/?promptlist=https://gist.github.com/user/abc123
https://your-site.com/?promptlist=https://dpaste.com/ABC123
```

If the same prompt list URL is reloaded (e.g., page refresh), your position in the list is preserved.

## Tech Stack

- **Vite** — Build tool with relative path support
- **React 19** — UI framework
- **Tailwind CSS v4** — Styling
- **TypeScript** — Type safety

## Features

- Full-screen camera viewfinder with live preview
- Random or sequential prompt delivery
- Configurable countdown timer
- Burned-in text: prompt, name, HH:MM timestamp
- Structured filenames: `QuestSnap-001-name-prompt.jpg`
- Custom prompt lists from hosted text files
- localStorage persistence (name, timer, prompts, position)
- PWA-ready with manifest.json
- Confetti celebration on capture

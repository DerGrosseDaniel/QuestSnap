import seedrandom from 'seedrandom';

const CORS_PROXIES: ((url: string) => string)[] = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

export function getRandomPromptIndex(length: number, seed?: string): number {
  if (seed) {
    const rng = seedrandom(seed);
    return Math.floor(rng() * length);
  }
  return Math.floor(Math.random() * length);
}

export function getPromptForIndex(index: number, prompts: string[], seed?: string): string {
  if (seed) {
    const rng = seedrandom(seed + index);
    const randomIndex = Math.floor(rng() * prompts.length);
    return prompts[randomIndex];
  } else {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
  }
}

function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isDpasteUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?dpaste\.com\//i.test(url);
}

function isGistUrl(url: string): boolean {
  return /^https?:\/\/(gist\.github\.com|gist\.githubusercontent\.com)\//i.test(url);
}

function isPastebinUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?pastebin\.com\//i.test(url);
}

function extractPastebinId(input: string): string | null {
  const trimmed = input.trim();

  const patterns = [
    /pastebin\.com\/raw\/([a-zA-Z0-9]{8})(?:\?|$|\/)/,
    /pastebin\.com\/([a-zA-Z0-9]{8})(?:\?|$|\/)/,
    /^([a-zA-Z0-9]{8})$/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function extractDpasteId(url: string): string | null {
  const match = url.match(/dpaste\.com\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function resolveRawUrl(input: string): string | null {
  const trimmed = input.trim();

  if (isGistUrl(trimmed)) {
    if (trimmed.includes('/raw/') || trimmed.includes('gist.githubusercontent.com')) {
      return trimmed;
    }
    const match = trimmed.match(/gist\.github\.com\/([^/]+)\/([a-f0-9]+)/i);
    if (match) {
      return `https://gist.githubusercontent.com/${match[1]}/${match[2]}/raw`;
    }
    return trimmed;
  }

  if (isDpasteUrl(trimmed)) {
    if (trimmed.endsWith('.txt')) {
      return trimmed;
    }
    const id = extractDpasteId(trimmed);
    if (id) {
      return `https://dpaste.com/${id}.txt`;
    }
    return trimmed;
  }

  if (isPastebinUrl(trimmed)) {
    const id = extractPastebinId(trimmed);
    if (id) {
      return `https://pastebin.com/raw/${id}`;
    }
    return trimmed;
  }

  if (isValidUrl(trimmed)) {
    return trimmed;
  }

  const pastebinId = extractPastebinId(trimmed);
  if (pastebinId) {
    return `https://pastebin.com/raw/${pastebinId}`;
  }

  return null;
}

async function tryFetch(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const text = await response.text();

    if (/<[a-z][\s\S]*>/i.test(text)) return null;

    return text;
  } catch {
    return null;
  }
}

export async function loadCustomPromptsFromInput(input: string): Promise<string[] | null> {
  if (!input || !input.trim()) return null;

  const rawUrl = resolveRawUrl(input);
  if (!rawUrl) return null;

  const needsProxy = isPastebinUrl(rawUrl);

  if (needsProxy) {
    const fetchUrls = [rawUrl, ...CORS_PROXIES.map(proxy => proxy(rawUrl))];

    for (const fetchUrl of fetchUrls) {
      const text = await tryFetch(fetchUrl);
      if (text) {
        const prompts = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        if (prompts.length > 0) {
          return prompts;
        }
      }
    }
  } else {
    const text = await tryFetch(rawUrl);
    if (text) {
      const prompts = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (prompts.length > 0) {
        return prompts;
      }
    }
  }

  console.warn('Failed to load custom prompts');
  return null;
}

export function getStoredCustomPrompts(): string[] | null {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem('photoquest_customPrompts');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every(p => typeof p === 'string' && p.length > 0)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function saveCustomPrompts(prompts: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('photoquest_customPrompts', JSON.stringify(prompts));
}

export function clearStoredCustomPrompts() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('photoquest_customPrompts');
}

export function getStoredName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('photoquest_name') || '';
}

export function saveName(name: string) {
  if (typeof window === 'undefined') return;
  if (name) {
    localStorage.setItem('photoquest_name', name);
  } else {
    localStorage.removeItem('photoquest_name');
  }
}

export function getStoredSeed(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('photoquest_seed') || undefined;
}

export function saveSeed(seed: string | undefined) {
  if (typeof window === 'undefined') return;
  if (seed) {
    localStorage.setItem('photoquest_seed', seed);
  } else {
    localStorage.removeItem('photoquest_seed');
  }
}

export function getStoredPromptIndex(): number {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem('photoquest_promptIndex');
  return saved ? parseInt(saved, 10) : 0;
}

export function savePromptIndex(index: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('photoquest_promptIndex', index.toString());
}

export function clearPromptIndex() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('photoquest_promptIndex');
}

import seedrandom from 'seedrandom';
import { DEFAULT_PROMPTS } from './prompts';

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
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

function extractPastebinId(input: string): string | null {
  const trimmed = input.trim();
  
  // Pastebin IDs are exactly 8 alphanumeric characters
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

export async function loadCustomPromptsFromInput(input: string): Promise<string[] | null> {
  if (!input || !input.trim()) return null;
  
  const pastebinId = extractPastebinId(input);
  if (!pastebinId) return null;
  
  const targetUrl = `https://pastebin.com/raw/${pastebinId}`;
  
  // Try direct fetch first, then fall back to CORS proxies
  const fetchUrls = [targetUrl, ...CORS_PROXIES.map(proxy => proxy(targetUrl))];
  
  for (const fetchUrl of fetchUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(fetchUrl, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) continue;
      
      const text = await response.text();
      
      // Reject if response contains HTML tags (Pastebin raw should be plain text only)
      if (/<[a-z][\s\S]*>/i.test(text)) continue;
      
      const prompts = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (prompts.length > 0) {
        return prompts;
      }
    } catch (e) {
      // Try next URL
      continue;
    }
  }
  
  console.warn('Failed to load custom prompts from Pastebin');
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
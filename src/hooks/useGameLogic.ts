import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_PROMPTS } from '@/lib/prompts';
import {
  getRandomPromptIndex,
  loadCustomPromptsFromInput,
  saveCustomPrompts,
  clearStoredCustomPrompts,
  getStoredCustomPrompts,
} from '@/lib/promptEngine';

const DEFAULT_TIMER_DURATION = 60; // seconds

export function useGameLogic() {
  const [name, setNameState] = useState('');
  const [seed, setSeedState] = useState<string | undefined>(undefined);
  const [customPrompts, setCustomPromptsState] = useState<string[] | null>(null);
  const [customIndex, setCustomIndex] = useState(0);
  const [timerDuration, setTimerDuration] = useState(DEFAULT_TIMER_DURATION);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER_DURATION);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  
  const isCustomMode = customPrompts !== null;

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedName = localStorage.getItem('photoquest_name') || '';
    const storedSeed = localStorage.getItem('photoquest_seed') || undefined;
    const storedCustomPrompts = localStorage.getItem('photoquest_customPrompts');
    const storedIndex = parseInt(localStorage.getItem('photoquest_promptIndex') || '0', 10);
    const storedTimer = parseInt(localStorage.getItem('photoquest_timerDuration') || String(DEFAULT_TIMER_DURATION), 10);

    setNameState(storedName);
    setSeedState(storedSeed);
    setCustomIndex(storedIndex);
    setTimerDuration(storedTimer > 0 ? storedTimer : DEFAULT_TIMER_DURATION);
    setTimeLeft(storedTimer > 0 ? storedTimer : DEFAULT_TIMER_DURATION);

    if (storedCustomPrompts) {
      try {
        const parsed = JSON.parse(storedCustomPrompts);
        if (Array.isArray(parsed) && parsed.every(p => typeof p === 'string' && p.length > 0)) {
          setCustomPromptsState(parsed);
        }
      } catch {
        // ignore
      }
    }

    setIsHydrated(true);
  }, []);

  // Load custom prompts from URL on mount
  const hasLoadedUrl = useRef(false);
  useEffect(() => {
    if (hasLoadedUrl.current) return;
    hasLoadedUrl.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const urlPromptlist = urlParams.get('promptlist');

    if (urlPromptlist) {
      loadCustomPromptsFromInput(urlPromptlist).then(prompts => {
        if (prompts) {
          const existing = getStoredCustomPrompts();
          const isSameList = existing && JSON.stringify(existing) === JSON.stringify(prompts);

          if (isSameList) {
            return;
          }

          saveCustomPrompts(prompts);
          setCustomPromptsState(prompts);
          setCustomIndex(0);
          localStorage.setItem('photoquest_promptIndex', '0');
        }
      });
    }
  }, []);

  // Pick a random prompt for default mode
  const pickRandomPrompt = useCallback(() => {
    const idx = getRandomPromptIndex(DEFAULT_PROMPTS.length, seed);
    return DEFAULT_PROMPTS[idx];
  }, [seed]);

  // Update current prompt when mode/index/seed changes
  useEffect(() => {
    if (!isHydrated) return;
    if (isCustomMode && customPrompts) {
      const idx = customIndex % customPrompts.length;
      setCurrentPrompt(customPrompts[idx]);
    } else {
      setCurrentPrompt(pickRandomPrompt());
    }
  }, [isHydrated, isCustomMode, customPrompts, customIndex, seed, pickRandomPrompt]);

  // Timer
  useEffect(() => {
    if (!isHydrated) return;
    if (timeLeft <= 0) {
      if (isCustomMode && customPrompts) {
        setCustomIndex(prev => {
          const next = (prev + 1) % customPrompts.length;
          localStorage.setItem('photoquest_promptIndex', next.toString());
          return next;
        });
      } else {
        setCurrentPrompt(pickRandomPrompt());
      }
      setTimeLeft(timerDuration);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isHydrated, isCustomMode, customPrompts, pickRandomPrompt, timerDuration]);

  const updateName = (newName: string) => {
    setNameState(newName);
    if (newName) {
      localStorage.setItem('photoquest_name', newName);
    } else {
      localStorage.removeItem('photoquest_name');
    }
  };

  const updateSeed = (newSeed: string | undefined) => {
    setSeedState(newSeed);
    if (newSeed) {
      localStorage.setItem('photoquest_seed', newSeed);
    } else {
      localStorage.removeItem('photoquest_seed');
    }
  };

  const updateTimerDuration = (seconds: number) => {
    const duration = Math.max(1, Math.floor(seconds));
    setTimerDuration(duration);
    setTimeLeft(duration);
    localStorage.setItem('photoquest_timerDuration', String(duration));
  };

  const nextPrompt = () => {
    if (isCustomMode && customPrompts) {
      setCustomIndex(prev => {
        const next = (prev + 1) % customPrompts.length;
        localStorage.setItem('photoquest_promptIndex', next.toString());
        return next;
      });
    } else {
      setCurrentPrompt(pickRandomPrompt());
    }
    // Reset timer to configured duration
    setTimeLeft(timerDuration);
  };

  const resetPosition = () => {
    if (isCustomMode) {
      setCustomIndex(0);
      localStorage.setItem('photoquest_promptIndex', '0');
    }
  };

  const applyCustomPrompts = (prompts: string[]) => {
    saveCustomPrompts(prompts);
    setCustomPromptsState(prompts);
    setCustomIndex(0);
    localStorage.setItem('photoquest_promptIndex', '0');
  };

  const removeCustomPrompts = () => {
    clearStoredCustomPrompts();
    setCustomPromptsState(null);
    setCustomIndex(0);
    localStorage.removeItem('photoquest_promptIndex');
  };

  return {
    name,
    updateName,
    seed,
    updateSeed,
    currentPrompt,
    timeLeft,
    timerDuration,
    updateTimerDuration,
    nextPrompt,
    isCustomMode,
    customIndex,
    resetPosition,
    applyCustomPrompts,
    removeCustomPrompts,
    loadCustomPromptsFromInput,
  };
}
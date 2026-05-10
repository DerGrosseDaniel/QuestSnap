'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Hash, Info, Clock } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
  name: string;
  onUpdateName: (name: string) => void;
  isCustomMode: boolean;
  resetPosition: () => void;
  removeCustomPrompts: () => void;
  onApplyPastebin: (input: string) => Promise<{ success: boolean }>;
  timerDuration: number;
  onUpdateTimerDuration: (seconds: number) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  onClose,
  name,
  onUpdateName,
  isCustomMode,
  resetPosition,
  removeCustomPrompts,
  onApplyPastebin,
  timerDuration,
  onUpdateTimerDuration,
}) => {
  const [tempName, setTempName] = useState(name);
  const [tempTimer, setTempTimer] = useState(timerDuration.toString());
  const [pastebinInput, setPastebinInput] = useState('');
  const [pastebinError, setPastebinError] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTempName(name);
  }, [name]);

  useEffect(() => {
    setTempTimer(timerDuration.toString());
  }, [timerDuration]);

  const handleSaveName = () => {
    onUpdateName(tempName.trim());
    setSavedStatus('Name saved!');
    setTimeout(() => setSavedStatus(null), 2000);
  };

  const handleSaveTimer = () => {
    const seconds = parseInt(tempTimer, 10);
    if (seconds > 0) {
      onUpdateTimerDuration(seconds);
      setSavedStatus('Timer set!');
      setTimeout(() => setSavedStatus(null), 2000);
    }
  };

  const handleApplyPastebin = async () => {
    if (!pastebinInput.trim()) return;

    setIsLoading(true);
    setPastebinError(null);

    const result = await onApplyPastebin(pastebinInput);

    setIsLoading(false);

    if (result.success) {
      setSavedStatus('Prompts loaded!');
      setPastebinInput('');
      setTimeout(() => setSavedStatus(null), 2000);
    } else {
      setPastebinError('Failed to load prompts. Check the URL or ID.');
      setPastebinInput('');
    }
  };

  const handlePastebinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPastebinInput(e.target.value);
    if (pastebinError) setPastebinError(null);
  };

  const handleResetPosition = () => {
    resetPosition();
    setSavedStatus('Position reset!');
    setTimeout(() => setSavedStatus(null), 2000);
  };

  const handleRemoveCustomPrompts = () => {
    removeCustomPrompts();
    setPastebinInput('');
    setPastebinError(null);
    setSavedStatus('Using default prompts');
    setTimeout(() => setSavedStatus(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <header className="flex justify-between items-center p-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="text-white" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Help Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-orange-500">
            <Info size={20} />
            <h3 className="text-lg font-semibold uppercase tracking-wider">How it works</h3>
          </div>
          <div className="text-zinc-400 text-sm space-y-2 bg-zinc-900/50 p-4 rounded-lg">
            <p>
              <span className="text-white font-medium">Name:</span> Your name appears on every photo you take.
            </p>
            <p>
              <span className="text-white font-medium">Timer:</span> Countdown in seconds before the app moves to the next prompt.
            </p>
            <p>
              <span className="text-white font-medium">Custom prompts:</span> Load a custom prompt list from a hosted text file. Paste the URL or ID below. Supported services:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>
                <span className="text-green-400 font-medium">GitHub Gist (recommended):</span>{' '}
                Create a Gist at <span className="text-orange-500">gist.github.com</span> with one prompt per line. Paste the Gist URL or raw URL here. Permanent &amp; reliable with full CORS support.
              </li>
              <li>
                <span className="text-green-400 font-medium">dpaste.com:</span>{' '}
                No account needed. Paste at <span className="text-orange-500">dpaste.com</span>, then paste the URL here (add <span className="text-orange-500">.txt</span> to the end for best results).
              </li>
              <li>
                <span className="text-yellow-400 font-medium">Pastebin (unreliable):</span>{' '}
                Works inconsistently due to CORS restrictions and frequent blocking. Only use as fallback.
              </li>
            </ul>
            <p>
              <span className="text-white font-medium">Share via link:</span> Add a custom prompt list to the URL so it loads automatically. Use the <span className="text-orange-500">?promptlist=</span> parameter with any supported URL or ID:
            </p>
            <p className="text-zinc-500 text-xs break-all font-mono">
              your-site.com/?promptlist=tsA2ZAwt
              <br />
              your-site.com/?promptlist=https://gist.github.com/user/abc123
              <br />
              your-site.com/?promptlist=https://dpaste.com/ABC123
              <br />
              your-site.com/?timer=120
            </p>
            <p>
              <span className="text-white font-medium">Timer via URL:</span>{' '}
              Use <span className="text-orange-500">?timer=</span> to set the countdown in seconds (1-3600). Overrides the saved timer value.
            </p>
            <p className="text-zinc-500 text-xs italic">
              Example paste content (one prompt per line):
              <br />
              Take a photo of something blue
              <br />
              Find a texture that looks like a map
              <br />
              Capture something older than you
            </p>
            <p>
              <span className="text-white font-medium">Without custom prompts:</span> The app randomly picks from its built-in list of 350+ photo challenges.
            </p>
          </div>
        </section>

        {/* Name Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-orange-500">
            <Hash size={20} />
            <h3 className="text-lg font-semibold uppercase tracking-wider">Your Name</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="e.g. Alex"
              className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <button
              onClick={handleSaveName}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </section>

        {/* Timer Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-orange-500">
            <Clock size={20} />
            <h3 className="text-lg font-semibold uppercase tracking-wider">Timer (seconds)</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={tempTimer}
              onChange={(e) => setTempTimer(e.target.value)}
              placeholder="60"
              min="1"
              className="w-28 bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <button
              onClick={handleSaveTimer}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </section>

        {/* Custom Prompts Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-orange-500">
            <Hash size={20} />
            <h3 className="text-lg font-semibold uppercase tracking-wider">Custom Prompts</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={pastebinInput}
              onChange={handlePastebinInputChange}
              placeholder="Gist, dpaste, Pastebin URL or ID"
              className={`flex-1 bg-zinc-900 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                pastebinError ? 'border-red-500' : 'border-white/10'
              }`}
            />
            <button
              onClick={handleApplyPastebin}
              disabled={isLoading || !pastebinInput.trim()}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Load'}
            </button>
          </div>
          {pastebinError && (
            <p className="text-red-500 text-sm">{pastebinError}</p>
          )}
          {isCustomMode && (
            <p className="text-green-500 text-sm">Using custom prompt list</p>
          )}
        </section>

        {/* Actions */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold uppercase tracking-wider text-white">Actions</h3>
          <div className="space-y-2">
            <button
              onClick={handleResetPosition}
              className="w-full bg-zinc-800 text-white py-3 rounded-lg font-bold hover:bg-zinc-700 active:scale-95 transition-all"
            >
              Reset Position (start from prompt #1)
            </button>
            {isCustomMode && (
              <button
                onClick={handleRemoveCustomPrompts}
                className="w-full bg-red-900/50 text-red-200 py-3 rounded-lg font-bold hover:bg-red-900/70 active:scale-95 transition-all"
              >
                Remove Custom Prompts (use defaults)
              </button>
            )}
          </div>
        </section>
      </div>

      {savedStatus && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full">
          {savedStatus}
        </div>
      )}
    </div>
  );
};
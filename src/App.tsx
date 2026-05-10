import { useState } from 'react';
import { CameraViewfinder } from '@/components/CameraViewfinder';
import { Settings } from '@/components/Settings';
import { useGameLogic } from '@/hooks/useGameLogic';
import { processImageWithBanner, downloadBlob } from '@/lib/imageProcessor';
import { Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const {
    currentPrompt,
    timeLeft,
    nextPrompt,
    name,
    updateName,
    isCustomMode,
    customIndex,
    resetPosition,
    applyCustomPrompts,
    removeCustomPrompts,
    loadCustomPromptsFromInput,
    timerDuration,
    updateTimerDuration,
  } = useGameLogic();

  const [view, setView] = useState<'camera' | 'settings'>('camera');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const { blob: processedBlob, filename } = await processImageWithBanner(
        blob,
        currentPrompt,
        isCustomMode ? customIndex : 0,
        name,
      );
      downloadBlob(processedBlob, filename);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff5f00', '#ffffff', '#000000'],
      });

      nextPrompt();
    } catch (err) {
      console.error('Capture error:', err);
      alert('Failed to save photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPastebin = async (input: string) => {
    const prompts = await loadCustomPromptsFromInput(input);
    if (prompts) {
      applyCustomPrompts(prompts);
      return { success: true };
    }
    return { success: false };
  };

  return (
    <main className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      <div className="flex-1 relative">
        <CameraViewfinder
          prompt={currentPrompt}
          timer={timeLeft}
          onCapture={handleCapture}
          onOpenSettings={() => setView('settings')}
          name={name}
        />

        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center">
            <Zap className="text-orange-500 animate-pulse mb-4" size={48} />
            <p className="text-xl font-bold tracking-widest uppercase">Processing...</p>
          </div>
        )}
      </div>

      {view === 'settings' && (
        <Settings
          onClose={() => setView('camera')}
          name={name}
          onUpdateName={updateName}
          isCustomMode={isCustomMode}
          resetPosition={resetPosition}
          removeCustomPrompts={removeCustomPrompts}
          onApplyPastebin={handleApplyPastebin}
          timerDuration={timerDuration}
          onUpdateTimerDuration={updateTimerDuration}
        />
      )}
    </main>
  );
}

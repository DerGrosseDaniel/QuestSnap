import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { calcOptimalFontSize, wrapText } from '@/lib/imageProcessor';

const CANVAS_W = 2393;
const TEXT_MAX_W = CANVAS_W - 2 * Math.round(CANVAS_W * 0.07);

interface CameraViewfinderProps {
  onCapture: (blob: Blob) => void;
  prompt: string;
  timer: number;
  onOpenSettings: () => void;
  name: string;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({ onCapture, prompt, timer, onOpenSettings, name }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const polaroidRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [fontSizePx, setFontSizePx] = useState(24);
  const [nameFontSizePx, setNameFontSizePx] = useState(12);
  const [previewLines, setPreviewLines] = useState<string[]>([]);

  const assignStream = useCallback((newStream: MediaStream | null) => {
    if (videoRef.current) videoRef.current.srcObject = newStream;
    if (bgVideoRef.current) bgVideoRef.current.srcObject = newStream;
  }, []);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    assignStream(null);
    setStream(null);
  }, [stream, assignStream]);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopStream();

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      setStream(newStream);
      setError(null);
      assignStream(newStream);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure permissions are granted.');
    }
  }, [stopStream, assignStream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const el = polaroidRef.current;
    if (!el) return;

    const update = async () => {
      const w = el.offsetWidth;
      if (w <= 0) return;
      const bestSize = await calcOptimalFontSize(prompt);
      const scaled = bestSize * (w / CANVAS_W);
      setFontSizePx(scaled);
      setNameFontSizePx(100 * (w / CANVAS_W));

      const ctx = document.createElement('canvas').getContext('2d');
      if (ctx) {
        const lines = wrapText(ctx, prompt, bestSize, TEXT_MAX_W);
        setPreviewLines(lines);
      }
    };

    update();
    document.fonts.ready.then(update);

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [prompt]);

  const switchCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    setStream(null);
    startCamera(newMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, 'image/jpeg', 0.9);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative h-full bg-black overflow-hidden flex flex-col">
      {error ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center relative z-10">
          <p className="text-red-500 font-mono">{error}</p>
        </div>
      ) : (
        <>
          <video
            ref={bgVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-110"
            style={{ filter: 'blur(5px)', opacity: 0.35 }}
          />

          <div className="flex-1 flex items-center justify-center relative z-10 min-h-0">
            <div
              ref={polaroidRef}
              className="relative w-full"
              style={{
                maxWidth: '90vw',
                aspectRatio: '2393 / 2870',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute"
                style={{
                  left: '5.64%',
                  top: '4.70%',
                  width: '89.43%',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                }}
              />

              <img
                src="./frame.png"
                alt=""
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 1 }}
              />

              <div
                className="absolute left-0 w-full"
                style={{
                  top: '78.75%',
                  height: '21.25%',
                  zIndex: 2,
                }}
              >
                <div
                  className="polaroid-prompt text-black"
                  style={{
                    position: 'absolute',
                    left: '7%',
                    top: '7%',
                    width: '86%',
                    height: '86%',
                    overflow: 'hidden',
                    fontSize: fontSizePx,
                    lineHeight: 1.04,
                  }}
                >
                  {previewLines.length > 0
                    ? previewLines.map((line, i) => (
                        <div key={i} style={{ margin: 0 }}>{line}</div>
                      ))
                    : <p style={{ margin: 0 }}>{prompt}</p>
                  }
                </div>
              </div>

              {name && name.split('').map((char, i) => (
                <span
                  key={i}
                  className="polaroid-prompt text-black"
                  style={{
                    position: 'absolute',
                    left: `${(Math.round(CANVAS_W - 135 / 2) - 40) / CANVAS_W * 100}%`,
                    bottom: `calc(${800 / 2870 * 100}% + ${i * nameFontSizePx}px)`,
                    transform: 'rotate(-90deg) translateX(-50%)',
                    transformOrigin: 'center center',
                    zIndex: 2,
                    fontSize: nameFontSizePx,
                    lineHeight: 1,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <div
        className="absolute top-4 right-4 z-30 polaroid-prompt text-white"
        style={{
          fontSize: 'clamp(1.25rem, 4vw, 2rem)',
          textShadow: '0 0 3px #000, 0 0 3px #000',
        }}
      >
        {formatTime(timer)}
      </div>

      <div className="shrink-0 relative z-20 h-20 bg-black border-t border-white/5 flex items-center justify-around px-6">
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white transition-colors"
        >
          <Settings size={24} />
          <span className="text-[10px] uppercase tracking-tighter">Settings</span>
        </button>
        <button
          onClick={capturePhoto}
          className="w-20 h-20 bg-white/20 backdrop-blur-sm border-4 border-white rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <div className="w-16 h-16 bg-white rounded-full" />
        </button>
        <button
          onClick={switchCamera}
          className="p-3 bg-black/40 rounded-full text-white active:rotate-180 transition-transform duration-500"
        >
          <RefreshCw size={24} />
        </button>
      </div>
    </div>
  );
};

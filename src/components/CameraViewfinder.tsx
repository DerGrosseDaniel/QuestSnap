'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface CameraViewfinderProps {
  onCapture: (blob: Blob) => void;
  prompt: string;
  timer: number;
  name?: string;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({ onCapture, prompt, timer, name }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please ensure permissions are granted.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
      {error ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <p className="text-red-500 font-mono">{error}</p>
        </div>
      ) : (
        <div className="relative flex-1 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/70 to-transparent">
             <div className="flex justify-between items-start">
                <p className="text-white text-lg font-medium max-w-[70%] drop-shadow-md">
                    {prompt}
                </p>
                <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <p className="text-orange-500 font-mono text-xl font-bold">
                        {formatTime(timer)}
                    </p>
                </div>
             </div>
          </div>

          <div className="absolute bottom-10 left-0 w-full flex justify-center items-center">
             <button
                onClick={capturePhoto}
                className="w-20 h-20 bg-white/20 backdrop-blur-sm border-4 border-white rounded-full flex items-center justify-center active:scale-90 transition-transform"
             >
                <div className="w-16 h-16 bg-white rounded-full" />
             </button>
             
             <button 
                onClick={startCamera}
                className="absolute right-8 p-3 bg-black/40 rounded-full text-white active:rotate-180 transition-transform duration-500"
             >
                <RefreshCw size={24} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
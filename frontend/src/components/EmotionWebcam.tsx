"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";

interface EmotionWebcamProps {
  onEmotionUpdate: (emotion: 'happy' | 'sad' | 'angry' | 'relaxed' | 'excited' | 'neutral') => void;
  isActive: boolean;
}

export default function EmotionWebcam({ onEmotionUpdate, isActive }: EmotionWebcamProps) {
  const webcamRef = useRef<Webcam>(null);
  const [currentJoyScore, setCurrentJoyScore] = useState<number>(0);

  const captureAndAnalyze = useCallback(async () => {
    if (!webcamRef.current) return;
    
    // Capture base64 image
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      // Convert base64 to Blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append("file", blob, "webcam-frame.jpg");

      // Send to FastAPI backend
      const apiResponse = await fetch("http://localhost:8000/analyze-emotion", {
        method: "POST",
        body: formData,
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        
        // Update the joy score for the HUD
        setCurrentJoyScore(Math.round(data.happy * 100));
        
        // Notify parent of the dominant smoothed emotion
        onEmotionUpdate(data.dominant_emotion);
      }
    } catch (error) {
      console.error("Error analyzing emotion:", error);
    }
  }, [onEmotionUpdate]);

  useEffect(() => {
    if (!isActive) return;

    // Capture frames every 2 seconds
    const interval = setInterval(() => {
      captureAndAnalyze();
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, captureAndAnalyze]);

  if (!isActive) return null;

  return (
    <div className="absolute top-24 right-[var(--spacing-gutter)] md:right-[var(--spacing-container-margin)] w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden glass-panel active-glow border border-[var(--color-primary)]/20 animate-in fade-in zoom-in duration-500 z-10">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ width: 320, height: 320, facingMode: "user" }}
        className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
      />
      <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-[var(--color-surface)] to-transparent pointer-events-none">
        <div className="flex items-center justify-between">
          <span className="font-mono-data text-[10px] text-[var(--color-primary-fixed)] tracking-tighter">
            JOY {currentJoyScore}%
          </span>
          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-ping"></div>
        </div>
      </div>
    </div>
  );
}

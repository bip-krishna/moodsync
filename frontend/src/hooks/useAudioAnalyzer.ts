import { useState, useEffect } from 'react';

interface AudioFeatures {
  energy: number;
  bass: number;
}

export function useAudioAnalyzer(isActive: boolean) {
  const [features, setFeatures] = useState<AudioFeatures>({ energy: 0, bass: 0 });

  useEffect(() => {
    if (!isActive) return;

    // Simulate audio feature extraction
    // In a real implementation, this would use Meyda.js connected to an AudioContext
    let animationFrameId: number;
    let time = 0;

    const analyze = () => {
      time += 0.1;
      
      // Mock some rhythmic data
      const mockEnergy = (Math.sin(time) * 0.5 + 0.5) * 0.8;
      
      // Mock a bass drum hitting roughly every second
      const isBassHit = time % 10 < 2; // rough pulse
      const mockBass = isBassHit ? Math.random() * 0.5 + 0.5 : 0.1;

      setFeatures({
        energy: mockEnergy,
        bass: mockBass
      });

      animationFrameId = requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  return features;
}

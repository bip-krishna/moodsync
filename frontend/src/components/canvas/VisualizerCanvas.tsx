"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import WaveVisualizer from './WaveVisualizer';

interface VisualizerCanvasProps {
  mood: 'happy' | 'sad' | 'angry' | 'relaxed' | 'excited' | 'neutral';
  audioData: {
    energy: number;
    bass: number;
  };
}

export default function VisualizerCanvas({ mood, audioData }: VisualizerCanvasProps) {
  return (
    <div className="absolute top-0 left-0 w-full h-full z-0">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <color attach="background" args={['#0e0e10']} />
        <ambientLight intensity={0.5} />
        <WaveVisualizer mood={mood} audioData={audioData} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5} 
        />
        <Environment preset="night" />
      </Canvas>
    </div>
  );
}

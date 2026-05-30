"use client";

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaveVisualizerProps {
  mood: 'happy' | 'sad' | 'angry' | 'relaxed' | 'excited' | 'neutral';
  audioData: {
    energy: number;
    bass: number;
  };
}

export default function WaveVisualizer({ mood, audioData }: WaveVisualizerProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Determine theme colors based on mood
  const getThemeColor = () => {
    switch (mood) {
      case 'happy': return new THREE.Color('#ffb59e');
      case 'sad': return new THREE.Color('#dcb8ff');
      case 'angry': return new THREE.Color('#ffb4ab');
      case 'relaxed': return new THREE.Color('#00dbe9');
      case 'excited': return new THREE.Color('#7701d0');
      default: return new THREE.Color('#00f0ff');
    }
  };

  const themeColor = getThemeColor();

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position;
    
    // Base speed and intensity determined by mood
    let speed = 1.0;
    let waveHeight = 2.0;

    switch (mood) {
      case 'happy': speed = 2.0; waveHeight = 2.5; break;
      case 'sad': speed = 0.3; waveHeight = 1.0; break;
      case 'angry': speed = 3.0; waveHeight = 4.0; break;
      case 'relaxed': speed = 0.5; waveHeight = 1.2; break;
      case 'excited': speed = 4.0; waveHeight = 3.5; break;
      default: speed = 1.0; waveHeight = 2.0;
    }

    // Audio reactivity - scales the waves up dramatically when playing
    // If not playing, audioData will be flat/zero, so it remains a calm ripple
    const audioMultiplier = 1 + (audioData.energy * 3);
    const bassPulse = audioData.bass * 3;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // Calculate a complex wave pattern
      const wave1 = Math.sin(x * 0.3 + time * speed) * waveHeight;
      const wave2 = Math.cos(y * 0.3 + time * speed * 0.8) * waveHeight;
      
      // Radial wave from the center for bass hits
      const distFromCenter = Math.sqrt(x*x + y*y);
      const wave3 = Math.sin(distFromCenter * 0.5 - time * speed * 2) * (waveHeight * 0.5);
      
      const bassEffect = Math.max(0, 15 - distFromCenter) * bassPulse * 0.3;

      // Combine waves
      const z = ((wave1 + wave2 + wave3) * audioMultiplier * 0.5) + bassEffect;
      
      positions.setZ(i, z);
    }

    positions.needsUpdate = true;
    
    // Smoothly interpolate wireframe color
    (meshRef.current.material as THREE.MeshBasicMaterial).color.lerp(themeColor, 0.05);
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2 + 0.5, 0, 0]} position={[0, -5, -5]}>
      {/* A dense plane geometry that we will distort into waves */}
      <planeGeometry args={[60, 60, 80, 80]} />
      <meshBasicMaterial
        color={themeColor}
        wireframe={true}
        transparent={true}
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

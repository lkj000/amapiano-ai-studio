/**
 * Rhythm Demo Page
 * 
 * Real audio demo showcasing:
 * - Euclidean rhythm patterns
 * - Regional swing profiles (Gauteng, Durban, Cape Town, etc.)
 * - Beat-1 silence (Amapiano Gasp)
 * - Heritage affinity scoring
 */

import React from 'react';
import RhythmDemoEngine from '@/components/audio/RhythmDemoEngine';

const RhythmDemo: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎵 Rhythm Demo Engine</h1>
        <p className="text-muted-foreground">
          Real audio generation using Euclidean rhythms, regional South African swing profiles, 
          and heritage authenticity scoring. No mocks - actual Tone.js audio synthesis.
        </p>
      </div>
      
      <RhythmDemoEngine />
    </div>
  );
};

export default RhythmDemo;

/**
 * Waveform component for audio visualization
 */

import React from 'react';
import '../index.css';

export interface WaveformProps {
  isActive: boolean;
  level: number;
}

export function Waveform({ isActive, level }: WaveformProps): React.ReactElement {
  const bars = 12;
  const baseHeight = 8;

  return (
    <div className="waveform-container">
      {Array.from({ length: bars }).map((_, i) => {
        const heightPercent = isActive ? (level * (50 + (i % 3) * 20)) / 100 : baseHeight;
        return (
          <div
            key={i}
            className="waveform-bar"
            style={{
              height: `${Math.max(baseHeight, heightPercent)}px`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        );
      })}
    </div>
  );
}

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { PeakMeter } from './PeakMeter';
import { Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MasterOutputProps {
  onVolumeChange?: (volume: number) => void;
}

export const MasterOutput: React.FC<MasterOutputProps> = ({ onVolumeChange }) => {
  const [volume, setVolume] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateVolume(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    updateVolume(e as any);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateVolume = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const newVolume = Math.max(0, Math.min(1, 1 - y / rect.height));
    setVolume(newVolume);
    onVolumeChange?.(newVolume);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <Card className="p-4 bg-background/95 backdrop-blur border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Master Output</span>
      </div>

      <div className="flex items-center gap-4 justify-center">
        {/* Peak Meters */}
        <div className="flex gap-2">
          <div className="flex flex-col items-center gap-1">
            <PeakMeter height={200} width={16} />
            <span className="text-[10px] text-muted-foreground">L</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <PeakMeter height={200} width={16} />
            <span className="text-[10px] text-muted-foreground">R</span>
          </div>
        </div>

        {/* Master Fader */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="relative w-12 h-[200px] bg-muted/30 rounded-lg cursor-ns-resize select-none"
            onMouseDown={handleMouseDown}
          >
            {/* Fader track */}
            <div className="absolute inset-x-2 top-2 bottom-2 bg-background/50 rounded-sm">
              {/* Volume fill */}
              <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary to-primary/50 rounded-sm transition-all duration-100"
                style={{ height: `${volume * 100}%` }}
              />
            </div>

            {/* Fader knob */}
            <motion.div
              className="absolute w-14 h-8 -left-1 bg-gradient-to-b from-muted-foreground/80 to-muted-foreground/60 rounded border-2 border-primary/50 shadow-lg cursor-grab active:cursor-grabbing"
              style={{
                bottom: `calc(${volume * 100}% - 16px)`,
                boxShadow: isDragging
                  ? '0 0 20px hsl(var(--primary)), 0 4px 8px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.2)',
              }}
              animate={{
                scale: isDragging ? 1.05 : 1,
              }}
              transition={{ duration: 0.1 }}
            >
              {/* Knob grip lines */}
              <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 space-y-1">
                <div className="h-[2px] bg-foreground/30 rounded" />
                <div className="h-[2px] bg-foreground/30 rounded" />
                <div className="h-[2px] bg-foreground/30 rounded" />
              </div>
            </motion.div>

            {/* Scale markers */}
            {[0, 0.25, 0.5, 0.75, 1].map((mark) => (
              <div
                key={mark}
                className="absolute left-0 w-2 h-[1px] bg-muted-foreground/30"
                style={{ bottom: `${mark * 100}%` }}
              />
            ))}
          </div>

          <div className="text-center">
            <div className="text-xs font-mono text-foreground">
              {(volume * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-muted-foreground">Master</div>
          </div>
        </div>
      </div>

      {/* dB Display */}
      <div className="mt-4 text-center">
        <div className="text-lg font-mono font-bold text-primary">
          {volume > 0 ? `${(20 * Math.log10(volume)).toFixed(1)} dB` : '-∞ dB'}
        </div>
      </div>
    </Card>
  );
};

import React, { useEffect, useState, useRef } from 'react';

interface PeakMeterProps {
  height?: number;
  width?: number;
  animated?: boolean;
}

export const PeakMeter: React.FC<PeakMeterProps> = ({
  height = 200,
  width = 20,
  animated = true
}) => {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!animated) return;

    const animate = () => {
      // Simulate audio levels
      const newLevel = Math.random() * 0.8 + 0.1;
      setLevel(newLevel);
      
      if (newLevel > peak) {
        setPeak(newLevel);
        setTimeout(() => setPeak(0), 1000);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animated, peak]);

  const segments = 20;
  const segmentHeight = (height - (segments - 1) * 2) / segments;

  return (
    <div
      className="relative rounded-lg overflow-hidden bg-background/50 border border-muted"
      style={{ width, height }}
    >
      <div className="absolute inset-0 flex flex-col-reverse gap-[2px] p-1">
        {Array.from({ length: segments }).map((_, i) => {
          const segmentLevel = i / segments;
          const isActive = segmentLevel < level;
          const isPeak = Math.abs(segmentLevel - peak) < 0.05;
          
          let color = 'hsl(var(--muted))';
          
          if (isActive || isPeak) {
            if (segmentLevel < 0.6) {
              color = 'hsl(142, 76%, 36%)'; // Green
            } else if (segmentLevel < 0.8) {
              color = 'hsl(48, 96%, 53%)'; // Yellow
            } else {
              color = 'hsl(0, 84%, 60%)'; // Red
            }
          }

          return (
            <div
              key={i}
              className="transition-all duration-75"
              style={{
                height: segmentHeight,
                backgroundColor: color,
                boxShadow: isActive || isPeak ? `0 0 8px ${color}` : 'none',
                opacity: isActive || isPeak ? 1 : 0.2,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

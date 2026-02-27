import React, { useEffect, useState, useRef } from 'react';

interface PeakMeterProps {
  height?: number;
  width?: number;
  animated?: boolean;
  analyserNode?: AnalyserNode;
}

export const PeakMeter: React.FC<PeakMeterProps> = ({
  height = 200,
  width = 20,
  animated = true,
  analyserNode
}) => {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const animationRef = useRef<number>();
  const peakTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!animated) return;

    if (analyserNode) {
      // Real peak detection from AnalyserNode
      const bufferLength = analyserNode.fftSize;
      const timeData = new Float32Array(bufferLength);

      const animate = () => {
        analyserNode.getFloatTimeDomainData(timeData);

        // Compute RMS
        let sumSq = 0;
        for (let i = 0; i < bufferLength; i++) {
          sumSq += timeData[i] * timeData[i];
        }
        const rms = Math.sqrt(sumSq / bufferLength);
        // Map RMS (0..1 linear) to 0..1 meter range
        const newLevel = Math.min(1, rms * 4);
        setLevel(newLevel);

        if (newLevel > peak) {
          setPeak(newLevel);
          if (peakTimeoutRef.current) clearTimeout(peakTimeoutRef.current);
          peakTimeoutRef.current = setTimeout(() => setPeak(0), 1000);
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
    } else {
      // No analyser provided — show silence (0)
      setLevel(0);
      setPeak(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (peakTimeoutRef.current) {
        clearTimeout(peakTimeoutRef.current);
      }
    };
  }, [animated, analyserNode, peak]);

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

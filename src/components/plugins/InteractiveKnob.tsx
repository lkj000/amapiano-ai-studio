import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface InteractiveKnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
}

export const InteractiveKnob: React.FC<InteractiveKnobProps> = ({
  value,
  min,
  max,
  onChange,
  label,
  unit = '',
  color = 'hsl(var(--primary))',
  size = 80
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const knobRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartValue = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Initialize audio context for auditory feedback
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.gain.value = 0;
    gainNodeRef.current.connect(audioContextRef.current.destination);

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playFeedbackTone = (normalizedValue: number) => {
    if (!audioContextRef.current || !gainNodeRef.current) {
      console.log('[InteractiveKnob] Audio context not ready');
      return;
    }

    if (audioContextRef.current.state !== 'running') {
      console.log('[InteractiveKnob] Audio context not running:', audioContextRef.current.state);
      return;
    }

    try {
      // Stop previous oscillator
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {
          // Oscillator might have already stopped
        }
      }

      // Create new oscillator
      oscillatorRef.current = audioContextRef.current.createOscillator();
      oscillatorRef.current.type = 'sine';
      
      // Map value to frequency (200Hz to 800Hz)
      const frequency = 200 + (normalizedValue * 600);
      oscillatorRef.current.frequency.value = frequency;
      
      oscillatorRef.current.connect(gainNodeRef.current);
      
      // More audible volume for testing (0.1 instead of 0.02)
      gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.01);
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.08);
      
      oscillatorRef.current.start();
      oscillatorRef.current.stop(audioContextRef.current.currentTime + 0.08);
      
      console.log('[InteractiveKnob] Playing tone at', frequency.toFixed(0), 'Hz');
    } catch (error) {
      console.error('[InteractiveKnob] Error playing tone:', error);
    }
  };

  const handleMouseDown = async (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartValue.current = value;
    document.body.style.cursor = 'ns-resize';
    
    // Resume audio context on user interaction
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
      console.log('[InteractiveKnob] AudioContext resumed');
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaY = dragStartY.current - e.clientY;
    const sensitivity = (max - min) / 200; // 200px for full range
    const newValue = Math.max(min, Math.min(max, dragStartValue.current + deltaY * sensitivity));
    
    setDisplayValue(newValue);
    onChange(newValue);
    
    // Play feedback tone
    const normalizedValue = (newValue - min) / (max - min);
    playFeedbackTone(normalizedValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const rotation = ((displayValue - min) / (max - min)) * 270 - 135;
  const normalizedValue = (displayValue - min) / (max - min);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer ring */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0"
          style={{ transform: 'rotate(-135deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="2"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * (size / 2 - 4)}`}
            strokeDashoffset={`${2 * Math.PI * (size / 2 - 4) * (1 - (normalizedValue * 0.75))}`}
            strokeLinecap="round"
            className="transition-all duration-100"
          />
        </svg>

        {/* Knob body */}
        <motion.div
          ref={knobRef}
          className="absolute inset-0 rounded-full shadow-lg cursor-ns-resize flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, hsl(var(--muted-foreground) / 0.2) 0%, hsl(var(--muted-foreground) / 0.05) 100%)`,
            boxShadow: isDragging
              ? `0 0 20px ${color}, inset 0 2px 4px rgba(0,0,0,0.3)`
              : 'inset 0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)',
          }}
          onMouseDown={handleMouseDown}
          animate={{
            scale: isDragging ? 1.05 : 1,
          }}
          transition={{ duration: 0.1 }}
        >
          {/* Value display */}
          <div className="text-xs font-mono text-foreground/80">
            {displayValue.toFixed(1)}
          </div>

          {/* Indicator line */}
          <div
            className="absolute w-1 rounded-full transition-all duration-100"
            style={{
              height: size * 0.35,
              background: color,
              top: '10%',
              left: '50%',
              transformOrigin: `50% ${size * 0.4}px`,
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              boxShadow: isDragging ? `0 0 10px ${color}` : 'none',
            }}
          />
        </motion.div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="text-xs font-medium text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground">
          {displayValue.toFixed(2)} {unit}
        </div>
      </div>
    </div>
  );
};

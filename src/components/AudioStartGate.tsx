import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioStartGateProps {
  onStart: () => Promise<void> | void;
  className?: string;
}

/**
 * AudioStartGate - Overlay that requires user interaction to start audio
 * Satisfies browser autoplay policies by waiting for user gesture
 */
export const AudioStartGate: React.FC<AudioStartGateProps> = ({ onStart, className }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  // Check if audio was already started in this session
  useEffect(() => {
    const audioStarted = sessionStorage.getItem('audioContextStarted');
    if (audioStarted === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await onStart();
      sessionStorage.setItem('audioContextStarted', 'true');
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to start audio:', error);
      setIsStarting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center",
        className
      )}
    >
      <div className="max-w-md mx-auto p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative bg-gradient-primary p-6 rounded-full">
              <Volume2 className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Enable Audio</h2>
          <p className="text-muted-foreground">
            Click below to activate the audio engine and start creating music
          </p>
        </div>

        <Button 
          size="lg"
          onClick={handleStart}
          disabled={isStarting}
          className="w-full text-lg py-6 shadow-glow"
        >
          {isStarting ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Starting Audio Engine...
            </>
          ) : (
            <>
              <Headphones className="w-5 h-5 mr-2" />
              Start Audio Engine
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Professional-grade audio requires user interaction to start
        </p>
      </div>
    </div>
  );
};

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ABTestComparisonProps {
  testType: 'voice_style' | 'lyrics' | 'instrumental';
  variantA: {
    id: string;
    url?: string;
    content?: string;
    label?: string;
  };
  variantB: {
    id: string;
    url?: string;
    content?: string;
    label?: string;
  };
  context?: Record<string, unknown>;
  onVoted?: (winner: 'a' | 'b' | 'tie') => void;
}

export function ABTestComparison({
  testType,
  variantA,
  variantB,
  context,
  onVoted
}: ABTestComparisonProps) {
  const [playingVariant, setPlayingVariant] = useState<'a' | 'b' | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<'a' | 'b' | 'tie' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setStartTime(Date.now());
  }, [variantA.id, variantB.id]);

  const playVariant = (variant: 'a' | 'b') => {
    const currentAudio = variant === 'a' ? audioARef.current : audioBRef.current;
    const otherAudio = variant === 'a' ? audioBRef.current : audioARef.current;
    
    // Stop other audio
    if (otherAudio) {
      otherAudio.pause();
      otherAudio.currentTime = 0;
    }

    if (playingVariant === variant) {
      currentAudio?.pause();
      setPlayingVariant(null);
    } else {
      currentAudio?.play();
      setPlayingVariant(variant);
    }
  };

  const handleAudioEnd = () => {
    setPlayingVariant(null);
  };

  const submitVote = async (winner: 'a' | 'b' | 'tie') => {
    setSelectedWinner(winner);
    setIsSubmitting(true);
    
    const timeToDecide = Date.now() - startTime;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to vote.',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('ab_test_results')
        .insert([{
          user_id: user.id,
          test_type: testType,
          variant_a_id: variantA.id,
          variant_b_id: variantB.id,
          winner,
          time_to_decide_ms: timeToDecide,
          context: JSON.parse(JSON.stringify(context || {}))
        }]);

      if (error) throw error;

      toast({
        title: 'Vote recorded',
        description: 'Thanks for helping improve our AI!'
      });

      onVoted?.(winner);
    } catch (error) {
      console.error('Vote error:', error);
      toast({
        title: 'Vote failed',
        description: 'Failed to record your vote. Please try again.',
        variant: 'destructive'
      });
      setSelectedWinner(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAudioTest = testType === 'voice_style' || testType === 'instrumental';
  const isLyricsTest = testType === 'lyrics';

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Which sounds better?
        </CardTitle>
        <CardDescription>
          Compare two versions and pick your favorite to help train the AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Variant A */}
          <div 
            className={cn(
              'border rounded-lg p-4 transition-all cursor-pointer',
              selectedWinner === 'a' 
                ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                : 'hover:border-primary/50'
            )}
            onClick={() => !isSubmitting && submitVote('a')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Version A</span>
              {variantA.label && (
                <span className="text-xs text-muted-foreground">{variantA.label}</span>
              )}
            </div>
            
            {isAudioTest && variantA.url && (
              <div className="space-y-2">
                <audio 
                  ref={audioARef} 
                  src={variantA.url} 
                  onEnded={handleAudioEnd}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    playVariant('a');
                  }}
                >
                  {playingVariant === 'a' ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Play Version A
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {isLyricsTest && variantA.content && (
              <div className="max-h-48 overflow-y-auto text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded">
                {variantA.content}
              </div>
            )}

            {selectedWinner === 'a' && (
              <div className="mt-3 flex items-center justify-center text-primary">
                <Trophy className="h-5 w-5 mr-1" />
                Selected
              </div>
            )}
          </div>

          {/* Variant B */}
          <div 
            className={cn(
              'border rounded-lg p-4 transition-all cursor-pointer',
              selectedWinner === 'b' 
                ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                : 'hover:border-primary/50'
            )}
            onClick={() => !isSubmitting && submitVote('b')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Version B</span>
              {variantB.label && (
                <span className="text-xs text-muted-foreground">{variantB.label}</span>
              )}
            </div>
            
            {isAudioTest && variantB.url && (
              <div className="space-y-2">
                <audio 
                  ref={audioBRef} 
                  src={variantB.url} 
                  onEnded={handleAudioEnd}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    playVariant('b');
                  }}
                >
                  {playingVariant === 'b' ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Play Version B
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {isLyricsTest && variantB.content && (
              <div className="max-h-48 overflow-y-auto text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded">
                {variantB.content}
              </div>
            )}

            {selectedWinner === 'b' && (
              <div className="mt-3 flex items-center justify-center text-primary">
                <Trophy className="h-5 w-5 mr-1" />
                Selected
              </div>
            )}
          </div>
        </div>

        {/* Tie option */}
        <Button
          variant="outline"
          className={cn(
            'w-full',
            selectedWinner === 'tie' && 'border-primary bg-primary/10'
          )}
          onClick={() => !isSubmitting && submitVote('tie')}
          disabled={isSubmitting}
        >
          {isSubmitting && selectedWinner === 'tie' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Both are equally good (Tie)
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Click on a version to select it, or choose "Tie" if they're equal
        </p>
      </CardContent>
    </Card>
  );
}

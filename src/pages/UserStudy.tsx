import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, RotateCcw, ChevronRight, CheckCircle } from 'lucide-react';

interface StudyPair {
  id: string;
  baseline: string;
  amapianorized: string;
  region: string;
}

interface Response {
  pairId: string;
  baselineRating: number;
  amapianorizedRating: number;
  preferredTrack: 'A' | 'B' | null;
  feedback: string;
}

// Demo pairs - in production, these would come from the database
const STUDY_PAIRS: StudyPair[] = [
  { id: '1', baseline: '/demo/baseline-1.wav', amapianorized: '/demo/amapianorized-1.wav', region: 'johannesburg' },
  { id: '2', baseline: '/demo/baseline-2.wav', amapianorized: '/demo/amapianorized-2.wav', region: 'pretoria' },
  { id: '3', baseline: '/demo/baseline-3.wav', amapianorized: '/demo/amapianorized-3.wav', region: 'durban' },
];

export default function UserStudy() {
  const { toast } = useToast();
  const [step, setStep] = useState<'intro' | 'demographics' | 'listening' | 'complete'>('intro');
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isPlaying, setIsPlaying] = useState<'A' | 'B' | null>(null);
  const [currentRatings, setCurrentRatings] = useState({ A: 5, B: 5 });
  const [preference, setPreference] = useState<'A' | 'B' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [demographics, setDemographics] = useState({
    experience: '',
    familiarityAmapiano: '',
    role: ''
  });
  
  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);
  
  // Randomize which track is A or B (blind test)
  const [trackOrder, setTrackOrder] = useState<'baseline-first' | 'amapianorized-first'>('baseline-first');
  
  useEffect(() => {
    // Randomize track order for each pair
    setTrackOrder(Math.random() > 0.5 ? 'baseline-first' : 'amapianorized-first');
  }, [currentPairIndex]);

  const currentPair = STUDY_PAIRS[currentPairIndex];
  const progress = ((currentPairIndex + 1) / STUDY_PAIRS.length) * 100;

  const trackA = trackOrder === 'baseline-first' ? currentPair?.baseline : currentPair?.amapianorized;
  const trackB = trackOrder === 'baseline-first' ? currentPair?.amapianorized : currentPair?.baseline;

  const playTrack = (track: 'A' | 'B') => {
    const audioRef = track === 'A' ? audioRefA : audioRefB;
    const otherRef = track === 'A' ? audioRefB : audioRefA;
    
    if (otherRef.current) {
      otherRef.current.pause();
      otherRef.current.currentTime = 0;
    }
    
    if (audioRef.current) {
      if (isPlaying === track) {
        audioRef.current.pause();
        setIsPlaying(null);
      } else {
        audioRef.current.play();
        setIsPlaying(track);
      }
    }
  };

  const resetPlayback = () => {
    if (audioRefA.current) {
      audioRefA.current.pause();
      audioRefA.current.currentTime = 0;
    }
    if (audioRefB.current) {
      audioRefB.current.pause();
      audioRefB.current.currentTime = 0;
    }
    setIsPlaying(null);
  };

  const submitResponse = async () => {
    if (!preference) {
      toast({ title: "Please select which track you prefer", variant: "destructive" });
      return;
    }

    // Map A/B ratings back to baseline/amapianorized
    const baselineRating = trackOrder === 'baseline-first' ? currentRatings.A : currentRatings.B;
    const amapianorizedRating = trackOrder === 'baseline-first' ? currentRatings.B : currentRatings.A;
    const preferredActual = trackOrder === 'baseline-first' 
      ? (preference === 'A' ? 'baseline' : 'amapianorized')
      : (preference === 'A' ? 'amapianorized' : 'baseline');

    const response: Response = {
      pairId: currentPair.id,
      baselineRating,
      amapianorizedRating,
      preferredTrack: preference,
      feedback
    };

    setResponses([...responses, response]);

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('user_study_responses').insert({
        user_id: user?.id || 'anonymous',
        baseline_audio_url: currentPair.baseline,
        amapianorized_audio_url: currentPair.amapianorized,
        authenticity_rating: amapianorizedRating,
        producer_experience: demographics.experience,
        familiarity_with_amapiano: demographics.familiarityAmapiano,
        feedback: JSON.stringify({
          pairId: currentPair.id,
          region: currentPair.region,
          baselineRating,
          amapianorizedRating,
          preferredActual,
          trackOrder,
          userFeedback: feedback,
          role: demographics.role
        })
      });
    } catch (error) {
      console.error('Failed to save response:', error);
    }

    // Move to next pair or complete
    resetPlayback();
    setCurrentRatings({ A: 5, B: 5 });
    setPreference(null);
    setFeedback('');

    if (currentPairIndex < STUDY_PAIRS.length - 1) {
      setCurrentPairIndex(currentPairIndex + 1);
    } else {
      setStep('complete');
    }
  };

  const startStudy = () => {
    if (!demographics.experience || !demographics.familiarityAmapiano) {
      toast({ title: "Please complete all demographic questions", variant: "destructive" });
      return;
    }
    setStep('listening');
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Amapiano Authenticity Study</CardTitle>
            <CardDescription>
              Help us understand what makes Amapiano music feel authentic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 text-muted-foreground">
              <p>
                In this study, you'll listen to pairs of audio tracks and rate their <strong>authenticity</strong> 
                as Amapiano music on a scale of 1-10.
              </p>
              <p>
                For each pair, you'll hear Track A and Track B. After listening to both, 
                rate each track and select which one sounds more authentically Amapiano.
              </p>
              <p>
                <strong>Duration:</strong> ~10 minutes ({STUDY_PAIRS.length} comparisons)
              </p>
              <p className="text-sm">
                Your responses are anonymous and will be used for academic research purposes only.
              </p>
            </div>
            <Button onClick={() => setStep('demographics')} className="w-full">
              Begin Study <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'demographics') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle>About You</CardTitle>
            <CardDescription>Help us understand your background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Years of music production experience</Label>
              <RadioGroup value={demographics.experience} onValueChange={(v) => setDemographics({...demographics, experience: v})}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0-1" id="exp-1" />
                  <Label htmlFor="exp-1">0-1 years</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2-5" id="exp-2" />
                  <Label htmlFor="exp-2">2-5 years</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5-10" id="exp-3" />
                  <Label htmlFor="exp-3">5-10 years</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10+" id="exp-4" />
                  <Label htmlFor="exp-4">10+ years</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Familiarity with Amapiano music</Label>
              <RadioGroup value={demographics.familiarityAmapiano} onValueChange={(v) => setDemographics({...demographics, familiarityAmapiano: v})}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="fam-1" />
                  <Label htmlFor="fam-1">Not familiar</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="casual" id="fam-2" />
                  <Label htmlFor="fam-2">Casual listener</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regular" id="fam-3" />
                  <Label htmlFor="fam-3">Regular listener</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="producer" id="fam-4" />
                  <Label htmlFor="fam-4">Producer/DJ in genre</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Primary role in music</Label>
              <RadioGroup value={demographics.role} onValueChange={(v) => setDemographics({...demographics, role: v})}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="listener" id="role-1" />
                  <Label htmlFor="role-1">Listener/Enthusiast</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="producer" id="role-2" />
                  <Label htmlFor="role-2">Music Producer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dj" id="role-3" />
                  <Label htmlFor="role-3">DJ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="artist" id="role-4" />
                  <Label htmlFor="role-4">Recording Artist</Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={startStudy} className="w-full">
              Start Listening Test <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'complete') {
    const amapianorizedPreferred = responses.filter(r => {
      // Check if amapianorized was preferred based on track order
      return r.preferredTrack === 'B'; // Simplified - actual logic in submitResponse
    }).length;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription>Your responses have been recorded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground">
              You completed {STUDY_PAIRS.length} comparisons. Your feedback will help improve 
              AI-generated Amapiano music authenticity.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{responses.length}</div>
                <div className="text-muted-foreground">Comparisons</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {Math.round(responses.reduce((acc, r) => acc + r.amapianorizedRating, 0) / responses.length * 10) / 10}
                </div>
                <div className="text-muted-foreground">Avg Rating</div>
              </div>
            </div>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Listening test step
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Comparison {currentPairIndex + 1} of {STUDY_PAIRS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Audio Players */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Track A */}
          <Card className={`${isPlaying === 'A' ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <CardTitle className="text-lg">Track A</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <audio ref={audioRefA} src={trackA} onEnded={() => setIsPlaying(null)} />
              <div className="flex gap-2">
                <Button 
                  onClick={() => playTrack('A')} 
                  variant={isPlaying === 'A' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  {isPlaying === 'A' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isPlaying === 'A' ? 'Pause' : 'Play'}
                </Button>
                <Button variant="ghost" size="icon" onClick={resetPlayback}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Authenticity Rating</span>
                  <span className="font-bold">{currentRatings.A}/10</span>
                </div>
                <Slider
                  value={[currentRatings.A]}
                  onValueChange={([v]) => setCurrentRatings({...currentRatings, A: v})}
                  min={1}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Not authentic</span>
                  <span>Very authentic</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Track B */}
          <Card className={`${isPlaying === 'B' ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <CardTitle className="text-lg">Track B</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <audio ref={audioRefB} src={trackB} onEnded={() => setIsPlaying(null)} />
              <div className="flex gap-2">
                <Button 
                  onClick={() => playTrack('B')} 
                  variant={isPlaying === 'B' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  {isPlaying === 'B' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isPlaying === 'B' ? 'Pause' : 'Play'}
                </Button>
                <Button variant="ghost" size="icon" onClick={resetPlayback}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Authenticity Rating</span>
                  <span className="font-bold">{currentRatings.B}/10</span>
                </div>
                <Slider
                  value={[currentRatings.B]}
                  onValueChange={([v]) => setCurrentRatings({...currentRatings, B: v})}
                  min={1}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Not authentic</span>
                  <span>Very authentic</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preference Selection */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Label className="text-base">Which track sounds more authentically Amapiano?</Label>
            <RadioGroup value={preference || ''} onValueChange={(v) => setPreference(v as 'A' | 'B')} className="flex gap-8">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A" id="pref-a" />
                <Label htmlFor="pref-a" className="font-medium">Track A</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="B" id="pref-b" />
                <Label htmlFor="pref-b" className="font-medium">Track B</Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label>What specific elements influenced your choice? (optional)</Label>
              <Textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g., drums, bass, rhythm, groove, instruments..."
                rows={2}
              />
            </div>

            <Button onClick={submitResponse} className="w-full" disabled={!preference}>
              {currentPairIndex < STUDY_PAIRS.length - 1 ? 'Next Comparison' : 'Complete Study'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

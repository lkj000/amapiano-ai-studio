/**
 * Training Sample Card
 * 
 * Display and annotate individual training samples
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Play, 
  Pause, 
  Star, 
  CheckCircle2, 
  Loader2,
  Music2,
  Wand2,
  GitBranch
} from 'lucide-react';

interface TrainingSample {
  id: string;
  filename: string;
  storage_path: string;
  duration_seconds: number | null;
  bpm: number | null;
  key_signature: string | null;
  subgenre: string | null;
  region: string | null;
  mood: string[] | null;
  tags: string[] | null;
  authenticity_score: number | null;
  quality_rating: number | null;
  is_verified: boolean;
  annotation_notes: string | null;
  processing_status: string;
  stems_separated: boolean;
}

interface TrainingSampleCardProps {
  sample: TrainingSample;
  onUpdate: () => void;
}

const REGIONS = [
  'gauteng', 'kwazulu-natal', 'western-cape', 'eastern-cape',
  'mpumalanga', 'limpopo', 'north-west', 'free-state', 'northern-cape'
];

const SUBGENRES = [
  'private-school', 'dust', 'kabza-style', 'vocal-deep',
  'piano-hub', 'bacardi', 'yanos', 'sghubu', 'gqom-fusion'
];

const MOODS = [
  'energetic', 'groovy', 'emotional', 'dark', 'uplifting',
  'chill', 'aggressive', 'spiritual', 'party', 'introspective'
];

export function TrainingSampleCard({ sample, onUpdate }: TrainingSampleCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSeparating, setIsSeparating] = useState(false);
  
  const [formData, setFormData] = useState({
    subgenre: sample.subgenre || '',
    region: sample.region || '',
    mood: sample.mood || [],
    quality_rating: sample.quality_rating || 0,
    annotation_notes: sample.annotation_notes || '',
    is_verified: sample.is_verified
  });

  const loadAudio = async () => {
    if (audioUrl) return audioUrl;
    
    const { data } = supabase.storage
      .from('training-audio')
      .getPublicUrl(sample.storage_path);
    
    setAudioUrl(data.publicUrl);
    return data.publicUrl;
  };

  const togglePlay = async () => {
    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    const url = await loadAudio();
    if (!url) return;

    let audio = audioElement;
    if (!audio) {
      audio = new Audio(url);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
    }
    
    audio.play();
    setIsPlaying(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('training_samples')
        .update({
          subgenre: formData.subgenre || null,
          region: formData.region || null,
          mood: formData.mood.length > 0 ? formData.mood : null,
          quality_rating: formData.quality_rating || null,
          annotation_notes: formData.annotation_notes || null,
          is_verified: formData.is_verified
        })
        .eq('id', sample.id);

      if (error) throw error;
      toast.success('Annotation saved');
      onUpdate();
    } catch (error) {
      toast.error('Failed to save annotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Trigger analysis edge function
      const { error } = await supabase.functions.invoke('analyze-training-sample', {
        body: { sampleId: sample.id }
      });
      
      if (error) throw error;
      toast.success('Analysis started');
      onUpdate();
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStemSeparation = async () => {
    setIsSeparating(true);
    try {
      const { error } = await supabase.functions.invoke('stem-separation', {
        body: { 
          audioUrl: audioUrl || await loadAudio(),
          sampleId: sample.id
        }
      });
      
      if (error) throw error;
      toast.success('Stem separation started');
      onUpdate();
    } catch (error) {
      toast.error('Stem separation failed');
    } finally {
      setIsSeparating(false);
    }
  };

  const toggleMood = (mood: string) => {
    setFormData(prev => ({
      ...prev,
      mood: prev.mood.includes(mood)
        ? prev.mood.filter(m => m !== mood)
        : [...prev.mood, mood]
    }));
  };

  const setRating = (rating: number) => {
    setFormData(prev => ({ ...prev, quality_rating: rating }));
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-lg shrink-0"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{sample.filename}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{formatDuration(sample.duration_seconds)}</span>
              {sample.bpm && <span>• {Math.round(sample.bpm)} BPM</span>}
              {sample.key_signature && <span>• {sample.key_signature}</span>}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge 
              variant={sample.processing_status === 'complete' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {sample.processing_status}
            </Badge>
            {sample.is_verified && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>

        {/* Scores */}
        {sample.authenticity_score !== null && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div className="bg-card/50 p-2 rounded text-center">
              <p className="text-muted-foreground text-xs">Authenticity</p>
              <p className="font-bold text-lg">{(sample.authenticity_score * 100).toFixed(0)}%</p>
            </div>
          </div>
        )}

        {/* Classification */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Region</label>
            <Select 
              value={formData.region} 
              onValueChange={v => setFormData(p => ({ ...p, region: v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map(r => (
                  <SelectItem key={r} value={r}>{r.replace('-', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Subgenre</label>
            <Select 
              value={formData.subgenre} 
              onValueChange={v => setFormData(p => ({ ...p, subgenre: v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select subgenre" />
              </SelectTrigger>
              <SelectContent>
                {SUBGENRES.map(s => (
                  <SelectItem key={s} value={s}>{s.replace('-', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mood Tags */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Mood</label>
          <div className="flex flex-wrap gap-1">
            {MOODS.map(mood => (
              <Badge
                key={mood}
                variant={formData.mood.includes(mood) ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => toggleMood(mood)}
              >
                {mood}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quality Rating */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Quality Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(rating => (
              <Button
                key={rating}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRating(rating)}
              >
                <Star 
                  className={`h-5 w-5 ${
                    rating <= formData.quality_rating 
                      ? 'fill-yellow-500 text-yellow-500' 
                      : 'text-muted-foreground'
                  }`} 
                />
              </Button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Annotation Notes</label>
          <Textarea
            value={formData.annotation_notes}
            onChange={e => setFormData(p => ({ ...p, annotation_notes: e.target.value }))}
            placeholder="Add notes about this sample..."
            className="h-20 text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Save
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyze}
            disabled={isAnalyzing || sample.processing_status === 'analyzing'}
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
            Analyze
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleStemSeparation}
            disabled={isSeparating || sample.stems_separated}
          >
            {isSeparating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <GitBranch className="h-4 w-4 mr-1" />}
            {sample.stems_separated ? 'Stems Ready' : 'Separate Stems'}
          </Button>

          <Button
            size="sm"
            variant={formData.is_verified ? 'default' : 'outline'}
            onClick={() => setFormData(p => ({ ...p, is_verified: !p.is_verified }))}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {formData.is_verified ? 'Verified' : 'Mark Verified'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

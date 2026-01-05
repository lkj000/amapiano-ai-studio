/**
 * Training Sample Card - Enhanced
 * 
 * Display and annotate individual training samples with multi-dimension quality scoring
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Play, 
  Pause, 
  Star, 
  CheckCircle2, 
  Loader2,
  Wand2,
  GitBranch,
  Mic,
  Music2,
  Drum,
  Piano,
  Activity
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
  // New enhanced fields
  source?: string | null;
  language?: string | null;
  prompt?: string | null;
  has_vocals?: boolean;
  section_type?: string | null;
  quality_log_drum?: number | null;
  quality_chords?: number | null;
  quality_rhythm?: number | null;
  quality_overall?: number | null;
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
  'piano-hub', 'bacardi', 'commercial', 'sgija'
];

const MOODS = [
  'energetic', 'groovy', 'emotional', 'dark', 'uplifting',
  'chill', 'aggressive', 'spiritual', 'party', 'introspective'
];

const SOURCES = [
  { value: 'suno_ai', label: 'Suno AI' },
  { value: 'real_producer', label: 'Real Producer' },
  { value: 'splice', label: 'Splice' },
  { value: 'custom', label: 'Custom' },
  { value: 'unknown', label: 'Unknown' }
];

const LANGUAGES = [
  { value: 'instrumental', label: 'Instrumental' },
  { value: 'isizulu', label: 'IsiZulu' },
  { value: 'xhosa', label: 'Xhosa' },
  { value: 'english', label: 'English' },
  { value: 'sesotho', label: 'Sesotho' },
  { value: 'mixed', label: 'Mixed' }
];

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro' },
  { value: 'buildup', label: 'Build-Up' },
  { value: 'drop', label: 'Drop' },
  { value: 'breakdown', label: 'Breakdown' },
  { value: 'outro', label: 'Outro' },
  { value: 'full', label: 'Full Track' }
];

export function TrainingSampleCard({ sample, onUpdate }: TrainingSampleCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSeparating, setIsSeparating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [formData, setFormData] = useState({
    subgenre: sample.subgenre || '',
    region: sample.region || '',
    mood: sample.mood || [],
    quality_rating: sample.quality_rating || 0,
    annotation_notes: sample.annotation_notes || '',
    is_verified: sample.is_verified,
    // Enhanced fields
    source: sample.source || 'unknown',
    language: sample.language || 'instrumental',
    prompt: sample.prompt || '',
    has_vocals: sample.has_vocals || false,
    section_type: sample.section_type || '',
    quality_log_drum: sample.quality_log_drum || 0,
    quality_chords: sample.quality_chords || 0,
    quality_rhythm: sample.quality_rhythm || 0,
    quality_overall: sample.quality_overall || 0
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
          is_verified: formData.is_verified,
          // Enhanced fields
          source: formData.source || 'unknown',
          language: formData.language || 'instrumental',
          prompt: formData.prompt || null,
          has_vocals: formData.has_vocals,
          section_type: formData.section_type || null,
          quality_log_drum: formData.quality_log_drum || null,
          quality_chords: formData.quality_chords || null,
          quality_rhythm: formData.quality_rhythm || null,
          quality_overall: formData.quality_overall || null
        })
        .eq('id', sample.id);

      if (error) throw error;
      toast.success('Annotation saved');
      onUpdate();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save annotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const QualitySlider = ({ 
    label, 
    icon: Icon, 
    value, 
    onChange 
  }: { 
    label: string; 
    icon: React.ElementType; 
    value: number; 
    onChange: (v: number) => void;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="font-medium">{value.toFixed(1)}/5</span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={5}
        step={0.5}
        onValueChange={([v]) => onChange(v)}
        className="h-2"
      />
    </div>
  );

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

        {/* Source & Language Row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Source</label>
            <Select 
              value={formData.source} 
              onValueChange={v => setFormData(p => ({ ...p, source: v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Language</label>
            <Select 
              value={formData.language} 
              onValueChange={v => setFormData(p => ({ ...p, language: v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Section</label>
            <Select 
              value={formData.section_type} 
              onValueChange={v => setFormData(p => ({ ...p, section_type: v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {SECTION_TYPES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Has Vocals Toggle */}
        <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Has Vocals</span>
          </div>
          <Switch
            checked={formData.has_vocals}
            onCheckedChange={v => setFormData(p => ({ ...p, has_vocals: v }))}
          />
        </div>

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

        {/* Multi-Dimension Quality Scoring */}
        <div className="space-y-3 bg-muted/20 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground">Quality Scoring (4-Dimension)</p>
          <div className="grid gap-3">
            <QualitySlider
              label="Log Drum"
              icon={Drum}
              value={formData.quality_log_drum}
              onChange={v => setFormData(p => ({ ...p, quality_log_drum: v }))}
            />
            <QualitySlider
              label="Chords"
              icon={Piano}
              value={formData.quality_chords}
              onChange={v => setFormData(p => ({ ...p, quality_chords: v }))}
            />
            <QualitySlider
              label="Rhythm"
              icon={Activity}
              value={formData.quality_rhythm}
              onChange={v => setFormData(p => ({ ...p, quality_rhythm: v }))}
            />
            <QualitySlider
              label="Overall"
              icon={Music2}
              value={formData.quality_overall}
              onChange={v => setFormData(p => ({ ...p, quality_overall: v }))}
            />
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

        {/* Suno Prompt (if AI-generated) */}
        {(formData.source === 'suno_ai' || formData.prompt) && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Suno Prompt</label>
            <Textarea
              value={formData.prompt}
              onChange={e => setFormData(p => ({ ...p, prompt: e.target.value }))}
              placeholder="Enter the Suno prompt used to generate this sample..."
              className="h-16 text-sm resize-none font-mono text-xs"
            />
          </div>
        )}

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

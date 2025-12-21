import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Mic, Square, Upload, Play, Pause, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FEMALE_VOICES, MALE_VOICES, DUET_VOICES } from '@/constants/amapianoVoices';
import { SA_LANGUAGES } from '@/constants/languages';

interface VoiceSampleCollectorProps {
  onSampleUploaded?: (sampleId: string) => void;
}

export function VoiceSampleCollector({ onSampleUploaded }: VoiceSampleCollectorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceStyleId, setVoiceStyleId] = useState('');
  const [language, setLanguage] = useState('');
  const [region, setRegion] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const allVoiceStyles = [
    ...FEMALE_VOICES,
    ...MALE_VOICES,
    ...DUET_VOICES
  ];

  const regions = [
    { value: 'soweto', label: 'Soweto' },
    { value: 'pretoria', label: 'Pretoria' },
    { value: 'durban', label: 'Durban' },
    { value: 'cape-town', label: 'Cape Town' },
    { value: 'johannesburg', label: 'Johannesburg' },
    { value: 'limpopo', label: 'Limpopo' },
    { value: 'mpumalanga', label: 'Mpumalanga' },
    { value: 'eastern-cape', label: 'Eastern Cape' }
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access to record voice samples.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setRecordedBlob(file);
      // Estimate duration from file
      const audio = new Audio(URL.createObjectURL(file));
      audio.onloadedmetadata = () => {
        setRecordingDuration(Math.round(audio.duration));
      };
    }
  };

  const playRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const uploadSample = async () => {
    if (!recordedBlob || !voiceStyleId || !language) {
      toast({
        title: 'Missing information',
        description: 'Please select a voice style, language, and record/upload a sample.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to upload voice samples.',
          variant: 'destructive'
        });
        return;
      }

      // Upload to storage
      const fileName = `voice-samples/${user.id}/${voiceStyleId}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('audio-samples')
        .upload(fileName, recordedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-samples')
        .getPublicUrl(fileName);

      // Save to database
      const { data, error } = await supabase
        .from('voice_training_samples')
        .insert({
          user_id: user.id,
          voice_style_id: voiceStyleId,
          sample_url: publicUrl,
          duration_seconds: recordingDuration,
          language,
          region: region || null,
          metadata: {
            uploaded_at: new Date().toISOString(),
            file_type: recordedBlob.type
          }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sample uploaded',
        description: 'Your voice sample has been submitted for training.'
      });

      // Reset form
      setRecordedBlob(null);
      setRecordingDuration(0);
      onSampleUploaded?.(data.id);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload voice sample. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Voice Sample Collector
        </CardTitle>
        <CardDescription>
          Record or upload voice samples to train authentic Amapiano voice styles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Voice Style *</Label>
            <Select value={voiceStyleId} onValueChange={setVoiceStyleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select voice style" />
              </SelectTrigger>
              <SelectContent>
                {allVoiceStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language *</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {SA_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Region (Optional)</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-muted/30">
          {!recordedBlob ? (
            <>
              <div className="flex gap-4">
                {!isRecording ? (
                  <Button onClick={startRecording} size="lg" className="gap-2">
                    <Mic className="h-5 w-5" />
                    Start Recording
                  </Button>
                ) : (
                  <Button onClick={stopRecording} size="lg" variant="destructive" className="gap-2">
                    <Square className="h-5 w-5" />
                    Stop ({formatDuration(recordingDuration)})
                  </Button>
                )}
              </div>
              
              <div className="text-muted-foreground text-sm">or</div>
              
              <div>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="audio-upload"
                />
                <Label htmlFor="audio-upload" className="cursor-pointer">
                  <Button variant="outline" className="gap-2" asChild>
                    <span>
                      <Upload className="h-4 w-4" />
                      Upload Audio File
                    </span>
                  </Button>
                </Label>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="font-medium">Recording ready</p>
                <p className="text-sm text-muted-foreground">
                  Duration: {formatDuration(recordingDuration)}
                </p>
              </div>
              
              <div className="flex gap-2">
                {!isPlaying ? (
                  <Button onClick={playRecording} variant="outline" className="gap-2">
                    <Play className="h-4 w-4" />
                    Preview
                  </Button>
                ) : (
                  <Button onClick={stopPlayback} variant="outline" className="gap-2">
                    <Pause className="h-4 w-4" />
                    Stop
                  </Button>
                )}
                
                <Button 
                  onClick={() => setRecordedBlob(null)} 
                  variant="ghost"
                >
                  Record Again
                </Button>
              </div>
            </>
          )}
        </div>

        <Button 
          onClick={uploadSample} 
          disabled={!recordedBlob || !voiceStyleId || !language || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            'Submit Voice Sample'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Voice samples should be 5-30 seconds of clear singing or vocals. 
          These samples help train AI to replicate authentic Amapiano voice styles.
        </p>
      </CardContent>
    </Card>
  );
}

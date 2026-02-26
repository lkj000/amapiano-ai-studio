import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Volume2, 
  Languages, 
  Sparkles,
  Download,
  RefreshCw
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useMultiLanguage, SupportedLanguage } from '@/hooks/useMultiLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface MultiLanguageVoiceEngineProps {
  onTrackGenerated?: (audioUrl: string, metadata: any) => void;
}

export const MultiLanguageVoiceEngine: React.FC<MultiLanguageVoiceEngineProps> = ({
  onTrackGenerated
}) => {
  const {
    currentLanguage,
    translate,
    translatePrompt,
    isTranslating,
    enhancePromptWithCulture,
    getVoiceId
  } = useMultiLanguage();

  const [textPrompt, setTextPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [generatedTrack, setGeneratedTrack] = useState<{
    audioUrl: string;
    isPlaying: boolean;
    metadata: any;
  } | null>(null);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: translate('voice.recording.started', 'Recording started'),
        description: translate('voice.recording.description', 'Speak your amapiano idea...'),
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [translate, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setProcessingStep('Transcribing audio...');
    setProgress(25);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:audio/webm;base64, prefix
        };
        reader.readAsDataURL(audioBlob);
      });

      // Send to Supabase function for transcription
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: audioBase64 }
      });

      if (error) throw error;

      const transcribedText = data.text || '';
      setTranscribedText(transcribedText);
      setProgress(50);

      // If not in English, translate the transcription
      if (currentLanguage !== 'en') {
        setProcessingStep('Translating to English...');
        const translatedText = await translatePrompt(transcribedText, 'en');
        setTextPrompt(translatedText);
      } else {
        setTextPrompt(transcribedText);
      }

      setProgress(75);
      toast({
        title: "Transcription Complete",
        description: `Recognized: "${transcribedText.substring(0, 50)}..."`,
      });

    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProgress(0);
    }
  }, [currentLanguage, translatePrompt, toast]);

  const generateMusic = useCallback(async () => {
    if (!textPrompt.trim()) {
      toast({
        title: "No Prompt",
        description: "Please enter a text prompt or record your voice.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      setProcessingStep('Enhancing prompt with cultural context...');
      setProgress(20);
      
      // Enhance prompt with cultural context
      const culturallyEnhancedPrompt = enhancePromptWithCulture(textPrompt, currentLanguage);
      
      setProcessingStep('Generating amapiano track...');
      setProgress(40);

      // Generate music using AI
      const { data, error } = await supabase.functions.invoke('ai-music-generation', {
        body: {
          prompt: culturallyEnhancedPrompt,
          type: 'voice_to_music',
          language: currentLanguage,
          cultural_context: true,
          generation_params: {
            style: 'amapiano',
            duration: 120,
            tempo: 118,
            key: 'Am',
            language_specific_elements: true
          }
        }
      });

      if (error) throw error;

      setProgress(80);
      setProcessingStep('Finalizing track...');

      const trackMetadata = {
        originalPrompt: textPrompt,
        enhancedPrompt: culturallyEnhancedPrompt,
        language: currentLanguage,
        transcribedText,
        culturalElements: true,
        generatedAt: new Date().toISOString()
      };

      // Use real audio from edge function response
      const audioBase64 = data?.audio;
      if (!audioBase64) {
        throw new Error('No audio returned from generation API');
      }

      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
        { type: 'audio/wav' }
      );
      const realAudioUrl = URL.createObjectURL(audioBlob);

      setGeneratedTrack({
        audioUrl: realAudioUrl,
        isPlaying: false,
        metadata: trackMetadata
      });

      setProgress(100);
      
      toast({
        title: translate('voice.generation.complete', 'Track Generated!'),
        description: translate('voice.generation.success', 'Your amapiano track is ready'),
      });

      if (onTrackGenerated) {
        onTrackGenerated(realAudioUrl, trackMetadata);
      }

    } catch (error) {
      console.error('Music generation error:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate track. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProgress(0);
    }
  }, [textPrompt, currentLanguage, enhancePromptWithCulture, transcribedText, translate, toast, onTrackGenerated]);

  const togglePlayback = useCallback(() => {
    if (!generatedTrack) return;
    
    setGeneratedTrack(prev => prev ? {
      ...prev,
      isPlaying: !prev.isPlaying
    } : null);
  }, [generatedTrack]);

  const clearAll = useCallback(() => {
    setTextPrompt('');
    setTranscribedText('');
    setRecordedAudio(null);
    setGeneratedTrack(null);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              <span>{translate('voice.title', 'Multi-Language Voice Engine')}</span>
            </div>
            <LanguageSelector variant="minimal" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language Selection */}
          <div>
            <h4 className="font-medium mb-3">
              {translate('voice.language.select', 'Select Your Language')}
            </h4>
            <LanguageSelector variant="buttons" />
          </div>

          <Separator />

          {/* Voice Recording */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Mic className="w-4 h-4" />
              {translate('voice.record.title', 'Voice Input')}
            </h4>
            
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5 mr-2" />
                    {translate('voice.record.stop', 'Stop Recording')}
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    {translate('voice.record.start', 'Start Recording')}
                  </>
                )}
              </Button>

              {recordedAudio && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  {translate('voice.record.ready', 'Audio Recorded')}
                </Badge>
              )}
            </div>

            {transcribedText && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">
                  {translate('voice.transcribed', 'Transcribed Text')}:
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "{transcribedText}"
                </p>
              </div>
            )}
          </div>

          <div className="text-center text-muted-foreground">
            {translate('voice.or', 'OR')}
          </div>

          {/* Text Input */}
          <div className="space-y-3">
            <h4 className="font-medium">
              {translate('voice.text.title', 'Text Input')}
            </h4>
            <Textarea
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder={translate('voice.prompt.placeholder', 'Describe your amapiano track in your language...')}
              rows={4}
              className="resize-none"
            />
            {isTranslating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {translate('voice.translating', 'Translating...')}
              </div>
            )}
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{processingStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Generation Controls */}
          <div className="flex gap-3">
            <Button
              onClick={generateMusic}
              disabled={isProcessing || (!textPrompt.trim() && !transcribedText)}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {translate('voice.generate', 'Generate Track')}
            </Button>

            <Button variant="outline" onClick={clearAll}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {translate('voice.clear', 'Clear')}
            </Button>
          </div>

          {/* Generated Track */}
          {generatedTrack && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {translate('voice.generated.title', 'Generated Track')}
                  </h5>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayback}
                    >
                      {generatedTrack.isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">
                      {translate('voice.generated.original', 'Original Prompt')}:
                    </span>
                    <p className="text-muted-foreground italic">
                      "{generatedTrack.metadata.originalPrompt}"
                    </p>
                  </div>
                  
                  {generatedTrack.metadata.transcribedText && (
                    <div className="text-sm">
                      <span className="font-medium">
                        {translate('voice.generated.voice', 'Voice Input')}:
                      </span>
                      <p className="text-muted-foreground italic">
                        "{generatedTrack.metadata.transcribedText}"
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap mt-3">
                    <Badge>{currentLanguage.toUpperCase()}</Badge>
                    <Badge variant="secondary">
                      {translate('voice.generated.cultural', 'Cultural Elements')}
                    </Badge>
                    <Badge variant="outline">Amapiano</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
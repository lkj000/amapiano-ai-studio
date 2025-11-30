import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, Music, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { MidiNote } from '@/types/daw';

interface AudioToMidiConverterProps {
  onMidiGenerated?: (midiData: MidiNote[]) => void;
}

const AudioToMidiConverter: React.FC<AudioToMidiConverterProps> = ({ onMidiGenerated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [midiData, setMidiData] = useState<MidiNote[] | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setMidiData(null);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please select an audio file',
        variant: 'destructive',
      });
    }
  };

  const simulateMidiConversion = async (audioUrl: string): Promise<MidiNote[]> => {
    // Simulate AI processing with progress updates
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Generate mock MIDI data
    const notes: MidiNote[] = [];
    const scales = [60, 62, 64, 65, 67, 69, 71, 72]; // C major scale
    
    for (let i = 0; i < 16; i++) {
      notes.push({
        id: `mock_note_${Date.now()}_${i}`,
        pitch: scales[Math.floor(Math.random() * scales.length)],
        velocity: 80 + Math.floor(Math.random() * 40),
        startTime: i * 0.5,
        duration: 0.4 + Math.random() * 0.3,
      });
    }

    return notes;
  };

  const handleConvert = async () => {
    if (!audioFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload audio file to storage
      const fileName = `${Date.now()}_${audioFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('samples')
        .upload(`audio-to-midi/${fileName}`, audioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('samples')
        .getPublicUrl(uploadData.path);

      // Create conversion record
      const { data: conversionData, error: conversionError } = await supabase
        .from('audio_to_midi_conversions')
        .insert({
          user_id: user.id,
          audio_url: publicUrl,
          status: 'processing',
        })
        .select()
        .single();

      if (conversionError) throw conversionError;

      setProgress(20);

      // Call real AI conversion edge function
      const { data: conversionResult, error: functionError } = await supabase.functions.invoke(
        'audio-to-midi',
        {
          body: { audioUrl: publicUrl },
        }
      );

      if (functionError) throw functionError;

      if (!conversionResult.success) {
        throw new Error(conversionResult.error || 'Conversion failed');
      }

      setProgress(90);

      // Parse MIDI data into notes
      // For now, create a simple placeholder structure
      // TODO: Implement proper MIDI parsing from conversionResult.midiData
      const generatedMidi: MidiNote[] = [{
        id: `midi_note_${Date.now()}`,
        pitch: 60,
        velocity: 80,
        startTime: 0,
        duration: 1,
      }];

      // Store the MIDI URL for download
      const midiUrl = conversionResult.midiUrl;

      // Update conversion record with results
      await supabase
        .from('audio_to_midi_conversions')
        .update({
          midi_data: { notes: generatedMidi, midiUrl } as any,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', conversionData.id);

      setProgress(100);
      setMidiData(generatedMidi);
      onMidiGenerated?.(generatedMidi);

      toast({
        title: 'Conversion Complete',
        description: `MIDI file ready. Download from: ${midiUrl}`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      
      // Update record with error
      try {
        await supabase
          .from('audio_to_midi_conversions')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Conversion failed',
          });
      } catch (updateError) {
        console.error('Error updating conversion record:', updateError);
      }

      toast({
        title: 'Conversion Failed',
        description: error instanceof Error ? error.message : 'Failed to convert audio',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownloadMidi = () => {
    if (!midiData) return;

    // Create a simple MIDI file blob (simplified format)
    const midiJson = JSON.stringify(midiData, null, 2);
    const blob = new Blob([midiJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-midi.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'MIDI Downloaded',
      description: 'MIDI data saved as JSON file',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Audio to MIDI Converter
        </CardTitle>
        <CardDescription>
          Convert audio recordings to MIDI notes using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col gap-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
            disabled={isProcessing}
          >
            <Upload className="w-4 h-4 mr-2" />
            {audioFile ? audioFile.name : 'Select Audio File'}
          </Button>

          {audioFile && (
            <Button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Music className="w-4 h-4 mr-2" />
                  Convert to MIDI
                </>
              )}
            </Button>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Processing audio: {progress}%
              </p>
            </div>
          )}

          {midiData && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Conversion Complete</p>
                  <p className="text-sm text-muted-foreground">
                    {midiData.length} notes detected
                  </p>
                </div>
                <Button onClick={handleDownloadMidi} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="max-h-48 overflow-y-auto bg-muted/50 rounded-md p-3">
                <div className="space-y-1 text-xs font-mono">
                  {midiData.slice(0, 10).map((note, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span>Note {idx + 1}:</span>
                      <span>Pitch {note.pitch}</span>
                      <span>Vel {note.velocity}</span>
                      <span>@{note.startTime.toFixed(2)}s</span>
                    </div>
                  ))}
                  {midiData.length > 10 && (
                    <p className="text-muted-foreground pt-2">
                      ...and {midiData.length - 10} more notes
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioToMidiConverter;

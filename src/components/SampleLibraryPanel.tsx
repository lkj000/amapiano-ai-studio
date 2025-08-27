import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Play, Square, Download, Upload, Music, Drum, Piano, 
  Zap, Mic, Volume2, Clock, Tag, X, Plus, Heart, Share2, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Sample, SampleLibraryUIState } from '@/types/daw';

interface SampleLibraryPanelProps {
  onClose: () => void;
  onAddSampleToTrack: (sample: Sample, trackId: string) => void;
  selectedTrackId?: string;
}

const sampleCategories = [
  { id: 'all', name: 'All Samples', icon: Music },
  { id: 'drums', name: 'Drums', icon: Drum },
  { id: 'bass', name: 'Bass', icon: Volume2 },
  { id: 'piano', name: 'Piano', icon: Piano },
  { id: 'synth', name: 'Synths', icon: Zap },
  { id: 'vocal', name: 'Vocals', icon: Mic },
  { id: 'fx', name: 'FX', icon: Volume2 },
  { id: 'loop', name: 'Loops', icon: Music },
];

export default function SampleLibraryPanel({ 
  onClose, 
  onAddSampleToTrack, 
  selectedTrackId 
}: SampleLibraryPanelProps) {
  const queryClient = useQueryClient();
  const [uiState, setUIState] = useState<SampleLibraryUIState>({
    selectedCategory: 'all',
    searchQuery: '',
    selectedSample: null,
    isPlaying: false,
    previewTime: 0
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch samples
  const { data: samples = [], isLoading } = useQuery({
    queryKey: ['samples', uiState.selectedCategory, uiState.searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('samples')
        .select('*')
        .order('created_at', { ascending: false });

      if (uiState.selectedCategory !== 'all') {
        query = query.eq('category', uiState.selectedCategory);
      }

      if (uiState.searchQuery) {
        query = query.or(`name.ilike.%${uiState.searchQuery}%,description.ilike.%${uiState.searchQuery}%,tags.cs.{${uiState.searchQuery}}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Sample[];
    }
  });

  // Upload sample mutation
  const uploadSampleMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Create unique filename
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `samples/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('samples')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('samples')
          .getPublicUrl(filePath);

        // Get audio duration and generate waveform
        const audioContext = new AudioContext();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const duration = audioBuffer.duration;

        // Generate waveform data
        const channelData = audioBuffer.getChannelData(0);
        const samples = 200;
        const blockSize = Math.floor(channelData.length / samples);
        const waveformData: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          const end = start + blockSize;
          let max = 0;
          
          for (let j = start; j < end; j++) {
            const sample = Math.abs(channelData[j]);
            if (sample > max) max = sample;
          }
          
          waveformData.push(max);
        }

        // Detect BPM (basic tempo detection)
        let detectedBPM = null;
        try {
          // Simple peak detection for BPM estimation
          const peaks = [];
          const threshold = 0.3;
          
          for (let i = 1; i < waveformData.length - 1; i++) {
            if (waveformData[i] > threshold && 
                waveformData[i] > waveformData[i - 1] && 
                waveformData[i] > waveformData[i + 1]) {
              peaks.push(i);
            }
          }
          
          if (peaks.length > 1) {
            const avgInterval = (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1);
            const timePerSample = duration / samples;
            const avgPeakInterval = avgInterval * timePerSample;
            detectedBPM = Math.round((60 / avgPeakInterval) / 4); // Assuming 4/4 time
          }
        } catch (e) {
          console.warn('BPM detection failed:', e);
        }

        // Save sample metadata to database
        const { data: sampleData, error: dbError } = await supabase
          .from('samples')
          .insert({
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            file_url: publicUrl,
            category: 'misc', // Default category
            duration,
            file_size: file.size,
            waveform_data: waveformData,
            bpm: detectedBPM,
            tags: [],
            is_public: false
          })
          .select()
          .single();

        if (dbError) throw dbError;

        return sampleData;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
      toast.success('Sample uploaded successfully!');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      toast.error('Failed to upload sample');
    }
  });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    uploadSampleMutation.mutate(file);
  }, [uploadSampleMutation]);

  const playSample = useCallback((sample: Sample) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(sample.fileUrl);
    audioRef.current.currentTime = 0;
    
    audioRef.current.ontimeupdate = () => {
      if (audioRef.current) {
        setUIState(prev => ({ ...prev, previewTime: audioRef.current!.currentTime }));
      }
    };

    audioRef.current.onended = () => {
      setUIState(prev => ({ ...prev, isPlaying: false, previewTime: 0, selectedSample: null }));
    };

    audioRef.current.play();
    setUIState(prev => ({ ...prev, isPlaying: true, selectedSample: sample }));
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setUIState(prev => ({ ...prev, isPlaying: false, previewTime: 0, selectedSample: null }));
  }, []);

  const renderWaveform = (sample: Sample) => {
    if (!sample.waveformData) return null;

    return (
      <div className="h-12 bg-muted/20 rounded flex items-end justify-center gap-px p-1">
        {sample.waveformData.map((peak, index) => (
          <div
            key={index}
            className="bg-primary/60 flex-1 max-w-px transition-colors"
            style={{ 
              height: `${Math.max(2, peak * 100)}%`,
              backgroundColor: uiState.selectedSample?.id === sample.id && uiState.isPlaying
                ? `hsl(var(--primary))` 
                : undefined
            }}
          />
        ))}
        
        {/* Playback indicator */}
        {uiState.selectedSample?.id === sample.id && uiState.isPlaying && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
            style={{
              left: `${(uiState.previewTime / sample.duration) * 100}%`
            }}
          />
        )}
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="fixed inset-4 z-50 bg-background flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Sample Library</CardTitle>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              Version 2.0
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Sample
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search samples, tags, or keywords..."
              value={uiState.searchQuery}
              onChange={(e) => setUIState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Uploading sample...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Category Sidebar */}
          <div className="w-48 border-r bg-muted/10">
            <ScrollArea className="h-full p-4">
              <div className="space-y-2">
                {sampleCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={uiState.selectedCategory === category.id ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setUIState(prev => ({ ...prev, selectedCategory: category.id }))}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Samples Grid */}
          <div className="flex-1 overflow-auto">
            <ScrollArea className="h-full p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Music className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                    <p className="text-muted-foreground">Loading samples...</p>
                  </div>
                </div>
              ) : samples.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground">No samples found</p>
                    <p className="text-sm text-muted-foreground/70">
                      {uiState.searchQuery ? 'Try a different search term' : 'Upload some samples to get started'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {samples.map((sample) => (
                    <Card key={sample.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{sample.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {sample.category}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(sample.duration)}
                              </span>
                              {sample.bpm && (
                                <span>{sample.bpm} BPM</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (uiState.selectedSample?.id === sample.id && uiState.isPlaying) {
                                  stopPlayback();
                                } else {
                                  playSample(sample);
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              {uiState.selectedSample?.id === sample.id && uiState.isPlaying ? 
                                <Square className="w-4 h-4" /> : 
                                <Play className="w-4 h-4" />
                              }
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {/* Waveform */}
                        <div className="relative mb-3">
                          {renderWaveform(sample)}
                        </div>

                        {/* Sample Info */}
                        {sample.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {sample.description}
                          </p>
                        )}

                        {/* Tags */}
                        {sample.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {sample.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Tag className="w-2 h-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {sample.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{sample.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* File Info */}
                        <div className="text-xs text-muted-foreground mb-3">
                          {sample.fileSize && (
                            <span>{formatFileSize(sample.fileSize)} • </span>
                          )}
                          <span>{new Date(sample.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {selectedTrackId && (
                            <Button
                              size="sm"
                              onClick={() => onAddSampleToTrack(sample, selectedTrackId)}
                              className="flex-1"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add to Track
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = sample.fileUrl;
                              link.download = sample.name;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </Card>
  );
}
import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  StudioProject, 
  GeneratedClip, 
  StemTrack, 
  LyricLine,
  GenerationRequest,
  GenerationProgress,
  GenerationMode,
  StemType
} from '../SunoStudioTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEFAULT_PROJECT: StudioProject = {
  id: crypto.randomUUID(),
  name: 'Untitled Project',
  createdAt: new Date(),
  updatedAt: new Date(),
  tracks: [],
  clips: [],
  lyrics: [],
  bpm: 112,
  timeSignature: '4/4',
  duration: 0,
  playheadPosition: 0,
  zoom: 1,
};

export function useSunoStudioState() {
  const [project, setProject] = useState<StudioProject>(DEFAULT_PROJECT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('create');
  const [generationQueue, setGenerationQueue] = useState<GenerationRequest[]>([]);
  const [history, setHistory] = useState<GeneratedClip[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playheadInterval = useRef<NodeJS.Timeout | null>(null);

  // Playback controls
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      playheadInterval.current = setInterval(() => {
        if (audioRef.current) {
          setProject(prev => ({
            ...prev,
            playheadPosition: audioRef.current!.currentTime
          }));
        }
      }, 50);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playheadInterval.current) {
        clearInterval(playheadInterval.current);
      }
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProject(prev => ({ ...prev, playheadPosition: time }));
    }
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setProject(prev => ({ ...prev, zoom: Math.max(0.1, Math.min(10, zoom)) }));
  }, []);

  // Generation functions
  const generateSong = useCallback(async (request: GenerationRequest) => {
    setGenerationProgress({
      status: 'queued',
      progress: 0,
      message: 'Starting generation...'
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-song-suno', {
        body: {
          lyrics: request.lyrics,
          title: request.prompt || 'Generated Song',
          genre: request.style || 'Amapiano',
          mood: 'energetic',
          bpm: request.bpm || project.bpm,
          instrumental: request.instrumental || false,
          customMode: true,
        }
      });

      if (error) throw error;

      if (data.pending && data.taskId) {
        // Poll for completion
        await pollForCompletion(data.taskId);
      } else if (data.audioUrl) {
        handleGenerationComplete(data, request);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationProgress({
        status: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'Generation failed'
      });
      toast.error('Failed to generate song');
    }
  }, [project.bpm]);

  const pollForCompletion = async (taskId: string) => {
    let attempts = 0;
    const maxAttempts = 120;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;

      setGenerationProgress({
        status: 'generating',
        progress: Math.min(90, (attempts / maxAttempts) * 100),
        message: `Generating music... (${attempts * 3}s)`
      });

      try {
        const { data } = await supabase.functions.invoke('generate-song-suno', {
          body: { taskId }
        });

        if (data.audioUrl) {
          handleGenerationComplete(data, { mode: 'create', prompt: '' });
          return;
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }

    setGenerationProgress({
      status: 'failed',
      progress: 0,
      message: 'Generation timed out'
    });
  };

  const handleGenerationComplete = (data: any, request: GenerationRequest) => {
    const newClip: GeneratedClip = {
      id: crypto.randomUUID(),
      title: data.metadata?.title || 'Generated Song',
      audioUrl: data.audioUrl,
      imageUrl: data.imageUrl,
      duration: data.metadata?.duration || 180,
      createdAt: new Date(),
      prompt: request.prompt,
      style: request.style,
      lyrics: request.lyrics,
      metadata: {
        bpm: data.metadata?.bpm || project.bpm,
        genre: data.metadata?.genre || 'Amapiano',
        modelVersion: data.metadata?.modelVersion || 'v4',
        hasVocals: !request.instrumental,
        isInstrumental: request.instrumental || false,
      }
    };

    setProject(prev => ({
      ...prev,
      clips: [...prev.clips, newClip],
      duration: Math.max(prev.duration, newClip.duration),
    }));

    setHistory(prev => [newClip, ...prev]);
    setSelectedClipId(newClip.id);

    setGenerationProgress({
      status: 'succeeded',
      progress: 100,
      message: 'Generation complete!'
    });

    toast.success('Song generated successfully!');
    
    // Clear progress after a delay
    setTimeout(() => setGenerationProgress(null), 3000);
  };

  // Stem separation
  const separateStems = useCallback(async (clipId: string) => {
    const clip = project.clips.find(c => c.id === clipId);
    if (!clip) return;

    setGenerationProgress({
      status: 'processing',
      progress: 0,
      message: 'Separating stems...'
    });

    try {
      const { data, error } = await supabase.functions.invoke('stem-separation', {
        body: { audioUrl: clip.audioUrl, quality: 'high' }
      });

      if (error) throw error;

      if (data.predictionId) {
        // Poll for stem separation completion
        await pollStemSeparation(data.predictionId, clipId);
      }
    } catch (error) {
      console.error('Stem separation error:', error);
      setGenerationProgress({
        status: 'failed',
        progress: 0,
        message: 'Stem separation failed'
      });
      toast.error('Failed to separate stems');
    }
  }, [project.clips]);

  const pollStemSeparation = async (predictionId: string, clipId: string) => {
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;

      setGenerationProgress({
        status: 'processing',
        progress: Math.min(90, (attempts / maxAttempts) * 100),
        message: `Separating stems... (${attempts * 5}s)`
      });

      try {
        const { data } = await supabase.functions.invoke('stem-separation', {
          body: { predictionId }
        });

        if (data.status === 'succeeded' && data.stems) {
          handleStemsComplete(clipId, data.stems);
          return;
        } else if (data.status === 'failed') {
          throw new Error('Stem separation failed');
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }

    setGenerationProgress({
      status: 'failed',
      progress: 0,
      message: 'Stem separation timed out'
    });
  };

  const handleStemsComplete = (clipId: string, stems: Record<string, string>) => {
    const stemColors: Record<StemType, string> = {
      vocals: '#ef4444',
      drums: '#f97316',
      bass: '#eab308',
      other: '#22c55e',
      piano: '#3b82f6',
      guitar: '#8b5cf6',
      strings: '#ec4899',
    };

    const newTracks: StemTrack[] = Object.entries(stems).map(([type, url]) => ({
      id: crypto.randomUUID(),
      type: type as StemType,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      audioUrl: url,
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      color: stemColors[type as StemType] || '#6b7280',
      regions: []
    }));

    // Update clip with stems
    setProject(prev => ({
      ...prev,
      clips: prev.clips.map(c => 
        c.id === clipId 
          ? { ...c, stems: stems as Record<StemType, string> }
          : c
      ),
      tracks: [...prev.tracks, ...newTracks]
    }));

    setGenerationProgress({
      status: 'succeeded',
      progress: 100,
      message: 'Stems separated!'
    });

    toast.success('Stems separated successfully!');
    setTimeout(() => setGenerationProgress(null), 3000);
  };

  // Cover generation
  const generateCover = useCallback(async (
    sourceUrl: string, 
    voiceStyle: string,
    options?: { pitch?: number; preserveInstrumental?: boolean }
  ) => {
    setGenerationProgress({
      status: 'starting',
      progress: 0,
      message: 'Creating cover version...'
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-cover', {
        body: {
          sourceAudioUrl: sourceUrl,
          voiceStyle,
          pitch: options?.pitch || 0,
          preserveInstrumental: options?.preserveInstrumental ?? true
        }
      });

      if (error) throw error;

      if (data.audioUrl) {
        const coverClip: GeneratedClip = {
          id: crypto.randomUUID(),
          title: `Cover - ${voiceStyle}`,
          audioUrl: data.audioUrl,
          duration: data.duration || 180,
          createdAt: new Date(),
          isVariation: true,
          metadata: {
            bpm: project.bpm,
            genre: 'Cover',
            modelVersion: 'cover-v1',
            hasVocals: true,
            isInstrumental: false,
          }
        };

        setProject(prev => ({
          ...prev,
          clips: [...prev.clips, coverClip]
        }));

        setHistory(prev => [coverClip, ...prev]);
        setSelectedClipId(coverClip.id);

        setGenerationProgress({
          status: 'succeeded',
          progress: 100,
          message: 'Cover created!'
        });

        toast.success('Cover version created!');
      }
    } catch (error) {
      console.error('Cover error:', error);
      setGenerationProgress({
        status: 'failed',
        progress: 0,
        message: 'Cover generation failed'
      });
      toast.error('Failed to create cover');
    }
  }, [project.bpm]);

  // Extend song
  const extendSong = useCallback(async (
    clipId: string,
    direction: 'forward' | 'backward',
    duration: number = 30
  ) => {
    const clip = project.clips.find(c => c.id === clipId);
    if (!clip) return;

    setGenerationProgress({
      status: 'starting',
      progress: 0,
      message: `Extending song ${direction}...`
    });

    try {
      const { data, error } = await supabase.functions.invoke('extend-song', {
        body: {
          audioUrl: clip.audioUrl,
          direction,
          duration,
          style: clip.metadata.genre,
          bpm: clip.metadata.bpm
        }
      });

      if (error) throw error;

      if (data.audioUrl) {
        const extendedClip: GeneratedClip = {
          id: crypto.randomUUID(),
          title: `${clip.title} (Extended)`,
          audioUrl: data.audioUrl,
          duration: clip.duration + duration,
          createdAt: new Date(),
          parentClipId: clipId,
          metadata: { ...clip.metadata }
        };

        setProject(prev => ({
          ...prev,
          clips: [...prev.clips, extendedClip]
        }));

        setHistory(prev => [extendedClip, ...prev]);
        setSelectedClipId(extendedClip.id);

        setGenerationProgress({
          status: 'succeeded',
          progress: 100,
          message: 'Song extended!'
        });

        toast.success('Song extended successfully!');
      }
    } catch (error) {
      console.error('Extend error:', error);
      setGenerationProgress({
        status: 'failed',
        progress: 0,
        message: 'Extension failed'
      });
      toast.error('Failed to extend song');
    }
  }, [project.clips]);

  // Build beat around uploaded loop - Suno v5 feature
  const buildBeatAroundLoop = useCallback(async (
    loops: Array<{
      id: string;
      file: File;
      audioUrl: string;
      name: string;
      duration: number;
      type: 'loop' | 'sample' | 'vocal';
      isActive: boolean;
    }>,
    options: {
      style: string;
      prompt: string;
      bpm: number;
      key: string;
      duration: number;
      preserveLoop: boolean;
      blendAmount: number;
      addDrums: boolean;
      addBass: boolean;
      addMelody: boolean;
      addVocals: boolean;
    }
  ) => {
    setGenerationProgress({
      status: 'starting',
      progress: 0,
      message: 'Uploading your loops...'
    });

    try {
      // Convert first loop to base64 for upload
      const activeLoop = loops.find(l => l.isActive);
      if (!activeLoop) throw new Error('No active loop selected');

      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(activeLoop.file);
      });

      setGenerationProgress({
        status: 'processing',
        progress: 20,
        message: 'Analyzing tempo and key...'
      });

      // Call the beat-building API
      const { data, error } = await supabase.functions.invoke('build-beat-around-loop', {
        body: {
          audioData: base64Audio,
          loopName: activeLoop.name,
          loopType: activeLoop.type,
          style: options.style,
          prompt: options.prompt,
          bpm: options.bpm,
          key: options.key,
          duration: options.duration,
          preserveLoop: options.preserveLoop,
          blendAmount: options.blendAmount,
          addDrums: options.addDrums,
          addBass: options.addBass,
          addMelody: options.addMelody,
          addVocals: options.addVocals,
        }
      });

      if (error) throw error;

      // Edge function can return setup/auth errors as 200 JSON to avoid FunctionsHttpError
      if (data?.requiresSetup) {
        throw new Error(data.message || data.error || 'Setup required');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data.pending && data.taskId) {
        // Poll for completion
        await pollForBeatCompletion(data.taskId, activeLoop.name, options);
      } else if (data.audioUrl) {
        handleBeatComplete(data, activeLoop.name, options);
      }
    } catch (error) {
      console.error('Beat building error:', error);
      setGenerationProgress({
        status: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to build beat'
      });
      toast.error('Failed to build beat around your loop');
    }
  }, []);

  const pollForBeatCompletion = async (taskId: string, loopName: string, options: any) => {
    let attempts = 0;
    const maxAttempts = 120;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;

      setGenerationProgress({
        status: 'generating',
        progress: Math.min(90, 20 + (attempts / maxAttempts) * 70),
        message: `Building beat around ${loopName}... (${attempts * 3}s)`
      });

      try {
        const { data, error } = await supabase.functions.invoke('build-beat-around-loop', {
          body: { taskId }
        });

        if (error) throw error;

        if (data?.requiresSetup) {
          setGenerationProgress({
            status: 'failed',
            progress: 0,
            message: data.message || data.error || 'Setup required'
          });
          return;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        if (data.audioUrl) {
          handleBeatComplete(data, loopName, options);
          return;
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }

    setGenerationProgress({
      status: 'failed',
      progress: 0,
      message: 'Beat building timed out'
    });
  };

  const handleBeatComplete = (data: any, loopName: string, options: any) => {
    const newClip: GeneratedClip = {
      id: crypto.randomUUID(),
      title: data.metadata?.title || `${loopName} - AI Beat`,
      audioUrl: data.audioUrl,
      imageUrl: data.imageUrl,
      duration: data.metadata?.duration || options.duration,
      createdAt: new Date(),
      prompt: options.prompt,
      style: options.style,
      metadata: {
        bpm: data.metadata?.bpm || options.bpm,
        key: data.metadata?.key || options.key,
        genre: options.style,
        modelVersion: 'suno-v5',
        hasVocals: options.addVocals,
        isInstrumental: !options.addVocals,
      }
    };

    setProject(prev => ({
      ...prev,
      clips: [...prev.clips, newClip],
      duration: Math.max(prev.duration, newClip.duration),
      bpm: data.metadata?.bpm || options.bpm,
    }));

    setHistory(prev => [newClip, ...prev]);
    setSelectedClipId(newClip.id);

    setGenerationProgress({
      status: 'succeeded',
      progress: 100,
      message: 'Beat complete!'
    });

    toast.success('Beat built successfully around your loop!');
    setTimeout(() => setGenerationProgress(null), 3000);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (playheadInterval.current) {
        clearInterval(playheadInterval.current);
      }
    };
  }, []);

  return {
    project,
    setProject,
    isPlaying,
    play,
    pause,
    seekTo,
    setZoom,
    generationProgress,
    generationMode,
    setGenerationMode,
    selectedClipId,
    setSelectedClipId,
    generationQueue,
    history,
    audioRef,
    generateSong,
    separateStems,
    generateCover,
    extendSong,
    buildBeatAroundLoop,
  };
}

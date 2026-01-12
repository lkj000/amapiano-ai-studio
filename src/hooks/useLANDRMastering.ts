/**
 * LANDR Mastering Hook
 * Handles AI mastering with real server-side DSP processing
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MasteringSettings {
  style: 'Warm' | 'Balanced' | 'Open';
  loudness: number;
  eq_low: number;
  eq_mid: number;
  eq_high: number;
  presence: number;
  compression: number;
  stereoWidth: number;
  saturation: number;
  deEsser: number;
}

export interface MasteringAnalysis {
  lufs: number;
  peakDb: number;
  truePeakDb: number;
}

export interface MasteredTrack {
  id: string;
  name: string;
  originalFile: string;
  originalUrl: string;
  masteredUrl: string | null;
  style: string;
  lufs: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  createdAt: Date;
  settings: MasteringSettings;
  inputAnalysis?: MasteringAnalysis;
  outputAnalysis?: MasteringAnalysis;
  processingTimeMs?: number;
}

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 data URL to Blob
 */
function base64ToBlob(base64: string, mimeType: string = 'audio/wav'): Blob {
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: mimeType });
}

export function useLANDRMastering() {
  const queryClient = useQueryClient();
  const [currentTrack, setCurrentTrack] = useState<MasteredTrack | null>(null);
  const [masteredTracks, setMasteredTracks] = useState<MasteredTrack[]>([]);

  // Upload and process audio for mastering with real DSP
  const uploadAndMaster = useMutation({
    mutationFn: async ({ 
      file, 
      settings 
    }: { 
      file: File; 
      settings: MasteringSettings;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to master tracks');

      const trackId = Date.now().toString();
      const trackName = file.name.replace(/\.[^/.]+$/, '');
      
      // Create initial track state
      const track: MasteredTrack = {
        id: trackId,
        name: `${trackName} - Master.wav`,
        originalFile: file.name,
        originalUrl: '',
        masteredUrl: null,
        style: settings.style,
        lufs: settings.loudness.toString(),
        status: 'uploading',
        progress: 0,
        createdAt: new Date(),
        settings
      };
      
      setCurrentTrack(track);

      // Convert file to base64 for processing
      console.log('[useLANDRMastering] Converting file to base64...');
      const audioBase64 = await fileToBase64(file);
      
      track.progress = 20;
      setCurrentTrack({ ...track });

      // Upload original file to storage for backup
      const fileName = `${user.id}/mastering/${trackId}/${file.name}`;
      try {
        const { error: uploadError } = await supabase.storage
          .from('audio-samples')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadError) {
          const { data: { publicUrl: originalUrl } } = supabase.storage
            .from('audio-samples')
            .getPublicUrl(fileName);
          track.originalUrl = originalUrl;
        }
      } catch (storageError) {
        console.warn('[useLANDRMastering] Storage upload failed (continuing):', storageError);
      }

      track.status = 'processing';
      track.progress = 30;
      setCurrentTrack({ ...track });

      // Call real DSP mastering edge function
      console.log('[useLANDRMastering] Calling real DSP mastering...');
      const { data, error } = await supabase.functions.invoke('ai-mastering', {
        body: {
          audioData: audioBase64,
          settings: {
            style: settings.style,
            loudness: settings.loudness,
            eq: {
              low: settings.eq_low,
              mid: settings.eq_mid,
              high: settings.eq_high
            },
            presence: settings.presence,
            compression: settings.compression,
            stereoWidth: settings.stereoWidth,
            saturation: settings.saturation,
            deEsser: settings.deEsser
          },
          quality: 'master'
        }
      });

      if (error) {
        console.error('[useLANDRMastering] Edge function error:', error);
        throw new Error(error.message || 'Mastering failed');
      }

      track.progress = 80;
      setCurrentTrack({ ...track });

      console.log('[useLANDRMastering] DSP Response:', {
        success: data?.success,
        inputLufs: data?.inputAnalysis?.lufs,
        outputLufs: data?.outputAnalysis?.lufs,
        processingTime: data?.processingInfo?.timeMs
      });

      if (!data?.success) {
        throw new Error(data?.error || 'Mastering failed');
      }

      // Store analysis results
      track.inputAnalysis = data.inputAnalysis;
      track.outputAnalysis = data.outputAnalysis;
      track.processingTimeMs = data.processingInfo?.timeMs;
      track.lufs = data.outputAnalysis?.lufs?.toString() || settings.loudness.toString();

      // Handle the mastered audio
      if (data.masteredAudioBase64) {
        // Create blob URL from base64 for playback
        const masteredBlob = base64ToBlob(data.masteredAudioBase64, 'audio/wav');
        const masteredBlobUrl = URL.createObjectURL(masteredBlob);
        track.masteredUrl = masteredBlobUrl;

        // Also upload to storage if we have a URL from the server
        if (data.masteredUrl) {
          track.masteredUrl = data.masteredUrl;
        } else {
          // Upload the mastered file to storage
          try {
            const masteredFileName = `${user.id}/mastering/${trackId}/${trackName}_mastered.wav`;
            const { error: masteredUploadError } = await supabase.storage
              .from('audio-samples')
              .upload(masteredFileName, masteredBlob, {
                contentType: 'audio/wav',
                cacheControl: '3600',
                upsert: false,
              });

            if (!masteredUploadError) {
              const { data: { publicUrl: masteredPublicUrl } } = supabase.storage
                .from('audio-samples')
                .getPublicUrl(masteredFileName);
              track.masteredUrl = masteredPublicUrl;
            }
          } catch (masteredStorageError) {
            console.warn('[useLANDRMastering] Mastered storage upload failed:', masteredStorageError);
            // Keep using blob URL
          }
        }
      }

      track.status = 'complete';
      track.progress = 100;
      setCurrentTrack({ ...track });

      return track;
    },
    onSuccess: (track) => {
      setMasteredTracks(prev => [track, ...prev]);
      
      const processingTime = track.processingTimeMs 
        ? `Processed in ${(track.processingTimeMs / 1000).toFixed(1)}s` 
        : '';
      
      const lufsChange = track.inputAnalysis && track.outputAnalysis
        ? `${track.inputAnalysis.lufs.toFixed(1)} → ${track.outputAnalysis.lufs.toFixed(1)} LUFS`
        : '';

      toast.success('Real DSP Mastering Complete!', {
        description: `${processingTime}${lufsChange ? ` • ${lufsChange}` : ''}`
      });
    },
    onError: (error) => {
      console.error('[useLANDRMastering] Mastering error:', error);
      if (currentTrack) {
        setCurrentTrack({ ...currentTrack, status: 'error', progress: 0 });
      }
      toast.error('Mastering failed', {
        description: error.message || 'Please try again'
      });
    }
  });

  // Download mastered track
  const downloadMastered = useCallback(async (track: MasteredTrack) => {
    if (!track.masteredUrl) {
      toast.error('No mastered file available');
      return;
    }

    try {
      let blob: Blob;
      
      // Check if it's a blob URL or regular URL
      if (track.masteredUrl.startsWith('blob:')) {
        const response = await fetch(track.masteredUrl);
        blob = await response.blob();
      } else {
        const response = await fetch(track.masteredUrl);
        blob = await response.blob();
      }
      
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = track.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download started', {
        description: track.name
      });
    } catch (error) {
      console.error('[useLANDRMastering] Download error:', error);
      toast.error('Download failed');
    }
  }, []);

  // Save mastered track to library
  const saveToLibrary = useMutation({
    mutationFn: async (track: MasteredTrack) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      // Get a persistent URL for saving
      let persistentUrl = track.masteredUrl;
      
      // If it's a blob URL, we need to upload it first
      if (persistentUrl?.startsWith('blob:')) {
        try {
          const response = await fetch(persistentUrl);
          const blob = await response.blob();
          const fileName = `${user.id}/library/${Date.now()}_${track.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('audio-samples')
            .upload(fileName, blob, {
              contentType: 'audio/wav',
              cacheControl: '3600',
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('audio-samples')
              .getPublicUrl(fileName);
            persistentUrl = publicUrl;
          }
        } catch (uploadError) {
          console.warn('[useLANDRMastering] Library upload failed:', uploadError);
        }
      }

      const { error } = await supabase
        .from('sample_library')
        .insert({
          user_id: user.id,
          name: track.name,
          category: 'Mastered',
          sample_type: 'loop',
          audio_url: persistentUrl,
          tags: ['mastered', track.style.toLowerCase(), 'dsp'],
          is_public: false,
        });

      if (error) throw error;
      return track;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-library'] });
      toast.success('Saved to your sample library');
    },
    onError: () => {
      toast.error('Failed to save to library');
    }
  });

  return {
    currentTrack,
    masteredTracks,
    uploadAndMaster,
    downloadMastered,
    saveToLibrary,
    isProcessing: uploadAndMaster.isPending
  };
}

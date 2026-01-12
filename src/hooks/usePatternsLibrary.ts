/**
 * Patterns Library Hook - Real Supabase Integration
 * Fetches chord progressions and drum patterns from arrangement_templates table
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChordProgression {
  id: string;
  name: string;
  artist: string;
  roman: string;
  chords: string;
  key: string;
  complexity: 'Simple' | 'Intermediate' | 'Advanced';
  genre: string;
  description: string;
  culturalContext: string;
  isLiked: boolean;
  usage: string;
}

export interface DrumPattern {
  id: string;
  name: string;
  artist: string;
  complexity: 'Simple' | 'Intermediate' | 'Advanced';
  genre: string;
  timeSignature: string;
  description: string;
  technique: string;
  culturalContext: string;
  isLiked: boolean;
  bpm: string;
}

export function usePatternsLibrary() {
  const queryClient = useQueryClient();

  // Fetch patterns from arrangement_templates table
  const { data, isLoading, error } = useQuery({
    queryKey: ['patterns-library'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get public templates or user's own
      let query = supabase
        .from('arrangement_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (user) {
        query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching patterns:', error);
        throw error;
      }

      // Transform into chord progressions and drum patterns
      const chordProgressions: ChordProgression[] = [];
      const drumPatterns: DrumPattern[] = [];

      (data || []).forEach(template => {
        const sections = template.sections as any;
        
        // Check if it's a chord progression or drum pattern based on content
        if (sections?.type === 'drums' || template.name?.toLowerCase().includes('drum')) {
          drumPatterns.push({
            id: template.id,
            name: template.name,
            artist: sections?.artist || 'Unknown Artist',
            complexity: mapComplexity(sections?.complexity || template.total_bars),
            genre: template.genre || 'Classic',
            timeSignature: sections?.timeSignature || '4/4',
            description: sections?.description || `${template.total_bars} bar drum pattern`,
            technique: sections?.technique || 'Standard technique',
            culturalContext: sections?.culturalContext || 'Traditional amapiano percussion',
            isLiked: sections?.isLiked || false,
            bpm: sections?.bpm || '118-125',
          });
        } else {
          chordProgressions.push({
            id: template.id,
            name: template.name,
            artist: sections?.artist || 'Various Artists',
            roman: sections?.roman || 'i - iv - bVII - bIII',
            chords: sections?.chords || 'Cm - Fm - Bb - Eb',
            key: sections?.key || 'C minor',
            complexity: mapComplexity(sections?.complexity || template.total_bars),
            genre: template.genre || 'Classic',
            description: sections?.description || `${template.total_bars} bar progression`,
            culturalContext: sections?.culturalContext || 'Traditional amapiano harmony',
            isLiked: sections?.isLiked || false,
            usage: sections?.usage || 'Popular progression pattern',
          });
        }
      });

      return { chordProgressions, drumPatterns };
    },
  });

  // Toggle favorite for a pattern
  const toggleFavorite = useMutation({
    mutationFn: async ({ patternId, type }: { patternId: string; type: 'chord' | 'drum' }) => {
      const { data: template, error: fetchError } = await supabase
        .from('arrangement_templates')
        .select('sections')
        .eq('id', patternId)
        .single();

      if (fetchError) throw fetchError;

      const sections = template.sections as any;
      const newIsLiked = !sections?.isLiked;

      const { error } = await supabase
        .from('arrangement_templates')
        .update({ 
          sections: { ...sections, isLiked: newIsLiked } 
        })
        .eq('id', patternId);

      if (error) throw error;
      return { patternId, isLiked: newIsLiked };
    },
    onSuccess: ({ isLiked }) => {
      queryClient.invalidateQueries({ queryKey: ['patterns-library'] });
      toast.success(isLiked ? 'Added to favorites' : 'Removed from favorites');
    },
    onError: () => {
      toast.error('Failed to update favorite');
    }
  });

  // Download pattern as MIDI (simulation - would need real MIDI generation)
  const downloadPattern = useMutation({
    mutationFn: async ({ patternId, patternName }: { patternId: string; patternName: string }) => {
      // In a real implementation, this would generate actual MIDI data
      // For now, we create a simple text file with pattern info
      const { data: template, error } = await supabase
        .from('arrangement_templates')
        .select('*')
        .eq('id', patternId)
        .single();

      if (error) throw error;

      const content = JSON.stringify({
        name: template.name,
        genre: template.genre,
        sections: template.sections,
        totalBars: template.total_bars
      }, null, 2);

      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${patternName.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { patternId, patternName };
    },
    onSuccess: ({ patternName }) => {
      toast.success(`Downloaded "${patternName}"`);
    },
    onError: () => {
      toast.error('Download failed');
    }
  });

  return {
    chordProgressions: data?.chordProgressions || [],
    drumPatterns: data?.drumPatterns || [],
    isLoading,
    error,
    toggleFavorite,
    downloadPattern,
  };
}

function mapComplexity(value: number | string): 'Simple' | 'Intermediate' | 'Advanced' {
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'simple') return 'Simple';
    if (value.toLowerCase() === 'advanced') return 'Advanced';
    return 'Intermediate';
  }
  // Map total bars to complexity
  if (value <= 8) return 'Simple';
  if (value <= 16) return 'Intermediate';
  return 'Advanced';
}

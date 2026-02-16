/**
 * Sample Actions Menu
 * Cross-feature actions: Use as Reference, Add to DJ Library, Amapianorize, Open in DAW
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Wand2, Disc3, Sparkles, Music } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Sample } from '@/hooks/useSampleLibrary';

interface SampleActionsProps {
  sample: Sample;
}

export function SampleActions({ sample }: SampleActionsProps) {
  const navigate = useNavigate();

  const handleUseAsReference = () => {
    // Store reference data for the generation page
    localStorage.setItem('reference-sample', JSON.stringify({
      name: sample.name,
      audioUrl: sample.audio_url,
      bpm: sample.bpm,
      key: sample.key_signature,
      category: sample.category,
    }));
    toast.success(`"${sample.name}" set as reference`);
    navigate('/suno-studio');
  };

  const handleAddToDJ = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Log in to add tracks to DJ library');
        return;
      }

      // Check if already in DJ library
      const { data: existing } = await supabase
        .from('dj_library_tracks')
        .select('id')
        .eq('file_url', sample.audio_url)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        toast.info(`"${sample.name}" is already in your DJ library`);
        navigate('/dj-agent');
        return;
      }

      const fileExt = sample.audio_url.split('.').pop()?.split('?')[0] || 'wav';

      const { error } = await supabase
        .from('dj_library_tracks')
        .insert({
          user_id: user.id,
          title: sample.name,
          file_url: sample.audio_url,
          file_format: fileExt,
          duration_sec: sample.duration_seconds,
        });

      if (error) throw error;

      toast.success(`"${sample.name}" added to DJ library`);
      navigate('/dj-agent');
    } catch (err) {
      console.error('DJ library error:', err);
      toast.error('Failed to add to DJ library');
    }
  };

  const handleAmapianorize = () => {
    localStorage.setItem('amapianorize-source', JSON.stringify({
      name: sample.name,
      audioUrl: sample.audio_url,
      bpm: sample.bpm,
      key: sample.key_signature,
    }));
    toast.success(`Opening Amapianorizer with "${sample.name}"`);
    navigate('/amapianorize');
  };

  const handleOpenInDAW = () => {
    localStorage.setItem('daw-import-sample', JSON.stringify({
      name: sample.name,
      audioUrl: sample.audio_url,
      bpm: sample.bpm,
      key: sample.key_signature,
      category: sample.category,
      type: sample.sample_type,
    }));
    toast.success(`Loading "${sample.name}" into DAW`);
    navigate('/daw');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={handleUseAsReference} className="gap-2 cursor-pointer">
          <Wand2 className="w-4 h-4 text-primary" />
          Use as Reference
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToDJ} className="gap-2 cursor-pointer">
          <Disc3 className="w-4 h-4 text-primary" />
          Add to DJ Library
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleAmapianorize} className="gap-2 cursor-pointer">
          <Sparkles className="w-4 h-4 text-primary" />
          Amapianorize
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenInDAW} className="gap-2 cursor-pointer">
          <Music className="w-4 h-4 text-primary" />
          Open in DAW
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

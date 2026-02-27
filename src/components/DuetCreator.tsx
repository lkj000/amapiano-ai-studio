import React, { useState } from 'react';
import { useDuetCollaboration } from '@/hooks/useDuetCollaboration';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Volume2, Mic, Music } from 'lucide-react';
import { toast } from 'sonner';
import { SocialPost } from '@/hooks/useSocialFeed';
import LoadingSpinner from './LoadingSpinner';

interface DuetCreatorProps {
  originalPost: SocialPost;
  userTrackUrl?: string;
  onDuetCreated?: (duetId: string) => void;
  onClose?: () => void;
}

const DuetCreator: React.FC<DuetCreatorProps> = ({
  originalPost,
  userTrackUrl,
  onDuetCreated,
  onClose
}) => {
  const { createDuet, loading } = useDuetCollaboration();
  const [mixSettings, setMixSettings] = useState({
    originalVolume: 70,
    userVolume: 80,
    fadeInDuration: 1,
    fadeOutDuration: 1,
    syncMode: 'beat' // 'beat', 'tempo', 'manual'
  });

  const handleCreateDuet = async () => {
    if (!userTrackUrl) return;

    // Create social post for user's duet track, then link as duet collaboration
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to create duets');
      return;
    }

    const { data: duetPost, error: postError } = await supabase
      .from('social_posts')
      .insert({
        creator_id: user.id,
        title: `Duet: ${originalPost.title}`,
        audio_url: userTrackUrl,
        is_remix: true,
        original_post_id: originalPost.id,
        remix_style: 'duet',
        visibility: 'public',
        genre_tags: originalPost.genre_tags,
      })
      .select()
      .single();

    if (postError || !duetPost) {
      toast.error('Failed to create duet post');
      return;
    }

    const duet = await createDuet(originalPost.id, duetPost.id, mixSettings);
    
    if (duet && onDuetCreated) {
      onDuetCreated(duet.id);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Create Duet Collaboration
        </h3>
        <p className="text-muted-foreground text-sm">Layer your AI track over the original</p>
      </div>

      {/* Original Track Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Music className="w-4 h-4" />
            Original Track
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{originalPost.title}</p>
              <p className="text-sm text-muted-foreground">
                {originalPost.creator?.display_name || 'Unknown Artist'}
              </p>
              {originalPost.genre_tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {originalPost.genre_tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Volume2 className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Mix Settings */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Mic className="w-4 h-4" />
          Mix Settings
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Original Track Volume ({mixSettings.originalVolume}%)</Label>
            <Slider
              value={[mixSettings.originalVolume]}
              onValueChange={(value) => setMixSettings(prev => ({ ...prev, originalVolume: value[0] }))}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Your Track Volume ({mixSettings.userVolume}%)</Label>
            <Slider
              value={[mixSettings.userVolume]}
              onValueChange={(value) => setMixSettings(prev => ({ ...prev, userVolume: value[0] }))}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Fade In Duration ({mixSettings.fadeInDuration}s)</Label>
            <Slider
              value={[mixSettings.fadeInDuration]}
              onValueChange={(value) => setMixSettings(prev => ({ ...prev, fadeInDuration: value[0] }))}
              max={5}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Fade Out Duration ({mixSettings.fadeOutDuration}s)</Label>
            <Slider
              value={[mixSettings.fadeOutDuration]}
              onValueChange={(value) => setMixSettings(prev => ({ ...prev, fadeOutDuration: value[0] }))}
              max={5}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Sync Mode Selection */}
        <div className="space-y-2">
          <Label>Synchronization Mode</Label>
          <div className="flex gap-2">
            {[
              { value: 'beat', label: 'Beat Sync' },
              { value: 'tempo', label: 'Tempo Match' },
              { value: 'manual', label: 'Manual' }
            ].map((mode) => (
              <Button
                key={mode.value}
                variant={mixSettings.syncMode === mode.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMixSettings(prev => ({ ...prev, syncMode: mode.value }))}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        
        <Button 
          onClick={handleCreateDuet}
          disabled={loading || !userTrackUrl}
          className="ml-auto"
        >
          {loading ? (
            <LoadingSpinner size="sm" message="" className="mr-2" />
          ) : (
            <Users className="w-4 h-4 mr-2" />
          )}
          Create Duet
        </Button>
      </div>

      {!userTrackUrl && (
        <div className="text-center text-sm text-muted-foreground">
          Generate your track first to create a duet collaboration
        </div>
      )}
    </div>
  );
};

export default DuetCreator;
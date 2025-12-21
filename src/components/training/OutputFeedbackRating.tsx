import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, ThumbsDown, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OutputFeedbackRatingProps {
  outputType: 'lyrics' | 'vocals' | 'instrumental' | 'full_song';
  outputId?: string;
  outputUrl?: string;
  generationParams?: Record<string, unknown>;
  onFeedbackSubmitted?: () => void;
  compact?: boolean;
}

interface RatingCategory {
  key: 'authenticity' | 'quality' | 'cultural_accuracy' | 'voice_style_match';
  label: string;
  description: string;
}

const RATING_CATEGORIES: RatingCategory[] = [
  { key: 'authenticity', label: 'Authenticity', description: 'How authentic does it sound?' },
  { key: 'quality', label: 'Quality', description: 'Overall production quality' },
  { key: 'cultural_accuracy', label: 'Cultural Accuracy', description: 'True to SA culture' },
  { key: 'voice_style_match', label: 'Voice Match', description: 'Matches the selected style' }
];

const FEEDBACK_TAGS = [
  'Great rhythm', 'Authentic feel', 'Needs work', 'Perfect vocals',
  'Log drums on point', 'Shaker timing off', 'Bassline fire', 
  'Lyrics meaningful', 'Culturally accurate', 'Missing elements'
];

export function OutputFeedbackRating({
  outputType,
  outputId,
  outputUrl,
  generationParams,
  onFeedbackSubmitted,
  compact = false
}: OutputFeedbackRatingProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isPreferred, setIsPreferred] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const { toast } = useToast();

  const setRating = (category: string, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const submitFeedback = async () => {
    if (Object.keys(ratings).length === 0 && isPreferred === null) {
      toast({
        title: 'Please provide feedback',
        description: 'Rate at least one category or indicate if you prefer this output.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to submit feedback.',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('training_feedback')
        .insert([{
          user_id: user.id,
          output_type: outputType,
          output_id: outputId || null,
          output_url: outputUrl || null,
          authenticity_rating: ratings.authenticity || null,
          quality_rating: ratings.quality || null,
          cultural_accuracy_rating: ratings.cultural_accuracy || null,
          voice_style_match_rating: ratings.voice_style_match || null,
          is_preferred: isPreferred,
          feedback_text: feedbackText || null,
          tags: selectedTags.length > 0 ? selectedTags : null,
          generation_params: JSON.parse(JSON.stringify(generationParams || {}))
        }]);

      if (error) throw error;

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for helping improve our AI!'
      });

      // Reset form
      setRatings({});
      setIsPreferred(null);
      setFeedbackText('');
      setSelectedTags([]);
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Feedback error:', error);
      toast({
        title: 'Submission failed',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ category, value }: { category: string; value: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setRating(category, star)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              'h-5 w-5 transition-colors',
              star <= value 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-muted-foreground hover:text-yellow-400'
            )}
          />
        </button>
      ))}
    </div>
  );

  if (compact && !isExpanded) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsExpanded(true)}
        className="gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Rate This
      </Button>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Rate This {outputType.replace('_', ' ')}
            </CardTitle>
            <CardDescription>
              Your feedback helps train more authentic AI
            </CardDescription>
          </div>
          {compact && (
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick preference */}
        <div className="flex items-center gap-4">
          <Label>Overall impression:</Label>
          <div className="flex gap-2">
            <Button
              variant={isPreferred === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsPreferred(true)}
              className="gap-1"
            >
              <ThumbsUp className="h-4 w-4" />
              Like
            </Button>
            <Button
              variant={isPreferred === false ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setIsPreferred(false)}
              className="gap-1"
            >
              <ThumbsDown className="h-4 w-4" />
              Dislike
            </Button>
          </div>
        </div>

        {/* Detailed ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RATING_CATEGORIES.map((category) => (
            <div key={category.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{category.label}</Label>
                <StarRating category={category.key} value={ratings[category.key] || 0} />
              </div>
              <p className="text-xs text-muted-foreground">{category.description}</p>
            </div>
          ))}
        </div>

        {/* Quick tags */}
        <div className="space-y-2">
          <Label>Quick tags</Label>
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Text feedback */}
        <div className="space-y-2">
          <Label>Additional feedback (optional)</Label>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What could be improved? What was great?"
            rows={2}
          />
        </div>

        <Button 
          onClick={submitFeedback} 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

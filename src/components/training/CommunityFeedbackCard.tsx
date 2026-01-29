import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, Loader2, Sparkles, Music, Globe, Mic } from 'lucide-react';
import { useCommunityFeedback, CommunityFeedbackParams } from '@/hooks/useCommunityFeedback';
import { cn } from '@/lib/utils';

interface CommunityFeedbackCardProps extends CommunityFeedbackParams {
  onFeedbackSubmitted?: () => void;
  compact?: boolean;
  showModelInfo?: boolean;
}

const CULTURAL_TAGS = [
  'Authentic groove', 'Log drums fire', 'Perfect swing', 'Shaker on point',
  'Bassline deep', 'Vocals authentic', 'Cultural accuracy', 'Regional flavor',
  'Needs refinement', 'Missing elements', 'Timing off', 'Great potential'
];

const RATING_CATEGORIES = [
  { key: 'cultural', label: 'Cultural Authenticity', icon: Globe, description: 'How authentic to SA music culture?' },
  { key: 'swing', label: 'Rhythmic Swing', icon: Music, description: 'How natural is the groove feel?' },
  { key: 'overall', label: 'Overall Quality', icon: Sparkles, description: 'Overall production quality' }
] as const;

export function CommunityFeedbackCard({
  patternId,
  modelVersion = 'si-v1.0-base',
  outputType = 'pattern',
  generationParams,
  sessionId,
  generationTimeMs,
  confidenceScore,
  onFeedbackSubmitted,
  compact = false,
  showModelInfo = false
}: CommunityFeedbackCardProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const { submitFeedback, isSubmitting, isAuthenticated } = useCommunityFeedback({
    patternId,
    modelVersion,
    outputType,
    generationParams,
    sessionId,
    generationTimeMs,
    confidenceScore
  });

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

  const handleSubmit = async () => {
    const result = await submitFeedback({
      cultural: ratings.cultural,
      swing: ratings.swing,
      overall: ratings.overall,
      text: feedbackText,
      tags: selectedTags,
      isFavorite
    });

    if (result.success) {
      // Reset form
      setRatings({});
      setFeedbackText('');
      setSelectedTags([]);
      setIsFavorite(false);
      onFeedbackSubmitted?.();
    }
  };

  const StarRating = ({ category, value }: { category: string; value: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setRating(category, star)}
          className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
        >
          <Star
            className={cn(
              'h-5 w-5 transition-all duration-200',
              star <= value 
                ? 'fill-yellow-400 text-yellow-400 drop-shadow-glow' 
                : 'text-muted-foreground hover:text-yellow-400/70'
            )}
          />
        </motion.button>
      ))}
    </div>
  );

  if (compact && !isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsExpanded(true)}
          className="gap-2 border-primary/30 hover:border-primary/60"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          Rate & Train AI
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                Rate This {outputType.replace('_', ' ')}
              </CardTitle>
              <CardDescription>
                Your feedback powers our AI learning flywheel
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFavorite(!isFavorite)}
                className="focus:outline-none"
              >
                <Heart 
                  className={cn(
                    'h-6 w-6 transition-all duration-300',
                    isFavorite 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-muted-foreground hover:text-red-400'
                  )}
                />
              </motion.button>
              {compact && (
                <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
                  ×
                </Button>
              )}
            </div>
          </div>
          
          {showModelInfo && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {modelVersion}
              </Badge>
              {confidenceScore && (
                <Badge variant="outline" className="text-xs">
                  {(confidenceScore * 100).toFixed(0)}% confidence
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          {!isAuthenticated && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground text-center">
              Sign in to submit feedback and help train our AI
            </div>
          )}

          {/* Rating Categories */}
          <div className="space-y-4">
            {RATING_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <motion.div 
                  key={category.key}
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: RATING_CATEGORIES.indexOf(category) * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium">{category.label}</Label>
                    </div>
                    <StarRating 
                      category={category.key} 
                      value={ratings[category.key] || 0} 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">{category.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Tags</Label>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {CULTURAL_TAGS.map((tag, index) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Badge
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all duration-200',
                        selectedTags.includes(tag) 
                          ? 'bg-primary hover:bg-primary/80' 
                          : 'hover:border-primary/60'
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Text Feedback */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Additional Feedback (optional)</Label>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="What could be improved? What was fire? 🔥"
              rows={2}
              className="resize-none bg-background/50"
            />
          </div>

          {/* Submit Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !isAuthenticated}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Training AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Submit & Train AI
                </>
              )}
            </Button>
          </motion.div>

          <p className="text-xs text-center text-muted-foreground">
            High-quality feedback (4+ stars) becomes Ground Truth for model training
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

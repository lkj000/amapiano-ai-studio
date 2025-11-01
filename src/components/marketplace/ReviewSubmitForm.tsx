import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { usePluginMarketplace } from '@/hooks/usePluginMarketplace';

interface ReviewSubmitFormProps {
  pluginId: string;
  onReviewSubmitted: () => void;
}

export const ReviewSubmitForm = ({ pluginId, onReviewSubmitted }: ReviewSubmitFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { submitReview, loading } = usePluginMarketplace();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !title || !content) return;

    try {
      await submitReview(pluginId, { rating, title, content });
      setRating(0);
      setTitle('');
      setContent('');
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your review in one sentence"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Review</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this plugin..."
              rows={4}
              required
            />
          </div>

          <Button type="submit" disabled={loading || rating === 0 || !title || !content}>
            Submit Review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

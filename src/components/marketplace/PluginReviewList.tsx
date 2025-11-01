import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp } from 'lucide-react';
import { PluginReview } from '@/hooks/usePluginMarketplace';
import { usePluginMarketplace } from '@/hooks/usePluginMarketplace';

interface PluginReviewListProps {
  reviews: PluginReview[];
}

export const PluginReviewList = ({ reviews }: PluginReviewListProps) => {
  const { markReviewHelpful } = usePluginMarketplace();

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reviews yet. Be the first to review this plugin!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <Card key={review.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{review.user_name}</span>
                  {review.verified_purchase && (
                    <Badge variant="secondary" className="text-xs">
                      Verified Purchase
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <h4 className="font-semibold mt-2">{review.title}</h4>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{review.content}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markReviewHelpful(review.id, true)}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              Helpful ({review.helpful_count})
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

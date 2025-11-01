import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Download, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { MarketplacePlugin, PluginReview } from '@/hooks/usePluginMarketplace';
import { usePluginMarketplace } from '@/hooks/usePluginMarketplace';
import { PluginReviewList } from './PluginReviewList';
import { ReviewSubmitForm } from './ReviewSubmitForm';

interface PluginDetailsDialogProps {
  plugin: MarketplacePlugin;
  open: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

export const PluginDetailsDialog = ({ plugin, open, onClose, onPurchase }: PluginDetailsDialogProps) => {
  const [reviews, setReviews] = useState<PluginReview[]>([]);
  const { getPluginReviews } = usePluginMarketplace();

  useEffect(() => {
    if (open) {
      loadReviews();
    }
  }, [open, plugin.id]);

  const loadReviews = async () => {
    const data = await getPluginReviews(plugin.id);
    setReviews(data);
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{plugin.name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{plugin.category}</Badge>
                  <span className="text-sm text-muted-foreground">by {plugin.seller_name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold">{plugin.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Download className="h-4 w-4" />
                    <span>{plugin.downloads} downloads</span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-3xl font-bold">{formatPrice(plugin.price_cents)}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={onPurchase}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                <TabsTrigger value="details">Technical Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{plugin.description}</p>
                </div>

                {plugin.tags && plugin.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Tags</h3>
                    <div className="flex gap-2 flex-wrap">
                      {plugin.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-2">Rating Distribution</h3>
                  <div className="space-y-2">
                    {ratingDistribution.map(({ rating, count, percentage }) => (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="w-12 text-sm">{rating} ⭐</span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-400" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-12 text-sm text-muted-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4 mt-4">
                <ReviewSubmitForm pluginId={plugin.id} onReviewSubmitted={loadReviews} />
                <PluginReviewList reviews={reviews} />
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-semibold">Category:</span>
                    <span className="text-sm text-muted-foreground ml-2">{plugin.category}</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold">Downloads:</span>
                    <span className="text-sm text-muted-foreground ml-2">{plugin.downloads}</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold">Created:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {new Date(plugin.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold">Seller:</span>
                    <span className="text-sm text-muted-foreground ml-2">{plugin.seller_name}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

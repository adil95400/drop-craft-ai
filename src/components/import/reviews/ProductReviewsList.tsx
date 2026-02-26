import React, { useState } from 'react';
import { Star, CheckCircle, ThumbsUp, Trash2, Image as ImageIcon, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  verified_purchase: boolean | null;
  helpful_count: number | null;
  review_date: string | null;
  source: string | null;
  images: string[] | null;
  created_at: string;
}

interface ProductReviewsListProps {
  reviews: Review[];
  onRefresh: () => void;
}

export function ProductReviewsList({ reviews, onRefresh }: ProductReviewsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Supprimer cet avis ?')) return;
    
    setDeletingId(reviewId);
    try {
      const { error } = await supabase
        .from('imported_reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
      
      toast.success('Avis supprimé');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars 
                ? 'text-yellow-400 fill-yellow-400' 
                : hasHalf && i === fullStars 
                  ? 'text-yellow-400 fill-yellow-400/50' 
                  : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Aucun avis importé</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <Card key={review.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{review.customer_name}</span>
                {renderStars(review.rating)}
                {review.verified_purchase && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Vérifié
                  </Badge>
                )}
              </div>
              
              {/* Title */}
              {review.title && (
                <p className="font-medium mb-1">{review.title}</p>
              )}
              
              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.comment}</p>
              )}
              
              {/* Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {review.images.slice(0, 4).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="h-16 w-16 rounded object-cover"
                    />
                  ))}
                  {review.images.length > 4 && (
                    <div className="h-16 w-16 rounded bg-muted flex items-center justify-center text-sm">
                      +{review.images.length - 4}
                    </div>
                  )}
                </div>
              )}
              
              {/* Footer */}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                {review.review_date && (
                  <span>
                    {format(new Date(review.review_date), 'd MMMM yyyy', { locale: getDateFnsLocale() })}
                  </span>
                )}
                {review.helpful_count && review.helpful_count > 0 && (
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {review.helpful_count} utile(s)
                  </span>
                )}
                {review.source && (
                  <Badge variant="outline" className="text-xs">
                    {review.source}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ))}
    </div>
  );
}

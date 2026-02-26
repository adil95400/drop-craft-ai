import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academyService } from '@/services/academy.service';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface CommentsSectionProps {
  courseId: string;
  lessonId?: string;
}

export function CommentsSection({ courseId, lessonId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', courseId, lessonId],
    queryFn: () => academyService.getCourseComments(courseId),
  });

  const addCommentMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('User not found');
      return academyService.addComment(user.id, courseId, comment, lessonId, rating || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', courseId] });
      setComment('');
      setRating(null);
      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été publié avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter le commentaire',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addCommentMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Commentaires & Questions ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        {user && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partagez votre question ou votre avis..."
                  rows={3}
                />
                
                {/* Rating */}
                {!lessonId && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Votre note:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition-colors"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              rating && star <= rating
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={!comment.trim() || addCommentMutation.isPending}
                  >
                    {addCommentMutation.isPending ? 'Publication...' : 'Publier'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setComment('');
                      setRating(null);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Aucun commentaire pour le moment</p>
              <p className="text-sm">Soyez le premier à partager votre avis !</p>
            </div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 pb-4 border-b last:border-0">
                <Avatar>
                  <AvatarFallback>
                    {comment.user_id?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        Utilisateur {comment.user_id?.substring(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: getDateFnsLocale(),
                        })}
                      </p>
                    </div>
                    {comment.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(comment.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="h-8 gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span className="text-xs">{comment.likes_count || 0}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      Répondre
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReviewService } from '@/services/ReviewService';
import { useToast } from '@/hooks/use-toast';

export const useReviewManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => ReviewService.getReviews()
  });

  const createReview = useMutation({
    mutationFn: ReviewService.createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({ title: 'Avis créé avec succès' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const updateReview = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      ReviewService.updateReview(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({ title: 'Avis mis à jour' });
    }
  });

  const deleteReview = useMutation({
    mutationFn: ReviewService.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({ title: 'Avis supprimé' });
    }
  });

  // AI Moderation
  const moderateReview = useMutation({
    mutationFn: ReviewService.moderateReview,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      toast({ 
        title: 'Modération IA terminée',
        description: `Statut: ${data.status}`
      });
    }
  });

  const bulkModerate = useMutation({
    mutationFn: ReviewService.bulkModerate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      toast({ 
        title: 'Modération en masse terminée',
        description: `${data.results.length} avis traités`
      });
    }
  });

  const manualModerate = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      ReviewService.manualModerate(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      toast({ title: 'Modération appliquée' });
    }
  });

  // Stats
  const { data: moderationStats } = useQuery({
    queryKey: ['moderation-stats'],
    queryFn: ReviewService.getModerationStats
  });

  // Photos
  const uploadPhoto = useMutation({
    mutationFn: ({ reviewId, file }: { reviewId: string; file: File }) =>
      ReviewService.uploadReviewPhoto(reviewId, file),
    onSuccess: () => {
      toast({ title: 'Photo uploadée avec succès' });
    }
  });

  // Widgets
  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ['review-widgets'],
    queryFn: ReviewService.getWidgets
  });

  const createWidget = useMutation({
    mutationFn: ReviewService.createWidget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-widgets'] });
      toast({ title: 'Widget créé avec succès' });
    }
  });

  // Import Jobs
  const { data: importJobs, isLoading: importJobsLoading } = useQuery({
    queryKey: ['review-import-jobs'],
    queryFn: ReviewService.getImportJobs
  });

  const createImportJob = useMutation({
    mutationFn: ReviewService.createImportJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-import-jobs'] });
      toast({ title: 'Import démarré' });
    }
  });

  // Analytics
  const { data: analytics } = useQuery({
    queryKey: ['review-analytics'],
    queryFn: ReviewService.getReviewAnalytics
  });

  return {
    // Reviews
    reviews,
    reviewsLoading,
    createReview,
    updateReview,
    deleteReview,
    // Moderation
    moderateReview,
    bulkModerate,
    manualModerate,
    moderationStats,
    // Photos
    uploadPhoto,
    // Widgets
    widgets,
    widgetsLoading,
    createWidget,
    // Import
    importJobs,
    importJobsLoading,
    createImportJob,
    // Analytics
    analytics
  };
};

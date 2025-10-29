import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academyService } from '@/services/academy.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useAcademyProgress(courseId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user course progress
  const { data: courseProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['course-progress', user?.id, courseId],
    queryFn: () => courseId && user?.id ? academyService.getUserCourseProgress(user.id, courseId) : null,
    enabled: !!user?.id && !!courseId,
  });

  // Get all user progress
  const { data: allProgress, isLoading: isLoadingAllProgress } = useQuery({
    queryKey: ['all-progress', user?.id],
    queryFn: () => user?.id ? academyService.getUserAllProgress(user.id) : [],
    enabled: !!user?.id,
  });

  // Get user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => user?.id ? academyService.getUserStats(user.id) : null,
    enabled: !!user?.id,
  });

  // Get lesson progress for a course
  const { data: lessonProgress } = useQuery({
    queryKey: ['lesson-progress', user?.id, courseId],
    queryFn: () => courseId && user?.id ? academyService.getUserLessonProgress(user.id, courseId) : [],
    enabled: !!user?.id && !!courseId,
  });

  // Update lesson progress mutation
  const updateLessonProgressMutation = useMutation({
    mutationFn: ({ 
      lessonId, 
      progress 
    }: { 
      lessonId: string; 
      progress: any 
    }) => {
      if (!user?.id || !courseId) throw new Error('Missing user or course');
      return academyService.updateLessonProgress(user.id, lessonId, courseId, progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress', user?.id, courseId] });
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', user?.id, courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour la progression',
        variant: 'destructive',
      });
    },
  });

  const markLessonComplete = (lessonId: string, timeSpentMinutes: number = 0) => {
    updateLessonProgressMutation.mutate({
      lessonId,
      progress: {
        is_completed: true,
        time_spent_minutes: timeSpentMinutes,
        progress_percentage: 100,
      },
    });
  };

  const updateVideoProgress = (lessonId: string, positionSeconds: number, progressPercentage: number) => {
    updateLessonProgressMutation.mutate({
      lessonId,
      progress: {
        last_position_seconds: positionSeconds,
        progress_percentage: progressPercentage,
      },
    });
  };

  return {
    courseProgress,
    allProgress,
    stats,
    lessonProgress,
    isLoading: isLoadingProgress || isLoadingAllProgress,
    markLessonComplete,
    updateVideoProgress,
    isUpdating: updateLessonProgressMutation.isPending,
  };
}

export function useAcademyCertificates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates', user?.id],
    queryFn: () => user?.id ? academyService.getUserCertificates(user.id) : [],
    enabled: !!user?.id,
  });

  const generateCertificateMutation = useMutation({
    mutationFn: (courseId: string) => {
      if (!user?.id) throw new Error('User not found');
      return academyService.generateCertificate(user.id, courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates', user?.id] });
      toast({
        title: '🎉 Certificat généré !',
        description: 'Félicitations pour avoir complété ce cours',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de générer le certificat',
        variant: 'destructive',
      });
    },
  });

  return {
    certificates,
    isLoading,
    generateCertificate: generateCertificateMutation.mutate,
    isGenerating: generateCertificateMutation.isPending,
  };
}

export function useAcademyAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: () => user?.id ? academyService.getUserAchievements(user.id) : [],
    enabled: !!user?.id,
  });

  const unlockAchievementMutation = useMutation({
    mutationFn: (achievement: any) => {
      if (!user?.id) throw new Error('User not found');
      return academyService.unlockAchievement(user.id, achievement);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] });
    },
  });

  return {
    achievements,
    isLoading,
    unlockAchievement: unlockAchievementMutation.mutate,
  };
}

export function useAcademyFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => user?.id ? academyService.getUserFavorites(user.id) : [],
    enabled: !!user?.id,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (courseId: string) => {
      if (!user?.id) throw new Error('User not found');
      return academyService.toggleFavorite(user.id, courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const isFavorite = (courseId: string) => {
    return favorites?.some(f => f.course_id === courseId) || false;
  };

  return {
    favorites,
    isLoading,
    toggleFavorite: toggleFavoriteMutation.mutate,
    isFavorite,
    isToggling: toggleFavoriteMutation.isPending,
  };
}
